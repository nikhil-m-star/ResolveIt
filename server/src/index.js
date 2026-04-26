import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import "dotenv/config"; // Important to load variables locally

import { issueRouter } from "./routes/issues.js";
import { userRouter } from "./routes/users.js";
import { adminRouter } from "./routes/admin.js";
import { notificationRouter } from "./routes/notifications.js";
import { authRouter } from "./routes/auth.js";

import { initSLA_CronJob } from "./services/sla.js"; // Import Cron

const app = express();
app.set("trust proxy", 1);

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
].filter(Boolean);

// Dynamic CORS for Preview and Production URLs
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
        origin.endsWith(".vercel.app") || 
        origin.endsWith(".onrender.com") ||
        origin.includes("localhost");

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS SHIELD] Blocked: ${origin}`);
        callback(null, false);
      }
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }); // Stricter limit for auth
app.use("/api/auth/session", authLimiter);

app.get("/api/health", (_, res) => res.json({ status: "ok", timestamp: new Date() }));

// Register Routes
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/notifications", notificationRouter);

// Initialize cron schedule checks
initSLA_CronJob();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ResolveIt server running on :${PORT}`));
