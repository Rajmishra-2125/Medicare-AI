import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  Activity,
  Shield,
  Clock,
  Sparkles,
  Zap,
  Phone,
  Calendar,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";

function HealthRecords() {
  const [files, setFiles] = useState([]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [vaultStatus, setVaultStatus] = useState("unlocked"); // unlocked, encrypting, locked
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files).map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      encrypted: false,
      date: new Date().toLocaleDateString(),
    }));
    setFiles([...files, ...uploadedFiles]);
    setVaultStatus("unlocked");
  };

  const lockVault = () => {
    if (files.length === 0) return;
    setIsEncrypting(true);
    setVaultStatus("encrypting");

    setTimeout(() => {
      setFiles(prev => prev.map(f => ({ ...f, encrypted: true })));
      setIsEncrypting(false);
      setVaultStatus("locked");
    }, 2000);
  };

  const unlockVault = () => {
    setVaultStatus("unlocked");
    setFiles(prev => prev.map(f => ({ ...f, encrypted: false })));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, idx) => idx !== index));
    if (files.length <= 1) setVaultStatus("unlocked");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-violet-500 to-purple-655 dark:from-violet-600 dark:to-purple-700 text-white py-16 transition-all duration-300">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                Security & Storage
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-sm">
                Digital Health Records Vault
              </h1>
              <p className="text-lg md:text-xl text-white/90 font-light max-w-3xl leading-relaxed">
                Secure, centralize, and maintain control of your entire medical timeline. Access your lab reports, prescriptions, and immunizations securely even when offline via our PWA.
              </p>
            </div>
            
            <div className="hidden lg:flex justify-end">
              <div className="p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-violet-500/20 shadow-2xl hover:scale-105 transition-transform duration-300">
                <FileText className="w-24 h-24 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]" />
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
                  "End-to-end AES-256 local database device-level encryption keys",
                  "PWA Service Worker static-asset & medical record cache fallback",
                  "Centralized chronologically grouped patient timeline display",
                  "Instant secure link sharing to authorize emergency-room lookups",
                  "Seamless PDF reports export with digital doctor signatures",
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
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">Instant Access 24/7</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex items-center gap-4 transition-colors duration-200">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl text-green-600 dark:text-green-400">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Pricing Guide</p>
                  <p className="font-bold text-gray-950 dark:text-white mt-0.5">Free | Unlimited Cloud Storage</p>
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
                className="flex-1 inline-flex items-center justify-center gap-2 bg-linear-to-r from-violet-500 to-purple-600 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-violet-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
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
            <div className="sticky top-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-violet-500/10 transition-colors duration-200">
              
              <div className="bg-linear-to-r from-violet-500 to-purple-650 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight">Interactive Service Portal</h3>
                  <p className="text-white/80 text-xs mt-0.5">Live validation & scheduling simulator</p>
                </div>
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/10">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-lg">Secure AES-256 Record Vault</h4>
                    <p className="text-sm text-gray-500 mt-1">Upload health charts, immunizations, or reports and simulate client-side secure vault locking.</p>
                  </div>

                  {/* File Dropper / Input */}
                  {vaultStatus === "unlocked" && (
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-violet-500 dark:hover:border-violet-500 transition-colors cursor-pointer"
                    >
                      <FileText className="w-10 h-10 text-violet-500 mx-auto mb-2 animate-bounce" />
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-300">Drag or Click to upload record</p>
                      <p className="text-xs text-gray-500 mt-1">Supports PDF, JPG, PNG up to 10MB</p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        multiple
                      />
                    </div>
                  )}

                  {/* Uploaded Files Queue */}
                  {files.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase">
                        <span>Staged Records ({files.length})</span>
                        <span>Vault Status</span>
                      </div>

                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-gray-100 dark:border-gray-800"
                          >
                            <div className="flex items-center gap-2 max-w-[70%]">
                              <FileText className="w-4 h-4 text-violet-600 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{file.size} | {file.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {file.encrypted ? (
                                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> AES-256
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Unlock className="w-2.5 h-2.5" /> STAGED
                                </span>
                              )}
                              {vaultStatus === "unlocked" && (
                                <button
                                  onClick={() => removeFile(idx)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Vault Controls */}
                      {vaultStatus === "encrypting" && (
                        <div className="p-4 bg-violet-50 dark:bg-violet-950/15 rounded-2xl border border-violet-100 dark:border-violet-900/30 text-center space-y-2">
                          <Lock className="w-8 h-8 text-violet-600 mx-auto animate-spin" />
                          <h5 className="font-extrabold text-violet-900 dark:text-violet-400">Locking local vaults...</h5>
                          <p className="text-xs text-violet-700 dark:text-violet-500 mt-1">Generating unique client-side key hashes and applying AES-256 algorithm.</p>
                        </div>
                      )}

                      {vaultStatus === "locked" && (
                        <div className="p-4 bg-green-50 dark:bg-green-950/15 rounded-2xl border border-green-100 dark:border-green-900/30 text-center space-y-2">
                          <Lock className="w-8 h-8 text-green-600 mx-auto" />
                          <h5 className="font-extrabold text-green-900 dark:text-green-400">Database Vault Encryption Locked</h5>
                          <p className="text-xs text-green-700 dark:text-green-500 mt-1">Your documents are secured offline in your browser's encrypted IndexedDB storage shell.</p>
                        </div>
                      )}

                      {vaultStatus === "unlocked" && (
                        <button
                          onClick={lockVault}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" /> Lock & Encrypt Vault
                        </button>
                      )}

                      {vaultStatus === "locked" && (
                        <button
                          onClick={unlockVault}
                          className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Unlock className="w-4 h-4" /> Unlock Vault / Add Files
                        </button>
                      )}
                    </div>
                  )}

                  {files.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs">
                      Upload at least one document to activate the secure encryption simulator.
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

export default HealthRecords;
