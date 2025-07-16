const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const cors = require('cors')
const bodyParser = require('body-parser')
const { v4: uuidv4 } = require('uuid')

const port = 3000

app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));


app.post('/compile', async (req, res) => {
    try {
        const latexCode = req.body.code;
        if(!latexCode){
            return res.status(400).json({message: 'No Latex Code Provided'})
        }

        const jobId = uuidv4();
        const tempDir = path.join(__dirname, "tmp", jobId);
        fs.mkdirSync(tempDir, {  recursive: true });

        const texFilePath = path.join(tempDir, "resume.tex");
        const pdfFilePath = path.join(tempDir, "resume.pdf");

        fs.writeFileSync(texFilePath, latexCode);

        const pdflatexPath = `"C:\\Program Files\\MiKTeX\\miktex\\bin\\x64\\pdflatex.exe"`;

        exec(
            `${pdflatexPath} -interaction=nonstopmode -output-directory=${tempDir} ${texFilePath}`,
            (error, stdout, stderr) => {
            
                if (error) {
                    console.error("Compilation error:", stderr);
                    return res.status(500).json({ error: "LaTeX compilation failed" });
                }

                // Send the PDF file
                res.setHeader("Content-Type", "application/pdf");
                fs.createReadStream(pdfFilePath).pipe(res);
            }
        );
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: 'server error'})
    }
});


app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})