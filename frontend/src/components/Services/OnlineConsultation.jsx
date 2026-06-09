import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  ArrowLeft,
  CheckCircle,
  Activity,
  Shield,
  Clock,
  Sparkles,
  Zap,
  Camera,
  Mic,
  Wifi,
  Phone,
  Calendar,
} from "lucide-react";

function OnlineConsultation() {
  const [testState, setTestState] = useState("idle"); // idle, testing, finished
  const [progress, setProgress] = useState(0);
  const [devices, setDevices] = useState({ camera: false, mic: false, network: 0 });
  const [latency, setLatency] = useState(0);
  const intervalRef = useRef(null);

  const startTest = () => {
    setTestState("testing");
    setProgress(0);
    setDevices({ camera: false, mic: false, network: 0 });
    setLatency(0);

    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);

      if (currentProgress === 25) {
        setDevices(prev => ({ ...prev, camera: true }));
      }
      if (currentProgress === 55) {
        setDevices(prev => ({ ...prev, mic: true }));
      }
      if (currentProgress === 80) {
        setDevices(prev => ({ ...prev, network: 98 }));
        setLatency(Math.floor(Math.random() * 20) + 12);
      }

      if (currentProgress >= 100) {
        clearInterval(intervalRef.current);
        setTestState("finished");
      }
    }, 150);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 text-white py-16 transition-all duration-300">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                Digital Health
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm">
                Secure Online Consultations
              </h1>
              <p className="text-lg md:text-xl text-white/90 font-light max-w-3xl leading-relaxed">
                Connect with certified medical specialists in real-time.
                Experience HD quality video consultations, secure live chat, and
                instant digital prescriptions from the comfort of your home.
              </p>
            </div>

            <div className="hidden lg:flex justify-end">
              <div className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-cyan-500/20 shadow-2xl hover:scale-105 transition-transform duration-300">
                <Video className="w-24 h-24 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors duration-200">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                What We Offer
              </h2>
              <div className="space-y-4">
                {[
                  "Board-certified physician access in under 15 minutes",
                  "Fully encrypted HIPAA-compliant WebRTC channels",
                  "Integrated digital prescription shelf with auto-refills",
                  "Post-consultation summary and direct follow-up chats",
                  "Accepts health insurance copays and direct card payments",
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="mt-1 shrink-0 p-1 bg-green-50 dark:bg-green-950/30 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-colors duration-200">
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl text-orange-600 dark:text-orange-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Service Hours
                  </p>
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">
                    Available 24/7/365
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-colors duration-200">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl text-green-600 dark:text-green-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    Pricing Guide
                  </p>
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">
                    Starting at ₹75 / consultation
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300">
                  HIPAA & GDPR Protected Care
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400/90 mt-1">
                  Medicare complies with global patient confidentiality laws.
                  All telemedicine calls, electronic medical charts, pharmacy
                  refills, and labs utilize military-grade encryption systems.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/appointments"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Calendar className="w-5 h-5" />
                Book Scheduled Service
              </Link>
              <a
                href="tel:+1234567890"
                className="inline-flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl transition-all border border-gray-200 dark:border-gray-700"
              >
                <Phone className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Right Column - Interactive Widget */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-cyan-500/10 transition-colors duration-200">
              <div className="bg-linear-to-r from-cyan-500 to-blue-600 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight">
                    Interactive Service Portal
                  </h3>
                  <p className="text-white/80 text-xs mt-0.5">
                    Live validation & scheduling simulator
                  </p>
                </div>
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/10">
                  <Video className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-lg">
                      WebRTC Telemedicine Check
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Verify your hardware & network readiness before connecting
                      with doctors.
                    </p>
                  </div>

                  {testState === "idle" && (
                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                      <Video className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-300">
                        Ready to diagnose connection?
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        This will scan your webcam, microphone feeds, and
                        connection speed.
                      </p>
                      <button
                        onClick={startTest}
                        className="mt-5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
                      >
                        Start Video Signal Test
                      </button>
                    </div>
                  )}

                  {testState === "testing" && (
                    <div className="space-y-5 p-4">
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                            Testing hardware pipelines
                          </span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {progress}%
                          </span>
                        </div>
                        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-blue-50 dark:bg-slate-800">
                          <div
                            style={{ width: `${progress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-150"
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Camera className="w-4 h-4" />
                            <span>Webcam Capture</span>
                          </div>
                          {devices.camera ? (
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">
                              DETECTED
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 animate-pulse">
                              CONNECTING...
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Mic className="w-4 h-4" />
                            <span>Microphone Core</span>
                          </div>
                          {devices.mic ? (
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">
                              DETECTED
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 animate-pulse">
                              CONNECTING...
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Wifi className="w-4 h-4" />
                            <span>Connection Quality</span>
                          </div>
                          {devices.network > 0 ? (
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">
                              EXCELLENT ({latency}ms)
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 animate-pulse">
                              MEASURING LATENCY...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {testState === "finished" && (
                    <div className="space-y-5">
                      <div className="bg-green-50 dark:bg-green-950/10 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 text-center">
                        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                        <h5 className="font-extrabold text-green-900 dark:text-green-400">
                          Connection Fully Approved
                        </h5>
                        <p className="text-xs text-green-700 dark:text-green-500 mt-1">
                          Your device successfully meets Medicare WebRTC
                          consultation criteria.
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Video Pipeline:</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            1080p WebCam (Ready)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Audio Stream:</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            Digital Input (Ready)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Latency Check:</span>
                          <span className="font-bold text-green-600">
                            {latency} ms
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={startTest}
                          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all"
                        >
                          Re-Test Connection
                        </button>
                        <Link
                          to="/appointments"
                          className="flex-2 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md"
                        >
                          Join Consult Room
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OnlineConsultation;
