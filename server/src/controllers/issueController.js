import prisma from "../lib/prisma.js";
import {
  autoCategorizIssue,
  checkDuplicate,
  assessIntensity,
  predictETA,
  generateCityReport,
  getCachedCityReport,
  setCachedCityReport,
  invalidateCityReportCache,
  buildEmptyCityReport
} from "../services/nvidia.js";
import { sendEmailNotification } from "../lib/email.js";

const VALID_STATUS = new Set(["REPORTED", "IN_PROGRESS", "RESOLVED", "REJECTED"]);
const VALID_CATEGORY = new Set([
  "POTHOLE",
  "GARBAGE",
  "STREETLIGHT",
  "WATER_LEAK",
  "BRIBERY",
  "POWER_CUT",
  "SEWAGE",
  "TREE_FALLEN",
  "OTHER"
]);

const normalizeQueryParam = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = String(value).trim();
  if (!parsed || parsed === "null" || parsed === "undefined") return null;
  return parsed;
};

const buildDistanceFromUser = (userLat, userLng, issueLat, issueLng) => {
  const hasValidUserCoords = Number.isFinite(userLat) && Number.isFinite(userLng);
  const hasValidIssueCoords = Number.isFinite(issueLat) && Number.isFinite(issueLng);
  if (!hasValidUserCoords || !hasValidIssueCoords) return Number.POSITIVE_INFINITY;
  return Math.hypot(issueLat - userLat, issueLng - userLng);
};

const getUserVoteMapForIssues = async (userId, issueIds = []) => {
  if (!userId || issueIds.length === 0) return new Map();

  try {
    const records = await prisma.vote.findMany({
      where: { userId, issueId: { in: issueIds } },
      select: { issueId: true, type: true }
    });
    return new Map(records.map((record) => [record.issueId, record.type]));
  } catch (error) {
    // Production safety: keep issues feed alive even if vote schema/migration is out of sync.
    console.warn("Vote map fallback: failed to fetch vote type, continuing without userVote.", error.message);
    return new Map();
  }
};

// AI Endpoint: Auto-Categorize Issue
export const autoCategorize = async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) return res.status(400).json({ error: "title and description required" });

  try {
    const aiResult = await autoCategorizIssue(title, description);
    res.json(aiResult);
  } catch (error) {
    console.error("Auto Category Error:", error);
    res.status(500).json({ error: "Failed to auto-categorize" });
  }
};

// AI Endpoint: Duplicate Check
export const duplicateCheck = async (req, res) => {
  const { title, description, area, city } = req.body;
  
  try {
    // Get recent issues to compare
    const recentIssues = await prisma.issue.findMany({
      where: {
        city,
        area,
        status: { in: ["REPORTED", "IN_PROGRESS"] }
      },
      select: { id: true, title: true, description: true },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    const aiResult = await checkDuplicate(title, description, recentIssues);
    res.json(aiResult);
  } catch (error) {
    console.error("Duplicate Check Error:", error);
    res.status(500).json({ error: "Failed to check duplicates" });
  }
};

// Create a new Issue
export const createIssue = async (req, res) => {
  try {
    const { title, description, category, city, area, isAnonymous } = req.body;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);
    const resolvedIsAnonymous = isAnonymous === "true" || isAnonymous === true;
    
    // Process image uploads from multer and upload to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => file.path);
    }

    // Call NVIDIA AI for intensity and ETA
    let intensity = 5; // default fallback
    let etaDays = 7;   // default fallback
    
    try {
        const severityResult = await assessIntensity(title, description, category);
        intensity = severityResult.score || 5;
        
        const etaResult = await predictETA(category, intensity, city);
        etaDays = etaResult.etaDays || 7;
    } catch(ai_err) {
        console.error("AI Error getting intensity/ETA:", ai_err);
    }

    // Automated Dispatch: Find lead officer for this area
    let assignedToId = null;
    if (area) {
       const leadOfficer = await prisma.user.findFirst({
         where: { role: 'OFFICER', area: { equals: area, mode: 'insensitive' } }
       });
       if (leadOfficer) assignedToId = leadOfficer.id;
    }

    const issueData = {
      title,
      description,
      category,
      city: city || "Bengaluru",
      area,
      latitude,
      longitude,
      imageUrls,
      intensity,
      etaDays,
      isAnonymous: resolvedIsAnonymous,
      createdById: req.user.id,
      assignedToId 
    };

    const newIssue = await prisma.issue.create({
      data: issueData,
    });

    invalidateCityReportCache(issueData.city, area);

    // Sector-Wide Notifications: Alert all officers in this area
    if (area) {
      try {
        const matchingOfficers = await prisma.user.findMany({
          where: { 
            role: 'OFFICER',
            area: { equals: area, mode: 'insensitive' }
          }
        });

        if (matchingOfficers.length > 0) {
          await prisma.notification.createMany({
            data: matchingOfficers.map(officer => ({
              userId: officer.id,
              issueId: newIssue.id,
              type: 'URGENT',
              message: `URGENT: New incident in your sector (${area}): ${title}`
            }))
          });
          console.log(`Automated Dispatch: Notified ${matchingOfficers.length} officers in ${area}`);
        }
      } catch (notifErr) {
        console.error("Failed to process mass officer notifications:", notifErr);
      }
    }

    res.status(201).json(newIssue);
  } catch (error) {
    console.error("Create Issue Error:", error);
    res.status(500).json({ error: "Failed to create issue" });
  }
};

// Get all issues with filters - Optimized Clean Version
export const getIssues = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    // 1. Build Atomic Filter
    const filter = {};
    const city = normalizeQueryParam(req.query.city);
    const area = normalizeQueryParam(req.query.area);
    const category = normalizeQueryParam(req.query.category);
    const status = normalizeQueryParam(req.query.status);
    const search = normalizeQueryParam(req.query.search);

    if (city) filter.city = city;
    if (area) filter.area = area;
    if (category && VALID_CATEGORY.has(category)) filter.category = category;
    if (status && VALID_STATUS.has(status)) filter.status = status;
    if (search) {
      filter.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }
    
    // Sector-Based Awareness: For officers to see everything in their zone
    if (req.query.areaReports === "true" && req.user?.area) {
      filter.area = req.user.area;
    } else if (req.query.assignedToMe === "true" && req.user?.id) {
      filter.assignedToId = req.user.id;
    }

    // 2. Data Retrieval with Dynamic Include
    let issues = await prisma.issue.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } }
      }
    });

    // 3. Force Global Fallback if filter too strict
    if (issues.length === 0 && (city || area)) {
       issues = await prisma.issue.findMany({
         take: 10,
         orderBy: { createdAt: 'desc' },
         include: { createdBy: { select: { id: true, name: true, role: true } } }
       });
    }

    // 4. Transform & Geospatial Precision
    const uLat = Number.parseFloat(lat);
    const uLng = Number.parseFloat(lng);
    const userVoteMap = await getUserVoteMapForIssues(req.user?.id, issues.map((issue) => issue.id));

    const processed = issues.map(i => ({
      ...i,
      userVote: userVoteMap.get(i.id) || null,
      createdBy: i.isAnonymous ? null : i.createdBy
    }));

    if (Number.isFinite(uLat) && Number.isFinite(uLng)) {
      processed.sort((a, b) => {
        const aDistance = buildDistanceFromUser(uLat, uLng, a.latitude, a.longitude);
        const bDistance = buildDistanceFromUser(uLat, uLng, b.latitude, b.longitude);
        return aDistance - bDistance;
      });
    }

    return res.json(processed);
  } catch (error) {
    console.error("Critical Failure in Case Retrieval:", error.message);
    return res.status(500).json({ error: "Failed to fetch incidents", message: error.message });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const include = {
      createdBy: { select: { name: true, id: true }},
      assignedTo: { select: { name: true, id: true }},
      statusHistory: { 
          include: { user: { select: { name: true, role: true } }},
          orderBy: { createdAt: 'asc' }
      },
      comments: {
          include: { user: { select: { name: true, role: true } }},
          orderBy: { createdAt: 'desc' }
      }
    };

    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      include
    });

    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const userVoteMap = await getUserVoteMapForIssues(req.user?.id, [issue.id]);

    const formattedIssue = {
      ...issue,
      userVote: userVoteMap.get(issue.id) || null
    };

    res.json(formattedIssue);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch issue details" });
  }
};

export const getIssueAreas = async (req, res) => {
  try {
    const city = normalizeQueryParam(req.user?.city);
    const where = city ? { city, area: { not: null } } : { area: { not: null } };

    const records = await prisma.issue.findMany({
      where,
      select: { area: true },
      distinct: ["area"]
    });

    const seen = new Set();
    const areas = [];

    for (const record of records) {
      const areaLabel = normalizeQueryParam(record.area);
      if (!areaLabel) continue;

      const normalizedArea = areaLabel.toLowerCase();
      if (seen.has(normalizedArea)) continue;

      seen.add(normalizedArea);
      areas.push(areaLabel);
    }

    areas.sort((left, right) => left.localeCompare(right));
    res.json({ areas });
  } catch (error) {
    console.error("Fetch issue areas error:", error);
    res.status(500).json({ error: "Failed to fetch issue areas" });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus, note } = req.body;
  const userId = req.user.id;

  if (!["OFFICER", "PRESIDENT"].includes(req.user.role)) {
     return res.status(403).json({ error: "Only officers/presidents can update status" });
  }

  try {
    const issue = await prisma.issue.findUnique({ 
        where: { id },
        include: { createdBy: true }
    });
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    // Strict Area-Based Enforcement: Officers can only update issues in their own sector
    if (req.user.role === "OFFICER") {
      const isSameArea = String(issue.area || "").trim().toLowerCase() === String(req.user.area || "").trim().toLowerCase();
      if (!isSameArea) {
        return res.status(403).json({ 
          error: "Permission Denied", 
          message: `This incident is in ${issue.area}, which is outside your assigned sector of ${req.user.area}.` 
        });
      }
    }

    // Update Issue & Push Status History in a transaction
    const [updatedIssue, statusEntry, _notification] = await prisma.$transaction([
      prisma.issue.update({
        where: { id },
        data: { 
            status: newStatus,
            resolvedAt: newStatus === "RESOLVED" ? new Date() : null,
            resolvedById: newStatus === "RESOLVED" ? userId : null
        }
      }),
      prisma.statusHistory.create({
        data: {
            issueId: id,
            userId,
            oldStatus: issue.status,
            newStatus,
            note
        }
      }),
      prisma.notification.create({
        data: {
          userId: issue.createdById,
          issueId: id,
          type: "INFO",
          message: `Your issue "${issue.title}" has been tracked to: ${newStatus.replace(/_/g, " ")}`
        }
      })
    ]);

    // Send Real Email!
    if (issue.createdBy && issue.createdBy.email) {
      await sendEmailNotification({
         to: issue.createdBy.email,
         subject: `Update on your reported issue: ${issue.title}`,
         html: `
           <h2>Status Update</h2>
           <p>Your issue regarding <strong>${issue.title}</strong> has been updated to: <strong>${newStatus.replace(/_/g, " ")}</strong>.</p>
           ${note ? `<p><strong>Official's Note:</strong> <em>"${note}"</em></p>` : ''}
           <hr />
           <p>Check the ResolveIt platform for more details.</p>
         `
      });
    }

    invalidateCityReportCache(issue.city, issue.area);

    res.json({ updatedIssue, statusEntry });

  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const getAIReport = async (req, res) => {
  const { city } = req.user;
  const area = normalizeQueryParam(req.query.area);

  try {
    const cachedReport = getCachedCityReport(city, area);
    if (cachedReport) return res.json(cachedReport);

    const filter = area
      ? {
          city,
          area: { equals: area, mode: "insensitive" }
        }
      : { city };

    const issues = await prisma.issue.findMany({
      where: filter,
      take: 24,
      orderBy: { createdAt: 'desc' },
      select: {
          id: true,
          title: true,
          description: true,
          category: true,
          status: true,
          area: true,
          intensity: true,
          createdAt: true
      }
    });

    if (issues.length === 0) {
        return res.json({
          report: buildEmptyCityReport(city, area),
          source: "instant",
          cached: false,
          generatedAt: new Date().toISOString(),
          issueCount: 0
        });
    }

    const reportPayload = await generateCityReport(city, issues, area);
    const responsePayload = {
      ...reportPayload,
      cached: false,
      generatedAt: new Date().toISOString(),
      issueCount: issues.length
    };

    setCachedCityReport(city, area, responsePayload);
    res.json(responsePayload);

  } catch (error) {
    console.error("AI Report Generation Error:", error);
    res.status(500).json({ error: "Failed to generate AI report" });
  }
};
