const express = require('express');
const router = express.Router();
const resumeInfoController = require('../controller/resumeInfoController');
const { verifyToken } = require('../middleware/middleware');

// All routes require authentication
router.use(verifyToken);

router.post('/', resumeInfoController.createResumeInfo);
router.get('/', resumeInfoController.getResumeInfo);

module.exports = router;
