import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Course } from "../models/course.model.js";

// @desc    Get All Courses (Public)
// @route   GET /api/v1/courses
// @access  Public
// @features Pagination, Search, Filter, Sort
const getAllCourses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    level,
    sort, // e.g. "price_asc", "price_desc", "newest"
  } = req.query;

  // 1. Build Query Object
  const query = {};

  // Search by Title (Case insensitive regex)
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  // Filters
  if (category) query.category = category;
  if (level) query.level = level;

  // Only show published courses to public (unless admin requesting specific dashboard data)
  query.isPublished = true;

  // 2. Build Sort Object
  let sortOptions = { createdAt: -1 }; // Default: Newest first
  if (sort === "price_asc") sortOptions = { price: 1 };
  if (sort === "price_desc") sortOptions = { price: -1 };
  if (sort === "oldest") sortOptions = { createdAt: 1 };

  // 3. Pagination Logic
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 4. Database Call
  // Optimization: Exclude 'syllabus' & 'batches' from list view to reduce payload size
  const courses = await Course.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .select("-syllabus -batches")
    .populate("instructor", "name avatar");

  const totalCourses = await Course.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        courses,
        pagination: {
          total: totalCourses,
          page: pageNum,
          pages: Math.ceil(totalCourses / limitNum),
        },
      },
      "Courses fetched successfully"
    )
  );
});

// @desc    Get Single Course Details
// @route   GET /api/v1/courses/:id
// @access  Public
const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findById(id).populate("instructor", "name email");

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course details fetched"));
});

// @desc    Create New Course
// @route   POST /api/v1/courses
// @access  Private (Admin)
const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    category,
    level,
    tags,
    thumbnail,
    batch,
    startDate,
    milestones,
  } = req.body;

  if (!title || !description || !price || !category || !batch || !startDate) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const course = await Course.create({
    title,
    description,
    price,
    category,
    level,
    tags,
    thumbnail,
    batch,
    startDate,
    milestones: milestones || [],
    instructor: req.user._id,
    isPublished: true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, course, "Course created successfully"));
});

// @desc    Update Course
// @route   PATCH /api/v1/courses/:id
// @access  Private (Admin)
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findByIdAndUpdate(
    id,
    {
      $set: req.body, // Updates whatever fields are sent
    },
    { new: true } // Return updated doc
  );

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, course, "Course updated successfully"));
});

// @desc    Delete Course
// @route   DELETE /api/v1/courses/:id
// @access  Private (Admin)
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await Course.findByIdAndDelete(id);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  // TODO: Clean up enrollments related to this course (Optional enhancement)
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Course deleted successfully"));
});

export {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
