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
import { ratingRouter } from "./routes/ratings.js"; // Import Rating

import { initSLA_CronJob } from "./services/sla.js"; // Import Cron

const app = express();

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://resolve--it.vercel.app",
].filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked for origin: " + origin));
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
app.use("/api/ratings", ratingRouter); // Add ratings router

// Initialize cron schedule checks
initSLA_CronJob();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ResolveIt server running on :${PORT}`));
