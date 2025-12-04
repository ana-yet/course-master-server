import { Router } from "express";
import {
  getAdminStats,
  getAllSubmissions,
  getAllAssignments,
  reviewAssignment,
} from "../controllers/admin.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes require admin access
router.use(verifyJWT, verifyAdmin);

router.get("/stats", getAdminStats);
router.get("/submissions", getAllSubmissions);
router.get("/assignments", getAllAssignments);
router.put("/assignments/:enrollmentId/:submissionId", reviewAssignment);

export default router;
