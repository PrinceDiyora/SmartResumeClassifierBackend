const jwt = require('jsonwebtoken')


exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        res.status(401).json({message: 'unauthorized: no token provided'})
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY)
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({message: 'unauthorized: invaild token'})
    }
}