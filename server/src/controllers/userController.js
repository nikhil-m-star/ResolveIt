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
  return res.status(403).json({
    error: "Role upgrades are restricted. Only platform admins can assign officer roles.",
  });
};
