const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

// Simple in-memory OTP store: { email: { code: string, expiresAt: number } }
// In production, prefer a cache like Redis.
const otpStore = new Map();

// Mail transporter using environment variables
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : undefined
});

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

// REQUEST PASSWORD RESET (send OTP)
exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({ message: 'If the email exists, an OTP has been sent' });
        }

        const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        otpStore.set(email, { code, expiresAt });

        // Send email
        const from = process.env.SMTP_USER;
        if (!from) {
            console.warn('MAIL_FROM/SMTP_USER not set; OTP will be logged instead of emailed.');
        }

        const mailOptions = {
            from,
            to: email,
            subject: 'Your password reset code',
            text: `Your OTP is ${code}. It expires in 10 minutes.`,
            html: `<p>Your OTP is <b>${code}</b>. It expires in 10 minutes.</p>`
        };

        try {
            if (from) {
                await transporter.sendMail(mailOptions);
            } else {
                console.log('OTP for', email, '->', code);
            }
        } catch (mailError) {
            console.error('Error sending OTP mail:', mailError);
            return res.status(500).json({ message: 'Failed to send OTP email' });
        }

        return res.status(200).json({ message: 'If the email exists, an OTP has been sent' });
    } catch (error) {
        console.error('Request Password Reset Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// RESET PASSWORD USING OTP
exports.resetPasswordWithOtp = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP and newPassword are required' });
        }

        const record = otpStore.get(email);
        if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        if (record.code !== String(otp)) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            otpStore.delete(email);
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(newPassword, salt);
        await prisma.user.update({ where: { email }, data: { password: hashPassword } });

        otpStore.delete(email);

        return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
