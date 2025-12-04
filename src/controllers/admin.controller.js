import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Enrollment } from "../models/enrollment.model.js";
import { Submission } from "../models/submission.model.js";
import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";

// @desc Get Dashboard Stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalCourses = await Course.countDocuments();
  const totalEnrollments = await Enrollment.countDocuments();

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
        chartData: enrollmentChart,
      },
      "Stats fetched"
    )
  );
});

// @desc Get All Submissions
export const getAllSubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find()
    .populate("student", "name email")
    .populate("course", "title")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new ApiResponse(200, submissions, "Submissions fetched"));
});
