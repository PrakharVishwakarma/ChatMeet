// frontend/src/pages/Converse.tsx

import { useEffect, useRef, useState } from "react";
import { Room } from "../components/converse/Room";

export default function Converse() {
    const [name, setName] = useState("");
    const [joined, setJoined] = useState(false);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);

    const mediaStreamRef = useRef<MediaStream | null>(null);

    const [camError, setCamError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);


    const getCam = async () => {
        console.log("🚀 LOBBY: Calling getUserMedia for camera/mic access...");
        try {
            setIsLoading(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            console.log("✅ LOBBY: Camera access granted. Stream received.");

            mediaStreamRef.current = stream;

            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            setLocalVideoTrack(videoTrack);
            setLocalAudioTrack(audioTrack);

            if (videoRef.current) {
                videoRef.current.srcObject = new MediaStream([videoTrack]);
                videoRef.current.play().catch(e => console.error("❌ LOBBY: Local video play() failed:", e));
                console.log("✅ LOBBY: Local video stream attached to video element.");
            }
            setCamError(null);
        } catch (err) {
            console.error("getUserMedia() error:", err);
            setCamError("Camera/Mic access denied. Please allow permissions to continue.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log("🚀 Component Mounted. Starting camera initialization.");
        getCam();
        return () => {
            console.log("🚀 LOBBY: Cleaning up because Converse component is unmounting.");

            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    if (joined) {
        return (
            <Room
                name={name}
                localAudioTrack={localAudioTrack}
                localVideoTrack={localVideoTrack}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
            <div className="absolute inset-0 bg-sky-800 opacity-30"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        ChatRio
                    </h1>
                    <p className="text-gray-300 text-lg">Connect with strangers worldwide</p>
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8">
                    {/* Video Preview */}
                    <div className="relative mb-6 group">
                        <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black/20">
                            {isLoading ? (
                                <div className="aspect-video flex items-center justify-center">
                                    <div className="flex flex-col items-center text-white/70">
                                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                                        <p className="text-sm">Accessing camera...</p>
                                    </div>
                                </div>
                            ) : (
                                <video
                                    autoPlay
                                    muted
                                    playsInline
                                    ref={videoRef}
                                    className="w-full aspect-video object-cover rounded-xl"
                                />
                            )}

                            {/* Video Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-xl"></div>

                            {/* Camera Status Indicator */}
                            {!camError && !isLoading && (
                                <div className="absolute top-3 right-3 flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded-full">
                                        Live
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Camera Error */}
                        {camError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-xl border border-red-500/30">
                                <div className="text-center p-6">
                                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <p className="text-red-300 text-sm mb-3">{camError}</p>
                                    <button
                                        onClick={getCam}
                                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg border border-red-500/30 transition-all duration-200"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Name Input */}
                    <div className="mb-6">
                        <label htmlFor="name" className="block text-white/90 text-sm font-medium mb-2">
                            Enter your name
                        </label>
                        <div className="relative">
                            <input
                                id="name"
                                type="text"
                                placeholder="What should we call you?"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                maxLength={20}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                        {name.length > 15 && (
                            <p className="text-yellow-300 text-xs mt-1">
                                {20 - name.length} characters remaining
                            </p>
                        )}
                    </div>

                    {/* Join Button */}
                    <button
                        onClick={() => setJoined(true)}
                        disabled={!name.trim() || camError !== null || isLoading}
                        className={`w-full py-4 px-6 hover:cursor-pointer rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden group ${name.trim() && !camError && !isLoading
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
                            : "bg-gray-500/30 cursor-not-allowed"
                            }`}
                    >
                        <span className="relative z-10 flex items-center justify-center ">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    Setting up camera...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 hover mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Start Chatting
                                </>
                            )}
                        </span>

                        {/* Button shine effect */}
                        {name.trim() && !camError && !isLoading && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        )}
                    </button>

                    {/* Privacy Notice */}
                    <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                                <p className="text-yellow-200 text-sm font-medium">Privacy Notice</p>
                                <p className="text-yellow-300/80 text-xs mt-1">
                                    Your conversations are not recorded. Be respectful and stay safe online.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-white/50 text-sm">
                        By joining, you agree to our community guidelines
                    </p>
                </div>
            </div>
        </div >
    );
}