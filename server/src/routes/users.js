import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { getProfile, updateProfile, upgradeRole, getLeaderboard } from "../controllers/userController.js";

const userRouter = Router();

userRouter.get("/me", jwtAuth, getProfile);
userRouter.patch("/me", jwtAuth, updateProfile);
userRouter.post("/upgrade", jwtAuth, upgradeRole);
userRouter.get("/leaderboard", jwtAuth, getLeaderboard);

export { userRouter };
