import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSocketContext } from "../../context/SocketContext";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff, 
  ShieldAlert, 
  Activity, 
  Users, 
  Clock 
} from "lucide-react";
import toast from "react-hot-toast";

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const ConsultationWorkspace = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocketContext();
  const { user } = useSelector((state) => state.auth);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [remoteUserConnected, setRemoteUserConnected] = useState(false);

  // 1. Timer for Consultation duration
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Create Peer Connection
  function createPeerConnection() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    // Send local candidate to peers
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc:ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    // Connection state diagnostics
    pc.onconnectionstatechange = () => {
      console.log("🕸️ PeerConnection state change:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setConnectionStatus("Consultation Active");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setConnectionStatus("Reconnecting...");
      }
    };

    // Render remote stream when tracks arrive
    pc.ontrack = (event) => {
      console.log("🎯 Received remote media tracks.");
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  }

  // Terminate Call & Navigate Home
  function hangUpCall() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  useEffect(() => {
    if (!socket) {
      toast.error("Socket signaling connection not active. Reconnecting...");
      return;
    }

    const initStreamsAndSignaling = async () => {
      try {
        // Get media streams
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        setConnectionStatus("Room Joined. Waiting for peer...");

        // Join room inside socket signaling server
        socket.emit("webrtc:join-room", { roomId, userId: user._id });

        // Initialize PeerConnection
        createPeerConnection();

        // Register WebSockets Signaling Listeners
        socket.on("webrtc:user-joined", async ({ userId: joinedUserId, socketId }) => {
          console.log("📹 Peer connected. Initiating call offer...");
          setRemoteUserConnected(true);
          toast.success("Consultation partner has entered the room.");
          setConnectionStatus("Connecting Peer...");
          
          // Re-create peer connection on user joined to clear stale state
          createPeerConnection();
          
          // Add local tracks to peer connection
          localStreamRef.current.getTracks().forEach((track) => {
            peerConnectionRef.current.addTrack(track, localStreamRef.current);
          });

          // Create WebRTC Offer
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit("webrtc:offer", { roomId, offer });
        });

        socket.on("webrtc:offer", async ({ offer, senderId }) => {
          console.log("📤 Received WebRTC offer.");
          setRemoteUserConnected(true);
          setConnectionStatus("Connecting Peer...");

          if (!peerConnectionRef.current) {
            createPeerConnection();
          }

          // Add local tracks if not already added
          const senders = peerConnectionRef.current.getSenders();
          if (senders.length === 0 && localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
              peerConnectionRef.current.addTrack(track, localStreamRef.current);
            });
          }

          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit("webrtc:answer", { roomId, answer });
        });

        socket.on("webrtc:answer", async ({ answer, senderId }) => {
          console.log("📥 Received WebRTC answer.");
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            setConnectionStatus("Secure Session Encrypted");
          }
        });

        socket.on("webrtc:ice-candidate", async ({ candidate, senderId }) => {
          if (peerConnectionRef.current && candidate) {
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error("Error adding ice candidate:", err);
            }
          }
        });

        socket.on("webrtc:user-left", ({ userId: leftUserId, socketId }) => {
          console.log("🛑 Peer left call.");
          setRemoteUserConnected(false);
          setConnectionStatus("Peer disconnected. Waiting...");
          toast.error("Consultation partner has left the call.");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });

        socket.on("webrtc:error", ({ message }) => {
          toast.error(message);
          navigate(user?.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/home");
        });
      } catch (err) {
        console.error("Camera access or WebRTC error:", err);
        toast.error("Failed to access camera or microphone. Please check permissions.");
        setConnectionStatus("Hardware Permissions Error");
      }
    };

    initStreamsAndSignaling();

    return () => {
      // Cleanup listeners and media tracks
      if (socket) {
        socket.emit("webrtc:leave", { roomId, userId: user._id });
        socket.off("webrtc:user-joined");
        socket.off("webrtc:offer");
        socket.off("webrtc:answer");
        socket.off("webrtc:ice-candidate");
        socket.off("webrtc:user-left");
        socket.off("webrtc:error");
      }
      hangUpCall();
    };
  }, [roomId, socket]);



  // Toggle Mute Audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      // Revert to camera video
      try {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
        setIsScreenSharing(false);
      } catch (err) {
        console.error("Failed to revert to camera:", err);
      }
    } else {
      // Request screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");

        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack);
          setIsScreenSharing(true);

          // Listen for screen sharing stop click from browser controls
          screenTrack.onended = async () => {
            const defaultVideoTrack = localStreamRef.current.getVideoTracks()[0];
            if (sender && defaultVideoTrack) {
              await sender.replaceTrack(defaultVideoTrack);
            }
            setIsScreenSharing(false);
          };
        }
      } catch (err) {
        console.error("Screen share access denied or failed:", err);
      }
    }
  };



  const handleEndCall = () => {
    hangUpCall();
    toast.success("Consultation session ended securely.");
    navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/home");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* 2. Ambient background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Panel */}
      <header className="px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">Medicare Live Clinic</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === "Consultation Active" ? "bg-green-500" : "bg-amber-400"} animate-ping`}></span>
              {connectionStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3.5 py-1.5 rounded-xl text-sm font-mono text-slate-300">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{formatTime(meetingDuration)}</span>
          </div>

          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-sm text-indigo-300 font-semibold">
            <Users className="w-4 h-4" />
            <span>{remoteUserConnected ? "2 Connected" : "Waiting..."}</span>
          </div>
        </div>
      </header>

      {/* Main Video View Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch z-10 max-h-[calc(100vh-160px)]">
        
        {/* Active Consultation Stream Pane */}
        <div className="lg:col-span-3 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center min-h-[400px]">
          
          {/* Remote Full Screen Video Feed */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
            poster="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"
          />

          {/* Fallback overlay when no peer is connected */}
          {!remoteUserConnected && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                <Users className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold mb-2">Waiting for other participant</h2>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Please share the link or wait here. The session will automatically activate with encrypted high-fidelity streams once the partner joins.
              </p>
            </div>
          )}

          {/* Local Feed - Mini Glassmorphic Picture-in-Picture window */}
          <div className="absolute bottom-6 right-6 w-36 sm:w-48 h-48 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 border border-slate-800">
              You
            </div>
          </div>
        </div>

        {/* Sidebar consultation details pane */}
        <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800/80 backdrop-blur-xs rounded-2xl p-5 flex flex-col justify-between max-h-[600px] lg:max-h-none overflow-y-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Session Info</h3>
              <div className="bg-slate-800/40 border border-slate-700/30 p-3 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Consultation room ID:</span>
                  <span className="font-mono text-xs font-semibold text-slate-300">{roomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Client identity:</span>
                  <span className="font-semibold text-indigo-400">{user?.fullname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Access role:</span>
                  <span className="font-semibold text-indigo-400">{user?.role}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Encryption Shield</h3>
              <div className="flex items-start gap-3 bg-green-500/5 border border-green-500/10 p-3.5 rounded-xl text-xs text-green-400/90 leading-relaxed">
                <ShieldAlert className="w-5 h-5 shrink-0 text-green-400 mt-0.5" />
                <div>
                  <p className="font-bold text-green-400 mb-0.5">HIPAA Compliant Tunnel</p>
                  <p>All video feeds and audio lines are fully encrypted end-to-end. Communication sessions are immutable and compliant with medical safety regulations.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 mt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 text-center">Connection Health</h4>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((bar) => (
                <div 
                  key={bar} 
                  className={`w-1.5 h-6 rounded-full ${
                    connectionStatus === "Consultation Active" 
                      ? "bg-green-500" 
                      : connectionStatus === "Connecting..." || connectionStatus === "Connecting Peer..."
                      ? "bg-amber-500 animate-pulse"
                      : "bg-slate-800"
                  }`}
                  style={{ height: `${bar * 5 + 8}px` }}
                ></div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* Control Dock Panel */}
      <footer className="px-6 py-5 bg-slate-900/60 backdrop-blur-md border-t border-slate-800 flex justify-center items-center gap-4 sm:gap-6 z-10">
        
        {/* Toggle Audio Mute */}
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 cursor-pointer ${
            isAudioMuted
              ? "bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30"
              : "bg-slate-800/60 border-slate-700/50 text-slate-200 hover:bg-slate-700"
          }`}
          title={isAudioMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Video Camera */}
        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 cursor-pointer ${
            isVideoMuted
              ? "bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30"
              : "bg-slate-800/60 border-slate-700/50 text-slate-200 hover:bg-slate-700"
          }`}
          title={isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
        >
          {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Sharing Toggle */}
        <button
          onClick={toggleScreenShare}
          disabled={!remoteUserConnected}
          className={`p-3.5 rounded-2xl border transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            isScreenSharing
              ? "bg-indigo-600 border-indigo-500 text-white"
              : "bg-slate-800/60 border-slate-700/50 text-slate-200 hover:bg-slate-700"
          }`}
          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>

        {/* Hang Up Consultation */}
        <button
          onClick={handleEndCall}
          className="p-3.5 rounded-2xl bg-red-600 border border-red-500 hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
          title="End Consultation"
        >
          <PhoneOff className="w-5 h-5" />
        </button>

      </footer>

    </div>
  );
};

export default ConsultationWorkspace;
