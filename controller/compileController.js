const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// Save (create/update) resume, then compile and stream PDF.
exports.compileAndSave = async (req, res) => {
    try {
        const { id: resumeId, title, code } = req.body;
        const userId = req.user && req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!title || !code) {
            return res.status(400).json({ message: 'Title and code are required' });
        }

        // Create or update resume belonging to the authenticated user
        let savedResume;
        if (resumeId) {
            const existing = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
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

        // Proceed to compile using the same flow as compileLatex
        const jobId = uuidv4();
        const tempDir = path.join('C:', 'Temp', 'latex-tmp', jobId);
        fs.mkdirSync(tempDir, { recursive: true });

        const texFilePath = path.join(tempDir, 'resume.tex');
        const pdfFilePath = path.join(tempDir, 'resume.pdf');
        fs.writeFileSync(texFilePath, code);

        const command = `"C:\\Tectonic\\tectonic.exe" --keep-intermediates -o ${tempDir} ${texFilePath}`;

        exec(command, (error, stdout, stderr) => {
            console.log('STDOUT:', stdout);
            console.log('STDERR:', stderr);
            if (error) {
                console.error("LaTeX compilation error", error);
                return res.status(500).json({
                    error: "LaTeX compilation failed",
                    stderr,
                    stdout,
                });
            }

            res.setHeader('x-resume-id', savedResume.id);
            res.setHeader('x-resume-title', savedResume.title);
            res.setHeader("Content-Type", "application/pdf");
            fs.createReadStream(pdfFilePath).pipe(res);
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};