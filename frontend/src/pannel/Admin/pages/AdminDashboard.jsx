import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats } from "../../../features/admin/AdminSlice";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Skeleton from "../../../components/common/Skeleton";
import { 
  Users, 
  UserRound, 
  Calendar, 
  TrendingUp, 
  MoreVertical, 
  Plus, 
  UserPlus, 
  FileText, 
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  BarChart3,
  Loader2
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

/**
 * Modern Admin Dashboard matching the requested design.
 * Now fully connected to the backend database.
 */
const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, isLoading, isChartLoading, isError, message } = useSelector((state) => state.admin);
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  useEffect(() => {
    dispatch(getDashboardStats(selectedPeriod));
  }, [dispatch, selectedPeriod]);

  const chartData = useMemo(() => {
    if (!stats?.chartData) return [];
    
    return stats.chartData.map(item => {
      const date = new Date(item.date);
      let name = "";
      
      if (selectedPeriod === "year") {
        name = date.toLocaleDateString('en-US', { month: 'short' });
      } else if (selectedPeriod === "month") {
        name = date.getDate().toString();
      } else {
        name = date.toLocaleDateString('en-US', { weekday: 'short' });
      }
      
      return {
        name,
        appointments: item.appointments,
      };
    });
  }, [stats?.chartData, selectedPeriod]);

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  const statCards = [
    { 
      label: "Total Appointments", 
      value: stats?.totalAppointments?.toLocaleString() || "0", 
      icon: Calendar, 
      color: "text-blue-600", 
      bg: "bg-blue-50 dark:bg-blue-500/10" 
    },
    { 
      label: "Total Doctors", 
      value: stats?.totalDoctors?.toString() || "0",  
      icon: UserRound, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50 dark:bg-emerald-500/10" 
    },
    { 
      label: "Total Patients", 
      value: stats?.totalUsers?.toLocaleString() || "0", 
      icon: Users, 
      color: "text-purple-600", 
      bg: "bg-purple-50 dark:bg-purple-500/10" 
    },
    { 
      label: "Revenue", 
      value: `₹${stats?.totalRevenue?.toLocaleString() || "0"}`, 
      icon: TrendingUp, 
      color: "text-orange-600", 
      bg: "bg-orange-50 dark:bg-orange-500/10" 
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex justify-between items-start h-[104px]">
               <div className="space-y-3 w-3/4">
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-8 w-24" />
               </div>
               <Skeleton variant="circle" className="w-12 h-12 rounded-xl" />
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden h-[450px]">
             <div className="p-6 border-b border-gray-100 dark:border-slate-800">
               <Skeleton className="h-6 w-48" />
             </div>
             <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 border border-gray-50 dark:border-slate-800 rounded-xl">
                    <Skeleton variant="circle" className="w-10 h-10" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 h-[450px]">
             <Skeleton className="h-6 w-32 mb-6" />
             <div className="space-y-3">
               {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl w-full" />)}
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-150 flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-full">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Failed to load dashboard</h3>
          <p className="text-gray-500 dark:text-slate-400">{message}</p>
        </div>
        <button 
          onClick={() => dispatch(getDashboardStats(selectedPeriod))}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex justify-between items-start transition-all hover:shadow-md">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                {stat.change}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Recent Appointments</h2>
            <Link to="/admin/appointments" className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline">View All</Link>
          </div>
          <div className="p-6 space-y-4">
            {stats?.recentAppointments?.length > 0 ? (
              stats.recentAppointments.map((apt) => (
                <div key={apt._id} className={`flex items-center justify-between p-4 rounded-xl border-l-4 bg-white dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 hover:shadow-sm transition-all
                  ${apt.status === 'COMPLETED' ? 'border-l-emerald-500' : 
                    apt.status === 'CONFIRMED' ? 'border-l-blue-500' : 
                    apt.status === 'PENDING' ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                      {apt.patientId?.profileImage ? (
                        <img src={apt.patientId.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-[15px]">{apt.patientId?.fullname || "Unknown Patient"} — <span className="font-normal text-gray-500 dark:text-slate-400 text-sm">{apt.doctorId?.specialization || "General"}</span></h4>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{apt.doctorId?.doctor} • <span className="font-medium text-gray-700 dark:text-slate-200">{new Date(apt.date).toLocaleDateString()} {apt.timeSlots}</span></p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                    ${apt.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 
                      apt.status === 'CONFIRMED' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' : 
                      apt.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                    {apt.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-slate-400 italic text-sm">No recent appointments found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 text-gray-900 dark:text-white">
          <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: "New Appointment", link: "/admin/appointments", icon: Plus, bg: "bg-indigo-600 hover:bg-indigo-700 text-white" },
              { label: "Add Doctor", link: "/admin/doctors", icon: UserPlus, bg: "bg-emerald-600 hover:bg-emerald-700 text-white" },
              { label: "Add Patient", link: "/admin/patients", icon: Plus, bg: "bg-purple-600 hover:bg-purple-700 text-white" },
              { label: "Medical Report", link: "/admin/medical-records", icon: FileText, bg: "bg-orange-600 hover:bg-orange-700 text-white" },
            ].map((action, index) => (
              <Link key={index} to={action.link} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${action.bg}`}>
                <action.icon className="w-4 h-4" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Appointment Analytics</h2>
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 p-1 rounded-lg border border-gray-100 dark:border-slate-700">
            {['week', 'month', 'year'].map((period) => (
              <button 
                key={period} 
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all capitalize
                  ${selectedPeriod === period 
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' 
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 h-[350px] w-full relative">
          {isChartLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px]">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                    borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: theme === 'dark' ? '#f8fafc' : '#1e293b'
                  }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorApts)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-md font-bold text-gray-900 dark:text-white mb-1">No analytics data available</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">Trends will appear once appointments are booked</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden text-gray-900 dark:text-white">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold tracking-tight">Recent Activity</h2>
        </div>
        <div className="p-6 space-y-6">
          {stats?.recentActivities?.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4">
                <div className={`mt-1 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  ${activity.type === 'appointment' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 
                    activity.type === 'user' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 
                    activity.type === 'doctor' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600'}`}>
                  {activity.type === 'appointment' ? <Calendar className="w-4 h-4" /> :
                   activity.type === 'user' ? <UserPlus className="w-4 h-4" /> :
                   activity.type === 'doctor' ? <FileText className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1 border-b border-gray-50 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="font-bold text-gray-900 dark:text-white text-sm">{activity.action}</h5>
                    <span className="text-[11px] font-medium text-gray-400">{formatRelativeTime(activity.time)}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{activity.detail}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 italic text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
