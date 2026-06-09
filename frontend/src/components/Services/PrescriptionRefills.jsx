import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Pill,
  ArrowLeft,
  CheckCircle,
  Activity,
  Shield,
  Clock,
  Sparkles,
  Zap,
  Phone,
  Calendar,
  Search,
  AlertTriangle,
} from "lucide-react";

const MOCK_ACTIVE_PRESCRIPTIONS = {
  "rx-9988": { doctor: "Dr. Sandeep Sharma", date: "24-May-2026", meds: "Metformin 500mg, Atorvastatin 10mg", remainingRefills: 2, pharmacy: "Apollo Pharmacy" },
  "rx-4412": { doctor: "Dr. Priya Patel", date: "10-May-2026", meds: "Amoxicillin 250mg", remainingRefills: 0, pharmacy: "MedPlus Pharmacy" },
};

function PrescriptionRefills() {
  const [rxQuery, setRxQuery] = useState("");
  const [activeRx, setActiveRx] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [status, setStatus] = useState("search"); // search, detail, ordered

  const searchPrescription = () => {
    setErrorMsg("");
    const key = rxQuery.toLowerCase().trim();
    if (MOCK_ACTIVE_PRESCRIPTIONS[key]) {
      setActiveRx({ id: key, ...MOCK_ACTIVE_PRESCRIPTIONS[key] });
      setStatus("detail");
    } else {
      setErrorMsg("Prescription ID not found. Enter rx-9988 or rx-4412 for validation.");
    }
  };

  const processRefill = () => {
    setStatus("ordered");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-amber-500 to-orange-655 dark:from-amber-600 dark:to-orange-700 text-white py-16 transition-all duration-300">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">          
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                Treatments & Meds
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm">
                Prescription Refill Shelf
              </h1>
              <p className="text-lg md:text-xl text-white/90 font-light max-w-3xl leading-relaxed">
                Manage your active prescription history, request one-click refills from your attending doctors, and organize automatic monthly home delivery integrations.
              </p>
            </div>
            
            <div className="hidden lg:flex justify-end">
              <div className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-amber-500/20 shadow-2xl hover:scale-105 transition-transform duration-300">
                <Pill className="w-24 h-24 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]" />
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
                  "HIPAA-compliant digital medical prescription record shelves",
                  "Direct secure API refill approval flows to your clinic physician",
                  "Neighborhood local pharmacy delivery networks within 4 hours",
                  "Medication adherence calendar schedules and pill alarm reminders",
                  "Substantial discounts on chronic illness long-term orders",
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
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Service Hours</p>
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">Pharmacies Open 24/7</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-colors duration-200">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl text-green-600 dark:text-green-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pricing Guide</p>
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">Free Request | Meds by Brand</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300">HIPAA & GDPR Protected Care</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400/90 mt-1">
                  Medicare complies with global patient confidentiality laws. All telemedicine calls, electronic medical charts, pharmacy refills, and labs utilize military-grade encryption systems.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/appointments"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-linear-to-r from-amber-500 to-orange-600 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
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
            <div className="sticky top-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-amber-500/10 transition-colors duration-200">
              
              <div className="bg-linear-to-r from-amber-500 to-orange-650 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight">Interactive Service Portal</h3>
                  <p className="text-white/80 text-xs mt-0.5">Live validation & scheduling simulator</p>
                </div>
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/10">
                  <Pill className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-lg">Active Rx Refill Requester</h4>
                    <p className="text-sm text-gray-500 mt-1">Lookup your digital prescription and request one-click doctor refill authorization.</p>
                  </div>

                  {status === "search" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Prescription ID (Rx ID)</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            value={rxQuery}
                            onChange={(e) => setRxQuery(e.target.value)}
                            placeholder="Enter Rx ID (try: rx-9988 or rx-4412)"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        {errorMsg && <p className="text-red-500 text-xs font-semibold">{errorMsg}</p>}
                      </div>

                      <button
                        onClick={searchPrescription}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                      >
                        Verify Prescription Status
                      </button>
                    </div>
                  )}

                  {status === "detail" && activeRx && (
                    <div className="space-y-5">
                      <div className="bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                          <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">{activeRx.id}</span>
                          <span className="text-xs text-gray-500">{activeRx.date}</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Attending Doctor</p>
                          <p className="font-bold text-gray-900 dark:text-white">{activeRx.doctor}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-semibold uppercase">Prescribed Medicines</p>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{activeRx.meds}</p>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Refills Left</p>
                          {activeRx.remainingRefills > 0 ? (
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">{activeRx.remainingRefills} Refills Left</span>
                          ) : (
                            <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">Expired / Zero Refills</span>
                          )}
                        </div>
                      </div>

                      {activeRx.remainingRefills > 0 ? (
                        <div className="space-y-3">
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 text-sm">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Nominated Pharmacy</p>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-800 dark:text-gray-200">{activeRx.pharmacy}</span>
                              <span className="text-xs font-bold text-emerald-600 uppercase">Auto-dispatch ready</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => setStatus("search")}
                              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all"
                            >
                              Change ID
                            </button>
                            <button
                              onClick={processRefill}
                              className="flex-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md"
                            >
                              Confirm Refill Dispatch
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 dark:bg-red-950/15 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700 dark:text-red-400">
                              This prescription has 0 refills remaining. You must book a quick online follow-up consultation with your attending doctor to renew your authorization before dispatching drugs.
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setStatus("search")}
                              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all"
                            >
                              Change ID
                            </button>
                            <Link
                              to="/appointments"
                              className="flex-2 text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md"
                            >
                              Book Consultation Room
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {status === "ordered" && (
                    <div className="space-y-5">
                      <div className="bg-green-50 dark:bg-green-950/15 p-5 rounded-2xl border border-green-100 dark:border-green-900/30 text-center">
                        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                        <h5 className="font-extrabold text-green-900 dark:text-green-400">Refill Dispatched successfully</h5>
                        <p className="text-xs text-green-700 dark:text-green-500 mt-1">Our pharmacy partner is packaging your prescription. Delivery estimated within 4 hours.</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 text-sm">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-500">Refill Approved:</span>
                          <span className="text-gray-800 dark:text-gray-200 uppercase">{activeRx.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Partner Pharmacy:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{activeRx.pharmacy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Remaining Refills Left:</span>
                          <span className="font-bold text-gray-800 dark:text-gray-200">{activeRx.remainingRefills - 1}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setStatus("search")}
                        className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-all"
                      >
                        Refill Another Prescription
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

export default PrescriptionRefills;
