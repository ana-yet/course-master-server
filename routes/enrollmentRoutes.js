const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/enroll/:courseId', enrollmentController.enroll);
router.patch('/:id/complete-lesson', enrollmentController.completeLesson);
router.get('/my-enrollments', enrollmentController.getMyEnrollments);

module.exports = router;
