import { Router } from "express";
import { createSession } from "../controllers/authController.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const authRouter = Router();

authRouter.post("/session", clerkAuth, createSession);

export { authRouter };
