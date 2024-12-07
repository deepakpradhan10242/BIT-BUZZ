const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/connectDB');
const router = require('./routes/index');
const cookiesParser = require('cookie-parser');
const { app, server } = require('./socket/index');

// Enhanced CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL, // Ensure this matches your frontend URL (e.g., https://bit-buzz-client.vercel.app)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Include all required methods
    credentials: true, // Allow cookies and other credentials
    allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allow necessary headers
}));

// Preflight handling
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
});

// Middleware
app.use(express.json());
app.use(cookiesParser());

// Port setup
const PORT = process.env.PORT || 8080;

// Health check route
app.get('/', (req, res) => {
    res.json({
        message: "Server running at " + PORT,
    });
});

// API endpoints
app.use('/api', router);

// Database connection and server start
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log("Server running at " + PORT);
    });
});
