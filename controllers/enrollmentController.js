const Enrollment = require('../models/enrollmentModel');
const Course = require('../models/courseModel');
const AppError = require('../utils/AppError');

exports.enroll = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // 1) Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError('No course found with that ID', 404));
    }

    // 2) Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: courseId,
    });

    if (existingEnrollment) {
      return next(new AppError('You are already enrolled in this course', 400));
    }

    // 3) Create enrollment
    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId,
    });

    res.status(201).json({
      status: 'success',
      data: {
        enrollment,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.completeLesson = async (req, res, next) => {
  try {
    const { id } = req.params; // Enrollment ID
    const { lessonId } = req.body;

    // 1) Get enrollment
    const enrollment = await Enrollment.findById(id).populate('course');
    if (!enrollment) {
      return next(new AppError('No enrollment found with that ID', 404));
    }

    // 2) Check if user owns this enrollment
    if (enrollment.user.toString() !== req.user.id) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    // 3) Add lesson to completedLessons if not already there
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);

      // 4) Recalculate progress
      const totalLessons = enrollment.course.syllabus.length;
      const completedCount = enrollment.completedLessons.length;

      if (totalLessons > 0) {
        enrollment.progress = Math.round((completedCount / totalLessons) * 100);
      } else {
        enrollment.progress = 100; // If no lessons, assume complete? Or 0? 100 seems safer if empty.
      }

      await enrollment.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        enrollment,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id }).populate({
      path: 'course',
      select: 'title thumbnail price instructor',
      populate: {
        path: 'instructor',
        select: 'name',
      },
    });

    res.status(200).json({
      status: 'success',
      results: enrollments.length,
      data: {
        enrollments,
      },
    });
  } catch (err) {
    next(err);
  }
};
