import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Submission } from "../models/submission.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";

// @desc Get Dashboard Stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalCourses = await Course.countDocuments();
  const totalEnrollments = await Enrollment.countDocuments({
    paymentStatus: "completed",
  });

  // Count pending assignments
  const pendingAssignments = await Enrollment.countDocuments({
    "assignmentSubmissions.status": "pending",
  });

  // Aggregation for Chart: Enrollments last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const enrollmentChart = await Enrollment.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalStudents,
        totalCourses,
        totalEnrollments,
        pendingAssignments,
        chartData: enrollmentChart,
      },
      "Stats fetched"
    )
  );
});

// @desc Get All Submissions (Legacy)
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find()
    .populate("student", "name email")
    .populate("course", "title")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Submissions fetched"));
});

// @desc Get All Assignment Submissions
// @route GET /api/v1/admin/assignments
export const getAllAssignments = asyncHandler(async (req, res) => {
  const { status } = req.query; // Optional filter: pending, reviewed, approved, rejected

  // Find all enrollments that have assignment submissions
  const query = {
    "assignmentSubmissions.0": { $exists: true },
  };

  const enrollments = await Enrollment.find(query)
    .populate("student", "name email avatar")
    .populate({
      path: "course",
      select: "title milestones",
    })
    .sort("-updatedAt");

  // Flatten the data for easier frontend consumption
  const assignments = [];

  enrollments.forEach((enrollment) => {
    enrollment.assignmentSubmissions.forEach((submission) => {
      // Apply status filter if provided
      if (status && submission.status !== status) return;

      // Find milestone title
      let milestoneTitle = "Unknown Milestone";
      let assignmentTitle = "Assignment";

      if (enrollment.course?.milestones) {
        const milestone = enrollment.course.milestones.find(
          (m) => m._id.toString() === submission.milestoneId
        );
        if (milestone) {
          milestoneTitle = milestone.title;
          assignmentTitle = milestone.assignment?.title || "Assignment";
        }
      }

      assignments.push({
        _id: submission._id,
        enrollmentId: enrollment._id,
        milestoneId: submission.milestoneId,
        student: enrollment.student,
        course: {
          _id: enrollment.course._id,
          title: enrollment.course.title,
        },
        milestoneTitle,
        assignmentTitle,
        submissionUrl: submission.submissionUrl,
        submittedAt: submission.submittedAt,
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback,
      });
    });
  });

  // Sort by submission date (newest first)
  assignments.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return res
    .status(200)
    .json(new ApiResponse(200, assignments, "Assignments fetched"));
});

// @desc Review an Assignment (Approve/Reject)
// @route PUT /api/v1/admin/assignments/:enrollmentId/:submissionId
export const reviewAssignment = asyncHandler(async (req, res) => {
  const { enrollmentId, submissionId } = req.params;
  const { status, score, feedback } = req.body;

  // Validate status
  if (!["approved", "rejected", "reviewed"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be approved, rejected, or reviewed");
  }

  // Find the enrollment
  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  // Find the specific submission
  const submission = enrollment.assignmentSubmissions.id(submissionId);

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  // Update the submission
  submission.status = status;
  if (score !== undefined) submission.score = score;
  if (feedback) submission.feedback = feedback;

  await enrollment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, submission, `Assignment ${status}`));
});

// @desc Get Students Enrolled in a Course
// @route GET /api/v1/admin/courses/:courseId/enrollments
export const getCourseEnrollments = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const enrollments = await Enrollment.find({
    course: courseId,
    paymentStatus: "completed",
  })
    .populate("student", "name email avatar")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new ApiResponse(200, enrollments, "Enrollments fetched"));
});
