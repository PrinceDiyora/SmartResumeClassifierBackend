const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdf = require("pdf-parse");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Parses the resume text from a PDF buffer.
 * @param {Buffer} pdfBuffer The buffer object of the uploaded PDF.
 * @returns {Promise<string>} The extracted text from the PDF.
 */
async function parseResumePdf(pdfBuffer) {
  const data = await pdf(pdfBuffer);
  return data.text;
}

/**
 * Calls the Gemini API to get a general quality analysis of the resume.
 * @param {string} resumeText The resume text.
 * @returns {Promise<object>} The JSON analysis from the model.
 */
async function getGeneralResumeAnalysis(resumeText) {
  // The new prompt focuses on general resume quality
  const prompt = `
    You are an expert career coach and professional resume reviewer. Your task is to conduct a detailed quality analysis of the provided resume, breaking down the score by section.

    Perform the following actions:
    1.  Evaluate and score each major section of the resume on a scale of 0 to 100. The sections to score are "Summary/Objective", "Work Experience", "Skills", "Education", and "Formatting & Clarity".
    2.  The "Work Experience" score should heavily factor in the use of strong action verbs and quantified achievements (e.g., using numbers, percentages, or metrics).
    3.  Calculate an "Overall Score" from 0 to 100 based on a weighted average of the individual section scores.
    4.  Provide a brief "Analysis Summary" of the resume's strengths and weaknesses.
    5.  Provide a list of specific, actionable "Improvement Suggestions", ideally tied to the sections that scored lower.

    Provide the final output in a clean, parsable JSON format with the exact following structure:
    {
      "overall_score": 0,
      "section_scores": {
        "summary_or_objective": 0,
        "experience": 0,
        "skills": 0,
        "education": 0,
        "formatting_and_clarity": 0
      },
      "analysis_summary": "",
      "improvement_suggestions": []
    }

    Here is the Resume to analyze:
    ---
    ${resumeText}
    ---
  `
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const cleanedJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanedJsonString);
}

// Export the updated functions
module.exports = {
  parseResumePdf,
  getGeneralResumeAnalysis, // Renamed for clarity
};