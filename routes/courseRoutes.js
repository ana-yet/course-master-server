const express = require('express');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(courseController.getAllCourses)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'instructor'), // Assuming 'instructor' role exists or will exist
    courseController.createCourse
  );

router
  .route('/:id')
  .get(courseController.getCourse)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'instructor'),
    courseController.updateCourse
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'instructor'),
    courseController.deleteCourse
  );

module.exports = router;
