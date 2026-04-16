import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const createSession = async (req, res) => {
  try {
    const clerkId = req.clerkUserId;
    const { email, name, city, area } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required to create a session" });
    }

    // Upsert the user into our DB
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {}, // Don't overwrite properties on login unless necessary 
      create: {
        clerkId,
        email,
        name: name || "Civic User",
        city: city || "Bengaluru",
        area: area || null,
        role: "CITIZEN",
      },
    });

    // Create our internal, short-lived API Auth token 
    const internalToken = jwt.sign(
      { 
        id: user.id, 
        clerkId: user.clerkId, 
        role: user.role, 
        city: user.city, 
        area: user.area 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("resolveit_token", internalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ user });
  } catch (error) {
    console.error("Auth Exception:", error);
    res.status(500).json({ error: "Authentication server error" });
  }
};
