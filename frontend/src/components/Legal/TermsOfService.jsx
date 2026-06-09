import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  UserCheck,
  Stethoscope,
  CreditCard,
  AlertTriangle,
  Ban,
  ShieldOff,
  Scale,
  RefreshCcw,
  Mail,
  ChevronRight,
  ArrowLeft,
  Globe,
} from "lucide-react";

const Section = ({ icon: Icon, title, children, id }) => (
  <div id={id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 scroll-mt-24">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed space-y-3">
      {children}
    </div>
  </div>
);

const TermsOfService = () => {
  const sections = [
    { id: "acceptance", label: "Acceptance of Terms", icon: FileText },
    { id: "user-responsibilities", label: "User Responsibilities", icon: UserCheck },
    { id: "doctor-responsibilities", label: "Doctor Responsibilities", icon: Stethoscope },
    { id: "payments", label: "Appointments & Payments", icon: CreditCard },
    { id: "disclaimer", label: "Medical Disclaimer", icon: AlertTriangle },
    { id: "prohibited", label: "Prohibited Activities", icon: Ban },
    { id: "suspension", label: "Account Suspension", icon: ShieldOff },
    { id: "liability", label: "Limitation of Liability", icon: Scale },
    { id: "changes", label: "Changes to Terms", icon: RefreshCcw },
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
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg px-3 py-2 transition-all group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    {s.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-5">
            {/* Hero Banner */}
            <div className="bg-linear-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Terms of Service</h2>
              </div>
              <p className="text-indigo-100 leading-relaxed">
                Please read these Terms of Service carefully before using
                Medicare. By accessing or creating an account on our platform,
                you agree to be bound by these terms. These terms govern your
                use of our healthcare appointment scheduling platform.
              </p>
            </div>

            <Section
              id="acceptance"
              icon={FileText}
              title="1. Acceptance of Terms"
            >
              <p>
                By accessing or using Medicare at{" "}
                <a
                  href="https://medicare-ai-agent.onrender.com"
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://medicare-ai-agent.onrender.com
                </a>
                , you confirm that you are at least 18 years old (or have
                parental consent if you are a minor), you have read and
                understood these Terms, and you agree to be bound by them.
              </p>
              <p>
                If you are accessing the platform on behalf of an organization,
                you represent that you have the authority to bind that
                organization to these Terms.
              </p>
              <p className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                These Terms constitute a legally binding agreement. If you do
                not accept these terms, please discontinue use of the platform
                immediately.
              </p>
            </Section>

            <Section
              id="user-responsibilities"
              icon={UserCheck}
              title="2. User Responsibilities"
            >
              <p>As a user (patient) of Medicare, you agree to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  Provide accurate, complete, and truthful information when
                  creating your account and booking appointments.
                </li>
                <li>
                  Keep your login credentials confidential and not share them
                  with any third party.
                </li>
                <li>
                  Notify us immediately of any unauthorized access to your
                  account.
                </li>
                <li>
                  Attend scheduled appointments or cancel with at least 24
                  hours&apos; notice.
                </li>
                <li>
                  Use the platform solely for legitimate healthcare purposes.
                </li>
                <li>
                  Treat all healthcare professionals on the platform with
                  respect and professionalism.
                </li>
                <li>
                  Not attempt to contact a doctor outside the platform for
                  matters arising from a Medicare appointment without their
                  explicit consent.
                </li>
              </ul>
            </Section>

            <Section
              id="doctor-responsibilities"
              icon={Stethoscope}
              title="3. Doctor Responsibilities"
            >
              <p>Doctors registered on Medicare agree to:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  Provide accurate professional credentials, qualifications, and
                  specialization information.
                </li>
                <li>
                  Maintain valid medical licenses and certifications as required
                  by applicable regulations.
                </li>
                <li>
                  Honor all confirmed appointments unless an emergency arises,
                  in which case patients must be notified promptly.
                </li>
                <li>
                  Maintain patient confidentiality in accordance with applicable
                  medical privacy laws.
                </li>
                <li>
                  Only provide medical advice, prescriptions, and treatment
                  within their registered scope of practice.
                </li>
                <li>
                  Use patient data accessed through Medicare exclusively for
                  delivering healthcare services.
                </li>
                <li>
                  Not engage in any form of discrimination against patients.
                </li>
              </ul>
            </Section>

            <Section
              id="payments"
              icon={CreditCard}
              title="4. Appointments & Payments"
            >
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    Booking
                  </p>
                  <p>
                    Appointments can be booked through the platform and are
                    subject to doctor availability. A booking is confirmed only
                    upon successful payment processing.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    Payments
                  </p>
                  <p>
                    All payments are processed securely through Cashfree.
                    Medicare does not store your raw payment card information.
                    Applicable taxes may be added at checkout.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    Cancellations & Refunds
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Cancellations made more than 24 hours in advance are
                      eligible for a full refund.
                    </li>
                    <li>
                      Cancellations made within 24 hours of the appointment may
                      incur a cancellation fee.
                    </li>
                    <li>
                      Refunds are processed within 5–7 business days to the
                      original payment method.
                    </li>
                    <li>
                      No-shows are non-refundable unless due to a technical
                      error on our platform.
                    </li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section
              id="disclaimer"
              icon={AlertTriangle}
              title="5. Medical Disclaimer"
            >
              <p className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium">
                ⚠️ Medicare is a healthcare appointment scheduling platform, not
                a substitute for professional medical advice, diagnosis, or
                treatment.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  Always seek the advice of your physician or other qualified
                  health provider with any questions you may have regarding a
                  medical condition.
                </li>
                <li>
                  Never disregard professional medical advice or delay seeking
                  it because of something you read on this platform.
                </li>
                <li>
                  In a medical emergency, call emergency services (e.g., 911 or
                  your local emergency number) immediately.
                </li>
                <li>
                  Medicare does not guarantee medical outcomes. Patient results
                  may vary.
                </li>
              </ul>
            </Section>

            <Section
              id="prohibited"
              icon={Ban}
              title="6. Prohibited Activities"
            >
              <p>
                The following activities are strictly prohibited on Medicare:
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  "Creating fake or misleading accounts",
                  "Impersonating a medical professional",
                  "Submitting fraudulent payment information",
                  "Scraping or harvesting user data",
                  "Attempting to hack or compromise the platform",
                  "Uploading harmful or malicious files",
                  "Harassing or threatening other users",
                  "Using the platform for non-healthcare commercial solicitation",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800"
                  >
                    <Ban className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3">
                Violation of any prohibited activity may result in immediate
                account suspension and potential legal action.
              </p>
            </Section>

            <Section
              id="suspension"
              icon={ShieldOff}
              title="7. Account Suspension & Termination"
            >
              <p>
                Medicare reserves the right to suspend or terminate your account
                at any time for:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Violation of these Terms of Service</li>
                <li>Providing false or misleading information</li>
                <li>Repeated no-shows without cancellation</li>
                <li>Engaging in fraudulent payment activities</li>
                <li>
                  Any activity that compromises the safety or integrity of the
                  platform
                </li>
              </ul>
              <p className="mt-3">
                You may also terminate your own account at any time through the
                account settings page or by contacting our support team. Upon
                termination, your right to use the Service will immediately
                cease.
              </p>
            </Section>

            <Section
              id="liability"
              icon={Scale}
              title="8. Limitation of Liability"
            >
              <p>
                To the fullest extent permitted by applicable law, Medicare and
                its affiliates, officers, directors, employees, and agents shall
                not be liable for:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  Any indirect, incidental, special, consequential, or punitive
                  damages
                </li>
                <li>
                  Loss of profits, data, goodwill, or other intangible losses
                </li>
                <li>
                  Medical outcomes resulting from appointments booked through
                  the platform
                </li>
                <li>
                  Third-party service outages (e.g., payment processors, cloud
                  storage)
                </li>
                <li>
                  Unauthorized access to your account resulting from your
                  failure to secure your credentials
                </li>
              </ul>
              <p className="mt-3">
                Our total liability to you for any claims arising from the use
                of the platform shall not exceed the total amount paid by you to
                Medicare in the 12 months preceding the claim.
              </p>
            </Section>

            <Section id="changes" icon={RefreshCcw} title="9. Changes to Terms">
              <p>
                Medicare reserves the right to modify these Terms of Service at
                any time. When changes are made:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>
                  We will update the &quot;Last updated&quot; date at the top of
                  this page.
                </li>
                <li>
                  For significant changes, we will notify registered users via
                  email.
                </li>
                <li>
                  Continued use of the platform after changes constitutes
                  acceptance of the new Terms.
                </li>
              </ul>
              <p className="mt-3">
                We encourage you to review these Terms periodically to stay
                informed about your rights and obligations.
              </p>
            </Section>

            <Section id="contact" icon={Mail} title="10. Contact Information">
              <p>
                If you have any questions about these Terms of Service or need
                to report a violation, please contact us:
              </p>
              <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Medicare Legal & Support Team
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <a
                    href="mailto:m30102658@gmail.com"
                    className="text-indigo-600 hover:underline"
                  >
                    m30102658@gmail.com
                  </a>
                </p>
                <p className="flex items-center gap-2 text-sm mt-1">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <a
                    href="https://medicare-ai-agent.onrender.com"
                    className="text-indigo-600 hover:underline"
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
                to="/privacy-policy"
                className="hover:text-indigo-500 transition-colors"
              >
                Privacy Policy
              </Link>
            </p>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
