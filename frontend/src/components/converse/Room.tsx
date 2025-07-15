// frontend/src/components/converse/Room.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";

const URL = "http://localhost:3000";

export const Room = ({
  name,
  localAudioTrack,
  localVideoTrack
}: {
  name: string,
  localAudioTrack: MediaStreamTrack | null,
  localVideoTrack: MediaStreamTrack | null,
}) => {
  const navigate = useNavigate();

  const [lobby, setLobby] = useState(true);
  const [socket, setSocket] = useState<null | Socket>(null);
  const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
  const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const socket = io(URL);

    socket.on('send-offer', async ({ roomId }) => {
      console.log("📤 Sending offer...");
      setLobby(false);
      const pc = new RTCPeerConnection();

      setSendingPc(pc);

      if (localVideoTrack) pc.addTrack(localVideoTrack);
      if (localAudioTrack) pc.addTrack(localAudioTrack);

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", {
          sdp: offer,
          roomId
        });
      };
    });

    socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
      console.log("📩 Received offer → sending answer...");
      setLobby(false);
      const pc = new RTCPeerConnection();

      const remoteStream = new MediaStream();
      setRemoteMediaStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => { });
      }

      pc.ontrack = (event) => {
        console.log("🎯 ontrack fired:", event.track.kind);
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
            if (track.kind === "video") {
              setRemoteVideoTrack(track);
            } else if (track.kind === "audio") {
              setRemoteAudioTrack(track);
            }
          });
        } else {
          remoteStream.addTrack(event.track);
        }
      };

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          socket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId
          });
        }
      };

      await pc.setRemoteDescription(remoteSdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setReceivingPc(pc);

      socket.emit("answer", {
        roomId,
        sdp: answer
      });
    });

    socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
      setLobby(false);
      setSendingPc(pc => {
        if (pc && remoteSdp) {
          pc.setRemoteDescription(remoteSdp);
        }
        return pc;
      });
    });

    socket.on("lobby", () => {
      setLobby(true);
    });

    socket.on("add-ice-candidate", ({ candidate, type }) => {
      if (!candidate) return;
      console.log("❄️ Received ICE candidate:", type);
      if (type === "sender") {
        setReceivingPc(pc => {
          pc?.addIceCandidate(candidate).catch(e => console.error("ICE error (sender):", e));
          return pc;
        });
      } else {
        setSendingPc(pc => {
          pc?.addIceCandidate(candidate).catch(e => console.error("ICE error (receiver):", e));
          return pc;
        });
      }
    });

    socket.on("partner-disconnected", () => {
      console.warn("⚠️ Partner disconnected unexpectedly.");

      // 1️⃣ Clean up peer connections
      sendingPc?.close();
      receivingPc?.close();
      setSendingPc(null);
      setReceivingPc(null);

      // 2️⃣ Reset remote media (so old tracks don't leak)
      setRemoteMediaStream(null);
      setRemoteVideoTrack(null);
      setRemoteAudioTrack(null);

      // 3️⃣ Show waiting screen (backend will requeue and emit 'lobby')
      setLobby(true);
    });

    setSocket(socket);
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localVideoTrack) {
      const stream = new MediaStream([localVideoTrack]);
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => { });
    }
  }, [localVideoTrack]);

  const handleLeaveChat = () => {
    // 1. Notify server
    socket?.emit("leave-chat");
    socket?.disconnect();

    // 2. Stop media tracks
    localVideoTrack?.stop();
    localAudioTrack?.stop();
    remoteVideoTrack?.stop();
    remoteAudioTrack?.stop();

    // 3. Close peer connections
    sendingPc?.close();
    receivingPc?.close();

    // 4. Navigate back to landing page
    navigate("/");
  };

  const handleSkip = () => {
    if (!socket) return;

    socket.emit("skip");

    sendingPc?.close();
    receivingPc?.close();

    setSendingPc(null);
    setReceivingPc(null);

    // Stop and clean remote tracks
    remoteVideoTrack?.stop();
    remoteAudioTrack?.stop();

    setRemoteVideoTrack(null);
    setRemoteAudioTrack(null);
    setRemoteMediaStream(null);

    setLobby(true); // back to waiting state
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">🎥 Welcome, {name}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2 text-gray-700">📍 Local Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg border"
          />
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2 text-gray-700">🌐 Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg border"
          />
        </div>
      </div>

      {lobby && (
        <div className="mt-6 p-3 bg-yellow-100 text-yellow-800 rounded shadow text-center w-full max-w-md">
          ⏳ Waiting to connect you to someone...
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleLeaveChat}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md"
        >
          🚪 Leave Chat
        </button>

        <button
          onClick={handleSkip}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md shadow-md"
        >
          ⏭️ Skip
        </button>
      </div>

    </div>
  );
};

