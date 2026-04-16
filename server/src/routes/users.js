import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { getProfile, updateProfile } from "../controllers/userController.js";

const userRouter = Router();

userRouter.get("/me", jwtAuth, getProfile);
userRouter.patch("/me", jwtAuth, updateProfile);
userRouter.get("/leaderboard", getLeaderboard); // Public leaderboard

// Administrative (President only)
userRouter.get("/admin/all", jwtAuth, getAllUsers);
userRouter.patch("/admin/role/:id", jwtAuth, updateUserRole);

export { userRouter };
