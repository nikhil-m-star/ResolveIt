import prisma from "../lib/prisma.js";

// Fetch user profile
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        _count: {
          select: { issues: true, resolvedIssues: true, votes: true },
        },
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Determine current tier logic on the fly (or you could sync it statically)
    const points = user.points || 0;
    let tier = "BRONZE";
    if (points >= 500) tier = "PLATINUM";
    else if (points >= 200) tier = "GOLD";
    else if (points >= 50) tier = "SILVER";

    if (user.tier !== tier) {
        await prisma.user.update({ where: { id: user.id }, data: { tier } });
        user.tier = tier;
    }

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

// Upgrade Role explicitly to checking standard ac.in domain
export const upgradeRole = async (req, res) => {
  try {
    const { id, email } = req.user; // Note, we pull original email from DB, but wait, it's not in req.user from JWT. Let's fetch the user first.
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if email domain ends in .ac.in or is a manually allowed domain
    if (!user.email.endsWith(".ac.in")) {
      return res.status(400).json({ error: "You must use an official .ac.in email domain to request upgrade" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: "OFFICER" }
    });

    res.json({ message: "Successfully upgraded to Officer!", user: updatedUser });
  } catch (error) {
     res.status(500).json({ error: "Upgrade role failed" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const officers = await prisma.user.findMany({
      where: { role: { in: ["OFFICER", "PRESIDENT"] } },
      orderBy: { points: 'desc' },
      take: 50,
      select: { id: true, name: true, tier: true, points: true, resolvedCount: true, avgRating: true }
    });

    const citizens = await prisma.user.findMany({
      where: { role: "CITIZEN" },
      orderBy: { points: 'desc' },
      take: 50,
      select: { 
          id: true, name: true, tier: true, points: true, 
          _count: { select: { issues: true, votes: true } }
      }
    });

    // Sort citizens by an engagement score (points natively or dynamically via issues count)
    // For now we lean on `points` integer from the Prisma schema which is managed dynamically

    res.json({ officers, citizens });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
};