import prisma from "../lib/prisma.js";
import { autoCategorizIssue, checkDuplicate, assessIntensity, predictETA } from "../services/nvidia.js";
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
      createdById: req.user.id
    };

    const newIssue = await prisma.issue.create({
      data: issueData,
    });

    res.status(201).json(newIssue);
  } catch (error) {
    console.error("Create Issue Error:", error);
    res.status(500).json({ error: "Failed to create issue" });
  }
};

// Get all issues with filters
export const getIssues = async (req, res) => {
  try {
    const { city, area, category, status } = req.query;
    
    const filter = {};
    if (city) filter.city = city;
    if (area) filter.area = area;
    if (category) filter.category = category;
    if (status) filter.status = status;

    const issues = await prisma.issue.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
           select: { id: true, name: true, role: true }
        }
      }
    });
    res.json(issues);
  } catch (error) {
    console.error("Get Issues Error:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: req.params.id },
      include: {
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
      }
    });

    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch issue details" });
  }
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus, note } = req.body;
  const userId = req.user.id;

  if (req.user.role === "CITIZEN") {
     return res.status(403).json({ error: "Only officers/presidents can update status" });
  }

  try {
    const issue = await prisma.issue.findUnique({ 
        where: { id },
        include: { createdBy: true }
    });
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    // Update Issue & Push Status History in a transaction
    const [updatedIssue, statusEntry] = await prisma.$transaction([
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
