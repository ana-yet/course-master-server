import { Router } from "express";
import {
  getAdminStats,
  getAllSubmissions,
} from "../controllers/admin.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/stats", verifyJWT, verifyAdmin, getAdminStats);
router.get("/submissions", verifyJWT, verifyAdmin, getAllSubmissions);

export default router;
