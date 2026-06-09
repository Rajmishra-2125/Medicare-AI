import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Microscope,
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
  ShoppingCart,
  Check,
  Trash2,
  MapPin,
} from "lucide-react";

const LAB_TEST_ITEMS = [
  { id: "cbc", name: "Complete Blood Count (CBC)", price: 35, category: "Haematology" },
  { id: "thy", name: "Thyroid Profile (T3, T4, TSH)", price: 65, category: "Hormone" },
  { id: "lpd", name: "Lipid Profile (Cholesterol)", price: 45, category: "Cardiac" },
  { id: "kdy", name: "Kidney Function Test (KFT)", price: 55, category: "Renal" },
  { id: "diab", name: "Diabetes HbA1c Test", price: 40, category: "Metabolic" },
];

function LabTests() {
  const [selectedTests, setSelectedTests] = useState([]);
  const [homeCollection, setHomeCollection] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const toggleTest = (test) => {
    if (selectedTests.some(t => t.id === test.id)) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const clearAll = () => setSelectedTests([]);

  const subtotal = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const collectionFee = homeCollection && selectedTests.length > 0 ? 15 : 0;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + collectionFee + tax;

  const filteredTests = LAB_TEST_ITEMS.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-emerald-500 to-teal-650 dark:from-emerald-600 dark:to-teal-700 text-white py-16 transition-all duration-300">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                Diagnostics
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm">
                Advanced Laboratory Testing
              </h1>
              <p className="text-lg md:text-xl text-white/90 font-light max-w-3xl leading-relaxed">
                Get comprehensive blood profiles, allergy testing, and genetic screenings with our state-of-the-art diagnostic services. Schedule home collection with 100% certified phlebotomists.
              </p>
            </div>
            
            <div className="hidden lg:flex justify-end">
              <div className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-emerald-500/20 shadow-2xl hover:scale-105 transition-transform duration-300">
                <Microscope className="w-24 h-24 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]" />
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
                  "Certified NABL-accredited diagnostic laboratory testing",
                  "Hygiene-certified home sample collection by trained professionals",
                  "Digital lab report delivery on your secure patient dashboard",
                  "Complimentary consultation with a GP to review test reports",
                  "Flexible slots from 6:00 AM to 8:00 PM daily",
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
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">Mon - Sun: 6:00 AM - 9:00 PM</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-colors duration-200">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl text-green-600 dark:text-green-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pricing Guide</p>
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">Starting at ₹50 / test package</p>
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
                className="flex-1 inline-flex items-center justify-center gap-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
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
            <div className="sticky top-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-emerald-500/10 transition-colors duration-200">
              
              <div className="bg-linear-to-r from-emerald-500 to-teal-650 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight">Interactive Service Portal</h3>
                  <p className="text-white/80 text-xs mt-0.5">Live validation & scheduling simulator</p>
                </div>
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/10">
                  <Microscope className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-lg">Diagnostics Cart Estimator</h4>
                    <p className="text-sm text-gray-500 mt-1">Select required checkups and estimate fees with home collection options.</p>
                  </div>

                  {!checkoutComplete ? (
                    <>
                      {/* Test Selector */}
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search diagnostics (e.g. CBC, HbA1c)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                          {filteredTests.map((test) => {
                            const isSelected = selectedTests.some(t => t.id === test.id);
                            return (
                              <button
                                key={test.id}
                                onClick={() => toggleTest(test)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
                                    : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                }`}
                              >
                                <div>
                                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{test.name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{test.category}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900 dark:text-white">₹{test.price}</span>
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                    isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 dark:border-gray-600"
                                  }`}>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Home Collection Toggle */}
                      {selectedTests.length > 0 && (
                        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-gray-800 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Home Sample Collection</p>
                              <p className="text-xs text-gray-400 mt-0.5">Phlebotomist visits your address (+₹15)</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={homeCollection}
                            onChange={() => setHomeCollection(!homeCollection)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-gray-300"
                          />
                        </label>
                      )}

                      {/* Pricing Summary */}
                      {selectedTests.length > 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-gray-800/80">
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Tests Subtotal:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">₹{subtotal}</span>
                          </div>
                          {homeCollection && (
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Home Collection Fee:</span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">₹{collectionFee}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax & Lab Handling (8%):</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">₹{tax}</span>
                          </div>
                          <div className="border-t border-gray-200 dark:border-gray-700/50 pt-2 flex justify-between font-black text-gray-900 dark:text-white text-base">
                            <span>Total Estimated Cost:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">₹{total}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 text-sm">
                          <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          Select one or more diagnostic tests to generate an estimate.
                        </div>
                      )}

                      {/* Checkout Button */}
                      {selectedTests.length > 0 && (
                        <div className="flex gap-3">
                          <button
                            onClick={clearAll}
                            className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setCheckoutComplete(true)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md"
                          >
                            Request Cart Scheduling
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-5">
                      <div className="bg-emerald-50 dark:bg-emerald-950/15 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                        <h5 className="font-extrabold text-emerald-900 dark:text-emerald-400">Diagnostics Request Lodged</h5>
                        <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-1">Our customer care will call you shortly to confirm sample slot and dispatch phlebotomists.</p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 text-sm">
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-500">Selected Tests:</span>
                          <span className="text-gray-800 dark:text-gray-200">{selectedTests.length} Items</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Collection mode:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{homeCollection ? "Home Address Sample" : "Lab Self-visit"}</span>
                        </div>
                        <div className="flex justify-between font-black border-t border-gray-200 dark:border-gray-700 pt-2 text-gray-900 dark:text-white">
                          <span>Total Fees due:</span>
                          <span className="text-emerald-600">₹{total}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setCheckoutComplete(false)}
                        className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-all"
                      >
                        Modify Diagnostics Cart
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

export default LabTests;
