import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { getProfile, updateProfile } from "../controllers/userController.js";

const userRouter = Router();

userRouter.get("/me", jwtAuth, getProfile);
userRouter.patch("/me", jwtAuth, updateProfile);

export { userRouter };
