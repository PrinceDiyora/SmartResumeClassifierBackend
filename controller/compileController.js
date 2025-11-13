const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');
const Handlebars = require('handlebars');
const prisma = new PrismaClient();

// Helper function to escape LaTeX special characters (used by helpers too)
function escapeLatexSpecial(text) {
    if (!text) return '';
    let escaped = String(text);
    // Don't escape backslashes in user data (they're rare and would break LaTeX commands if user had them)
    // Only escape characters that commonly appear in user text and break LaTeX
    escaped = escaped.replace(/#/g, '\\#');  // Hash - MUST be escaped
    escaped = escaped.replace(/%/g, '\\%');  // Percent
    escaped = escaped.replace(/&/g, '\\&');  // Ampersand
    escaped = escaped.replace(/\$/g, '\\$');  // Dollar
    escaped = escaped.replace(/_/g, '\\_');  // Underscore (common in URLs, emails)
    escaped = escaped.replace(/\{/g, '\\{');  // Opening brace
    escaped = escaped.replace(/\}/g, '\\}');  // Closing brace
    escaped = escaped.replace(/\^/g, '\\textasciicircum{}');  // Caret
    escaped = escaped.replace(/~/g, '\\textasciitilde{}');  // Tilde
    return escaped;
}

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function(dateString) {
    if (!dateString) return 'Present';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return escapeLatexSpecial(dateString);
        const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        return escapeLatexSpecial(formatted);  // Escape any special chars in formatted date
    } catch (e) {
        return escapeLatexSpecial(dateString);
    }
});

Handlebars.registerHelper('join', function(array, separator) {
    if (!array || !Array.isArray(array)) return '';
    return array.map(item => {
        const value = item.name || item;
        return escapeLatexSpecial(value);
    }).join(separator);
});

Handlebars.registerHelper('uppercase', function(str) {
    return str ? escapeLatexSpecial(str).toUpperCase() : '';
});

// Helper to safely output text (escapes LaTeX special characters)
Handlebars.registerHelper('safe', function(str) {
    return escapeLatexSpecial(str);
});

// Save (create/update) resume, then compile and stream PDF via microservice
exports.compileAndSave = async (req, res) => {
    try {
        const { id: resumeId, title, code } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!title || !code) {
            return res.status(400).json({ message: 'Title and code are required' });
        }

        // Create or update resume belonging to the authenticated user
        let savedResume;
        if (resumeId) {
            const existing = await prisma.resume.findFirst({
                where: { id: resumeId, userId }
            });

            if (!existing) {
                return res.status(404).json({ message: 'Resume not found' });
            }

            savedResume = await prisma.resume.update({
                where: { id: resumeId },
                data: { title, content: code }
            });
        } else {
            savedResume = await prisma.resume.create({
                data: { title, content: code, userId }
            });
        }

        // Check if code contains Handlebars syntax ({{variable}}, {{#if}}, {{#each}}, {{/if}}, etc.)
        const hasHandlebars = /\{\{[#\/]?[^}]+\}\}/.test(code);
        
        // Fetch resume info data for template processing
        let resumeInfo = null;
        try {
            resumeInfo = await prisma.resumeInfo.findFirst({
                where: { userId },
                include: {
                    skills: true,
                    projects: true,
                    experiences: true,
                    educations: true
                },
                orderBy: { updatedAt: 'desc' }
            });
        } catch (error) {
            console.log('Could not fetch resume info, proceeding without template processing:', error.message);
        }

        // Process Handlebars template if it contains Handlebars syntax
        let processedLatex = code;
        if (hasHandlebars) {
            try {
                console.log('Processing Handlebars template...');
                
                // Use the global escapeLatexSpecial function
                const escapeLatexText = escapeLatexSpecial;

                // Prepare template data - escape special LaTeX chars in user data
                const templateData = {
                    name: escapeLatexText(resumeInfo?.name || 'Your Name'),
                    email: escapeLatexText(resumeInfo?.email || 'your.email@example.com'),
                    phone: escapeLatexText(resumeInfo?.phone || '(555) 123-4567'),
                    linkedin: resumeInfo?.linkedin ? escapeLatexText(resumeInfo.linkedin) : null,
                    github: resumeInfo?.github ? escapeLatexText(resumeInfo.github) : null,
                    website: resumeInfo?.website ? escapeLatexText(resumeInfo.website) : null,
                    summary: resumeInfo?.summary ? escapeLatexText(resumeInfo.summary) : null,
                    jobRole: resumeInfo?.jobRole ? escapeLatexText(resumeInfo.jobRole) : null,
                    educations: resumeInfo?.educations ? resumeInfo.educations.map(edu => ({
                        degree: escapeLatexText(edu.degree),
                        institution: escapeLatexText(edu.institution),
                        startDate: edu.startDate,
                        endDate: edu.endDate,
                        grade: edu.grade ? escapeLatexText(edu.grade) : null,
                        description: edu.description ? escapeLatexText(edu.description) : null
                    })) : null,
                    experiences: resumeInfo?.experiences ? resumeInfo.experiences.map(exp => ({
                        role: escapeLatexText(exp.role),
                        company: escapeLatexText(exp.company),
                        startDate: exp.startDate,
                        endDate: exp.endDate,
                        description: exp.description ? escapeLatexText(exp.description) : null
                    })) : null,
                    skills: resumeInfo?.skills ? resumeInfo.skills.map(skill => ({
                        name: escapeLatexText(skill.name)
                    })) : null,
                    projects: resumeInfo?.projects ? resumeInfo.projects.map(proj => ({
                        title: escapeLatexText(proj.title),
                        description: escapeLatexText(proj.description),
                        technologies: proj.technologies ? escapeLatexText(proj.technologies) : null
                    })) : null,
                    languages: resumeInfo?.languages || null
                };

                // Compile and process Handlebars template
                // Use noEscape: true since we've already LaTeX-escaped all data
                // Handlebars' default HTML escaping would mess up our LaTeX escaping
                const template = Handlebars.compile(code, { noEscape: true });
                processedLatex = template(templateData);
                console.log('Handlebars template processed successfully');
            } catch (error) {
                console.error('Error processing Handlebars template:', error);
                console.error('Error details:', error.message, error.stack);
                // Continue with original code if template processing fails
                processedLatex = code;
            }
        } else {
            console.log('No Handlebars syntax detected in template, skipping processing');
        }

        // Create temporary directory
        const jobId = uuidv4();
        const tempDir = path.join('C:', 'Temp', 'latex-tmp', jobId);
        fs.mkdirSync(tempDir, { recursive: true });

        const texFilePath = path.join(tempDir, 'resume.tex');

        // No need for additional escaping - we've already escaped user data in templateData
        // The processed Latex should be safe to write directly
        fs.writeFileSync(texFilePath, processedLatex, 'utf8');


        //CALL THE TECTONIC MICROSERVICE
        const form = new FormData();
        form.append("file", fs.createReadStream(texFilePath));

        const tectonicURL = 'http://localhost:8080';
        if (!tectonicURL) {
            return res.status(500).json({ error: "Missing TECTONIC_SERVICE_URL environment variable" });
        }

        const compileURL = `${tectonicURL}/compile`;

        let response;
        try {
            response = await axios.post(compileURL, form, {
                headers: form.getHeaders(),
                responseType: "arraybuffer"
            });
        } catch (error) {
            console.error("Tectonic microservice error:", error);
            return res.status(500).json({
                error: "LaTeX compilation failed via microservice",
                details: error.message
            });
        }

        // Cleanup temp files
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }

        // Send PDF back to frontend
        res.setHeader("x-resume-id", savedResume.id);
        res.setHeader("x-resume-title", savedResume.title);
        res.setHeader("Content-Type", "application/pdf");

        return res.send(response.data);

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};
