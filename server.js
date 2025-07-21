const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const compileRoutes = require('./routes/compileRoutes')

const app = express()
const port = 3000

app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

app.use('/api', compileRoutes)

app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`)
})