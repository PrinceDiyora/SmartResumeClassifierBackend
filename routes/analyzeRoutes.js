const express = require('express')
const router  = express.Router();
const atsController = require('../controller/atsController')
const multer = require('multer')

const upload = multer({ storage: multer.memoryStorage() });


router.post('/ats-score', upload.single("resumeFile"), atsController.analyzeResume);


module.exports = router;