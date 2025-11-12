const atsModel = require("../models/atsModel");

/**
 * Handles the general resume analysis request.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
exports.analyzeResume = async (req, res) => {
  try {
    // 1. Validate that the file exists
    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required." });
    }

    const resumeBuffer = req.file.buffer;
    const jobDescription = req.body.jobDescription;

    // 2. Use the Model to do the work
    const resumeText = await atsModel.parseResumePdf(resumeBuffer);
    
    let analysis;
    if (jobDescription) {
      // If job description is provided, use job match analysis
      analysis = await atsModel.getJobMatchAnalysis(resumeText, jobDescription);
    } else {
      // Otherwise use general resume analysis
      analysis = await atsModel.getGeneralResumeAnalysis(resumeText);
    }

    // 3. Send the successful response
    return res.status(200).json(analysis);

  } catch (error) {
    console.error("Controller Error:", error.message);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}

/**
 * Calls external ML service to predict role from resume text.
 * Expects a single file field named `resumeFile`.
 */
exports.predictRoleViaService = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required." });
    }

    const resumeText = await atsModel.parseResumePdf(req.file.buffer);
    const serviceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000/predict' || 'https://smartresumeclassifiermlservice.onrender.com';
    // console.log("Connecting to:", serviceUrl);

    const response = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: resumeText })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'ML service error', details: errText });
    }

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Predict service error:', error);
    return res.status(500).json({ error: 'Failed to call ML service' });
  }
}