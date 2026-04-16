import prisma from "../lib/prisma.js";
import { autoCategorizIssue, checkDuplicate, assessIntensity, predictETA, generateCityReport } from "../services/nvidia.js";
import { sendEmailNotification } from "../lib/email.js";

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

    // Automated Dispatch: Find officer assigned to this area
    let assignedToId = null;
    if (area) {
      const matchingOfficer = await prisma.user.findFirst({
        where: { 
          role: 'OFFICER',
          area: { equals: area, mode: 'insensitive' }
        }
      });
      if (matchingOfficer) {
        assignedToId = matchingOfficer.id;
        console.log(`Automated Dispatch: Incident in ${area} assigned to Officer ${matchingOfficer.name}`);
      }
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
      assignedToId // Auto-assigned if match found
    };

    const newIssue = await prisma.issue.create({
      data: issueData,
    });

    // Notify officer if automatically assigned
    if (assignedToId) {
      try {
        await prisma.notification.create({
          data: {
            userId: assignedToId,
            issueId: newIssue.id,
            type: 'URGENT',
            message: `URGENT: New incident dispatched to your sector (${area}): ${title}`
          }
        });
      } catch (notifErr) {
        console.error("Failed to send auto-dispatch notification:", notifErr);
      }
    }

    res.status(201).json(newIssue);
  } catch (error) {
    console.error("Create Issue Error:", error);
    res.status(500).json({ error: "Failed to create issue" });
  }
};

// Get all issues with filters
export const getIssues = async (req, res) => {
  try {
    const { city, area, category, status, search, lat, lng } = req.query;
    
    // Self-Bootstrapping: IF database is empty, auto-populate situational grid
    const count = await prisma.issue.count();
    if (count === 0) {
      console.log("Self-Bootstrapping: No data detected. Initializing metropolitan grid...");
      
      // 1. Ensure Administrative Personnel exist
      const admin = await prisma.user.upsert({
        where: { email: 'admin@resolveit.com' },
        update: {},
        create: {
          clerkId: 'sys_admin_root',
          name: 'Central Command',
          email: 'admin@resolveit.com',
          role: 'PRESIDENT',
          city: 'Bengaluru',
          area: 'HQ'
        }
      });

      const officer = await prisma.user.upsert({
        where: { email: 'officer@resolveit.com' },
        update: {},
        create: {
          clerkId: 'sys_officer_1',
          name: 'Sector Officer Raj',
          email: 'officer@resolveit.com',
          role: 'OFFICER',
          city: 'Bengaluru',
          area: 'Koramangala'
        }
      });

      // 2. Deploy Initial Situational Reports
      await prisma.issue.createMany({
        data: [
          { 
            title: 'SEED - Major Pothole on 80ft Road', 
            description: 'Critical road damage impacting metropolitan flow. Dispatch required.',
            category: 'POTHOLE', status: 'REPORTED', city: 'Bengaluru', area: 'Koramangala',
            latitude: 12.9352, longitude: 77.6245, intensity: 8, createdById: admin.id,
            assignedToId: officer.id
          },
          { 
            title: 'SEED - Overflowing Sanitation Point', 
            description: 'Environmental hazard detected at sector boundary.',
            category: 'GARBAGE', status: 'RESOLVED', city: 'Bengaluru', area: 'HSR Layout',
            latitude: 12.9116, longitude: 77.6474, intensity: 5, createdById: admin.id,
            resolvedById: officer.id
          }
        ]
      });
      console.log("Metropolitan Grid Initialized.");
    }

    const filter = {};
    const isValid = (val) => val && val !== "" && val !== "null" && val !== "undefined";

    if (isValid(city)) filter.city = city;
    if (isValid(area)) filter.area = area;
    if (isValid(category)) filter.category = category;
    if (isValid(status)) filter.status = status;

    if (isValid(search)) {
      filter.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (req.query.assignedToMe === "true" && req.user?.id) {
       filter.assignedToId = req.user.id;
    }

    const include = {
      createdBy: {
        select: { id: true, name: true, role: true }
      }
    };

    // Only include user-specific vote context if we have a valid user session
    if (req.user?.id) {
      include.voteRecords = {
        where: { userId: req.user.id },
        select: { type: true }
      };
    }

    let issues = await prisma.issue.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include
    }).catch(err => {
      console.error("Zero-Crash Prisma Shield triggered:", err.message);
      return [];
    });

    if (!Array.isArray(issues)) issues = [];

    // Safe transformation
    let processedIssues = issues.map(issue => {
      try {
        const processed = {
          ...issue,
          userVote: issue.voteRecords?.[0]?.type || null
        };
        // Mask user details for anonymous issues
        if (processed.isAnonymous) {
          processed.createdBy = null;
        }
        return processed;
      } catch (err) {
        return issue;
      }
    });

    // Safe Geospatial Sorting
    try {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      
      if (lat && lng && !isNaN(uLat) && !isNaN(uLng)) {
        const getDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };

        processedIssues.sort((a, b) => {
            const distA = getDistance(uLat, uLng, a.latitude, a.longitude);
            const distB = getDistance(uLat, uLng, b.latitude, b.longitude);
            return (distA || 0) - (distB || 0);
        });
      }
    } catch (sortErr) {
      console.error("Zero-Crash Sort Shield triggered:", sortErr.message);
    }

    return res.json(processedIssues);
  } catch (error) {
    console.error("Critical Failure in getIssues (Zero-Crash):", error.message);
    return res.status(200).json([]);
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

    if (req.user?.id) {
      include.voteRecords = {
        where: { userId: req.user.id },
        select: { type: true }
      };
    }

    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      include
    });

    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const formattedIssue = {
      ...issue,
      userVote: issue.voteRecords[0]?.type || null
    };

    res.json(formattedIssue);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch issue details" });
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

    res.json({ updatedIssue, statusEntry });

  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const getAIReport = async (req, res) => {
  const { city } = req.user;
  const { area } = req.query;

  try {
    // Get last 50 issues for this filter set to analyze
    const filter = area ? { city, area } : { city };
    const issues = await prisma.issue.findMany({
      where: filter,
      take: 50,
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
        return res.json({ report: `No issues reported in ${area || city} yet to generate a report.` });
    }

    const reportMarkdown = await generateCityReport(city, issues, area);
    res.json({ report: reportMarkdown });

  } catch (error) {
    console.error("AI Report Generation Error:", error);
    res.status(500).json({ error: "Failed to generate AI report" });
  }
};
