import { Socket } from "socket.io";
import RoomManager from "./RoomManager";

export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: Map<string, User>; 
    private queue: string[];
    private roomManager: RoomManager;

    constructor() {
        this.users = new Map<string, User>();
        this.queue = [];
        this.roomManager = new RoomManager();
    }

    addUser(name: string, socket: Socket) {
        if (this.users.has(socket.id)) {
            console.log(`⚠️ User [${socket.id}] is already added`);
            return;
        }
        this.users.set(socket.id, { name, socket });
        this.queue.push(socket.id);
        socket.emit("lobby");
        console.log(`✅ User connected → socket ID: ${socket.id}. Queue length: ${this.queue.length}`);
        this.clearQueue();
        this.initHandlers(socket);
    }

    clearQueue() {
        while (this.queue.length >= 2) {
            const id1 = this.queue.shift();
            const id2 = this.queue.shift();
            if (!id1 || !id2) continue;

            const user1 = this.users.get(id1);
            const user2 = this.users.get(id2);
            if (!user1 || !user2) continue;

            console.log(`🎯 Matching users → ${user1.name} (${id1}) ⇄ ${user2.name} (${id2})`);
            this.roomManager.createRoom(user1, user2);
        }
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
        const userToRemove = this.users.get(socketId);
        if (!userToRemove) return;

        // Clean up any room the user was in
        const roomId = this.roomManager.getRoomIdForUser(socketId);
        if (roomId) {
            const room = this.roomManager.getRoom(roomId);
            if (room) {
                const partner = room.user1.socket.id === socketId ? room.user2 : room.user1;
                partner.socket.emit("partner-disconnected");
                this.queue.push(partner.socket.id);
                this.clearQueue();
            }
            this.roomManager.removeRoom(roomId);
        }

        this.users.delete(socketId);
        this.queue = this.queue.filter(id => id !== socketId);

        console.log(`❌ User [${userToRemove.name}] disconnected. Users: ${this.users.size}, Queue: ${this.queue.length}`);
    }

    skip(socketId: string) {
        const roomId = this.roomManager.getRoomIdForUser(socketId);
        if (!roomId) return;
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const skipper = room.user1.socket.id === socketId ? room.user1 : room.user2;
        const partner = room.user1.socket.id === socketId ? room.user2 : room.user1;

        this.roomManager.removeRoom(roomId);

        this.queue.push(skipper.socket.id);
        this.queue.push(partner.socket.id);

        skipper.socket.emit("lobby");
        partner.socket.emit("lobby");

        console.log(`⏭️ Requeued skipper [${skipper.socket.id}] and partner [${partner.socket.id}]`);
        this.clearQueue();
    }
}