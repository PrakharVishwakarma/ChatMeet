// backend/src/managers/UserManager.ts

import { Socket } from "socket.io";
import RoomManager from "./RoomManager";

const SKIP_COOLDOWN_MS = Number(process.env.SKIP_COOLDOWN_MS) || 5 * 60 * 1000;

export interface User {
    socket: Socket;
    name: string;
}

export class UserManager {
    private users: Map<string, User>;
    private queue: string[];
    private roomManager: RoomManager;
    private skipHistory: Set<string>;


    constructor() {
        this.users = new Map<string, User>();
        this.queue = [];
        this.roomManager = new RoomManager();
        this.skipHistory = new Set<string>();
    }

    private getPairKey(id1: string, id2: string): string {
        return [id1, id2].sort().join('--');
    }

    addUser(name: string, socket: Socket) {
        if (this.users.has(socket.id)) {
            console.log(`⚠️ User [${socket.id}] is already added`);
            return;
        }
        this.users.set(socket.id, { name, socket });
        this.queue.push(socket.id);
        // socket.emit("lobby");
        console.log(`✅ User connected → socket ID: ${socket.id}. Queue length: ${this.queue.length}`);
        this.clearQueue();
        this.initHandlers(socket);
    }

    clearQueue() {
        console.log(`🧹 Clearing queue`);
        while (this.queue.length >= 2) {
            const id1 = this.queue.shift();
            if (!id1) continue;

            let partnerFound = false;

            for (let i = 0; i < this.queue.length; i++) {
                const id2 = this.queue[i];
                const pairKey = this.getPairKey(id1, id2);

                if (this.skipHistory.has(pairKey)) {
                    continue;
                }

                this.queue.splice(i, 1);

                const user1 = this.users.get(id1);
                const user2 = this.users.get(id2);

                if (user1 && user2) {
                    this.roomManager.createRoom(user1, user2);
                    partnerFound = true;
                }
                break;
            }

            if (!partnerFound) {
                // this.queue.push(id1);
                this.queue.unshift(id1);
                break;
            }
        }
    }

    initHandlers(socket: Socket) {
        console.log(`🔌 Initializing handlers for socket [${socket.id}]`);
        socket.on("offer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            console.log(`📨 Received offer from socket [${socket.id}] for room [${roomId}]`);
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        socket.on("answer", ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            console.log(`📨 Received answer from socket [${socket.id}] for room [${roomId}]`);
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("add-ice-candidate", ({ candidate, roomId }) => {
            if (!candidate) return;
            console.log(`❄️ Received ICE candidate from socket [${socket.id}] in room [${roomId}]`);
            this.roomManager.onIceCandidates(candidate, roomId, socket.id);
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

        const pairKey = this.getPairKey(skipper.socket.id, partner.socket.id);
        this.skipHistory.add(pairKey);
        setTimeout(() => {
            this.skipHistory.delete(pairKey);
            console.log(`[Cooldown Expired] Users can be matched again: ${pairKey}`);
        }, SKIP_COOLDOWN_MS);
        console.log(`[Cooldown Started] Users on cooldown for 5 mins: ${pairKey}`);

        this.roomManager.removeRoom(roomId);

        this.queue.push(skipper.socket.id);
        this.queue.push(partner.socket.id);

        skipper.socket.emit("lobby");
        partner.socket.emit("lobby");

        console.log(`⏭️ Requeued skipper [${skipper.socket.id}] and partner [${partner.socket.id}]`);
        this.clearQueue();
    }
}