import { Router } from "express";
import {
  enrollStudent,
  getMyEnrollments,
  checkEnrollment,
  updateProgress,
} from "../controllers/enrollment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(verifyJWT);

router.post("/progress", updateProgress); // Mark lesson complete
router.post("/:courseId", enrollStudent); // Buy Course
router.get("/my-courses", getMyEnrollments); // Student Dashboard
router.get("/check/:courseId", checkEnrollment); // Check if bought

export default router;
