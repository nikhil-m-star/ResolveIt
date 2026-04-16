import jwt from "jsonwebtoken";

export const jwtAuth = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT Auth Error: JWT_SECRET environment variable is not defined!");
  }

  let token = req.cookies?.resolveit_token;
  let source = "cookie";

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      source = "header";
    }
  }

  if (!token) {
    console.warn("JWT Auth Error: No token found in cookies or headers");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, clerkId, role, city, area }
    next();
  } catch (err) {
    console.error(`JWT Auth Error (${source}):`, err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
export const optionalJwtAuth = (req, res, next) => {
  let token = req.cookies?.resolveit_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // Graceful fallback for guests with expired tokens
    next();
  }
};
