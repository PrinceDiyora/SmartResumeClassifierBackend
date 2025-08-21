const express = require('express')
const router = express.Router();
const compileController = require('../controller/compileController')
const { verifyToken } = require('../middleware/middleware');

// router.post('/compile', compileController.compileLatex)
router.post('/compile/save', verifyToken, compileController.compileAndSave)

module.exports = router