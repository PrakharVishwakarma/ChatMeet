// backend/src/managers/RoomManager.ts

import { User } from "./UserManager";

import { v4 as uuidv4 } from "uuid";
interface Room {
    user1: User;
    user2: User;
}

export default class RoomManager {
    private rooms: Map<string, Room>;
    private userToRoomMap: Map<string, string>;


    constructor() {
        this.rooms = new Map<string, Room>();
        this.userToRoomMap = new Map<string, string>();
    }

    createRoom(user1: User, user2: User) {
        if (this.userToRoomMap.has(user1.socket.id) || this.userToRoomMap.has(user2.socket.id)) {
            console.warn(`⚠️ Cannot create room: one or both users already in a room.`);
            return;
        }
        const roomId = uuidv4();
        const roomKey = roomId.toString();

        this.rooms.set(roomKey, { user1, user2 });

        // 🔥 NEW: track which user is in which room
        this.userToRoomMap.set(user1.socket.id, roomKey);
        this.userToRoomMap.set(user2.socket.id, roomKey);

        console.log(`🏠 Room created → ID: ${roomKey}`);
        console.log(`👤 User1: ${user1.name} (${user1.socket.id})`);
        console.log(`👤 User2: ${user2.name} (${user2.socket.id})`);

        // Both users will handle offer logic client-side
        user1.socket.emit("send-offer", { roomId: roomKey });
        user2.socket.emit("send-offer", { roomId: roomKey });

        console.log("📩 Sent 'send-offer' to both users in room", roomKey);
    }

    onOffer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`❌ Room not found: ${roomId}`);
            return;
        }

        const receiver = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        console.log(`➡️ Forwarding offer from [${senderSocketId}] to [${receiver.socket.id}] in room [${roomId}]`);
        receiver.socket.emit("offer", { sdp, roomId });
    }

    onAnswer(roomId: string, sdp: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`❌ Room not found: ${roomId}`);
            return;
        }

        const receiver = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        console.log(`➡️ Forwarding answer from [${senderSocketId}] to [${receiver.socket.id}] in room [${roomId}]`);
        receiver.socket.emit("answer", { sdp, roomId });
    }

    onIceCandidates(candidate: string, type: "sender" | "receiver", roomId: string, senderSocketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log(`❌ Room not found: ${roomId}`);
            return;
        }

        const receiver = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
        console.log(`❄️ Forwarding ICE candidate from [${senderSocketId}] to [${receiver.socket.id}]`);
        receiver.socket.emit("add-ice-candidate", { candidate, type });
    }

    removeRoom(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        console.log(`🧹 Removing room [${roomId}]`);

        // Clean up room
        if (this.rooms.has(roomId)) {
            this.rooms.delete(roomId);
        }
        if (this.userToRoomMap.has(room.user1.socket.id)) {
            this.userToRoomMap.delete(room.user1.socket.id);
        }
        if (this.userToRoomMap.has(room.user2.socket.id)) {
            this.userToRoomMap.delete(room.user2.socket.id);
        }
    }

    getRoomIdForUser(socketId: string): string | null {
        return this.userToRoomMap.get(socketId) || null;
    }

    getRoom(roomId: string): Room | null {
        return this.rooms.get(roomId) || null;
    }

}