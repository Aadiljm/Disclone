const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Generate passcode (6 digits)
        const passcode = Math.floor(100000 + Math.random() * 900000).toString();

        user = new User({
            username,
            email,
            password,
            passcode
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, passcode: user.passcode, email: user.email } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// Login (Username + Passcode + Password) - Deprecated or Admin only? Keeping for now if needed, but adding Access Code route below
router.post('/login', async (req, res) => {
    try {
        const { username, passcode, password } = req.body;

        // Find user by username and passcode
        const user = await User.findOne({ username, passcode });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, passcode: user.passcode, email: user.email } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// Access via Specific Passcodes Only
router.post('/access', async (req, res) => {
    try {
        const { passcode } = req.body;
        const VALID_CODES = ['09102010', '15102007'];

        if (!passcode || !VALID_CODES.includes(passcode)) {
            return res.status(400).json({ msg: 'Invalid passcode' });
        }

        // Check if user exists for this code, if not create one
        let user = await User.findOne({ passcode });

        if (!user) {
            // Create the persistent user for this code if it doesn't exist (simulating "no registration")
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('default_password', salt); // Dummy password

            user = new User({
                username: `User_${passcode}`,
                email: `${passcode}@disclone.local`,
                password: hashedPassword,
                passcode: passcode
            });
            await user.save();
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '365d' }, // Long expiry for convenience
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, passcode: user.passcode, email: user.email } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// Get User
router.get('/user', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

module.exports = router;
