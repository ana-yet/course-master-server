import { Router } from "express";
import {
  enrollStudent,
  getMyEnrollments,
  getEnrollmentDetails,
  checkEnrollment,
  updateProgress,
  submitQuiz,
  submitAssignment,
} from "../controllers/enrollment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require login
router.use(verifyJWT);

// Specific routes MUST come before wildcard (:courseId) routes
router.get("/my-courses", getMyEnrollments);
router.post("/progress", updateProgress);
router.post("/quiz", submitQuiz);
router.post("/assignment", submitAssignment);
router.get("/details/:courseId", getEnrollmentDetails);
router.get("/check/:courseId", checkEnrollment);
router.post("/:courseId", enrollStudent);

export default router;
