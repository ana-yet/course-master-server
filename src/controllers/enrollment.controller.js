import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";

// @desc    Enroll in a course (For free courses or after payment)
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

  if (existingEnrollment && existingEnrollment.paymentStatus === "completed") {
    throw new ApiError(409, "You are already enrolled in this course");
  }

  // 3. Create Enrollment (for free courses, payment status is completed)
  const enrollment = await Enrollment.create({
    student: userId,
    course: courseId,
    progress: 0,
    completedModules: [],
    paymentStatus: course.price === 0 ? "completed" : "pending",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, enrollment, "Enrolled successfully"));
});

// @desc    Get logged-in user's enrolled courses (Student Dashboard)
// @route   GET /api/v1/enrollments/my-courses
const getMyEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Only get completed payments
  const enrollments = await Enrollment.find({
    student: userId,
    paymentStatus: "completed",
  })
    .populate({
      path: "course",
      select: "title thumbnail instructor level batch startDate",
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

// @desc    Get full enrollment details for learning page
// @route   GET /api/v1/enrollments/details/:courseId
const getEnrollmentDetails = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
    paymentStatus: "completed",
  });

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found or payment pending");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, enrollment, "Enrollment details fetched"));
});

// @desc    Check enrollment status for a specific course
// @route   GET /api/v1/enrollments/check/:courseId
const checkEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
    paymentStatus: "completed",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { enrolled: !!enrollment, enrollment },
        "Enrollment status checked"
      )
    );
});

// @desc    Mark a module as completed & Update Progress
// @route   POST /api/v1/enrollments/progress
const updateProgress = asyncHandler(async (req, res) => {
  const { courseId, moduleId } = req.body;
  const userId = req.user._id;

  // 1. Find the enrollment
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
    paymentStatus: "completed",
  });

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  // 2. If module already completed, do nothing
  if (enrollment.completedModules.includes(moduleId)) {
    return res
      .status(200)
      .json(new ApiResponse(200, enrollment, "Progress already updated"));
  }

  // 3. Add module to completed list
  enrollment.completedModules.push(moduleId);

  // 4. Calculate new progress percentage
  const course = await Course.findById(courseId);

  // Count total modules across all milestones
  let totalModules = 0;
  if (course.milestones) {
    course.milestones.forEach((milestone) => {
      totalModules += milestone.modules?.length || 0;
    });
  }

  if (totalModules > 0) {
    enrollment.progress = Math.round(
      (enrollment.completedModules.length / totalModules) * 100
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

// @desc    Submit quiz answers
// @route   POST /api/v1/enrollments/quiz
const submitQuiz = asyncHandler(async (req, res) => {
  const { courseId, moduleId, answers } = req.body;
  const userId = req.user._id;

  // 1. Find enrollment
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
    paymentStatus: "completed",
  });

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  // 2. Get course and find the quiz
  const course = await Course.findById(courseId);
  let quiz = null;
  let passingScore = 70;

  for (const milestone of course.milestones || []) {
    for (const module of milestone.modules || []) {
      if (module._id.toString() === moduleId) {
        quiz = module.quiz;
        passingScore = quiz?.passingScore || 70;
        break;
      }
    }
  }

  if (!quiz || !quiz.questions?.length) {
    throw new ApiError(404, "Quiz not found for this module");
  }

  // 3. Calculate score
  let correctCount = 0;
  quiz.questions.forEach((q, index) => {
    if (answers[index] === q.correctAnswer) {
      correctCount++;
    }
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= passingScore;

  // 4. Save quiz attempt
  enrollment.quizAttempts.push({
    moduleId,
    score,
    passed,
    attemptedAt: new Date(),
  });

  await enrollment.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        score,
        passed,
        correctCount,
        totalQuestions: quiz.questions.length,
        passingScore,
      },
      passed ? "Congratulations! You passed!" : "Keep trying!"
    )
  );
});

// @desc    Submit assignment
// @route   POST /api/v1/enrollments/assignment
const submitAssignment = asyncHandler(async (req, res) => {
  const { courseId, milestoneId, submissionUrl } = req.body;
  const userId = req.user._id;

  // 1. Find enrollment
  const enrollment = await Enrollment.findOne({
    student: userId,
    course: courseId,
    paymentStatus: "completed",
  });

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  // 2. Check if already submitted
  const existingSubmission = enrollment.assignmentSubmissions.find(
    (s) => s.milestoneId === milestoneId
  );

  if (existingSubmission) {
    // Update existing submission
    existingSubmission.submissionUrl = submissionUrl;
    existingSubmission.submittedAt = new Date();
    existingSubmission.status = "pending";
  } else {
    // Add new submission
    enrollment.assignmentSubmissions.push({
      milestoneId,
      submissionUrl,
      submittedAt: new Date(),
      status: "pending",
    });
  }

  await enrollment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, enrollment, "Assignment submitted successfully"));
});

export {
  enrollStudent,
  getMyEnrollments,
  getEnrollmentDetails,
  checkEnrollment,
  updateProgress,
  submitQuiz,
  submitAssignment,
};
