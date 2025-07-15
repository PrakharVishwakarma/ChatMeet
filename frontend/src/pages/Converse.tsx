// frontend/src/pages/Converse.tsx

import { useEffect, useRef, useState } from "react";
import { Room } from "../components/converse/Room";

export default function Converse() {
    const [name, setName] = useState("");
    const [joined, setJoined] = useState(false);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [camError, setCamError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);

    const getCam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            setLocalVideoTrack(videoTrack);
            setLocalAudioTrack(audioTrack);

            if (videoRef.current) {
                videoRef.current.srcObject = new MediaStream([videoTrack]);
                videoRef.current.play();
            }
        } catch (err) {
            console.error("getUserMedia() error:", err);
            setCamError("Camera/Mic access denied. Please allow permissions.");
        }
    };

    useEffect(() => {
        console.log("🚀 Joining room...");
        getCam();
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <video
                autoPlay
                ref={videoRef}
                className="w-full max-w-md rounded-lg shadow-md mb-6 border border-gray-300"
            ></video>

            {camError && (
                <p className="text-red-600 font-medium mb-4">{camError}</p>
            )}

            <input
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
            />

            <button
                onClick={() => setJoined(true)}
                disabled={!name.trim()}
                className={`w-full max-w-md py-2 px-4 rounded-md font-semibold text-white transition-all duration-200 ${name.trim()
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-400 cursor-not-allowed"
                    }`}
            >
                Join
            </button>
        </div>
    );
}
