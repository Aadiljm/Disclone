require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: false, // For serving uploads
}));
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Database Connection
const startServer = async () => {
    try {
        let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/disclone';

        // Try connecting to the provided URI first (if it's not the default local one which we know fails)
        // Or actually, just straight up use Memory Server if we suspect no local DB
        // checking if we can import mongodb-memory-server
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            console.log('Starting MongoDB Memory Server...');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            console.log('MongoDB Memory Server started at:', mongoUri);
        } catch (e) {
            console.log('mongodb-memory-server not found, trying default URI');
        }

        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected...');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();
