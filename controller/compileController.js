exports.compile = async (req, res) => {
    try {
        const latexCode = req.body.code
        if(!latexCode){
            return res.ststus(400).json({message: 'No Latex Code Provided'})
        }
    } catch (error) {
        
    }
};