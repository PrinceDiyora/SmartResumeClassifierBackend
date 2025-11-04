const express = require('express')
const router = express.Router();
const authController = require('../controller/authController')

router.post('/signup', authController.signup)
router.post('/login', authController.login)
router.post('/request-reset', authController.requestPasswordReset)
router.post('/reset-password', authController.resetPasswordWithOtp)

module.exports = router;
