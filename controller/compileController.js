const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

exports.compileLatex = async (req, res) => {
    try {
        const latexCode = req.body.code;
        if (!latexCode) {
            return res.status(400).json({ message: 'No LaTeX code provided' });
        }

        const jobId = uuidv4();
        // const tempDir = path.join(__dirname, '..', 'tmp', jobId);
        const tempDir = path.join('C:', 'Temp', 'latex-tmp', jobId);

        fs.mkdirSync(tempDir, { recursive: true });

        const texFilePath = path.join(tempDir, 'resume.tex');
        const pdfFilePath = path.join(tempDir, 'resume.pdf');

        fs.writeFileSync(texFilePath, latexCode);

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

                res.setHeader("Content-Type", "application/pdf");
                fs.createReadStream(pdfFilePath).pipe(res);
            }
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};