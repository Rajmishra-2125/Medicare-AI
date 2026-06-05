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
} from "lucide-react";
import appointmentService from "../../../services/appointmentService";

function MyAppointments({
  appointments = [],
  loading = false,
  onRefresh,
}) {
  const [selectedFilter, setSelectedFilter] = useState("all"); // all, upcoming, completed, cancelled
  const [searchQuery, setSearchQuery] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Standalone mode state
  const [localAppointments, setLocalAppointments] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const isStandalone = !onRefresh;

  // Fetch data if standalone
  useEffect(() => {
    if (isStandalone) {
      fetchLocalAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLocalAppointments = async () => {
    try {
      setLocalLoading(true);
      const data = await appointmentService.getMyAppointments();
      const list = data.data || data || [];
      setLocalAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const currentAppointments = isStandalone ? localAppointments : appointments;
  const currentLoading = isStandalone ? localLoading : loading;
  const handleRefresh = isStandalone ? fetchLocalAppointments : onRefresh;

  const filteredAppointments = useMemo(() => {
    let filtered = Array.isArray(currentAppointments)
      ? [...currentAppointments]
      : [];

    // Apply status filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter((apt) => {
        const status = apt.status?.toUpperCase() || "";
        const filter = selectedFilter.toUpperCase();

        if (filter === "UPCOMING") {
          return (
            status === "CONFIRMED" ||
            status === "PENDING" ||
            status === "UPCOMING" ||
            status === "RESCHEDULED"
          );
        } else if (filter === "COMPLETED") {
          return status === "COMPLETED";
        } else if (filter === "CANCELLED") {
          return status === "CANCELLED";
        }
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.doctorId?.doctor?.toLowerCase().includes(query) ||
          (apt.doctorId?.doctor || "").toLowerCase().includes(query) ||
          apt.doctorId?.specialization?.toLowerCase().includes(query) ||
          apt.reason?.toLowerCase().includes(query),
      );
    }
    return filtered;
  }, [currentAppointments, selectedFilter, searchQuery]);

  const handleCancelAppointment = async (appointment) => {
    if (!appointment) return;

    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      setCancellingId(appointment._id);

      // Extract required data
      const slotNumber = appointment.slotNumber;
      // Handle both populated doctor object and direct ID or username
      const username = appointment.doctorId?.username || appointment.doctorName;
      const date = new Date(appointment.date).toISOString();

      await appointmentService.cancelAppointment(slotNumber, username, date);

      // Refresh appointments
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      // alert("Failed to cancel appointment. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase() || "";

    const styles = {
      CONFIRMED:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800",
      COMPLETED:
        "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800",
      CANCELLED:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800",
      RESCHEDULED:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
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

  return (
    <div className="container mx-auto rounded-2xl mb-10 mt-6 px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-[80vh] transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* <!-- Page Header --> */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              My Appointments
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your upcoming consultations and medical history
            </p>
          </div>
          {/* Quick Stats Summary */}
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="text-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">
                {
                  currentAppointments.filter((a) =>
                    ["CONFIRMED", "PENDING", "UPCOMING"].includes(
                      a.status?.toUpperCase(),
                    ),
                  ).length
                }
              </span>
              <span className="text-xs text-gray-500 uppercase font-semibold">
                Upcoming
              </span>
            </div>
            <div className="text-center px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                {currentAppointments.length}
              </span>
              <span className="text-xs text-gray-500 uppercase font-semibold">
                Total
              </span>
            </div>
          </div>
        </div>

        {/* <!-- Filter and Actions --> */}
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
                <RefreshCw
                  className={`w-4 h-4 ${currentLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">
                  {currentLoading ? "Refreshing..." : "Refresh"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* <!-- Appointments List --> */}
        <div className="grid gap-6">
          {currentLoading && currentAppointments.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Loading your appointments...
              </span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No appointments found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {searchQuery || selectedFilter !== "all"
                  ? "We couldn't find any appointments matching your filters."
                  : "You haven't booked any appointments yet. Book your first consultation today!"}
              </p>
            </div>
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
                            `https://ui-avatars.com/api/?name=${appointment.doctorId?.username || appointment.doctorName || "Doctor"}&background=random`
                          }
                          alt={
                            appointment.doctorId?.username ||
                            appointment.doctorName
                          }
                          className="w-16 h-16 rounded-xl object-cover bg-gray-100 dark:bg-gray-700 shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                          {appointment.type === "Video Consultation" ? (
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
                          {appointment.doctorId
                            ? `Dr. ${appointment.doctorId.username}`
                            : appointment.doctorName}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-medium text-sm mb-1">
                          {appointment.doctorId?.specialization ||
                            appointment.specialty ||
                            "General Physician"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md w-fit">
                          {appointment.type === "Video Consultation"
                            ? "Video Call"
                            : "In-Person Visit"}
                        </div>
                      </div>
                    </div>

                    {/* Date & Time Info */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between flex-1 gap-6 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">
                            Date
                          </p>
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(appointment.date)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">
                            Time
                          </p>
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatTime(
                              appointment.timeSlots ||
                                appointment.slotNumber ||
                                appointment.time,
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-4">
                        <div className="text-right">
                          {getStatusBadge(appointment.status)}
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="View Details"
                          >
                            <FileText className="w-5 h-5" />
                          </button>

                          {(appointment.status?.toUpperCase() === "PENDING" ||
                            appointment.status?.toUpperCase() ===
                              "CONFIRMED") && (
                            <button
                              onClick={() =>
                                handleCancelAppointment(appointment)
                              }
                              disabled={cancellingId === appointment._id}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Cancel Appointment"
                            >
                              {cancellingId === appointment._id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
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
      </div>
    </div>
  );
}

export default MyAppointments;
