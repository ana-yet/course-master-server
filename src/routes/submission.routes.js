import { Router } from "express";
import { submitAssignment } from "../controllers/submission.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/submit", verifyJWT, submitAssignment);

export default router;
