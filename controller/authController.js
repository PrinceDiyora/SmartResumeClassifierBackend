const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// SIGNUP CONTROLLER
exports.signup = async (req, res) => {
    const { email, password, confirmpassword } = req.body;

    try {
        if (password !== confirmpassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashPassword,
            },
        });

        return res.status(201).json({ message: 'User created successfully', userId: newUser.id });

    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// LOGIN CONTROLLER
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ message: 'Username or password is incorrect' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Username or password is incorrect' });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.ACCESS_TOKEN_SECRET_KEY,
            { expiresIn: '1h' }
        );

        return res.status(200).json({ message: 'Login successful', userId: user.id, token });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
