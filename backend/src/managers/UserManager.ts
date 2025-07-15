// backend/src/managers/UserManager.ts

import { Socket } from "socket.io";
import RoomManager from "./RoomManager";

export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: User[];
    private queue: string[];
    private roomManager: RoomManager;

    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, socket: Socket) {
        const alreadyQueued = this.queue.includes(socket.id);
        const alreadyAdded = this.users.some(u => u.socket.id === socket.id);
        if (alreadyQueued || alreadyAdded) {
            console.log(`⚠️ User [${name}] with socket [${socket.id}] is already queued or added`);
            return;
        }

        console.log(`✅ User connected → socket ID: ${socket.id}`);
        this.users.push({ name, socket });
        this.queue.push(socket.id);

        socket.emit("lobby");
        console.log(`🕐 Sent 'lobby' to user [${socket.id}]. Queue length: ${this.queue.length}`);

        this.clearQueue();
        this.initHandlers(socket);
    }

    clearQueue() {
        if (this.queue.length < 2) {
            console.log("🛑 Not enough users in queue to create a room.");
            return;
        }

        const id1 = this.queue.shift();
        const id2 = this.queue.shift();

        const user1 = this.users.find((user) => user.socket.id === id1);
        const user2 = this.users.find((user) => user.socket.id === id2);

        if (!user1 || !user2) {
            console.log("❌ Failed to fetch both users for room creation.");
            return;
        }

        console.log(`🎯 Matching users → ${user1.name} (${id1}) ⇄ ${user2.name} (${id2})`);
        this.roomManager.createRoom(user1, user2);

        // Recursively try matching more users
        this.clearQueue();
    }

    initHandlers(socket: Socket) {
        socket.on("offer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            console.log(`📨 Received offer from socket [${socket.id}] for room [${roomId}]`);
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            console.log(`📨 Received answer from socket [${socket.id}] for room [${roomId}]`);
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("add-ice-candidate", ({ candidate, type, roomId }) => {
            if (!candidate) return;
            console.log(`❄️ Received ICE candidate from socket [${socket.id}] in room [${roomId}]`);
            this.roomManager.onIceCandidates(candidate, type, roomId, socket.id);
        });
    }

    removeUser(socketId: string) {
        const user = this.users.find((user) => user.socket.id === socketId);
        if (!user) return;

        console.log(`❌ Removing user [${user.name}] with socket [${socketId}]`);

        this.users = this.users.filter((x) => x.socket.id !== socketId);
        this.queue = this.queue.filter((id) => id !== socketId);

        console.log(`The length of users is ${this.users.length} and queue's length is now: ${this.queue.length}`);  

        // 🆕 Room cleanup
        const roomId = this.roomManager.getRoomIdForUser(socketId);
        if (roomId) {
            const room = this.roomManager.getRoom(roomId);
            if (room) {
                // ✅ Notify only the partner
                const partner = room.user1.socket.id === socketId ? room.user2 : room.user1;
                partner.socket.emit("partner-disconnected");
                this.roomManager.removeRoom(roomId);
                
                this.queue.push(partner.socket.id);
                this.clearQueue();
            }else {
                this.roomManager.removeRoom(roomId);
            }
        }
    }

    skip(socketId: string) {
        const roomId = this.roomManager.getRoomIdForUser(socketId);
        if (!roomId) return;

        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const user1 = room.user1;
        const user2 = room.user2;

        // 🧹 Clean up room
        this.roomManager.removeRoom(roomId);

        // ♻️ Add both users back to queue
        this.queue.push(user1.socket.id);
        this.queue.push(user2.socket.id);

        user1.socket.emit("lobby");
        user2.socket.emit("lobby");

        console.log(`⏭️ Requeued users: ${user1.socket.id}, ${user2.socket.id}`);

        this.clearQueue();
    }

    leaveChat(socketId: string) {
        const roomId = this.roomManager.getRoomIdForUser(socketId);
        if (!roomId) return;

        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const leaver = room.user1.socket.id === socketId ? room.user1 : room.user2;
        const partner = room.user1.socket.id === socketId ? room.user2 : room.user1;

        // 🧹 Clean room
        this.roomManager.removeRoom(roomId);

        // ❌ Remove leaver completely
        this.removeUser(leaver.socket.id);

        // ♻️ Requeue partner
        this.queue.push(partner.socket.id);
        partner.socket.emit("lobby");

        console.log(`🚪 User [${leaver.socket.id}] left. Partner [${partner.socket.id}] requeued.`);

        this.clearQueue();
    }

}
