const express = require('express')
const router = express.Router();
const compileController = require('../controller/compileController')

router.post('/compile', compileController.compileLatex)

module.exports = router