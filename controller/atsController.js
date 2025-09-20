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
