// frontend/src/components/converse/Room.tsx 

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";

const URL = "http://localhost:3000";

const STUN_SERVERS = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
      ],
    },
  ],
};

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
  const [socket, setSocket] = useState<Socket | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Use ref instead of state to avoid closure issues
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("✅ ROOM: Component Mounted.");
    const newSocket = io(URL);
    setSocket(newSocket);

    const createPeerConnection = (roomId: string) => {
      console.log("Creating peer connection");
      const pc = new RTCPeerConnection(STUN_SERVERS);

      // Add local media tracks
      if (localAudioTrack) {
        pc.addTrack(localAudioTrack);
        console.log("Added audio track to peer connection");
      }
      if (localVideoTrack) {
        pc.addTrack(localVideoTrack);
        console.log("Added video track to peer connection");
      }

      // Fixed ontrack handler using refs instead of state
      pc.ontrack = (event) => {
        console.log("--------------------------------");
        console.log("🎯 DEBUG: ontrack event fired!");
        console.log("  > Track kind:", event.track.kind);
        console.log("  > Event streams length:", event.streams.length);
        console.log("  > Track readyState:", event.track.readyState);

        // Add track to our remote stream ref
        remoteStreamRef.current.addTrack(event.track);
        console.log("  > Added track to remoteStream. Total tracks:", remoteStreamRef.current.getTracks().length);

        // Clear any existing timeout
        if (playTimeoutRef.current) {
          clearTimeout(playTimeoutRef.current);
        }

        // Set the stream to video element with debounced play
        const setRemoteStream = () => {
          if (remoteVideoRef.current) {
            console.log("  > Setting remoteStream to video element");
            remoteVideoRef.current.srcObject = remoteStreamRef.current;

            // Debounce play attempts - wait for all tracks to be added
            playTimeoutRef.current = setTimeout(() => {
              if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                remoteVideoRef.current.play()
                  .then(() => console.log("✅ Remote video playing successfully"))
                  .catch(e => {
                    if (e.name !== 'AbortError') {
                      console.error("❌ Remote video play error:", e);
                    }
                  });
              }
            }, 200);
          } else {
            console.log("  > remoteVideoRef not ready, retrying in 100ms");
            setTimeout(setRemoteStream, 100);
          }
        };

        setRemoteStream();
        console.log("--------------------------------");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("❄️ Sending ICE candidate");
          newSocket.emit("add-ice-candidate", { candidate: event.candidate, roomId });
        }
      };

      // Add connection state logging for debugging
      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      pcRef.current = pc;
    };

    // Caller Path
    newSocket.on("create-offer", async ({ roomId }) => {
      console.log("📞 Caller: creating offer");
      createPeerConnection(roomId);
      if (pcRef.current) {
        try {
          const offer = await pcRef.current.createOffer();
          await pcRef.current.setLocalDescription(offer);
          newSocket.emit("offer", { sdp: offer, roomId });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }
    });

    // Callee Path
    newSocket.on("wait-for-offer", ({ roomId }) => {
      console.log("📱 Callee: waiting for offer");
      createPeerConnection(roomId);
    });

    newSocket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
      console.log("📩 Received offer, sending answer");
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(remoteSdp));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          newSocket.emit("answer", { sdp: answer, roomId });
          setLobby(false);
        } catch (error) {
          console.error("Error handling offer:", error);
        }
      }
    });

    // Finalizing connection for the Caller
    newSocket.on("answer", async ({ sdp: remoteSdp }) => {
      console.log("✅ Received answer");
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(remoteSdp));
          setLobby(false);
        } catch (error) {
          console.error("Error handling answer:", error);
        }
      }
    });

    newSocket.on("add-ice-candidate", ({ candidate }) => {
      console.log("❄️ Received ICE candidate");
      if (pcRef.current && pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(candidate).catch(console.error);
      }
    });

    const cleanupConnection = () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      // Clear timeout
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }

      // Reset remote stream
      remoteStreamRef.current = new MediaStream();

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    newSocket.on("lobby", () => {
      console.log("↩️ Returning to lobby");
      cleanupConnection();
      setLobby(true);
    });

    newSocket.on("partner-disconnected", () => {
      console.warn("⚠️ Partner disconnected");
      cleanupConnection();
      setLobby(true);
    });

    return () => {
      console.log("🚀 Cleaning up Room component");
      cleanupConnection();
      newSocket.disconnect();
      localAudioTrack?.stop();
      localVideoTrack?.stop();
    };

  }, [localAudioTrack, localVideoTrack, navigate]);

  // Setup local video
  useEffect(() => {
    if (localVideoRef.current && (localVideoTrack || localAudioTrack)) {
      const tracks = [];
      if (localVideoTrack) tracks.push(localVideoTrack);
      if (localAudioTrack) tracks.push(localAudioTrack);

      const localStream = new MediaStream(tracks);
      localVideoRef.current.srcObject = localStream;

      localVideoRef.current.play()
        .then(() => console.log("Local video playing"))
        .catch(e => console.error("Local video play error:", e));
    }
  }, [localVideoTrack, localAudioTrack]);

  const handleLeaveChat = () => {
    socket?.disconnect();
    navigate("/");
  };

  const handleSkip = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clear timeout
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    // Reset remote stream
    remoteStreamRef.current = new MediaStream();

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    socket?.emit("skip");
    setLobby(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
      <div className="absolute inset-0 bg-sky-800 opacity-30"></div>

      {/* Header */}
      <div className="relative z-10 bg-white/30 backdrop-blur-md border-b border-white/50">
        <div className="container mx-auto px-2 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ChatRio</h1>
                <p className="text-white/70 text-sm">Welcome, {name}</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {!lobby && (
                <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 text-sm font-medium">Connected</span>
                </div>
              )}
              {lobby && (
                <div className="flex items-center space-x-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-300 text-sm font-medium">Searching...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col container mx-auto px-6 py-6">
        {/* Video Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Remote Video */}
          <div className="relative group">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden h-full min-h-[300px] lg:min-h-[400px]">
              <div className="p-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${!lobby ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <h3 className="text-white font-medium">
                      {!lobby ? 'Stranger' : 'Waiting...'}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-1 text-white/60 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9" />
                    </svg>
                    <span>Remote</span>
                  </div>
                </div>
              </div>
              <div className="relative h-full">
                {lobby ? (
                  <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                      <h4 className="text-white font-medium mb-2">Finding someone...</h4>
                      <p className="text-white/60 text-sm">We're connecting you to a stranger</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover bg-gray-900"
                      onLoadedMetadata={() => console.log("Remote video metadata loaded")}
                      onCanPlay={() => console.log("Remote video can play")}
                      onError={(e) => console.error("Remote video error:", e)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Local Video */}
          <div className="relative group">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden h-full min-h-[300px] lg:min-h-[400px]">
              <div className="p-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <h3 className="text-white font-medium">You</h3>
                  </div>
                  <div className="flex items-center space-x-1 text-white/60 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Local</span>
                  </div>
                </div>
              </div>
              <div className="relative h-full">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover bg-gray-900"
                  onError={(e) => console.error("Local video error:", e)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>

        </div>

        {/* Waiting Message */}
        {lobby && (
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-500/30 rounded-xl px-6 py-4 max-w-md">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-yellow-200 font-medium">Connecting you to someone...</p>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
          <button
            onClick={handleSkip}
            disabled={lobby}
            className={`group relative hover:cursor-pointer px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${lobby
              ? "bg-gray-500/30 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-yellow-500/25 hover:scale-105 active:scale-95"
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Next Person</span>
            {!lobby && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-xl"></div>
            )}
          </button>

          <button
            onClick={handleLeaveChat}
            className="group relative hover:cursor-pointer px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-300 flex items-center space-x-2 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Leave Chat</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-xl"></div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-sm">
            Stay respectful and have fun connecting with strangers worldwide
          </p>
        </div>
      </div>
    </div>
  );
};

/* Using Double RTCPeerConnection */

// // frontend/src/components/converse/Room.tsx

// import { useEffect, useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Socket, io } from "socket.io-client";

// const URL = "http://localhost:3000";

// export const Room = ({
//   name,
//   localAudioTrack,
//   localVideoTrack
// }: {
//   name: string,
//   localAudioTrack: MediaStreamTrack | null,
//   localVideoTrack: MediaStreamTrack | null,
// }) => {
//   const navigate = useNavigate();

//   const [lobby, setLobby] = useState(true);
//   const [socket, setSocket] = useState<null | Socket>(null);
//   const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
//   const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
//   const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
//   const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
//   const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);

//   const remoteVideoRef = useRef<HTMLVideoElement>(null);
//   const localVideoRef = useRef<HTMLVideoElement>(null);

//   useEffect(() => {
//     const socket = io(URL);

//     socket.on('send-offer', async ({ roomId }) => {
//       console.log("📤 Sending offer...");
//       setLobby(false);
//       const pc = new RTCPeerConnection();

//       setSendingPc(pc);

//       if (localVideoTrack) pc.addTrack(localVideoTrack);
//       if (localAudioTrack) pc.addTrack(localAudioTrack);

//       pc.onicecandidate = async (e) => {
//         if (e.candidate) {
//           socket.emit("add-ice-candidate", {
//             candidate: e.candidate,
//             type: "sender",
//             roomId
//           });
//         }
//       };

//       pc.onnegotiationneeded = async () => {
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socket.emit("offer", {
//           sdp: offer,
//           roomId
//         });
//       };
//     });

//     socket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
//       console.log("📩 Received offer → sending answer...");
//       setLobby(false);
//       const pc = new RTCPeerConnection();

//       const remoteStream = new MediaStream();
//       setRemoteMediaStream(remoteStream);
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = remoteStream;
//         remoteVideoRef.current.play().catch(() => { });
//       }

//       pc.ontrack = (event) => {
//         console.log("🎯 ontrack fired:", event.track.kind);
//         if (event.streams && event.streams[0]) {
//           event.streams[0].getTracks().forEach(track => {
//             remoteStream.addTrack(track);
//             if (track.kind === "video") {
//               setRemoteVideoTrack(track);
//             } else if (track.kind === "audio") {
//               setRemoteAudioTrack(track);
//             }
//           });
//         } else {
//           remoteStream.addTrack(event.track);
//         }
//       };

//       pc.onicecandidate = async (e) => {
//         if (e.candidate) {
//           socket.emit("add-ice-candidate", {
//             candidate: e.candidate,
//             type: "receiver",
//             roomId
//           });
//         }
//       };

//       await pc.setRemoteDescription(remoteSdp);
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);
//       setReceivingPc(pc);

//       socket.emit("answer", {
//         roomId,
//         sdp: answer
//       });
//     });

//     socket.on("answer", ({ roomId, sdp: remoteSdp }) => {
//       setLobby(false);
//       setSendingPc(pc => {
//         if (pc && remoteSdp) {
//           pc.setRemoteDescription(remoteSdp);
//         }
//         return pc;
//       });
//     });

//     socket.on("lobby", () => {
//       setLobby(true);
//     });

//     socket.on("add-ice-candidate", ({ candidate, type }) => {
//       if (!candidate) return;
//       console.log("❄️ Received ICE candidate:", type);
//       if (type === "sender") {
//         setReceivingPc(pc => {
//           pc?.addIceCandidate(candidate).catch(e => console.error("ICE error (sender):", e));
//           return pc;
//         });
//       } else {
//         setSendingPc(pc => {
//           pc?.addIceCandidate(candidate).catch(e => console.error("ICE error (receiver):", e));
//           return pc;
//         });
//       }
//     });

//     socket.on("partner-disconnected", () => {
//       console.warn("⚠️ Partner disconnected unexpectedly.");

//       // 1️⃣ Clean up peer connections
//       sendingPc?.close();
//       receivingPc?.close();
//       setSendingPc(null);
//       setReceivingPc(null);

//       // 2️⃣ Reset remote media (so old tracks don't leak)
//       setRemoteMediaStream(null);
//       setRemoteVideoTrack(null);
//       setRemoteAudioTrack(null);

//       // 3️⃣ Show waiting screen (backend will requeue and emit 'lobby')
//       setLobby(true);
//     });

//     setSocket(socket);
//   }, []);

//   useEffect(() => {
//     if (localVideoRef.current && localVideoTrack) {
//       const stream = new MediaStream([localVideoTrack]);
//       localVideoRef.current.srcObject = stream;
//       localVideoRef.current.play().catch(() => { });
//     }
//   }, [localVideoTrack]);

//   const handleLeaveChat = () => {
//     // 1. Notify server
//     socket?.disconnect();

//     // 2. Stop media tracks
//     localVideoTrack?.stop();
//     localAudioTrack?.stop();
//     remoteVideoTrack?.stop();
//     remoteAudioTrack?.stop();

//     // 3. Close peer connections
//     sendingPc?.close();
//     receivingPc?.close();

//     // 4. Navigate back to landing page
//     navigate("/");
//   };

//   const handleSkip = () => {
//     if (!socket) return;

//     socket.emit("skip");

//     sendingPc?.close();
//     receivingPc?.close();

//     setSendingPc(null);
//     setReceivingPc(null);

//     // Stop and clean remote tracks
//     remoteVideoTrack?.stop();
//     remoteAudioTrack?.stop();

//     setRemoteVideoTrack(null);
//     setRemoteAudioTrack(null);
//     setRemoteMediaStream(null);

//     setLobby(true); // back to waiting state
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex flex-col relative overflow-hidden">
//       {/* Background Pattern */}
//       <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
//       <div className="absolute inset-0 bg-sky-800 opacity-30"></div>

//       {/* Header */}
//       <div className="relative z-10 bg-white/30 backdrop-blur-md border-b border-white/50">
//         <div className="container mx-auto px-2 py-1">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-3">
//               <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
//                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                 </svg>
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-white">ChatRio</h1>
//                 <p className="text-white/70 text-sm">Welcome, {name}</p>
//               </div>
//             </div>

//             {/* Connection Status */}
//             <div className="flex items-center space-x-2">
//               {!lobby && (
//                 <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
//                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                   <span className="text-green-300 text-sm font-medium">Connected</span>
//                 </div>
//               )}
//               {lobby && (
//                 <div className="flex items-center space-x-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
//                   <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
//                   <span className="text-yellow-300 text-sm font-medium">Searching...</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="relative z-10 flex-1 flex flex-col container mx-auto px-6 py-6">
//         {/* Video Grid */}
//         <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           {/* Remote Video */}
//           <div className="relative group">
//             <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden h-full min-h-[300px] lg:min-h-[400px]">
//               <div className="p-4 bg-white/5 border-b border-white/10">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-2">
//                     <div className={`w-3 h-3 rounded-full ${!lobby ? 'bg-green-400' : 'bg-gray-400'}`}></div>
//                     <h3 className="text-white font-medium">
//                       {!lobby ? 'Stranger' : 'Waiting...'}
//                     </h3>
//                   </div>
//                   <div className="flex items-center space-x-1 text-white/60 text-sm">
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9" />
//                     </svg>
//                     <span>Remote</span>
//                   </div>
//                 </div>
//               </div>
//               <div className="relative h-full">
//                 {lobby ? (
//                   <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-800/50 to-gray-900/50">
//                     <div className="text-center">
//                       <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
//                         <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                       </div>
//                       <h4 className="text-white font-medium mb-2">Finding someone...</h4>
//                       <p className="text-white/60 text-sm">We're connecting you to a stranger</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <>
//                     <video
//                       ref={remoteVideoRef}
//                       autoPlay
//                       playsInline
//                       className="w-full h-full object-cover"
//                     />
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Local Video */}
//           <div className="relative group">
//             <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden h-full min-h-[300px] lg:min-h-[400px]">
//               <div className="p-4 bg-white/5 border-b border-white/10">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-2">
//                     <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
//                     <h3 className="text-white font-medium">You</h3>
//                   </div>
//                   <div className="flex items-center space-x-1 text-white/60 text-sm">
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                     </svg>
//                     <span>Local</span>
//                   </div>
//                 </div>
//               </div>
//               <div className="relative h-full">
//                 <video
//                   ref={localVideoRef}
//                   autoPlay
//                   muted
//                   playsInline
//                   className="w-full h-full object-cover"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
//               </div>
//             </div>
//           </div>

//         </div>

//         {/* Waiting Message */}
//         {lobby && (
//           <div className="mb-6 flex justify-center">
//             <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-500/30 rounded-xl px-6 py-4 max-w-md">
//               <div className="flex items-center space-x-3">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
//                   <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
//                   <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
//                 </div>
//                 <p className="text-yellow-200 font-medium">Connecting you to someone...</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Control Buttons */}
//         <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
//           <button
//             onClick={handleSkip}
//             disabled={lobby}
//             className={`group relative hover:cursor-pointer px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${lobby
//               ? "bg-gray-500/30 text-gray-400 cursor-not-allowed"
//               : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-yellow-500/25 hover:scale-105 active:scale-95"
//               }`}
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//             </svg>
//             <span>Next Person</span>
//             {!lobby && (
//               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-xl"></div>
//             )}
//           </button>

//           <button
//             onClick={handleLeaveChat}
//             className="group relative hover:cursor-pointer px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-300 flex items-center space-x-2 hover:scale-105 active:scale-95"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//             </svg>
//             <span>Leave Chat</span>
//             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-xl"></div>
//           </button>
//         </div>

//         {/* Footer Info */}
//         <div className="mt-6 text-center">
//           <p className="text-white/50 text-sm">
//             Stay respectful and have fun connecting with strangers worldwide
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };