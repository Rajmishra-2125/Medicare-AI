import React, { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Cookie, Settings } from "lucide-react";

export default function CookieConsent() {
  const [hasConsent, setHasConsent] = useLocalStorage("cookie_consent", null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  if (hasConsent !== null) {
    return null;
  }

  const handleAcceptAll = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setHasConsent({
        necessary: true,
        analytics: true,
        marketing: true,
        timestamp: Date.now()
      });
    }, 400);
  };

  const handleAcceptEssential = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setHasConsent({
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now()
      });
    }, 400);
  };

  const handleSaveCustom = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setHasConsent({
        necessary: true,
        analytics: analyticsEnabled,
        marketing: marketingEnabled,
        timestamp: Date.now()
      });
    }, 400);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] max-w-[420px] w-[calc(100vw-3rem)] pointer-events-none transition-all duration-500 ease-out ${isAnimatingOut ? 'opacity-0 translate-y-10 scale-95' : 'animate-cookie-slide-in'}`}>
      <div className="pointer-events-auto bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl p-5 text-white flex flex-col gap-4 font-sans relative overflow-hidden">
        {/* Decorative subtle background gradient spot */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -z-10 pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30 shrink-0">
            <Cookie className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-wide bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Cookie Preferences
            </h3>
            <p className="text-xs text-slate-400 leading-normal mt-1">
              We use cookies to secure our healthcare application and enhance your appointment scheduling experience.
            </p>
          </div>
        </div>

        {/* Customization Section (Collapsible) */}
        {showCustomize && (
          <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-3 animate-in slide-in-from-top-4 duration-300">
            {/* Essential (Required) */}
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 flex justify-between items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-300">Strictly Necessary</span>
                <span className="text-[10px] text-slate-500 leading-tight">Secure login and basic scheduling tools.</span>
              </div>
              <div className="bg-slate-800 text-indigo-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-slate-750 select-none">
                Required
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 flex justify-between items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-300">Performance & Analytics</span>
                <span className="text-[10px] text-slate-500 leading-tight">Help us optimize clinic wait times and search.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={analyticsEnabled} 
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
              </label>
            </div>

            {/* Marketing */}
            <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 flex justify-between items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-300">Personalized Content</span>
                <span className="text-[10px] text-slate-500 leading-tight">Used to remind patients of upcoming vaccinations.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={marketingEnabled} 
                  onChange={(e) => setMarketingEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>
        )}

        {/* Buttons Panel */}
        <div className="flex flex-col gap-2 mt-1">
          {showCustomize ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCustomize(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer text-center"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 py-2 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
              >
                Save Settings
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/35 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Accept All
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomize(true)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" /> Customize Cookie Settings
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideIn {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-cookie-slide-in {
          animation: cookieSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
