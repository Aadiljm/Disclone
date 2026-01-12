const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');

// Setup Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Send Message
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const { sender, recipient, channel, text, fileType } = req.body;

        let fileUrl = '';
        if (req.file) {
            fileUrl = `/uploads/${req.file.filename}`;
        }

        const newMessage = new Message({
            sender,
            recipient,
            channel,
            text,
            fileUrl,
            fileType: fileType || (req.file ? 'file' : 'text')
        });

        const message = await newMessage.save();
        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// Get Messages
router.get('/:channel', async (req, res) => {
    try {
        const messages = await Message.find({ channel: req.params.channel })
            .populate('sender', 'username')
            .sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

module.exports = router;
