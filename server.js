const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const compileRoutes = require('./routes/compileRoutes')
const authRoutes = require('./routes/authRoutes')
const resumeRoutes = require('./routes/resumeRoutes')
const atsRoutes = require('./routes/analyzeRoutes')
const resumeInfoRoutes = require('./routes/resumeInfoRoutes');
const app = express()
const port = 5000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));


app.use(bodyParser.json({ limit: "5mb" }));

app.use('/api', compileRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/analyze', atsRoutes)
app.use('/api/resumeInfo', resumeInfoRoutes);


app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`)
})