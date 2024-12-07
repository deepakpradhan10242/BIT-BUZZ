const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken');
const UserModel = require('../models/UserModel');
const { ConversationModel, MessageModel } = require('../models/ConversationModel');
const getConversation = require('../helpers/getConversation');

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL, // Ensure this matches your frontend origin
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Online users tracking
const onlineUsers = new Map();

/*** Socket.io Connection Handler ***/
io.on('connection', async (socket) => {
    console.log("User connected:", socket.id);

    try {
        // Validate token in handshake
        const token = socket.handshake.auth?.token;
        if (!token) {
            console.error("Token missing in socket handshake");
            socket.emit('error', { message: "Authentication token is required" });
            return socket.disconnect();
        }

        // Get user details from token
        const user = await getUserDetailsFromToken(token);
        if (!user || !user._id) {
            console.error("Invalid user or token");
            socket.emit('error', { message: "Invalid token or user" });
            return socket.disconnect();
        }

        // Register user in online users map and join user-specific room
        onlineUsers.set(user._id.toString(), socket.id);
        socket.join(user._id.toString());
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));

        /*** Socket Event Listeners ***/

        // Fetch conversation messages
        socket.on('message-page', async (userId) => {
            try {
                const userDetails = await UserModel.findById(userId).select('-password');
                if (!userDetails) {
                    return socket.emit('error', { message: "User not found" });
                }

                const payload = {
                    _id: userDetails._id,
                    name: userDetails.name,
                    email: userDetails.email,
                    profile_pic: userDetails.profile_pic,
                    online: onlineUsers.has(userId),
                };
                socket.emit('message-user', payload);

                const conversation = await ConversationModel.findOne({
                    "$or": [
                        { sender: user._id, receiver: userId },
                        { sender: userId, receiver: user._id },
                    ],
                }).populate('messages').sort({ updatedAt: -1 });

                socket.emit('message', conversation?.messages || []);
            } catch (err) {
                console.error("Error in message-page:", err);
                socket.emit('error', { message: "Failed to fetch conversation" });
            }
        });

        // Handle new message creation
        socket.on('new-message', async (data) => {
            try {
                let conversation = await ConversationModel.findOne({
                    "$or": [
                        { sender: data.sender, receiver: data.receiver },
                        { sender: data.receiver, receiver: data.sender },
                    ],
                });

                // Create new conversation if it doesn't exist
                if (!conversation) {
                    conversation = new ConversationModel({
                        sender: data.sender,
                        receiver: data.receiver,
                    });
                    await conversation.save();
                }

                // Save new message
                const message = new MessageModel({
                    text: data.text,
                    imageUrl: data.imageUrl,
                    videoUrl: data.videoUrl,
                    msgByUserId: data.msgByUserId,
                });
                const savedMessage = await message.save();

                // Update conversation with the new message
                await ConversationModel.updateOne(
                    { _id: conversation._id },
                    { $push: { messages: savedMessage._id } }
                );

                const updatedConversation = await ConversationModel.findOne({
                    _id: conversation._id,
                }).populate('messages');

                // Emit updated messages to both participants
                io.to(data.sender).emit('message', updatedConversation?.messages || []);
                io.to(data.receiver).emit('message', updatedConversation?.messages || []);

                // Emit updated conversations to both participants
                io.to(data.sender).emit('conversation', await getConversation(data.sender));
                io.to(data.receiver).emit('conversation', await getConversation(data.receiver));
            } catch (err) {
                console.error("Error in new-message:", err);
                socket.emit('error', { message: "Failed to send message" });
            }
        });

        // Fetch sidebar conversations
        socket.on('sidebar', async (currentUserId) => {
            try {
                const conversations = await getConversation(currentUserId);
                socket.emit('conversation', conversations);
            } catch (err) {
                console.error("Error in sidebar:", err);
                socket.emit('error', { message: "Failed to fetch conversations" });
            }
        });

        // Mark messages as seen
        socket.on('seen', async (msgByUserId) => {
            try {
                const conversation = await ConversationModel.findOne({
                    "$or": [
                        { sender: user._id, receiver: msgByUserId },
                        { sender: msgByUserId, receiver: user._id },
                    ],
                });

                const conversationMessageIds = conversation?.messages || [];

                // Mark messages as seen
                await MessageModel.updateMany(
                    { _id: { $in: conversationMessageIds }, msgByUserId },
                    { $set: { seen: true } }
                );

                // Emit updated conversations to both participants
                io.to(user._id.toString()).emit('conversation', await getConversation(user._id));
                io.to(msgByUserId).emit('conversation', await getConversation(msgByUserId));
            } catch (err) {
                console.error("Error in seen:", err);
                socket.emit('error', { message: "Failed to mark messages as seen" });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            onlineUsers.delete(user._id.toString());
            console.log('User disconnected:', socket.id);
            io.emit('onlineUsers', Array.from(onlineUsers.keys()));
        });
    } catch (err) {
        console.error("Error during connection:", err);
        socket.emit('error', { message: "Failed to establish socket connection" });
        socket.disconnect();
    }
});

module.exports = {
    app,
    server,
};
