import { Router } from "express";
import { upload } from "../middleware/multer.js";
import { optionalJwtAuth, jwtAuth } from "../middleware/jwtAuth.js";
import {
  createIssue,
  getIssues,
  getIssueById,
  getIssueAreas,
  autoCategorize,
  duplicateCheck,
  updateStatus,
  getAIReport
} from "../controllers/issueController.js";
import { toggleVote } from "../controllers/voteController.js";
import { addComment } from "../controllers/commentController.js";

const issueRouter = Router();

// AI Routes endpoints (must be before /:id)
issueRouter.post("/auto-categorize", jwtAuth, autoCategorize);
issueRouter.post("/check-duplicate", jwtAuth, duplicateCheck);
issueRouter.get("/ai-report", jwtAuth, getAIReport);
issueRouter.get("/areas", jwtAuth, getIssueAreas);

// CRUD
issueRouter.post("/", jwtAuth, upload.array("images", 3), createIssue);
issueRouter.get("/", optionalJwtAuth, getIssues);
issueRouter.get("/:id", jwtAuth, getIssueById);

// Votes
issueRouter.post("/:id/vote", jwtAuth, toggleVote);

// Comments
issueRouter.post("/:id/comments", jwtAuth, addComment);

// Officer operations
issueRouter.patch("/:id/status", jwtAuth, updateStatus);

export { issueRouter };
