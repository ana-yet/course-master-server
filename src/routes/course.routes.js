import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createCourseSchema,
  updateCourseSchema,
} from "../validators/course.validator.js";

const router = Router();

// Public Routes
router.route("/").get(getAllCourses); // List with Search/Filter
router.route("/:id").get(getCourseById); // Details

// Admin Routes (Protected)
router.use(verifyJWT);
router.use(verifyAdmin);

router.route("/").post(validate(createCourseSchema), createCourse);

router
  .route("/:id")
  .patch(validate(updateCourseSchema), updateCourse)
  .delete(deleteCourse);

export default router;
