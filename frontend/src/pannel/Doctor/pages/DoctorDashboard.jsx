import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchDoctorAppointments, 
  updateDoctorAppointmentStatus,
  resetDoctorAppointments
} from "../../../features/appointments/doctorAppointmentSlice";
import StatsCard from "../components/Cards/StatsCard";
import DashboardSkeleton from "../../../components/skeletons/DashboardSkeleton";
import { Calendar, CheckCircle, Clock, IndianRupee, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import doctorService from "../../../services/doctorService";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const DoctorDashboard = () => {
  const dispatch = useDispatch();
  const { appointments, isLoading, isError, message } = useSelector(
    (state) => state.doctorAppointments
  );
  
  const { user } = useSelector((state) => state.auth);

  const [analytics, setAnalytics] = useState(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchDoctorAppointments());
    
    // Fetch Practice Analytics
    const loadAnalytics = async () => {
      try {
        const data = await doctorService.getDoctorAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load doctor analytics", err);
      } finally {
        setIsAnalyticsLoading(false);
      }
    };
    loadAnalytics();

    return () => {
      dispatch(resetDoctorAppointments());
    };
  }, [dispatch]);

  // Derived Stats
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const totalAppointments = safeAppointments.length;
  const pendingAppointments = safeAppointments.filter(a => a.status === "PENDING").length;
  const completedAppointments = safeAppointments.filter(a => a.status === "COMPLETED").length;
  const totalEarnings = safeAppointments
    .filter(a => a.paymentStatus === "PAID" || a.status === "COMPLETED")
    .reduce((acc, curr) => acc + (Number(curr.consultationFee) || 0), 0);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await dispatch(updateDoctorAppointmentStatus({ appointmentId, status })).unwrap();
      toast.success(`Appointment marked as ${status}`);
    } catch (err) {
      toast.error(err || "Failed to update appointment");
    }
  };

  if (isLoading || isAnalyticsLoading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
            title="Total Appointments" 
            value={totalAppointments} 
            icon={Calendar} 
            colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" 
        />
        <StatsCard 
            title="Pending Requests" 
            value={pendingAppointments} 
            icon={Clock} 
            colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" 
        />
        <StatsCard 
            title="Completed" 
            value={completedAppointments} 
            icon={CheckCircle} 
            colorClass="bg-green-50 text-green-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
        />
        <StatsCard 
            title="Total Earnings" 
            value={`₹${totalEarnings}`} 
            icon={IndianRupee} 
            colorClass="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" 
        />
      </div>

      {/* Practice Analytics Panel */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 animate-in fade-in duration-300">
          
          {/* Revenue Trend Area Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-zinc-100 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-1">Practice Revenue Trend</h3>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mb-6">Net monthly earnings from paid sessions (6-month aggregate)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={analytics.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-slate-800" />
                  <XAxis dataKey="month" className="text-xs fill-zinc-500 dark:fill-slate-400 font-mono" />
                  <YAxis className="text-xs fill-zinc-500 dark:fill-slate-400 font-mono" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      border: "none", 
                      borderRadius: "12px", 
                      color: "#fff",
                      fontSize: "12px" 
                    }} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consultation Status Pie Chart */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-zinc-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-1">Consultation Distribution</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mb-6">Aggregate distribution of patient statuses</p>
            </div>
            
            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="status"
                  >
                    {analytics.statusDistribution.filter(d => d.value > 0).map((entry, index) => {
                      const COLORS = {
                        CONFIRMED: "#3b82f6",
                        COMPLETED: "#10b981",
                        CANCELLED: "#ef4444",
                        PENDING: "#f59e0b",
                        RESCHEDULED: "#6366f1",
                        NO_SHOW: "#6b7280"
                      };
                      return <Cell key={`cell-${index}`} fill={COLORS[entry.status] || "#cbd5e1"} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(15, 23, 42, 0.9)", 
                      border: "none", 
                      borderRadius: "12px", 
                      color: "#fff",
                      fontSize: "12px" 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {analytics.overview.completionRate > 0 && (
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-zinc-800 dark:text-white">{analytics.overview.completionRate}%</span>
                  <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">Done Rate</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-green-50 dark:bg-emerald-500/5 p-2 rounded-xl border border-green-100 dark:border-emerald-500/10">
                <span className="block text-xs text-zinc-400">Completed</span>
                <span className="text-sm font-bold text-green-600 dark:text-emerald-400">{analytics.overview.completedAppointments}</span>
              </div>
              <div className="bg-red-50 dark:bg-red-500/5 p-2 rounded-xl border border-red-100 dark:border-red-500/10">
                <span className="block text-xs text-zinc-400">Cancelled</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{analytics.overview.canceledAppointments}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/5 p-2 rounded-xl border border-blue-100 dark:border-blue-500/10">
                <span className="block text-xs text-zinc-400">Total Booked</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{analytics.overview.totalAppointments}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Appointments Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-slate-800 overflow-hidden mt-8">
          <div className="p-6 border-b border-zinc-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white">Recent Appointments</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-slate-800/80">
                <tr className="text-left text-sm font-semibold text-zinc-600 dark:text-slate-300">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Fee</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-slate-800">
                {safeAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                         <div className="w-16 h-16 bg-zinc-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-zinc-100 dark:border-slate-700 shadow-sm">
                            <Calendar className="w-8 h-8 text-zinc-400 dark:text-slate-500" />
                         </div>
                         <h3 className="text-zinc-800 dark:text-white font-semibold text-lg">No appointments yet</h3>
                         <p className="text-zinc-500 dark:text-slate-400 text-sm max-w-sm mt-1">You do not have any pending or upcoming appointments at this time.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  safeAppointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-zinc-50/50 dark:hover:bg-slate-800/50 hover:-translate-y-px hover:shadow-sm transition-all duration-200 group">
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                              {apt.patientId?.profileImage ? (
                                  <img 
                                      src={apt.patientId.profileImage} 
                                      alt="Patient Avatar" 
                                      className="w-10 h-10 rounded-full object-cover"
                                  />
                              ) : (
                                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-slate-700 flex items-center justify-center">
                                      <span className="font-semibold text-zinc-600 dark:text-slate-300">
                                          {apt.patientId?.fullname?.[0]?.toUpperCase() || "P"}
                                      </span>
                                  </div>
                              )}
                              <div>
                                  <p className="font-medium text-zinc-800 dark:text-white">{apt.patientId?.fullname}</p>
                                  <p className="text-xs text-zinc-500 dark:text-slate-400 flex gap-2">
                                      {apt.patientId?.age && <span>{apt.patientId.age} yrs</span>}
                                      {apt.patientId?.gender && <span>{apt.patientId.gender}</span>}
                                  </p>
                              </div>
                          </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-800 dark:text-white">
                          {new Date(apt.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-slate-400">{apt.timeSlots}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-zinc-800 dark:text-white">₹{apt.consultationFee}</p>
                        {apt.paymentStatus === "PAID" ? (
                            <span className="text-xs text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full border border-green-200 dark:border-emerald-500/20 inline-block mt-1">Paid</span>
                        ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-500/20 inline-block mt-1">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          apt.status === "PENDING" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" :
                          apt.status === "CONFIRMED" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" :
                          apt.status === "COMPLETED" ? "bg-green-50 dark:bg-emerald-500/10 text-green-600 dark:text-emerald-400 border-green-200 dark:border-emerald-500/20" :
                          apt.status === "CANCELLED" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20" :
                          "bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 border-zinc-200 dark:border-slate-700"
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {apt.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(apt._id, "CONFIRMED")}
                              className="text-sm px-4 py-1.5 bg-zinc-900 dark:bg-indigo-600 text-white font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                            >
                              Accept
                            </button>
                            <button 
                               onClick={() => handleUpdateStatus(apt._id, "CANCELLED")}
                              className="text-sm px-4 py-1.5 bg-white dark:bg-transparent text-red-600 dark:text-red-400 font-medium border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all shadow-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {apt.status === "CONFIRMED" && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(apt._id, "COMPLETED")}
                              className="text-sm px-4 py-1.5 bg-green-50 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400 font-medium border border-green-200 dark:border-emerald-500/20 rounded-lg hover:bg-green-100 dark:hover:bg-emerald-500/20 active:scale-95 transition-all shadow-sm"
                            >
                              Mark Completed
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(apt._id, "CANCELLED")}
                              className="text-sm px-4 py-1.5 text-zinc-500 dark:text-slate-400 font-medium hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {(apt.status === "COMPLETED" || apt.status === "CANCELLED") && (
                            <span className="text-sm text-zinc-400 dark:text-slate-500 font-medium text-center inline-block w-full">No actions required</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
