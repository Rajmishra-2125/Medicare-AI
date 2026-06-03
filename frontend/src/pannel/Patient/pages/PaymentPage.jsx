import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  CreditCard,
  Loader2,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  IndianRupee,
  ShieldCheck,
  CheckCircle,
  XCircle,
  PartyPopper,
  AlertTriangle,
  FileText,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import appointmentService from "../../../services/appointmentService";
import paymentService from "../../../services/paymentService";

import { load } from '@cashfreepayments/cashfree-js';

function PaymentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState(null); // { success: true/false, data }

  // ── Fetch appointment details ─────────────────────────────────────────────
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const res = await appointmentService.getMyAppointments();
        const list = res?.data || res || [];
        const found = (Array.isArray(list) ? list : []).find(
          (a) => a._id === appointmentId
        );
        if (found) {
          setAppointment(found);
        } else {
          toast.error("Appointment not found.");
          navigate("/patient/appointments", { replace: true });
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
        toast.error("Failed to load appointment details.");
        navigate("/patient/appointments", { replace: true });
      } finally {
        setLoading(false);
      }
    };
    if (appointmentId) fetchAppointment();
  }, [appointmentId, navigate]);

  // ── Pay Now Handler ───────────────────────────────────────────────────────
  const handlePayNow = useCallback(async () => {
    if (!appointment) return;
    setPaying(true);
    try {
      // 1. Load Cashfree SDK
      const cashfree = await load({
        mode: import.meta.env.VITE_CASHFREE_MODE || "sandbox",
      });

      // 2. Create order on Backend
      const orderRes = await paymentService.createOrder(appointment._id);
      const order = orderRes?.data || orderRes;
      
      if (!order?.payment_session_id) {
        toast.error("Could not create payment session. Please try again.");
        setPaying(false);
        return;
      }

      // 3. Open Cashfree checkout modal
      let checkoutOptions = {
        paymentSessionId: order.payment_session_id,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then(async (result) => {
        if (result.error) {
          console.error("Cashfree Checkout Error:", result.error);
          setResult({ success: false });
          setPaying(false);
          toast.error(result.error.message || "Payment failed or cancelled.");
        }
        
        if (result.paymentDetails) {
          // Verify Payment
          try {
            const verifyRes = await paymentService.verifyPayment({
              order_id: order.order_id,
              appointmentId: appointment._id,
            });
            const updatedAppointment = verifyRes?.data || verifyRes;
            setResult({ success: true, data: updatedAppointment });
          } catch (err) {
            console.error("Verification error:", err);
            setResult({ success: false });
          } finally {
            setPaying(false);
          }
        }
      });
    } catch (err) {
      console.error("Payment initialization error:", err);
      toast.error(err?.message || "Failed to initialize payment. Please try again.");
      setPaying(false);
    }
  }, [appointment]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  // ── Payment Result Screen ─────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
          style={{ animation: "paymentFadeIn 0.4s ease" }}
        >
          {/* Accent bar */}
          <div
            className={`h-2 w-full ${
              result.success
                ? "bg-linear-to-r from-emerald-400 via-green-500 to-teal-500"
                : "bg-linear-to-r from-red-400 via-rose-500 to-pink-500"
            }`}
          />

          <div className="p-10 text-center">
            {/* Icon */}
            <div
              className={`mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center shadow-xl ${
                result.success
                  ? "bg-linear-to-br from-emerald-100 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 shadow-emerald-200/50 dark:shadow-emerald-900/30"
                  : "bg-linear-to-br from-red-100 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20 shadow-red-200/50 dark:shadow-red-900/30"
              }`}
            >
              {result.success ? (
                <PartyPopper className="w-11 h-11 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="w-11 h-11 text-red-600 dark:text-red-400" />
              )}
            </div>

            <h2
              className={`text-3xl font-extrabold mb-3 ${
                result.success
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {result.success ? "Payment Successful! 🎉" : "Payment Failed"}
            </h2>

            <p className="text-gray-500 dark:text-gray-400 text-base mb-8 max-w-sm mx-auto">
              {result.success
                ? "Your consultation fee has been received and your appointment is now confirmed!"
                : "Something went wrong during payment. You can retry from My Appointments."}
            </p>

            {/* Details Card */}
            {result.success && result.data && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-8 text-left space-y-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" /> Doctor
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Dr.{" "}
                    {result.data.doctorId?.doctor ||
                      result.data.doctorName ||
                      "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {result.data.date
                      ? new Date(result.data.date).toDateString()
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {result.data.timeSlots || "—"}
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" /> Amount Paid
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                    ₹{result.data.consultationFee || "—"}
                  </span>
                </div>
                {result.data.cashfreeOrderId && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-400">Order ID</span>
                    <span className="text-gray-500 dark:text-gray-300 font-mono text-[11px]">
                      {result.data.cashfreeOrderId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {result.success ? (
                <button
                  onClick={() => navigate("/patient/appointments")}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  View My Appointments ✓
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setResult(null)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all"
                  >
                    Retry Payment
                  </button>
                  <button
                    onClick={() => navigate("/patient/appointments")}
                    className="flex-1 py-3.5 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Go to Appointments
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes paymentFadeIn {
            from { opacity: 0; transform: translateY(30px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // ── Main Payment Page ─────────────────────────────────────────────────────
  if (!appointment) return null;

  const doctorName =
    appointment.doctorId?.doctorDetails?.fullname ||
    appointment.doctorId?.doctor ||
    "Doctor";
  const specialty =
    appointment.doctorId?.specialization || "General Physician";
  const fee = appointment.consultationFee || 0;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div
        className="w-full max-w-xl"
        style={{ animation: "paymentFadeIn 0.4s ease" }}
      >
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {/* Payment Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-7 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  Complete Payment
                </h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  Pay to confirm your appointment
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            {/* Appointment Summary */}
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-4">
                Appointment Summary
              </h3>

              <div className="space-y-4">
                {/* Doctor info */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/15 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl">
                    <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                      Dr. {doctorName}
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      {specialty}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs uppercase font-bold tracking-wider">
                        Date
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs uppercase font-bold tracking-wider">
                        Time
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {appointment.timeSlots || "TBD"}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                {appointment.reason && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs uppercase font-bold tracking-wider">
                        Reason
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {appointment.reason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-4">
                Payment Details
              </h3>
              <div className="bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Consultation Fee
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹{fee}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white font-extrabold text-lg">
                    Total
                  </span>
                  <span className="font-extrabold text-2xl text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" />
                    {fee}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/15 rounded-xl border border-amber-200 dark:border-amber-700/30 mb-8">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Your appointment slot is reserved for <strong>15 minutes</strong>. Please
                complete the payment to confirm your booking.
              </p>
            </div>

            {/* Pay Now Button */}
            <button
              onClick={handlePayNow}
              disabled={paying || fee <= 0}
              className="w-full py-4 rounded-2xl font-extrabold text-lg text-white bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {paying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Pay ₹{fee} Securely
                </>
              )}
            </button>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>256-bit Encrypted</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Powered by Cashfree</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes paymentFadeIn {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default PaymentPage;
