import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";

// @desc    Enroll in a course (Simulate Purchase)
// @route   POST /api/v1/enrollments/:courseId
const enrollStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  // 1. Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // 2. Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  if (existingEnrollment) {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  // 3. Create Enrollment
  // TODO: Verify payment success here
  const enrollment = await Enrollment.create({
    student: userId,
    course: courseId,
    progress: 0,
    completedLessons: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, enrollment, "Enrolled successfully"));
});

// @desc    Get logged-in user's enrolled courses (Student Dashboard)
// @route   GET /api/v1/enrollments/my-courses
const getMyEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Populate course details but EXCLUDE the heavy syllabus to make it fast
  // only need title, thumbnail, instructor for the dashboard card
  const enrollments = await Enrollment.find({ student: userId })
    .populate({
      path: "course",
      select: "title thumbnail instructor level",
      populate: {
        path: "instructor",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, enrollments, "Fetched enrollments"));
});

// @desc    Check enrollment status for a specific course (For "Buy" vs "Go to Course" button)
// @route   GET /api/v1/enrollments/check/:courseId
const checkEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { enrolled: !!enrollment },
        "Enrollment status checked"
      )
    );
});

// @desc    Mark a lesson as completed & Update Progress
// @route   POST /api/v1/enrollments/progress
const updateProgress = asyncHandler(async (req, res) => {
  const { courseId, lectureId } = req.body;
  const userId = req.user._id;

  // 1. Find the enrollment
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
  });

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  // 2. If lesson already completed, do nothing
  if (enrollment.completedLessons.includes(lectureId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, enrollment, "Progress updated"));
  }

  // 3. Add lesson to completed list
  enrollment.completedLessons.push(lectureId);

  // 4. Calculate new progress percentage
  const course = await Course.findById(courseId);
  const totalLectures = course.syllabus.length;

  if (totalLectures > 0) {
    enrollment.progress = Math.round(
      (enrollment.completedLessons.length / totalLectures) * 100
    );
  } else {
    enrollment.progress = 100;
  }

  // 5. Mark as completed if 100%
  if (enrollment.progress === 100) {
    enrollment.status = "completed";
  }

  await enrollment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, enrollment, "Progress updated"));
});

export { enrollStudent, getMyEnrollments, checkEnrollment, updateProgress };
