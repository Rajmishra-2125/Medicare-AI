import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Eye,
  Database,
  Lock,
  Cookie,
  Globe,
  UserCheck,
  Mail,
  ChevronRight,
  ArrowLeft,
  Settings,
  Info,
} from "lucide-react";

const Section = ({ icon: Icon, title, children, id }) => (
  <div
    id={id}
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 scroll-mt-24"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
    </div>
    <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const CookiePolicy = () => {
  const sections = [
    { id: "introduction", label: "Introduction", icon: Info },
    { id: "what-is-saved", label: "What Data is Saved?", icon: Database },
    { id: "cookie-types", label: "Essential vs Optional", icon: Cookie },
    { id: "fallback-storage", label: "LocalStorage Fallback", icon: Lock },
    { id: "management", label: "Managing Preferences", icon: Settings },
    { id: "contact", label: "Contact Us", icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Table of Contents */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                On This Page
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg px-3 py-2 transition-all group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-5">
            {/* Hero Banner */}
            <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Cookie className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Understanding Our Cookies</h2>
              </div>
              <p className="text-blue-100 leading-relaxed">
                At Medicare, we value clarity and transparency. This Cookie Policy
                outlines what data we store on your device, how we use sessions
                to keep you logged in, and how our hybrid storage fallback system
                keeps your account safe and functional even if cookies are blocked.
              </p>
            </div>

            <Section id="introduction" icon={Info} title="1. Introduction">
              <p>
                Medicare (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies, local storage
                tokens, and session identifiers on our platform to deliver a fast, reliable, and secure
                user experience.
              </p>
              <p>
                Cookies are small text files stored directly in your browser. LocalStorage is a secure,
                sandboxed browser mechanism that allows web apps to retain session variables between refreshes
                without triggering full-page authorization reloads.
              </p>
            </Section>

            <Section id="what-is-saved" icon={Database} title="2. Exactly What Data is Stored?">
              <p>We store only essential data required to maintain your active account session and configuration. Here is a transparent breakdown of what is saved on your device:</p>
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">🔑 Session Authentication Tokens</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li><strong className="text-gray-800 dark:text-gray-100">accessToken:</strong> A short-lived JSON Web Token (JWT) encrypting your credentials (ID, role) to authorize API requests.</li>
                    <li><strong className="text-gray-800 dark:text-gray-100">refreshToken:</strong> A longer-lived secure JWT token used to automatically request a fresh access token in the background when the current one expires.</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">👤 Profile Details</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li><strong className="text-gray-800 dark:text-gray-100">user:</strong> Stores your basic user profile (fullname, email, role: &apos;patient&apos; / &apos;doctor&apos; / &apos;admin&apos;, and profile image URL). Storing this locally speeds up client dashboard load times and prevents blank dashboard flashes.</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">🎨 Interface Preferences</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs">
                    <li><strong className="text-gray-800 dark:text-gray-100">theme:</strong> Remembers your chosen aesthetic preference (&apos;dark&apos; or &apos;light&apos; theme).</li>
                    <li><strong className="text-gray-800 dark:text-gray-100">cookie-consent:</strong> Stores your decision on the Cookie Consent banner (&apos;essential-only&apos; or &apos;all-approved&apos;) so we don&apos;t keep showing the prompt.</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section id="cookie-types" icon={Cookie} title="3. Essential vs Optional Cookies">
              <p>To give you full control, we divide our cookies and storage keys into two distinct categories:</p>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                <div className="p-4 rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-950/20 text-xs">
                  <h4 className="font-bold text-green-900 dark:text-green-300 text-sm mb-2">🔐 Strictly Essential</h4>
                  <p className="mb-2">Required for the core functionality of our platform. They cannot be turned off because you will not be able to log in or book appointments.</p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-400">
                    <li>Session cookies (`accessToken`)</li>
                    <li>Refresh cookies (`refreshToken`)</li>
                    <li>CSRF Protection headers</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-2">⚙️ Preferences & Personalization</h4>
                  <p className="mb-2">Used to customize your interface experience. Disabling these won&apos;t break authentication, but defaults will reset on every page reload.</p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-400">
                    <li>Theme preference (`theme`)</li>
                    <li>Patient UI states</li>
                    <li>Cookie approval cache</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section id="fallback-storage" icon={Lock} title="4. Our Cookie Fallback Security System">
              <p>
                Many modern browsers (such as Safari, Brave, and Chrome in private mode) heavily block third-party or cross-site cookies by default. Because Medicare&apos;s frontend is hosted on Vercel and our API backend is hosted on Render, browsers block standard HttpOnly cookies across these origins.
              </p>
              <p>
                To solve this, Medicare implements a state-of-the-art **Hybrid Storage Fallback System**:
              </p>
              <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex gap-3">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-xs space-y-1.5 text-blue-900 dark:text-blue-300">
                  <p className="font-bold">How it protects you:</p>
                  <p>When you log in, if the browser blocks HttpOnly cookies, our system securely saves duplicate encrypted tokens inside browser `localStorage`.</p>
                  <p>Our API calls then dynamically attach these tokens as an `Authorization: Bearer &lt;token&gt;` request header. This completely prevents redirection loops, unexpected session logouts, and authenticates you seamlessly!</p>
                </div>
              </div>
            </Section>

            <Section id="management" icon={Settings} title="5. How You Can Manage Cookies">
              <p>
                You have the full right to accept, limit, or refuse cookies on your devices:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-gray-800 dark:text-gray-100">Cookie Consent Banner:</strong> When you first visit Medicare, you can choose &quot;Essential Only&quot; or &quot;Approve All Credentials&quot;. Choosing &quot;Essential Only&quot; disables preferences but retains secure JWT login structures.</li>
                <li><strong className="text-gray-800 dark:text-gray-100">Browser Settings:</strong> You can configure your browser to block cookies or alert you when cookies are sent. Check your browser&apos;s Help page for instructions.</li>
              </ul>
              <p className="mt-3">
                Please note: completely clearing or blocking local storage and cookies will require you to re-login on every visit.
              </p>
            </Section>

            <Section id="contact" icon={Mail} title="6. Contact Us">
              <p>
                If you have any questions or require support regarding your cookies, data storage, or account session, please contact us:
              </p>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Medicare Privacy Compliance</p>
                <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <a href="mailto:m30102658@gmail.com" className="text-blue-600 hover:underline">
                    m30102658@gmail.com
                  </a>
                </p>
              </div>
            </Section>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
              © {new Date().getFullYear()} Medicare. All rights reserved. &nbsp;·&nbsp;
              <Link to="/privacy-policy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link>
            </p>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
