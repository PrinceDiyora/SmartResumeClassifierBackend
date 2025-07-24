const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const compileRoutes = require('./routes/compileRoutes')
const authRoutes = require('./routes/authRoutes')
const app = express()
const port = 3000

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));


app.use(bodyParser.json({ limit: "5mb" }));

app.use('/api', compileRoutes)
app.use('/api/auth', authRoutes)


app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`)
})