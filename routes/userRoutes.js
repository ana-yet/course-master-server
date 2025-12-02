const express = require('express');
const authController = require('../controllers/authController');
const {
  validate,
  signupSchema,
  loginSchema,
} = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
