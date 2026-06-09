import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Ambulance,
  ArrowLeft,
  CheckCircle,
  Activity,
  Shield,
  Clock,
  Sparkles,
  Zap,
  Phone,
  Calendar,
  AlertTriangle,
} from "lucide-react";

function EmergencyCare() {
  const [sosState, setSosState] = useState("inactive"); // inactive, dispatching, onway, arrived
  const [coordinates, setCoordinates] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [timerCount, setTimerCount] = useState(12);
  const intervalRef = useRef(null);

  const activateSOS = () => {
    setSosState("dispatching");
    setCoordinates({ lat: "28.6139° N", lng: "77.2090° E" }); // Mock Location
    setChatMessages([
      { sender: "System", text: "SOS TRIPLE-ALPHA BEACON EMITTED SUCCESSFULLY." },
      { sender: "System", text: "Acquiring cellular GPS telemetry coordinates..." },
    ]);

    setTimeout(() => {
      setSosState("onway");
      setChatMessages(prev => [
        ...prev,
        { sender: "System", text: `Coordinates Lock: 28.6139° N, 77.2090° E (Accuracy: ±3 meters)` },
        { sender: "Dispatcher", text: "Medicare Dispatch Center here. An Advanced Life Support ICU Ambulance has been dispatched to your current location immediately. ETA is 12 minutes. Please remain calm." }
      ]);
      setTimerCount(12);
    }, 2500);
  };

  useEffect(() => {
    if (sosState === "onway") {
      intervalRef.current = setInterval(() => {
        setTimerCount(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setSosState("arrived");
            setChatMessages(c => [...c, { sender: "Dispatcher", text: "Ambulance unit is arriving on scene now. Flashing beacon lights visible." }]);
            return 0;
          }
          if (prev === 9) {
            setChatMessages(c => [...c, { sender: "Dispatcher", text: "Unit is crossing the main medical corridor junction. Traffic pre-clearance activated." }]);
          }
          if (prev === 4) {
            setChatMessages(c => [...c, { sender: "Dispatcher", text: "Phlebotomists and surgeons have finalized pre-triage files. Emergency team standing by." }]);
          }
          return prev - 1;
        });
      }, 3000); // 3 seconds per simulated minute
    }

    return () => clearInterval(intervalRef.current);
  }, [sosState]);

  const cancelSOS = () => {
    clearInterval(intervalRef.current);
    setSosState("inactive");
    setCoordinates(null);
    setChatMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-red-500 to-rose-600 dark:from-red-655 dark:to-rose-700 text-white py-16 transition-all duration-300">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                Emergency & Trauma
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm">
                24/7 Emergency Care
              </h1>
              <p className="text-lg md:text-xl text-white/90 font-light max-w-3xl leading-relaxed">
                Activate immediate ICU-grade critical ambulance response or
                trauma care. Our automated system locks coordinates, dispatches
                nearest units, and establishes doctor pre-triage coordination.
              </p>
            </div>

            <div className="hidden lg:flex justify-end">
              <div className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-red-500/20 shadow-2xl hover:scale-105 transition-transform duration-300">
                <Ambulance className="w-24 h-24 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]" />
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
                  "Average 12-minute ambulance arrival in metro areas",
                  "Advanced Life Support (ALS) fully-equipped mobile ICU vehicles",
                  "Live GPS vehicle location sharing and dispatcher audio feeds",
                  "Pre-arrival triage status feeds piped directly to host hospitals",
                  "Board-certified trauma surgery teams standing by on arrival",
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
                    24/7 Emergency Active
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
                    Insurance Cover / Emergency Free
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
                className="flex-1 inline-flex items-center justify-center gap-2 bg-linear-to-r from-red-500 to-rose-600 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Calendar className="w-5 h-5" />
                Book Scheduled Service
              </Link>
              <a
                href="tel:911"
                className="inline-flex items-center justify-center p-4 bg-red-600 hover:bg-red-750 text-white rounded-2xl transition-all border border-red-500 shadow-md shadow-red-500/20"
              >
                <Phone className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Right Column - Interactive Widget */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-red-500/10 transition-colors duration-200">
              <div className="bg-linear-to-r from-red-500 to-rose-600 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight">
                    Interactive Service Portal
                  </h3>
                  <p className="text-white/80 text-xs mt-0.5">
                    Live validation & scheduling simulator
                  </p>
                </div>
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/10">
                  <Ambulance className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-lg">
                      SOS Emergency Dispatch
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Initiate immediate satellite beacon lock to coordinate
                      crisis response teams.
                    </p>
                  </div>

                  {sosState === "inactive" && (
                    <div className="text-center p-8 bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-dashed border-red-200 dark:border-red-900/30">
                      <button
                        onClick={activateSOS}
                        className="w-28 h-28 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xl rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] border-4 border-white dark:border-gray-900 mx-auto flex items-center justify-center transition-all animate-pulse"
                      >
                        SOS
                      </button>
                      <p className="text-sm font-bold text-red-900 dark:text-red-400 mt-5">
                        Ready to dispatch crisis support?
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-500/80 mt-1">
                        Click the button above to test emergency triangulation
                        and response scheduling.
                      </p>
                    </div>
                  )}

                  {sosState === "dispatching" && (
                    <div className="p-5 bg-red-600 text-white rounded-2xl text-center space-y-4 animate-pulse">
                      <Ambulance className="w-12 h-12 mx-auto animate-bounce" />
                      <div>
                        <h5 className="font-black text-lg">
                          LOCKING SATELLITE BEACON...
                        </h5>
                        <p className="text-xs text-red-100 mt-1">
                          Acquiring cellular network routing arrays. Remain
                          standing by.
                        </p>
                      </div>
                    </div>
                  )}

                  {(sosState === "onway" || sosState === "arrived") && (
                    <div className="space-y-4">
                      {/* Dispatch Info */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2 text-sm">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-500">
                            SOS Geolocation:
                          </span>
                          <span className="text-red-600">
                            {coordinates?.lat}, {coordinates?.lng}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">
                            Estimated Arrival:
                          </span>
                          {sosState === "onway" ? (
                            <span className="font-bold text-orange-600 dark:text-amber-500 animate-pulse">
                              {timerCount} Minutes (On the way)
                            </span>
                          ) : (
                            <span className="font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">
                              ARRIVED ON SCENE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dispatch Chat Stream */}
                      <div className="border border-gray-150 dark:border-gray-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-955/10 space-y-3 max-h-44 overflow-y-auto">
                        <p className="text-[10px] text-gray-400 font-bold text-center border-b pb-1 dark:border-gray-800">
                          EMERGENCY DIALOG PROTOCOL ACTIVE
                        </p>
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className="text-xs">
                            {msg.sender === "System" && (
                              <p className="text-slate-500 italic font-mono">
                                {msg.text}
                              </p>
                            )}
                            {msg.sender === "Dispatcher" && (
                              <div className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-850 mt-1">
                                <span className="font-extrabold text-red-600 block text-[10px] uppercase">
                                  🚨 Dispatch Officer
                                </span>
                                <p className="text-gray-800 dark:text-gray-200 font-medium mt-0.5 leading-relaxed">
                                  {msg.text}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={cancelSOS}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-all"
                      >
                        Cancel SOS Dispatch Signal
                      </button>
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

export default EmergencyCare;
