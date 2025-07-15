// backend/src/index.ts

import express, { Application } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { UserManager } from "./managers/UserManager";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const userManager = new UserManager();

// Socket.IO connection
io.on("connection", (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    userManager.addUser("randomName", socket);

    socket.on("disconnect", () => {
        console.log(`❌ User disconnected: ${socket.id}`);
        userManager.removeUser(socket.id);
    });

    socket.on("skip", () => {
        console.log(`⏭️ User requested to skip: ${socket.id}`);
        userManager.skip(socket.id);
    });

    socket.on("leave-chat", () => {
        console.log(`🚪 User left chat: ${socket.id}`);
        userManager.leaveChat(socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅Signaling Server running on http://localhost:${PORT}`);
});