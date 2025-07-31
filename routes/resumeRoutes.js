const express = require('express');
const router = express.Router();
const resumeController = require('../controller/resumeController');
const { verifyToken } = require('../middleware/middleware');

// All resume routes require authentication
router.use(verifyToken);

// Get all resumes for the authenticated user
router.get('/', resumeController.getUserResumes);

// Get a specific resume by ID
router.get('/:id', resumeController.getResumeById);

// Create a new resume
router.post('/', resumeController.createResume);

// Update an existing resume
router.put('/:id', resumeController.updateResume);

// Delete a resume
router.delete('/:id', resumeController.deleteResume);

module.exports = router;