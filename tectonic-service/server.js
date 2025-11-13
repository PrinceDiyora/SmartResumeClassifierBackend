const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const upload = multer({ dest: "uploads/" });
const app = express();

app.post("/compile", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded");

    const uploadPath = req.file.path;
    const workDir = path.join(__dirname, "work");
    fs.mkdirSync(workDir, { recursive: true });

    const texPath = path.join(workDir, "input.tex");
    const pdfPath = path.join(workDir, "input.pdf");

    // Move uploaded file → input.tex
    fs.renameSync(uploadPath, texPath);

    // Run tectonic
    exec(`tectonic ${texPath} --outdir ${workDir}`, (err, stdout, stderr) => {
        console.log("Tectonic stdout:", stdout);
        console.log("Tectonic stderr:", stderr);

        if (err) {
            console.error("Compilation error:", err);
            return res.status(500).send("Compilation error");
        }

        if (!fs.existsSync(pdfPath)) {
            return res.status(500).send("PDF not generated");
        }

        const pdf = fs.readFileSync(pdfPath);

        res.setHeader("Content-Type", "application/pdf");
        res.send(pdf);

        // Cleanup
        try {
            fs.unlinkSync(texPath);
            fs.unlinkSync(pdfPath);
        } catch (cleanupError) {
            console.warn("Cleanup failed:", cleanupError);
        }
    });
});

app.listen(8080, () => console.log("Tectonic microservice running on 8080"));
