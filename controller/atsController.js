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

    // 2. Use the Model to do the work
    const resumeText = await atsModel.parseResumePdf(resumeBuffer);
    // Call the new model function that only requires resume text
    const analysis = await atsModel.getGeneralResumeAnalysis(resumeText);

    // 3. Send the successful response
    return res.status(200).json(analysis);

  } catch (error) {
    console.error("Controller Error:", error.message);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}
