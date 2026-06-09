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
} from "lucide-react";

const Section = ({ icon: Icon, title, children, id }) => (
  <div id={id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 scroll-mt-24">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const PrivacyPolicy = () => {
  const sections = [
    { id: "introduction", label: "Introduction", icon: Shield },
    { id: "information", label: "Information We Collect", icon: Database },
    { id: "usage", label: "How We Use Information", icon: Eye },
    { id: "google-oauth", label: "Google OAuth", icon: UserCheck },
    { id: "medical", label: "Medical Records", icon: Lock },
    { id: "cookies", label: "Cookies & Sessions", icon: Cookie },
    { id: "third-party", label: "Third-Party Services", icon: Globe },
    { id: "security", label: "Data Security", icon: Shield },
    { id: "rights", label: "User Rights", icon: UserCheck },
    { id: "contact", label: "Contact", icon: Mail },
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
            <div className="bg-linear-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Your Privacy Matters</h2>
              </div>
              <p className="text-blue-100 leading-relaxed">
                At Medicare, we are deeply committed to protecting your personal
                health information. This Privacy Policy explains how we collect,
                use, and protect your data when you use our healthcare
                appointment platform.
              </p>
            </div>

            <Section id="introduction" icon={Shield} title="1. Introduction">
              <p>
                Medicare (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
                operates the website
                <a
                  href="https://medicare-ai-agent.onrender.com"
                  className="text-blue-600 hover:underline mx-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://medicare-ai-agent.onrender.com
                </a>
                (the &quot;Service&quot;). This Privacy Policy describes how we
                collect, use, disclose, and protect information about you when
                you use our platform.
              </p>
              <p>
                By accessing or using Medicare, you agree to the practices
                described in this policy. If you do not agree with this policy,
                please discontinue use of the Service immediately.
              </p>
            </Section>

            <Section
              id="information"
              icon={Database}
              title="2. Information We Collect"
            >
              <p>
                We collect the following categories of personal information:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Account Information:
                  </strong>{" "}
                  Full name, email address, phone number, date of birth, gender,
                  and password (encrypted).
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Health Information:
                  </strong>{" "}
                  Medical history, appointment records, prescriptions, and
                  documents you upload to the platform.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Authentication Data:
                  </strong>{" "}
                  OAuth tokens when you sign in via Google.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Payment Information:
                  </strong>{" "}
                  Appointment payment details processed via Cashfree (we do not
                  store raw card data).
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Usage Data:
                  </strong>{" "}
                  Log data, IP address, browser type, and pages visited.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Device Information:
                  </strong>{" "}
                  Operating system, browser version, and device identifiers.
                </li>
              </ul>
            </Section>

            <Section
              id="usage"
              icon={Eye}
              title="3. How We Use Your Information"
            >
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Create and manage your Medicare account</li>
                <li>Facilitate doctor appointments and consultations</li>
                <li>Process appointment payments securely</li>
                <li>Send appointment reminders and notifications</li>
                <li>Enable doctors to access relevant patient records</li>
                <li>Improve and personalize your experience on the platform</li>
                <li>
                  Comply with applicable healthcare regulations and legal
                  obligations
                </li>
                <li>Prevent fraudulent or unauthorized access</li>
              </ul>
              <p className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                We do not sell, rent, or trade your personal health information
                to any third party for marketing purposes.
              </p>
            </Section>

            <Section
              id="google-oauth"
              icon={UserCheck}
              title="4. Google OAuth Authentication"
            >
              <p>
                Medicare offers the ability to sign in using your Google account
                via Google OAuth 2.0. When you choose this option:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  We receive your name, email address, and profile picture from
                  Google.
                </li>
                <li>We do not receive your Google password at any point.</li>
                <li>
                  Your Google account data is used solely to create or identify
                  your Medicare account.
                </li>
                <li>
                  You can revoke Medicare&apos;s access to your Google account
                  at any time via your Google Account security settings.
                </li>
              </ul>
              <p className="mt-3">
                Google&apos;s use of your data is governed by the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Privacy Policy
                </a>
                .
              </p>
            </Section>

            <Section
              id="medical"
              icon={Lock}
              title="5. Medical Records & Appointment Data"
            >
              <p>
                Medical data is among the most sensitive personal information.
                Medicare takes the following specific measures to protect it:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  Medical records and documents are stored securely on
                  Cloudinary with HTTPS-only access.
                </li>
                <li>
                  Only the patient and their treating doctors can access medical
                  records.
                </li>
                <li>
                  Appointment history is retained for continuity of care and may
                  be required for regulatory compliance.
                </li>
                <li>
                  Prescription data is accessible only to the patient and the
                  issuing doctor.
                </li>
                <li>
                  You may request deletion of your medical records by contacting
                  our support team.
                </li>
              </ul>
            </Section>

            <Section id="cookies" icon={Cookie} title="6. Cookies & Sessions">
              <p>Medicare uses cookies and similar technologies to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Authentication Cookies:
                  </strong>{" "}
                  HttpOnly, secure cookies that maintain your login session.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Preference Cookies:
                  </strong>{" "}
                  Store your theme and display preferences.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Analytics Cookies:
                  </strong>{" "}
                  Help us understand how users interact with the platform.
                </li>
              </ul>
              <p className="mt-3">
                You can control cookies through your browser settings. Disabling
                cookies may affect your ability to log in and use certain
                features of the platform.
              </p>
            </Section>

            <Section
              id="third-party"
              icon={Globe}
              title="7. Third-Party Services"
            >
              <p>
                We integrate with the following third-party services, each
                governed by their own privacy policies:
              </p>
              <div className="mt-3 space-y-3">
                {[
                  {
                    name: "MongoDB Atlas",
                    desc: "Secure cloud database for storing user and appointment data.",
                  },
                  {
                    name: "Cloudinary",
                    desc: "Cloud storage for medical documents and profile images (HTTPS only).",
                  },
                  {
                    name: "CashFree",
                    desc: "Payment gateway for processing appointment fees. We never store raw card details.",
                  },
                  {
                    name: "Google OAuth",
                    desc: "Authentication service for Google Sign-In.",
                  },
                  {
                    name: "Nodemailer / SMTP",
                    desc: "Email delivery for OTP verification and appointment confirmations.",
                  },
                ].map((s) => (
                  <div
                    key={s.name}
                    className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section id="security" icon={Shield} title="8. Data Security">
              <p>We implement industry-standard security measures including:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>TLS/HTTPS encryption for all data in transit</li>
                <li>Bcrypt hashing for all user passwords</li>
                <li>JWT-based authentication with short-lived access tokens</li>
                <li>
                  HttpOnly and Secure cookie attributes to prevent XSS attacks
                </li>
                <li>Helmet.js security headers on all API responses</li>
                <li>
                  CORS restrictions to only allow authorized frontend origins
                </li>
              </ul>
              <p className="mt-3">
                Despite these measures, no system is 100% secure. In the event
                of a data breach affecting your personal information, we will
                notify affected users as required by law.
              </p>
            </Section>

            <Section id="rights" icon={UserCheck} title="9. Your Rights">
              <p>
                Depending on your location, you may have the following rights
                regarding your data:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Right to Access:
                  </strong>{" "}
                  Request a copy of the personal data we hold about you.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Right to Rectification:
                  </strong>{" "}
                  Correct inaccurate or incomplete information in your profile.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Right to Deletion:
                  </strong>{" "}
                  Request deletion of your account and associated data.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Right to Portability:
                  </strong>{" "}
                  Request an export of your data in a machine-readable format.
                </li>
                <li>
                  <strong className="text-gray-800 dark:text-gray-100">
                    Right to Withdraw Consent:
                  </strong>{" "}
                  Revoke consent for data processing at any time.
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at the email
                below.
              </p>
            </Section>

            <Section id="contact" icon={Mail} title="10. Contact Information">
              <p>
                If you have any questions, concerns, or requests regarding this
                Privacy Policy or your personal data, please contact us:
              </p>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  Medicare Support Team
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <a
                    href="mailto:m30102658@gmail.com"
                    className="text-blue-600 hover:underline"
                  >
                    m30102658@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2 text-sm mt-1">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <a
                    href="https://medicare-ai-agent.onrender.com"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    medicare-ai-agent.onrender.com
                  </a>
                </p>
              </div>
            </Section>

            {/* Footer note */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 pb-4">
              © {new Date().getFullYear()} Medicare. All rights reserved.
              &nbsp;·&nbsp;
              <Link
                to="/terms"
                className="hover:text-blue-500 transition-colors"
              >
                Terms of Service
              </Link>
            </p>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
