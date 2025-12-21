const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authUser } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

router.post('/register', [
  authLimiter,
  body('fullname').isLength({ min: 3 }).withMessage('Fullname must be at least 3 characters long'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], userController.registerUser);

router.post('/login', [
  authLimiter,
  body('email').isEmail().withMessage('Invalid Email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], userController.loginUser);

router.post('/refresh-token', userController.refreshToken);

router.get('/profile', authUser, userController.getUserProfile);

router.post('/logout', authUser, userController.logoutUser);

module.exports = router;