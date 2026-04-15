import { Router } from "express";
import { upload } from "../middleware/multer.js";
import { jwtAuth } from "../middleware/jwtAuth.js";
import {
  createIssue,
  getIssues,
  getIssueById,
  autoCategorize,
  duplicateCheck,
  updateStatus
} from "../controllers/issueController.js";
import { toggleVote } from "../controllers/voteController.js";

const issueRouter = Router();

// AI Routes endpoints (must be before /:id)
issueRouter.post("/auto-categorize", jwtAuth, autoCategorize);
issueRouter.post("/check-duplicate", jwtAuth, duplicateCheck);

// CRUD
issueRouter.post("/", jwtAuth, upload.array("images", 3), createIssue);
issueRouter.get("/", jwtAuth, getIssues);
issueRouter.get("/:id", jwtAuth, getIssueById);

// Votes
issueRouter.post("/:id/vote", jwtAuth, toggleVote);

// Officer operations
issueRouter.patch("/:id/status", jwtAuth, updateStatus);

export { issueRouter };
