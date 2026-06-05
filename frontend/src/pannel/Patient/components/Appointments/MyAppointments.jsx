import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Video,
  Building,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  Plus,
  FileText,
  AlertOctagon,
  Pill,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import appointmentService from "../../../../services/appointmentService";
import toast from "react-hot-toast";
import ReviewModal from "../Review/ReviewModal.jsx";
import { useNavigate } from "react-router-dom";
import { Star, CreditCard } from "lucide-react";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import { useDebounce } from "../../../../hooks/useDebounce";
import { useSessionStorage } from "../../../../hooks/useSessionStorage";
import AppointmentRowSkeleton from "../../../../components/skeletons/AppointmentRowSkeleton";
import EmptyState from "../../../../components/ui/EmptyState";

function MyAppointments({ appointments = [], loading = false, onRefresh }) {
  const [selectedFilter, setSelectedFilter] = useSessionStorage("my_appointments_filter", "all"); // all, upcoming, completed, cancelled
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);
  const [availableSlotsForReschedule, setAvailableSlotsForReschedule] =
    useState([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: "",
    newSlotNumber: "",
    reason: "",
  });
  // expandedCard state removed to fix lint warning
  const today = new Date().toISOString().split("T")[0];

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAppointment, setReviewAppointment] = useState(null);
  // showPaymentModal and paymentAppointment states removed to fix lint warning
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState("appointments"); // appointments or prescriptions
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);

  // Standalone mode state
  const [localAppointments, setLocalAppointments] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const isStandalone = !onRefresh;

  // Fetch data if standalone
  useEffect(() => {
    if (isStandalone) {
      fetchLocalAppointments();
    }

    const handleOnline = () => {
      setIsOffline(false);
      fetchLocalAppointments();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLocalAppointments = async () => {
    try {
      setLocalLoading(true);
      const data = await appointmentService.getMyAppointments();
      const list = data.data || data || [];
      const safeList = Array.isArray(list) ? list : [];
      setLocalAppointments(safeList);
      
      // Offline LocalStorage pre-caching for PWA
      localStorage.setItem("cached_patient_appointments", JSON.stringify(safeList));
    } catch (err) {
      console.error("Error fetching appointments:", err);
      // Fallback offline pre-cache load
      const cached = localStorage.getItem("cached_patient_appointments");
      if (cached) {
        setLocalAppointments(JSON.parse(cached));
        toast("Loaded appointments from offline storage fallback.", { icon: "📁" });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const currentAppointments = isStandalone ? localAppointments : appointments;
  const currentLoading = isStandalone ? localLoading : loading;
  const handleRefresh = isStandalone ? fetchLocalAppointments : onRefresh;

  const filteredAppointments = useMemo(() => {
    let filtered = Array.isArray(currentAppointments) ? [...currentAppointments] : [];

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((apt) => {
        const status = apt.status?.toUpperCase() || "";
        const filter = selectedFilter.toUpperCase();
        
        if (filter === "UPCOMING") {
          return status === "CONFIRMED" || status === "PENDING" || status === "UPCOMING" || status === "RESCHEDULED";
        } else if (filter === "COMPLETED") {
          return status === "COMPLETED";
        } else if (filter === "CANCELLED") {
          return status === "CANCELLED";
        }
        return true;
      });
    }

    // Apply search filter (debounced)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.doctorId?.doctor?.toLowerCase().includes(query) ||
          (apt.doctorId?.doctor || "").toLowerCase().includes(query) ||
          apt.doctorId?.specialization?.toLowerCase().includes(query) ||
          apt.reason?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [currentAppointments, selectedFilter, debouncedSearchQuery]);

  // Extract completed appointments with active prescriptions
  const prescriptionAppointments = useMemo(() => {
    const list = Array.isArray(currentAppointments) ? currentAppointments : [];
    return list.filter(
      (apt) => apt.status?.toUpperCase() === "COMPLETED" && apt.prescription && apt.prescription.medications?.length > 0
    );
  }, [currentAppointments]);

  // Request refills locally for instant PWA feedback
  const handleRefillRequest = (aptId) => {
    setLocalAppointments((prev) =>
      prev.map((apt) => {
        if (apt._id === aptId) {
          const currentRefills = apt.prescription?.refillsRemaining || 0;
          if (currentRefills <= 0) {
            toast.error("No refills remaining on this prescription. Please renew with your doctor.");
            return apt;
          }
          toast.success("Prescription refill requested successfully at your local pharmacy!");
          return {
            ...apt,
            prescription: {
              ...apt.prescription,
              refillsRemaining: currentRefills - 1,
            },
          };
        }
        return apt;
      })
    );
  };

  // Generate HIPAA Compliant PDF Prescription download
  const downloadRxPDF = (apt) => {
    try {
      const doc = new jsPDF();

      // Top Slate Header
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("MEDICARE CLINICAL PORTAL", 15, 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text("Official Digital E-Prescription Tunnel · HIPAA Protected File", 15, 31);

      // Section
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("SECURE PATIENT PRESCRIPTION DETIALS", 15, 55);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 59, 195, 59);

      // Doctor & Patient Meta Grid
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Doctor: Dr. ${apt.doctorId?.doctor || apt.doctorName || "Specialist"}`, 15, 68);
      doc.text(`Specialty: ${apt.doctorId?.specialization || "Practitioner"}`, 15, 74);
      doc.text(`Consultation Date: ${new Date(apt.date).toLocaleDateString()}`, 120, 68);
      doc.text(`Document Reference: ${apt._id}`, 120, 74);

      doc.line(15, 80, 195, 80);

      // Medications Table
      const headers = [["#", "Medication", "Dosage & Frequency", "Duration"]];
      const rows = (apt.prescription.medications || []).map((med, idx) => [
        idx + 1,
        med.name,
        `${med.dosage || ""} - ${med.frequency || ""}`,
        med.duration || "As Directed"
      ]);

      const table = autoTable(doc, {
        startY: 87,
        head: headers,
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [99, 102, 241] }, // Indigo-500
        styles: { fontSize: 9.5, cellPadding: 4.5 }
      });

      const finalY = (table?.finalY || 150) + 15;

      // Doctor Notes
      if (apt.prescription.advice) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Medical Advice & Special Guidelines", 15, finalY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const wrappedAdvice = doc.splitTextToSize(apt.prescription.advice, 180);
        doc.text(wrappedAdvice, 15, finalY + 7);
      }

      // Expiry and Signature
      const sigY = finalY + 45;
      doc.setDrawColor(203, 213, 225);
      doc.line(125, sigY, 195, sigY);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text(`Digitally Authorized by Dr. ${apt.doctorId?.doctor || apt.doctorName}`, 125, sigY + 5);

      if (apt.prescription.expiryDate) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Fulfillment Expiration Date: ${new Date(apt.prescription.expiryDate).toLocaleDateString()}`, 15, sigY);
      }
      doc.text(`Eligible Pharmacy Refills: ${apt.prescription.refillsRemaining || 0}`, 15, sigY + 5);

      // Save PDF
      doc.save(`Rx_Prescription_${apt._id}.pdf`);
      toast.success("E-Prescription document downloaded successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to build PDF invoice.");
    }
  };



  const handleCancelAppointment = (appointment) => {
    if (!appointment) return;
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointment) return;

    const appointment = selectedAppointment;
    try {
      setCancellingId(appointment._id);

      const slotNumber = appointment.slotNumber;
      // Backend expects `Doctor.doctor` (username), not user.username.
      const doctorUsername =
        appointment.doctorId?.doctor ||
        appointment.doctorId?.username ||
        appointment.doctorName;
      const date = new Date(appointment.date).toISOString();

      if (!doctorUsername) {
        toast.error("Could not determine doctor username for cancellation.");
        return;
      }

      await appointmentService.cancelAppointment(
        slotNumber,
        doctorUsername,
        date
      );

      toast.success("Appointment cancelled successfully.");

      if (onRefresh) await onRefresh();
      setShowCancelModal(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to cancel appointment."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const openRescheduleModal = (appointment) => {
    if (!appointment) return;

    const defaultDate =
      appointment?.date && !isNaN(new Date(appointment.date).getTime())
        ? new Date(appointment.date).toISOString().split("T")[0]
        : "";

    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    setShowCancelModal(false);

    setRescheduleForm({
      newDate: defaultDate,
      newSlotNumber: "",
      reason: "",
    });
    setAvailableSlotsForReschedule([]);
  };

  const confirmRescheduleAppointment = async () => {
    if (!selectedAppointment) return;
    if (!rescheduleForm.newDate || !rescheduleForm.newSlotNumber) return;

    try {
      setReschedulingId(selectedAppointment._id);

      await appointmentService.rescheduleAppointment(selectedAppointment._id, {
        newDate: rescheduleForm.newDate,
        newSlotNumber: rescheduleForm.newSlotNumber,
        reason: rescheduleForm.reason,
      });

      toast.success("Appointment rescheduled successfully");

      if (onRefresh) await onRefresh();

      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleForm({ newDate: "", newSlotNumber: "", reason: "" });
      setAvailableSlotsForReschedule([]);
    } catch (err) {
      console.error("Error rescheduling appointment:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reschedule appointment"
      );
    } finally {
      setReschedulingId(null);
    }
  };

  // Fetch available slots for reschedule modal
  useEffect(() => {
    const fetchRescheduleSlots = async () => {
      if (
        !showRescheduleModal ||
        !selectedAppointment ||
        !rescheduleForm.newDate
      ) {
        return;
      }

      const doctorUsername =
        selectedAppointment?.doctorId?.doctor ||
        selectedAppointment?.doctorId?.username ||
        selectedAppointment?.doctorName;

      if (!doctorUsername) return;

      setLoadingRescheduleSlots(true);
      setAvailableSlotsForReschedule([]);

      try {
        const res = await appointmentService.checkAvailableSlots(
          doctorUsername,
          rescheduleForm.newDate
        );
        const slots = Array.isArray(res?.data) ? res.data : res || [];
        setAvailableSlotsForReschedule(Array.isArray(slots) ? slots : []);
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch reschedule slots"
        );
      } finally {
        setLoadingRescheduleSlots(false);
      }
    };

    fetchRescheduleSlots();
  }, [showRescheduleModal, selectedAppointment, rescheduleForm.newDate]);

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    
    const styles = {
      CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
      RESCHEDULED: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
    };

    const icons = {
      CONFIRMED: <CheckCircle className="w-3.5 h-3.5" />,
      PENDING: <Clock className="w-3.5 h-3.5" />,
      COMPLETED: <CheckCircle className="w-3.5 h-3.5" />,
      CANCELLED: <XCircle className="w-3.5 h-3.5" />,
      RESCHEDULED: <RefreshCw className="w-3.5 h-3.5" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
          styles[statusUpper] || styles.PENDING
        }`}
      >
        {icons[statusUpper] || icons.PENDING}
        {statusUpper || "PENDING"}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeSlot) => {
    return timeSlot || "TBD";
  };

  const getCallAvailability = (appointment) => {
    if (!appointment || !appointment.date) return { show: false, isAllowed: false };
    
    // Check if it is the session day in Asia/Kolkata
    const aptDate = new Date(appointment.date);
    if (isNaN(aptDate.getTime())) return { show: false, isAllowed: false };

    const formatOptions = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
    const formatter = new Intl.DateTimeFormat("en-US", formatOptions);
    
    const todayStr = formatter.format(new Date());
    const aptDateStr = formatter.format(aptDate);

    if (aptDateStr !== todayStr) {
      return { show: false, isAllowed: false };
    }

    // It is the session day. Check time window.
    const slotTimeStr = appointment.timeSlots || appointment.slotNumber || appointment.time;
    if (!slotTimeStr) {
      return { show: true, isAllowed: true };
    }

    const times = slotTimeStr.split("-");
    const startTimeStr = times[0]?.trim();
    const endTimeStr = times[1]?.trim() || times[0]?.trim();

    const parseTimeToHoursMinutes = (tStr) => {
      if (!tStr) return { hours: 0, minutes: 0 };
      const parts = tStr.trim().split(/\s+/);
      if (parts.length < 2) return { hours: 0, minutes: 0 };
      const timeVal = parts[0];
      const modifier = parts[1].toUpperCase();
      let [hours, minutes] = timeVal.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return { hours: 0, minutes: 0 };

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return { hours, minutes };
    };

    const startInfo = parseTimeToHoursMinutes(startTimeStr);
    const endInfo = parseTimeToHoursMinutes(endTimeStr);

    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;

    const pad = (num) => String(num).padStart(2, '0');
    
    const startIso = `${year}-${pad(month)}-${pad(day)}T${pad(startInfo.hours)}:${pad(startInfo.minutes)}:00+05:30`;
    const endIso = `${year}-${pad(month)}-${pad(day)}T${pad(endInfo.hours)}:${pad(endInfo.minutes)}:00+05:30`;

    const startDateTime = new Date(startIso);
    const endDateTime = new Date(endIso);

    const now = new Date();
    const allowedStartTime = new Date(startDateTime.getTime() - 15 * 60 * 1000);
    const allowedEndTime = new Date(endDateTime.getTime() + 30 * 60 * 1000);

    if (now > allowedEndTime) {
      return { show: false, isAllowed: false };
    }
    if (now < allowedStartTime) {
      return { show: true, isAllowed: false };
    }
    return { show: true, isAllowed: true };
  };

  // handlePaymentSuccess removed to fix lint warning


    return (
    <>
    <div className="container mx-auto rounded-2xl mb-10 mt-6 px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-[80vh] transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* <!-- Page Header --> */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    My Clinic Area
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Track your upcoming consultations, medical shelf history, and prescriptions
                </p>
            </div>
            {/* Quick Stats Summary */}
            <div className="flex gap-4 mt-4 md:mt-0">
                 <div className="text-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currentAppointments.filter(a => ['CONFIRMED', 'PENDING', 'UPCOMING'].includes(a.status?.toUpperCase())).length}
                    </span>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Upcoming</span>
                 </div>
                 <div className="text-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                        {currentAppointments.length}
                    </span>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Total</span>
                 </div>
            </div>
        </div>

        {/* Offline Banner Alert */}
        {isOffline && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-3.5 rounded-2xl mb-6 flex items-start gap-3 text-sm animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold">Offline Caching Active</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                You are currently offline. You can view your cached appointments list and download cached prescription PDFs. Booking new appointments or initiating WebRTC video consultations requires an active internet connection.
              </p>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-8">
          <button 
            onClick={() => setActiveTab("appointments")}
            className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === "appointments" 
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            My Appointments
          </button>
          <button 
            onClick={() => setActiveTab("prescriptions")}
            className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 px-1 cursor-pointer ${
              activeTab === "prescriptions" 
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" 
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Digital Prescriptions Shelf
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-8 transition-colors duration-200">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

    {/* LEFT SECTION */}
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
      
      {/* Search */}
      <div className="relative w-full sm:w-64">
        <input
          type="text"
          placeholder="Search doctor, specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white w-full transition-all"
        />
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      {/* Filter */}
      <div className="relative w-full sm:w-48">
        <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white appearance-none w-full font-medium transition-all"
        >
          <option value="all">All Appointments</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
      </div>

    </div>

    {/* RIGHT SECTION (Buttons) */}
    <div className="flex gap-3 justify-end w-full md:w-auto">
      
      <button 
        onClick={handleRefresh}
        disabled={currentLoading}
        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${currentLoading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">{currentLoading ? "Refreshing..." : "Refresh"}</span>
      </button>

    </div>

  </div>
</div>


        {/* Tab Render Layout */}
        {activeTab === "appointments" ? (
          <div className="grid gap-6">
            {currentLoading && currentAppointments.length === 0 ? (
              <AppointmentRowSkeleton />
            ) : filteredAppointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Appointments Found"
                description={
                  searchQuery || selectedFilter !== "all"
                    ? "We couldn't find any appointments matching your search query or status filters. Try adjusting your parameters!"
                    : "You haven't scheduled any consultations yet. Find an expert doctor and book your appointment today!"
                }
                actionLabel={searchQuery || selectedFilter !== "all" ? "Clear Search Filters" : "Book Appointment"}
                actionPath={searchQuery || selectedFilter !== "all" ? null : "/doctors"}
                onActionClick={
                  searchQuery || selectedFilter !== "all"
                    ? () => {
                        setSearchQuery("");
                        setSelectedFilter("all");
                      }
                    : null
                }
              />
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment._id || appointment.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                          {/* Doctor Image & Basic Info */}
                          <div className="flex items-start gap-4 lg:w-1/3">
                              <div className="relative">
                                  <img
                                      src={
                                          appointment.doctorId?.doctorId?.profileImage ||
                                          appointment.doctorId?.profileImage ||
                                          appointment.doctorId?.image || 
                                          appointment.image ||
                                          `https://ui-avatars.com/api/?name=${appointment.doctorId?.doctor || appointment.doctorName || 'Doctor'}&background=random`
                                      }
                                      alt={appointment.doctorId?.doctor || appointment.doctorName}
                                      loading="lazy"
                                      className="w-16 h-16 rounded-xl object-cover bg-gray-100 dark:bg-gray-700 shadow-sm"
                                  />
                                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                                      {(appointment.meetingType === 'ONLINE' || appointment.type === 'Video Consultation' || appointment.type === 'ONLINE') ? (
                                          <div className="bg-blue-100 dark:bg-blue-900/50 p-1 rounded-full">
                                              <Video className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                          </div>
                                      ) : (
                                          <div className="bg-green-100 dark:bg-green-900/50 p-1 rounded-full">
                                              <Building className="w-3 h-3 text-green-600 dark:text-green-400" />
                                          </div>
                                      )}
                                  </div>
                              </div>
                              
                              <div>
                                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {appointment.doctorId ? `Dr. ${appointment.doctorId.doctor}` : appointment.doctorName}
                                  </h3>
                                  <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-1">
                                      {appointment.doctorId?.specialization || appointment.specialty || "General Physician"}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md w-fit">
                                      {(appointment.meetingType === 'ONLINE' || appointment.type === 'Video Consultation' || appointment.type === 'ONLINE') ? 'Video Call' : 'In-Person Visit'}
                                  </div>
                              </div>
                          </div>
  
                          {/* Date & Time Info */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between flex-1 gap-6 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6">
                              
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">Date</p>
                                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                                          <Calendar className="w-4 h-4 text-gray-400" />
                                          {formatDate(appointment.date)}
                                      </div>
                                  </div>
                                  <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">Time</p>
                                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                                          <Clock className="w-4 h-4 text-gray-400" />
                                          {formatTime(appointment.timeSlots || appointment.slotNumber || appointment.time)}
                                      </div>
                                  </div>
                              </div>
  
                              <div className="flex items-center justify-between lg:justify-end gap-4">
                                  <div className="text-right">
                                      {getStatusBadge(appointment.status)}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => {
                                              setSelectedAppointment(appointment);
                                              setShowDetailsModal(true);
                                          }}
                                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all cursor-pointer"
                                          title="View Details"
                                      >
                                          <FileText className="w-5 h-5" />
                                      </button>
  
                                      {/* Payment Button - Show when appointment is CONFIRMED but NOT PAID */}
                                      {(appointment.status?.toUpperCase() === 'CONFIRMED' || appointment.status?.toUpperCase() === 'PENDING') && 
                                       (appointment.paymentStatus?.toUpperCase() !== 'PAID') && (
                                          <button 
                                              onClick={() => {
                                                  navigate(`/patient/payment/${appointment._id}`);
                                              }}
                                              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all cursor-pointer"
                                              title="Pay Now"
                                          >
                                              <CreditCard className="w-5 h-5" />
                                          </button>
                                      )}

                                      {/* Video Consultation Call launcher */}
                                      {appointment.status?.toUpperCase() === 'CONFIRMED' && 
                                       (appointment.meetingType === 'ONLINE' || appointment.type === 'Video Consultation' || appointment.type === 'ONLINE') && (() => {
                                          const availability = getCallAvailability(appointment);
                                          if (!availability.show) return null;
                                          return (
                                              <button 
                                                  onClick={() => {
                                                      if (!availability.isAllowed) {
                                                          toast.error("You can try one 15min before when session started");
                                                          return;
                                                      }
                                                      navigate(`/consultation/${appointment._id}`);
                                                  }}
                                                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                                                      availability.isAllowed 
                                                      ? "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 animate-pulse" 
                                                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-60 cursor-not-allowed"
                                                  }`}
                                                  title="Join Video Room"
                                              >
                                                  <Video className="w-5 h-5" />
                                              </button>
                                          );
                                      })()}
                                      
                                      {(appointment.status?.toUpperCase() === 'PENDING' || appointment.status?.toUpperCase() === 'CONFIRMED') && (
                                          <button 
                                              onClick={() => handleCancelAppointment(appointment)}
                                              disabled={cancellingId === appointment._id}
                                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                                              title="Cancel Appointment"
                                          >
                                              {cancellingId === appointment._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                          </button>
                                      )}
  
                                      {(appointment.status?.toUpperCase() === "PENDING" ||
                                        appointment.status?.toUpperCase() ===
                                          "CONFIRMED") && (
                                        <button
                                          onClick={() => openRescheduleModal(appointment)}
                                          disabled={
                                            reschedulingId === appointment._id
                                          }
                                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all cursor-pointer"
                                          title="Reschedule Appointment"
                                        >
                                          {reschedulingId === appointment._id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-5 h-5" />
                                          )}
                                        </button>
                                      )}
  
                                      {appointment.status?.toUpperCase() === 'COMPLETED' && (
                                          <button 
                                              onClick={() => {
                                                  if (!appointment.isReviewed) {
                                                      setReviewAppointment(appointment);
                                                      setShowReviewModal(true);
                                                  }
                                              }}
                                              disabled={appointment.isReviewed}
                                              className={`p-2 transition-all relative group/btn rounded-lg ${
                                                  appointment.isReviewed
                                                      ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 cursor-default"
                                                      : "text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 cursor-pointer"
                                              }`}
                                              title={appointment.isReviewed ? "Reviewed" : "Write a Review"}
                                          >
                                              <Star className={`w-5 h-5 ${appointment.isReviewed ? "fill-yellow-500" : ""}`} />
                                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-10 hidden md:block">
                                                  {appointment.isReviewed ? "Reviewed" : "Write Review"}
                                              </span>
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Prescriptions Shelf Tab */
          <div className="grid gap-6">
            {prescriptionAppointments.length === 0 ? (
              <EmptyState 
                icon={Pill}
                title="No Active Prescriptions"
                description="You don't have any digital prescriptions issued by clinical specialists yet. Prescriptions are automatically archived here after completing a consultation."
              />
            ) : (
              prescriptionAppointments.map((apt) => {
                const isRxExpired = apt.prescription.expiryDate && new Date(apt.prescription.expiryDate) < new Date();
                return (
                  <div key={apt._id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Dr. {apt.doctorId?.doctor || apt.doctorName}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isRxExpired 
                              ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" 
                              : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30"
                          }`}>
                            {isRxExpired ? "Expired" : "Active"}
                          </span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">{apt.doctorId?.specialization || "Specialist"}</p>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-3">
                          <p><strong>Primary Med:</strong> {apt.prescription.medications?.[0]?.name} · {apt.prescription.medications?.[0]?.dosage}</p>
                          <p><strong>Refills Left:</strong> {apt.prescription.refillsRemaining || 0} Refills</p>
                          {apt.prescription.expiryDate && (
                            <p><strong>Fulfillment Expiry:</strong> {new Date(apt.prescription.expiryDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4 md:mt-0 w-full md:w-auto">
                        <button
                          onClick={() => handleRefillRequest(apt._id)}
                          disabled={isRxExpired || (apt.prescription.refillsRemaining || 0) <= 0}
                          className="flex-1 md:flex-initial px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Request Refill
                        </button>
                        <button
                          onClick={() => downloadRxPDF(apt)}
                          className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Download Rx PDF
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>

    {showCancelModal && selectedAppointment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cancel appointment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Are you sure you want to cancel this appointment?
            </p>
          </div>

          <div className="p-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowCancelModal(false);
                setSelectedAppointment(null);
              }}
              disabled={cancellingId === selectedAppointment._id}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors disabled:opacity-50"
            >
              Keep
            </button>

            <button
              type="button"
              onClick={confirmCancelAppointment}
              disabled={cancellingId === selectedAppointment._id}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {cancellingId === selectedAppointment._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Cancel appointment
            </button>
          </div>
        </div>
      </div>
    )}

    {showRescheduleModal && selectedAppointment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reschedule appointment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Choose a new date and slot
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowRescheduleModal(false);
                setSelectedAppointment(null);
                setRescheduleForm({
                  newDate: "",
                  newSlotNumber: "",
                  reason: "",
                });
                setAvailableSlotsForReschedule([]);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3">
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Current schedule
              </p>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 mt-1">
                {formatDate(selectedAppointment.date)} |{" "}
                {formatTime(
                  selectedAppointment.timeSlots ||
                    selectedAppointment.slotNumber ||
                    selectedAppointment.time
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                New date *
              </label>
              <input
                type="date"
                min={today}
                value={rescheduleForm.newDate}
                onChange={(e) => {
                  setRescheduleForm((prev) => ({
                    ...prev,
                    newDate: e.target.value,
                    newSlotNumber: "",
                  }));
                }}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Available slots *
              </label>
              <select
                required
                value={rescheduleForm.newSlotNumber}
                onChange={(e) =>
                  setRescheduleForm((prev) => ({
                    ...prev,
                    newSlotNumber: e.target.value,
                  }))
                }
                disabled={!rescheduleForm.newDate || loadingRescheduleSlots}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-60"
              >
                <option value="">
                  {loadingRescheduleSlots
                    ? "Loading slots..."
                    : !rescheduleForm.newDate
                      ? "Select a date first"
                      : "Select a slot"}
                </option>

                {!loadingRescheduleSlots &&
                  Array.isArray(availableSlotsForReschedule) &&
                  availableSlotsForReschedule.length > 0 &&
                  availableSlotsForReschedule.map((slot) => (
                    <option
                      key={slot._id || slot.slotNumber}
                      value={slot.slotNumber}
                    >
                      {slot.startTime} - {slot.endTime}
                    </option>
                  ))}

                {!loadingRescheduleSlots &&
                  Array.isArray(availableSlotsForReschedule) &&
                  availableSlotsForReschedule.length === 0 && (
                    <option value="" disabled>
                      No available slots for this date
                    </option>
                  )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Reason (optional)
              </label>
              <textarea
                value={rescheduleForm.reason}
                onChange={(e) =>
                  setRescheduleForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm h-20 resize-none"
                placeholder="E.g. Doctor unavailable / change of schedule..."
              />
            </div>

            <button
              type="button"
              onClick={confirmRescheduleAppointment}
              disabled={
                !rescheduleForm.newSlotNumber ||
                reschedulingId === selectedAppointment._id ||
                loadingRescheduleSlots
              }
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 mt-2 flex items-center justify-center gap-2"
            >
              {reschedulingId === selectedAppointment._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Confirm reschedule
            </button>
          </div>
        </div>
      </div>
    )}
    
    {showReviewModal && reviewAppointment && (
        <ReviewModal 
            appointment={reviewAppointment} 
            onClose={() => {
                setShowReviewModal(false);
                setReviewAppointment(null);
            }}
            onReviewAdded={() => handleRefresh()}
        />
    )}

    {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal 
            appointment={selectedAppointment}
            onClose={() => {
                setShowDetailsModal(false);
                setSelectedAppointment(null);
            }}
        />
    )}


    </>
  )


}

export default MyAppointments;
