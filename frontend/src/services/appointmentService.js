import api from "./api";

// Get all appointments for current user
const getMyAppointments = async () => {
  const response = await api.get("/appointments");
  return response.data.data;
};

// Get specific appointment by ID
const getAppointmentById = async (appointmentId) => {
  const response = await api.get(`/appointments/${appointmentId}`);
  return response.data.data;
};

// Get appointment details by slot ID
const getAppointmentBySlotId = async (slotId) => {
  const response = await api.get(`/appointments/slot/${slotId}`);
  return response.data.data;
};

// Check available slots for a doctor on a specific date
const checkAvailableSlots = async (username, date) => {
  const response = await api.post("/appointments/checkslot", {
    username,
    date,
  });
  return response.data.data;
};

// Book an appointment
const bookAppointment = async (appointmentData) => {
  const { slotNumber, date, username, reason, meetingType } = appointmentData;
  const response = await api.post("/appointments/bookslot", {
    slotNumber,
    date,
    username,
    reason,
    meetingType,
  });
  return response.data.data;
};

// Cancel an appointment
const cancelAppointment = async (slotNumber, username, date) => {
  const response = await api.post("/appointments/cancelslot", {
    slotNumber,
    username,
    date,
  });
  return response.data;
};

// Update appointment status
const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.patch(`/appointments/${appointmentId}`, {
    status,
  });
  return response.data.data;
};

// Reschedule appointment
const rescheduleAppointment = async (appointmentId, rescheduleData) => {
  const response = await api.patch(
    `/appointments/${appointmentId}/reschedule`,
    rescheduleData
  );
  return response.data.data;
};

const appointmentService = {
  getMyAppointments,
  getAppointmentById,
  getAppointmentBySlotId,
  checkAvailableSlots,
  bookAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
};

export default appointmentService;
