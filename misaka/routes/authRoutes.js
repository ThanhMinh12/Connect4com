const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define endpoints for authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/google-login', authController.googleLogin);
router.get('/current', authController.requireAuth, authController.getCurrentUser);
module.exports = router;