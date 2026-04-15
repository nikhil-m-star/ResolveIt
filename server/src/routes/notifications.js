import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { getUserNotifications, markAllRead } from "../controllers/notificationController.js";

const notificationRouter = Router();

notificationRouter.get("/", jwtAuth, getUserNotifications);
notificationRouter.patch("/read-all", jwtAuth, markAllRead);

export { notificationRouter };
