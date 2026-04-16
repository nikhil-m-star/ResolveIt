import prisma from "../lib/prisma.js";

// Fetch user profile
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        issues: {
          take: 10,
          orderBy: { createdAt: "desc" }
        },
        resolvedIssues: {
          take: 10,
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: { issues: true, resolvedIssues: true, votes: true },
        },
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Update Location Profile
export const updateProfile = async (req, res) => {
  const { city, area } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { city, area }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Leaderboard logic based on impact, not points
export const getLeaderboard = async (req, res) => {
  try {
    const citizens = await prisma.user.findMany({
      where: { role: "CITIZEN" },
      select: {
        id: true,
        name: true,
        _count: {
          select: { issues: true, votes: true }
        }
      },
      take: 10,
      orderBy: {
        issues: { _count: "desc" }
      }
    });

    const officers = await prisma.user.findMany({
      where: { role: { in: ["OFFICER", "PRESIDENT"] } },
      select: {
        id: true,
        name: true,
        resolvedCount: true,
        avgRating: true,
      },
      take: 10,
      orderBy: {
        resolvedCount: "desc"
      }
    });

    res.json({ citizens, officers });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

// Admin: Get all users (President Only)
export const getAllUsers = async (req, res) => {
  if (req.user.role !== "PRESIDENT") {
     return res.status(403).json({ error: "Unauthorized. President only." });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        area: true,
        resolvedCount: true,
        _count: { select: { issues: true } }
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Admin: Update User Role (President Only)
export const updateUserRole = async (req, res) => {
  if (req.user.role !== "PRESIDENT") {
    return res.status(403).json({ error: "Unauthorized. President only." });
  }

  const { id } = req.params;
  const { role } = req.body;

  if (!["CITIZEN", "OFFICER", "PRESIDENT"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update role" });
  }
};
