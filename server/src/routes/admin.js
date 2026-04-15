import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { getDashboardStats, assignIssue } from "../controllers/adminController.js";

const adminRouter = Router();

adminRouter.get("/stats", jwtAuth, getDashboardStats);
adminRouter.patch("/issues/:id/assign", jwtAuth, assignIssue);

export { adminRouter };
