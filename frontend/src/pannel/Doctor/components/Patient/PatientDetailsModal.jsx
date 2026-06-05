import React from 'react';
import { X, Calendar, Clock, Activity, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const PatientDetailsModal = ({ isOpen, onClose, patient, appointments, onStatusChange }) => {
  if (!isOpen || !patient) return null;

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    
    const styles = {
      CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      RESCHEDULED: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    };

    const icons = {
      CONFIRMED: <CheckCircle className="w-3 h-3" />,
      PENDING: <Clock className="w-3 h-3" />,
      COMPLETED: <CheckCircle className="w-3 h-3" />,
      CANCELLED: <AlertCircle className="w-3 h-3" />,
      RESCHEDULED: <RefreshCw className="w-3 h-3" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold shadow-sm border border-black/5 dark:border-white/5 ${
          styles[statusUpper] || styles.PENDING
        }`}
      >
        {icons[statusUpper] || icons.PENDING}
        {statusUpper || "PENDING"}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 shrink-0">
                 {patient.profileImage ? (
                     <img src={patient.profileImage} alt={patient.name} className="w-full h-full object-cover" />
                 ) : (
                     <span className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-xl">
                         {patient.name?.charAt(0)}
                     </span>
                 )}
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1">
                    {patient.name}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {patient.age ? `${patient.age} yrs • ` : ''} {patient.gender || 'Unknown'} • {patient.phone}
                </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Appointment History</h3>
          </div>
          
          {appointments && appointments.length > 0 ? (
              <div className="space-y-4">
                 {appointments.map((apt) => (
                    <div key={apt._id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 hover:border-blue-100 dark:hover:border-blue-900/30 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                                <Clock className="w-4 h-4 text-blue-500" />
                                {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                <span className="text-gray-400 font-normal">at</span>
                                {apt.timeSlots || apt.slotId?.timeSlots || 'TBD'}
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(apt.status)}
                                {onStatusChange && (
                                    <select 
                                      className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none cursor-pointer"
                                      onChange={(e) => onStatusChange(e, apt)}
                                      value={apt.status}
                                      disabled={['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(apt.status)}
                                    >
                                      <option value="" disabled>Update Status</option>
                                      <option value="PENDING" disabled>Pending</option>
                                      <option value="CONFIRMED">Confirm</option>
                                      <option value="COMPLETED">Mark Completed</option>
                                      <option value="CANCELLED">Cancel</option>
                                    </select>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-2 mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/50">
                            <Activity className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">Reason for Visit</p>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{apt.reason || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>
                 ))}
              </div>
          ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-dashed border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No appointment history found for this patient.</p>
              </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientDetailsModal;
