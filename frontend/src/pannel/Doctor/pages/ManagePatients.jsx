import React, { useState, useEffect } from 'react';
import { Users, Search, Download, HeartPulse, UserCircle, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDoctorPatients, fetchDoctorAppointments, updateDoctorAppointmentStatus } from '../../../features/appointments/doctorAppointmentSlice';
import PatientDetailsModal from '../components/Patient/PatientDetailsModal';
import PrescriptionModal from '../components/Prescriptions/PrescriptionModal';
import toast from 'react-hot-toast';

const DoctorPatients = () => {
  const dispatch = useDispatch();
  const { patients, appointments, isLoading } = useSelector((state) => state.doctorAppointments);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeApt, setActiveApt] = useState(null);

  useEffect(() => {
    dispatch(fetchDoctorPatients());
    dispatch(fetchDoctorAppointments());
  }, [dispatch]);

  const handleStatusChange = (e, apt) => {
    const status = e.target.value;
    if (status === 'COMPLETED') {
      setActiveApt(apt);
      setIsPrescriptionModalOpen(true);
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
      setIsPrescriptionModalOpen(false);
      setActiveApt(null);
    } catch (e) {
      toast.error(e || "Failed to generate prescription successfully");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter appointments to only show IN_PERSON (non-ONLINE) ones
  const inPersonAppointments = appointments.filter(a => a.meetingType !== 'ONLINE');

  // Filter patients to only show those who have at least one IN_PERSON appointment
  const inPersonPatientIds = new Set(
    inPersonAppointments.map(a => a.patientId?._id || a.patientId)
  );

  const filteredPatients = patients.filter(patient => 
    inPersonPatientIds.has(patient._id) &&
    patient.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Manage Patients
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage your patient roster</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Patient</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Last Visit</th>
                <th className="p-4">Diagnosis</th>
                <th className="p-4 pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 overflow-hidden shrink-0">
                          {patient.profileImage ? (
                            <img src={patient.profileImage} alt={patient.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{patient.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{patient.age || 'N/A'} yrs • {patient.gender || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{patient.phone || 'N/A'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      {patient.diagnoses && patient.diagnoses.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                            <HeartPulse className="w-3.5 h-3.5" />
                            {patient.diagnoses[patient.diagnoses.length - 1]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No Diagnosis</span>
                      )}
                    </td>
                    <td className="p-4 pr-6">
                      <button onClick={() => setSelectedPatient(patient)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">View Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && filteredPatients.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No patients found matching your search.
            </div>
          )}
        </div>
      </div>

      <PatientDetailsModal 
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
        appointments={inPersonAppointments.filter(a => (a.patientId?._id === selectedPatient?._id || a.patientId === selectedPatient?._id))}
        onStatusChange={handleStatusChange}
      />

      <PrescriptionModal 
        isOpen={isPrescriptionModalOpen}
        onClose={() => { setIsPrescriptionModalOpen(false); setActiveApt(null); }}
        onSubmit={handleIssuePrescription}
        defaultAppointment={activeApt}
        availableAppointments={appointments}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default DoctorPatients;
