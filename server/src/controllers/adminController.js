import prisma from "../lib/prisma.js";

// Dash Stats for Officer
export const getDashboardStats = async (req, res) => {
  const { role, city, area, id } = req.user;

  if (role === "CITIZEN") {
      return res.status(403).json({ error: "Access Denied" });
  }

  try {
    // Presidents see city-wide data; officers default to city-wide when area is missing.
    const filter = role === "PRESIDENT"
      ? { city }
      : { city, ...(area ? { area } : {}) };

    const totalIssues = await prisma.issue.count({ where: filter });
    const resolvedIssues = await prisma.issue.count({ where: { ...filter, status: "RESOLVED" } });
    const inProgressIssues = await prisma.issue.count({ where: { ...filter, status: "IN_PROGRESS" } });
    const slaBreachedCount = await prisma.issue.count({ where: { ...filter, slaBreached: true } });

    // Category breakdown
    const categoryGroup = await prisma.issue.groupBy({
      by: ['category'],
      where: filter,
      _count: { category: true }
    });

    res.json({
        total: totalIssues,
        resolved: resolvedIssues,
        inProgress: inProgressIssues,
        slaBreached: slaBreachedCount,
        resolutionRate: totalIssues === 0 ? 0 : Math.round((resolvedIssues / totalIssues) * 100),
        categoryBreakdown: categoryGroup.map(c => ({ category: c.category, count: c._count.category }))
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const assignIssue = async (req, res) => {
    const { id } = req.params;
    const { officerId } = req.body;
    const { role, city } = req.user;

    // Only President can assign issues forcefully
    if (role !== "PRESIDENT") {
        return res.status(403).json({ error: "Access Denied. Presidential privileges required." });
    }

    try {
        // Validate that the officerId user exists, has role OFFICER, and belongs to the same city
        const officer = await prisma.user.findUnique({
            where: { id: officerId }
        });

        if (!officer) {
            return res.status(404).json({ error: "Officer not found" });
        }

        if (officer.role !== "OFFICER") {
            return res.status(400).json({ error: "User is not an officer" });
        }

        if (officer.city !== city) {
            return res.status(400).json({ error: "Officer does not belong to your city jurisdiction" });
        }

        const issue = await prisma.issue.update({
            where: { id },
            data: { assignedToId: officerId }
        });

        // Notify chosen officer
        await prisma.notification.create({
            data: {
                message: `You've been assigned to issue: ${issue.title}`,
                userId: officerId,
                issueId: issue.id,
                type: "URGENT"
            }
        });

        res.json(issue);
    } catch (error) {
        console.error("Assign Issue Error:", error);
        res.status(500).json({ error: "Failed to assign issue" });
    }
};
