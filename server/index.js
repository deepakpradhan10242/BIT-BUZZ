const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/connectDB');
const router = require('./routes/index');
const cookiesParser = require('cookie-parser');
const { app, server } = require('./socket/index');

// CORS configuration
app.use(cors({
    origin: ["https://bit-buzz-client.vercel.app"], // Allowed origin
    methods: ["POST", "GET", "OPTIONS"],           // Allow OPTIONS for preflight
    credentials: true                              // Include credentials if needed
}));

// Middleware
app.use(express.json());
app.use(cookiesParser());

// Port configuration
const PORT = process.env.PORT || 8080;

// Base route
app.get('/', (request, response) => {
    response.json({
        message: "Server running at " + PORT
    });
});

// Explicitly handle preflight requests
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://bit-buzz-client.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
});

// API endpoints
app.use('/api', router);

// Connect to the database and start the server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log("Server running at " + PORT);
    });
});
