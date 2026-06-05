import React, { useEffect, useState } from 'react';
import { Video, Calendar as CalendarIcon, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctorAppointments, updateDoctorAppointmentStatus } from '../../../features/appointments/doctorAppointmentSlice';
import toast from 'react-hot-toast';
import PrescriptionModal from '../components/Prescriptions/PrescriptionModal';
import { useNavigate } from 'react-router-dom';

const OnlineSessions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { appointments, isLoading } = useSelector(state => state.doctorAppointments);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeApt, setActiveApt] = useState(null);

  useEffect(() => {
    dispatch(fetchDoctorAppointments());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchDoctorAppointments());
    setRefreshing(false);
  };

  const handleStatusChange = (e, apt) => {
    const status = e.target.value;
    if (status === 'COMPLETED') {
      setActiveApt(apt);
      setIsModalOpen(true);
      e.target.value = apt.status; 
    } else if (status) {
      dispatch(updateDoctorAppointmentStatus({ appointmentId: apt._id, status }));
    }
  };

  const handleIssuePrescription = async (data) => {
    setIsSubmitting(true);
    try {
      await dispatch(updateDoctorAppointmentStatus({ appointmentId: data.appointmentId, status: "COMPLETED", prescription: data.prescription })).unwrap();
      toast.success("Success! Patient discharged and files appended.");
      dispatch(fetchDoctorAppointments());
      setIsModalOpen(false);
      setActiveApt(null);
    } catch (e) {
      toast.error(e || "Failed to generate prescription successfully");
    } finally {
      setIsSubmitting(false);
    }
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

  // Filter appointments to show only ONLINE ones
  const onlineAppointments = appointments.filter(apt => apt.meetingType === 'ONLINE');

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="w-8 h-8 text-indigo-600" />
            Online Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your online video consultations</p>
        </div>
        <button 
          onClick={handleRefresh} 
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        >
          {refreshing || isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-100">
        <div className="p-6">
          <div className="grid gap-4">
            {isLoading && !refreshing ? (
              <div className="p-12 flex justify-center w-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : onlineAppointments.length > 0 ? (
              onlineAppointments.map((apt) => (
                <div key={apt._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-500/50 hover:shadow-sm transition-all bg-gray-50/50 dark:bg-gray-900/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{apt.patientId?.name || apt.patientId?.fullname || "Unknown Patient"}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(apt.date).toLocaleDateString()} at {apt.timeSlots}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      ['CONFIRMED', 'COMPLETED'].includes(apt.status) ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 
                      apt.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                    }`}>
                      {apt.status}
                    </span>

                    {/* Join WebRTC Video Consultation launcher */}
                    {apt.status === 'CONFIRMED' && (() => {
                      const availability = getCallAvailability(apt);
                      if (!availability.show) return null;
                      return (
                        <button 
                          onClick={() => {
                            if (!availability.isAllowed) {
                              toast.error("This session starts in the future. You can join 15 minutes before the start time.");
                              return;
                            }
                            navigate(`/consultation/${apt._id}`);
                          }}
                          className={`p-2 rounded-lg transition-all cursor-pointer ${
                            availability.isAllowed 
                            ? "text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 animate-pulse" 
                            : "text-gray-400 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed"
                          }`}
                          title="Join Video Consultation"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      );
                    })()}

                    <select 
                      className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 outline-none cursor-pointer"
                      onChange={(e) => handleStatusChange(e, apt)}
                      value={apt.status}
                      disabled={['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(apt.status)}
                    >
                      <option value="" disabled>Update Status</option>
                      <option value="PENDING" disabled>Pending</option>
                      <option value="CONFIRMED">Confirm</option>
                      <option value="COMPLETED">Mark Completed</option>
                      <option value="CANCELLED">Cancel</option>
                    </select>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl">
                No online sessions scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <PrescriptionModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setActiveApt(null); }}
        onSubmit={handleIssuePrescription}
        defaultAppointment={activeApt}
        availableAppointments={appointments}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default OnlineSessions;
