import { createClerkClient } from "@clerk/backend";

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export const clerkAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.warn("Clerk Auth Error: No token provided in headers");
      return res.status(401).json({ error: "No token provided" });
    }
    
    const payload = await clerk.verifyToken(token);
    req.clerkUserId = payload.sub;
    next();
  } catch (err) {
    console.error("Clerk Auth Error:", err.message);
    res.status(401).json({ error: "Clerk auth failed", details: err.message });
  }
};
