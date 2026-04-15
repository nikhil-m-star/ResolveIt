import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth.js";
import { createRating } from "../controllers/ratingController.js";

const ratingRouter = Router();

ratingRouter.post("/", jwtAuth, createRating);

export { ratingRouter };
