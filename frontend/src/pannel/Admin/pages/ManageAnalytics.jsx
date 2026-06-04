import React, { useState, useEffect } from "react";
import Skeleton from "../../../components/common/Skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Loader2
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import adminService from "../../../services/adminService";
import toast from "react-hot-toast";

const ManageAnalytics = () => {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState("Month");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await adminService.getDashboardStats(timeRange.toLowerCase());
        setStats(response.data);
      } catch (error) {
        toast.error("Failed to load analytics data");
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeRange]);

  const handleDownloadReport = () => {
    if (!stats) {
      toast.error("No data available to download.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== MediCare Analytics Report ===\n\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Patients,${stats.totalUsers || 0}\n`;
    csvContent += `Total Doctors,${stats.totalDoctors || 0}\n`;
    csvContent += `Total Appointments,${stats.totalAppointments || 0}\n`;
    csvContent += `Total Revenue,₹${stats.totalRevenue || 0}\n\n`;

    csvContent += "=== Time Series Data ===\n";
    csvContent += "Date,Appointments Volume\n";
    
    if (stats.chartData && stats.chartData.length > 0) {
      stats.chartData.forEach((row) => {
        csvContent += `${row.date},${row.appointments}\n`;
      });
    } else {
      csvContent += "No chart data available.\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medicare_report_${timeRange.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV Report generated successfully!");
  };

  // Dynamic metrics from backend
  const metrics = [
    { label: "Total Patients", value: stats?.totalUsers || "0", change: "+14.5%", isIncrease: true, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Appointments", value: stats?.totalAppointments || "0", change: "+8.2%", isIncrease: true, icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Total Revenue", value: `₹${stats?.totalRevenue || "0"}`, change: "+4.1%", isIncrease: true, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Active Doctors", value: stats?.totalDoctors || "0", change: "Steady", isIncrease: true, icon: Activity, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-500/10" },
  ];

  // Map Backend chartData to Recharts
  const dynamicChartData = stats?.chartData || [];

  const departmentData = [
    { name: "Cardiology", value: 400 },
    { name: "Neurology", value: 300 },
    { name: "Pediatrics", value: 300 },
    { name: "Orthopedics", value: 200 },
  ];
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-3 rounded-xl shadow-lg">
          <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto pb-10 mt-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-end mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Stats Cards Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>
              <Skeleton className="w-32 h-6 rounded-md mb-2" />
              <Skeleton className="w-24 h-10 rounded-md" />
            </div>
          ))}
        </div>

        {/* Charts Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[400px] flex flex-col">
            <Skeleton className="w-48 h-6 rounded-md mb-8" />
            <div className="flex-1 flex items-end gap-4 px-4 overflow-hidden">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className={`flex-1 rounded-t-lg h-[${30 + Math.random() * 60}%]`} />
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-[400px] flex flex-col">
            <Skeleton className="w-48 h-6 rounded-md mb-8" />
            <div className="flex-1 flex items-center justify-center">
              <Skeleton variant="circle" className="w-64 h-64 border-16 border-gray-50 dark:border-slate-800/50 bg-transparent!" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Track key performance metrics and overall hospital growth.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
            {['Week', 'Month', 'Year'].map((period) => (
              <button 
                key={period} 
                onClick={() => setTimeRange(period)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all
                  ${timeRange === period 
                    ? 'bg-gray-100 dark:bg-slate-700 text-indigo-600 dark:text-white' 
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                {period}
              </button>
            ))}
          </div>
          <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all cursor-pointer">
            <Download className="w-4 h-4" /> Report
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${stat.isIncrease ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10'}`}>
                {stat.isIncrease ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appointments Volume</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Total bookings over the selected period</p>
            </div>
            <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}/>
                <Area type="monotone" dataKey="appointments" name="Total Appointments" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient by Department Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Patients by Department</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Distribution of patients</p>
          </div>
          <div className="flex-1 flex flex-col justify-center relative">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-4 mt-4 px-2">
              {departmentData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Appointments Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Appointments Breakdown</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Online vs In-person visitations</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={dynamicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                <RechartsTooltip cursor={{fill: theme === 'dark' ? '#1e293b' : '#f8fafc'}} content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}/>
                <Bar dataKey="appointments" name="Appointments" fill="#10b981" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Placeholder for additional table or chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Detailed Reports Generator</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mb-6">Create custom tailored reports for hospital management. Select date ranges, specific departments, and metrics.</p>
            <button onClick={handleDownloadReport} className="px-6 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all cursor-pointer">
              Download CSV Report
            </button>
        </div>

      </div>

    </div>
  );
};

export default ManageAnalytics;