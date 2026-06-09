import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redisClient from "../config/redis.js";
import { Slot } from "../models/slots.models.js";
import { Doctor } from "../models/doctor.models.js";
import { Appointment } from "../models/appointment.models.js";
import { Notification } from "../models/notification.models.js";
import { generateAppointmentId } from "../utils/idGenerators.js";
import mongoose, { set } from "mongoose";
import { User } from "../models/user.models.js";
import { sendEmail } from "../utils/sendEmail.js";
import { getReceiverSocketId, io } from "../socket.js";
import { appointmentConfirmationTemplate } from "../utils/emailTemplates.js";

// Get my appointments (Patient)
const myAppointments = asyncHandler(async (req, res) => {
  const patientId = req.user?._id;

  const appointments = await Appointment.find({ patientId: patientId })
    .populate({
      path: "doctorId",
      select:
        "doctor specialization qualification experience consultationFee availableDays timeSlots doctorId",
      populate: {
        path: "doctorId",
        select: "profileImage",
      },
    })
    .populate("slotId", "slotNumber date timeSlots status")
    .sort({ date: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, appointments, "My Appointments fetched"));
});

// Get Doctor Appointments (Doctor Dashboard)
const getDoctorAppointments = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (req.user.role !== "DOCTOR") {
    throw new ApiError(403, "Only doctors can access this route");
  }

  // Find the exact Doctor profile tied to this User
  const doctorProfile = await Doctor.findOne({ doctorId: userId }).setOptions({
    includeInactive: true,
  });

  if (!doctorProfile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const appointments = await Appointment.find({ doctorId: doctorProfile._id })
    .populate("patientId", "fullname profileImage gender age phone email")
    .populate("slotId", "slotNumber date timeSlots status")
    .sort({ date: -1 })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        appointments,
        "Doctor appointments fetched successfully"
      )
    );
});

// Get appointment details by slotId (Slot Document ID) OR slotNumber
const getAppointmentDetailsBySlotId = asyncHandler(async (req, res) => {
  const identifier = req.params.slotId; // Can be ObjectId or Number

  let query = {};

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    // It's a Mongo ID -> Search by slotId ref
    query = { slotId: identifier };
  } else if (!isNaN(identifier)) {
    // It's a Number -> Search by slotNumber
    query = { slotNumber: parseInt(identifier) };
  } else {
    throw new ApiError(
      400,
      "Invalid Slot Identifier (Must be ID or Slot Number)"
    );
  }

  // Find Appointment
  const appointment = await Appointment.findOne(query)
    .populate({
      path: "doctorId",
      select:
        "doctor specialization qualification experience consultationFee availableDays timeSlots doctorId",
      populate: {
        path: "doctorId",
        select: "profileImage",
      },
    })
    .populate("slotId", "slotNumber date timeSlots status")
    .lean();

  if (!appointment) {
    throw new ApiError(404, "Appointment not found for this Slot");
  }

  // Enforce patient/doctor/admin ownership before returning data (IDOR fix)
  if (req.user.role === "PATIENT") {
    const patientId = appointment.patientId._id
      ? appointment.patientId._id.toString()
      : appointment.patientId.toString();
    if (patientId !== req.user._id.toString()) {
      throw new ApiError(
        403,
        "You are not authorized to view this appointment details"
      );
    }
  } else if (req.user.role === "DOCTOR") {
    const doctorProfile = await Doctor.findOne({ doctorId: req.user._id });
    const appointmentDoctorId = appointment.doctorId._id
      ? appointment.doctorId._id.toString()
      : appointment.doctorId.toString();
    if (
      !doctorProfile ||
      doctorProfile._id.toString() !== appointmentDoctorId
    ) {
      throw new ApiError(
        403,
        "You are not authorized to view this appointment details"
      );
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, appointment, "Appointment details fetched"));
});

// Helper to parse "HH:MM AM/PM" to minutes from midnight for chronological sorting
const parseTimeToMinutes = (timeStr) => {
  try {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(/\s+/);
    if (parts.length < 2) return 0;
    const time = parts[0];
    const modifier = parts[1].toUpperCase();
    let [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  } catch (error) {
    console.error("Time Parse Error inside parseTimeToMinutes:", error);
    return 0;
  }
};

// Helper to parse "HH:MM AM/PM" to hours and minutes
const parseTimeToHoursMinutes = (timeStr) => {
  if (!timeStr) return { hours: 0, minutes: 0 };
  const parts = timeStr.trim().split(/\s+/);
  if (parts.length < 2) return { hours: 0, minutes: 0 };
  const time = parts[0];
  const modifier = parts[1].toUpperCase();
  let [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return { hours: 0, minutes: 0 };

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
};

// Helper to filter out past slots for today and sort them chronologically
const filterAndSortSlots = (slots) => {
  const now = new Date();
  return [...slots]
    .filter((s) => {
      const dObj = new Date(s.date);
      const year = dObj.getUTCFullYear();
      const month = dObj.getUTCMonth(); // 0-indexed
      const date = dObj.getUTCDate();

      const { hours, minutes } = parseTimeToHoursMinutes(s.startTime);
      const pad = (num) => String(num).padStart(2, "0");
      const isoString = `${year}-${pad(month + 1)}-${pad(date)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
      const slotDateTime = new Date(isoString);

      // Return true only if slot time is in the future (with 10 minutes buffer)
      return slotDateTime.getTime() > now.getTime() + 10 * 60 * 1000;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;

      const timeA = parseTimeToMinutes(a.startTime);
      const timeB = parseTimeToMinutes(b.startTime);
      return timeA - timeB;
    });
};

// Get available slots for a doctor on a specific date
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { username, date } = req.body;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  if (!date) {
    throw new ApiError(400, "Date is required");
  }

  // Parse Date String to UTC Midnight (Universal Standard)
  let queryDate;
  if (typeof date === "string") {
    const [y, m, d] = date.split("T")[0].split("-");
    // Use Date.UTC to ensure 2026-02-06 becomes 2026-02-06T00:00:00.000Z
    queryDate = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
  } else {
    // Fallback if already a Date object, strip time and force UTC
    const d = new Date(date);
    queryDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  if (isNaN(queryDate.getTime())) {
    throw new ApiError(401, "Invalid date format. Enter: YYYY-MM-DD");
  }

  const doctor = await Doctor.findOne({
    doctor: { $regex: new RegExp("^" + username + "$", "i") },
  })
    .setOptions({ includeInactive: true })
    .lean();
  if (!doctor) {
    throw new ApiError(404, "Doctor doesn't exists");
  }

  const doctorId = doctor._id; // Correct: Use Doctor Document ID

  // Check Redis Cache
  const cacheKey = `slots:${doctorId.toString()}:${queryDate.toISOString().split("T")[0]}`;
  if (redisClient && redisClient.isOpen) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const cachedResult = JSON.parse(cached);
        if (cachedResult && Array.isArray(cachedResult.data)) {
          cachedResult.data = filterAndSortSlots(cachedResult.data);
        }
        return res.status(200).json(cachedResult);
      }
    } catch (err) {
      console.warn("⚠️ Slot cache get error:", err);
    }
  }

  console.log("DoctorId is:", doctorId);
  console.log("Input Date:", date);
  console.log("Query Date (Universal UTC Midnight):", queryDate.toISOString());

  // Use find() instead of aggregate() for better type casting support
  const slots = await Slot.find({
    doctorId: doctorId,
    date: queryDate,
    status: "AVAILABLE",
  }).lean();

  if (!slots) {
    throw new ApiError(404, "Slot is not available today");
  }

  const filteredSlots = filterAndSortSlots(slots);

  const responsePayload = new ApiResponse(
    200,
    filteredSlots,
    "Slot is available"
  );

  // Save to Redis Cache
  if (redisClient && redisClient.isOpen && filteredSlots.length > 0) {
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responsePayload)); // Cache for 5 minutes
    } catch (err) {
      console.error("⚠️ Slot cache set error:", err);
    }
  }

  return res.status(200).json(responsePayload);
});

// Applying for booking an appointment
const applyForBooking = asyncHandler(async (req, res) => {
  const patientId = req.user?._id;
  const { slotNumber, date, username, reason, meetingType } = req.body;

  if (!slotNumber) {
    throw new ApiError(400, "Slot number is required");
  }

  if (!username) {
    throw new ApiError(400, "Doctor username is required");
  }

  if (!reason) {
    throw new ApiError(400, "Reason for appointment is required");
  }

  // Parse Date String to UTC Midnight (Universal Standard)
  let bookingDate;
  try {
    if (typeof date === "string") {
      const [y, m, d] = date.split("T")[0].split("-");
      bookingDate = new Date(
        Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d))
      );
    } else {
      const d = new Date(date);
      bookingDate = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
      );
    }
  } catch (e) {
    throw new ApiError(400, "Invalid Date Format");
  }

  if (isNaN(bookingDate.getTime())) {
    throw new ApiError(401, "Invalid date format. Enter: YYYY-MM-DD");
  }

  // Prevent booking in the past
  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );
  if (bookingDate < todayUTC) {
    throw new ApiError(400, "Cannot book appointments in the past");
  }

  console.log(
    `[DEBUG] applyForBooking: Looking for doctor '${username}' (case-insensitive)`
  );
  const doctor = await Doctor.findOne({
    doctor: { $regex: new RegExp("^" + username + "$", "i") },
  }).setOptions({ includeInactive: true });
  console.log(`[DEBUG] applyForBooking: Found? ${!!doctor}`);
  if (!doctor) {
    throw new ApiError(404, "Doctor doesn't exists");
  }

  // Verify doctor is verified, visible, and accepting new patients
  if (
    !doctor.isVerified ||
    !doctor.isVisible ||
    !doctor.isAcceptingNewPatients
  ) {
    throw new ApiError(
      400,
      "This doctor is currently not accepting appointments or is not verified/visible"
    );
  }

  const doctorId = doctor._id; // Correct: Use Doctor Document ID

  console.log("DoctorId: ", doctorId);
  console.log("Booking Date (UTC):", bookingDate.toISOString());

  // TRUSTED BOOKING ATTEMPT
  const bookedSlot = await Slot.findOneAndUpdate(
    {
      slotNumber: slotNumber,
      doctorId: doctorId,
      date: bookingDate, // USE CORRECT UTC DATE
      status: "AVAILABLE",
    },
    {
      status: "BOOKED",
      bookedBy: patientId,
    },
    { new: true }
  );

  if (bookedSlot) {
    const dObj = new Date(bookedSlot.date);
    const year = dObj.getUTCFullYear();
    const month = dObj.getUTCMonth();
    const dateVal = dObj.getUTCDate();
    const { hours, minutes } = parseTimeToHoursMinutes(bookedSlot.startTime);
    const pad = (num) => String(num).padStart(2, "0");
    const isoString = `${year}-${pad(month + 1)}-${pad(dateVal)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
    const slotDateTime = new Date(isoString);
    const now = new Date();

    if (slotDateTime.getTime() <= now.getTime() + 10 * 60 * 1000) {
      // Rollback bookedSlot
      await Slot.findByIdAndUpdate(bookedSlot._id, {
        status: "AVAILABLE",
        bookedBy: null,
      });
      throw new ApiError(
        400,
        "This slot's time has already passed. Please select a future slot."
      );
    }
  }

  // --- ROOT CAUSE ANALYSIS IF FAILED ---
  if (!bookedSlot) {
    console.log("❌ Booking Failed. Running Deep Analysis...");

    // 1. Check if Slot exists at all (ignoring date/status)
    const slotAny = await Slot.findOne({
      slotNumber: slotNumber,
      doctorId: doctorId,
    });

    if (!slotAny) {
      console.log("  -> Slot Number not found for this doctor.");
      const count = await Slot.countDocuments({ doctorId: doctorId });
      console.log(`  -> Doctor has ${count} slots total.`);
      throw new ApiError(
        404,
        "Slot Number not found. Please refresh available slots."
      );
    }

    // 2. Check Date Mismatch
    const dbDateISO = slotAny.date.toISOString();
    const reqDateISO = bookingDate.toISOString();

    if (dbDateISO !== reqDateISO) {
      console.log(`  -> DATE MISMATCH! DB: ${dbDateISO} vs Req: ${reqDateISO}`);
      console.log(
        `  -> Readable: DB has ${slotAny.date.toDateString()}, You asked for ${bookingDate.toDateString()}`
      );
      throw new ApiError(
        400,
        `Date Mismatch. Slot is for ${slotAny.date.toDateString()}, but you requested ${bookingDate.toDateString()}.`
      );
    }

    // 3. Check Status
    if (slotAny.status !== "AVAILABLE") {
      console.log(`  -> STATUS MISMATCH! Slot is ${slotAny.status}`);
      throw new ApiError(400, `Slot is already ${slotAny.status}.`);
    }

    // 4. Unknown
    console.log(
      "  -> Slot looks perfect but findOneAndUpdate returned null. Race condition?"
    );
    throw new ApiError(
      500,
      "Unknown Booking Error. Slot update failed despite valid slot."
    );
  }

  // SUCCESS PATH
  // Parse Fee
  let fee = 0;
  if (doctor.consultationFee) {
    fee = parseFloat(doctor.consultationFee.replace(/[^0-9.]/g, "")) || 0;
  }

  try {
    const appointmentId = await generateAppointmentId();

    const appointment = await Appointment.create({
      appointmentId,
      patientId: patientId,
      doctorId: doctorId,
      slotId: bookedSlot._id, // Renamed from slot -> slotId
      date: bookingDate, // USE CORRECT UTC DATE
      slotNumber: slotNumber,
      status: "PENDING", // PENDING UNTIL PAID
      reason: reason,
      consultationFee: fee,
      timeSlots: `${bookedSlot.startTime} - ${bookedSlot.endTime}`,
      meetingType: meetingType,
    });

    // Update Doctor Stats (New Appointment Count)
    doctor
      .updateDoctorStats()
      .catch((err) => console.error("Stats Update Error:", err));

    // --- EMAILS AND DOCTOR STATS ARE OMITTED HERE ---
    // They are now handled in the /api/payments/verify endpoint when payment is formally collected.

    // Send Real-Time Notification to Doctor
    const notificationData = {
      userId: doctor.doctorId,
      title: "New Appointment",
      message: `A new appointment has been booked for ${bookingDate.toDateString()}.`,
      type: "APPOINTMENT",
      relatedId: appointment._id,
    };
    await Notification.create(notificationData);

    const receiverSocketId = getReceiverSocketId(doctor.doctorId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("notification", notificationData);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, appointment, "Appointment booked Successfully.")
      );
  } catch (error) {
    // ... (rest of catch block)

    // ROLLBACK
    console.error("❌ Appointment Creation Failed. Rolling back Slot...");
    await Slot.findByIdAndUpdate(bookedSlot._id, {
      status: "AVAILABLE",
      bookedBy: null,
    });
    throw error;
  }
});

// Cancel booking an appointment
const cancelBooking = asyncHandler(async (req, res) => {
  const patientId = req.user?._id;
  const { slotNumber, username, date } = req.body;

  if (!slotNumber || !username || !date) {
    throw new ApiError(400, "Slotnumber, username and date is required");
  }

  // Parse Date String to UTC Midnight (Universal Standard)
  let bookingDate;
  if (typeof date === "string") {
    const [y, m, d] = date.split("T")[0].split("-");
    bookingDate = new Date(Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d)));
  } else {
    const d = new Date(date);
    bookingDate = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    );
  }

  if (isNaN(bookingDate.getTime())) {
    throw new ApiError(400, "Invalid date format. Enter: YYYY-MM-DD");
  }

  const doctor = await Doctor.findOne({
    doctor: { $regex: new RegExp("^" + username + "$", "i") },
  }).setOptions({ includeInactive: true });

  if (!doctor) {
    throw new ApiError(404, "Doctor doesn't exists");
  }

  const doctorId = doctor._id; // Correct: Use Doctor Document ID
  console.log("patientId", patientId);
  console.log("doctorId", doctorId);
  console.log("date", bookingDate.toISOString());
  console.log("slotNumber", slotNumber);

  const appointment = await Appointment.findOne({
    slotNumber: slotNumber,
    patientId: patientId,
    doctorId: doctorId,
    date: bookingDate, // Appointment stores raw string or Date? Schema says Date.
    status: "CONFIRMED",
  });

  console.log("appointment", appointment);

  if (!appointment) {
    throw new ApiError(404, "No appoinment available for this slotnumber");
  }

  const slot = await Slot.findOneAndUpdate(
    {
      slotNumber: slotNumber,
      doctorId: doctorId,
      date: bookingDate,
      status: "BOOKED",
    },
    {
      status: "AVAILABLE",
      bookedBy: null,
    },
    { new: true }
  );

  if (!slot) {
    throw new ApiError(404, "Slot cancellation failed or no slot available");
  }

  appointment.status = "CANCELLED";
  await appointment.save();

  // Update Doctor Stats (Cancellation Count)
  doctor
    .updateDoctorStats()
    .catch((err) => console.error("Stats Update Error:", err));

  console.log("Appointment cancelled: ", appointment);

  // Send Notification to Doctor/Patient
  const notifyDoctorId = doctor.doctorId.toString();
  const notifyPatientId = appointment.patientId.toString();
  const targetId =
    req.user.role === "DOCTOR" ? notifyPatientId : notifyDoctorId;

  const notificationData = {
    userId: targetId,
    title: "Appointment Cancelled",
    message: `Appointment on ${appointment.date.toDateString()} was cancelled.`,
    type: "APPOINTMENT",
    relatedId: appointment._id,
  };
  await Notification.create(notificationData);

  const receiverSocketId = getReceiverSocketId(targetId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification", notificationData);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: slot, appointment },
        "Appointment cancelled successfully"
      )
    );
});

// Update appointment status
// Update appointment status (Robust State Machine)
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { status, prescription, notes, reason } = req.body;
  const userId = req.user?._id;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // AUTHORIZATION CHECK
  if (req.user.role === "DOCTOR") {
    const doctorProfile = await Doctor.findOne({ doctorId: userId }).setOptions(
      { includeInactive: true }
    );
    if (
      !doctorProfile ||
      doctorProfile._id.toString() !== appointment.doctorId.toString()
    ) {
      throw new ApiError(403, "Not authorized to update this appointment");
    }
  } else if (req.user.role === "PATIENT") {
    if (appointment.patientId.toString() !== userId.toString()) {
      throw new ApiError(403, "Not authorized to update this appointment");
    }
  }

  if (status === "CONFIRMED" && req.user.role !== "ADMIN") {
    throw new ApiError(
      403,
      "Only automated payment verification or admin can confirm appointments"
    );
  }

  // 1. STATE MACHINE VALIDATION
  const terminalStates = ["CANCELLED", "COMPLETED", "NO_SHOW"];
  if (terminalStates.includes(appointment.status)) {
    throw new ApiError(
      400,
      `Cannot change status. Appointment is already ${appointment.status}.`
    );
  }

  const validTransitions = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
    RESCHEDULED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  };

  const allowed = validTransitions[appointment.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(
      400,
      `Invalid Status Transition. Cannot go from ${appointment.status} to ${status}.`
    );
  }

  // 2. APPLY UPDATES
  appointment.status = status;
  if (prescription) appointment.prescription = prescription;
  if (notes) appointment.doctorNotes = notes; // Mapped to doctorNotes schema field

  // 3. STATUS SPECIFIC LOGIC
  if (status === "CONFIRMED") {
    try {
      const patientData = await User.findById(appointment.patientId);
      const doctorData = await Doctor.findById(appointment.doctorId).setOptions(
        { includeInactive: true }
      );
      if (patientData && patientData.email) {
        const htmlMessage = appointmentConfirmationTemplate(
          patientData.fullname,
          doctorData?.doctor || "",
          appointment.date,
          appointment.timeSlots,
          appointment.meetingType
        );
        await sendEmail({
          email: patientData.email,
          subject: `Appointment Confirmed - ${new Date(appointment.date).toDateString()}`,
          message: htmlMessage,
        });
      }
    } catch (err) {
      console.error("Failed to send appointment confirmation email:", err);
    }
  }

  if (status === "CANCELLED") {
    // Free the Slot
    const slotUpdate = await Slot.findByIdAndUpdate(appointment.slotId, {
      status: "AVAILABLE",
      bookedBy: null,
    });

    if (!slotUpdate) {
      // Log critical error but don't fail the request if slot is already gone
      console.error(
        `CRITICAL: Slot ${appointment.slotId} missing for appointment ${appointment._id}`
      );
    }

    // Metadata
    appointment.cancellationReason = reason || "Cancelled by User/Doctor";
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = userId;
  }

  if (status === "COMPLETED") {
    if (appointment.paymentStatus !== "PAID") {
      throw new ApiError(
        400,
        "Cannot complete appointment. Payment has not been verified/paid."
      );
    }
    appointment.isCompleted = true; // If schema supports
  }

  await appointment.save();

  // Update Doctor Stats (Status Change: Completed/Cancelled)
  Doctor.findById(appointment.doctorId)
    .setOptions({ includeInactive: true })
    .then((doc) => {
      if (doc)
        doc
          .updateDoctorStats()
          .catch((err) => console.error("Stats Update Error:", err));
    });

  const notificationData = {
    userId: appointment.patientId,
    title: `Status: ${status}`,
    message: `Your appointment status was updated to ${status}.`,
    type: "APPOINTMENT",
    relatedId: appointment._id,
  };
  await Notification.create(notificationData);

  const receiverSocketId = getReceiverSocketId(
    appointment.patientId.toString()
  );
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("notification", notificationData);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        appointment,
        "Appointment status updated successfully"
      )
    );
});

// Reschedule appointment
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { newDate, newSlotNumber, reason, meetingType } = req.body;
  const userId = req.user?._id;

  if (!newDate || !newSlotNumber) {
    throw new ApiError(400, "New date and slot number are required");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // AUTHORIZATION CHECK
  if (req.user.role === "DOCTOR") {
    const doctorProfile = await Doctor.findOne({ doctorId: userId }).setOptions(
      { includeInactive: true }
    );
    if (
      !doctorProfile ||
      doctorProfile._id.toString() !== appointment.doctorId.toString()
    ) {
      throw new ApiError(403, "Not authorized to reschedule this appointment");
    }
  } else if (req.user.role === "PATIENT") {
    if (appointment.patientId.toString() !== userId.toString()) {
      throw new ApiError(403, "Not authorized to reschedule this appointment");
    }
  }

  // 1. VALIDATION: Prevent rescheduling terminal states
  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status)) {
    throw new ApiError(
      400,
      `Cannot reschedule. Appointment is already ${appointment.status}.`
    );
  }

  if (appointment.status === "RESCHEDULED") {
    throw new ApiError(
      400,
      "Appointment has already been rescheduled once. Further changes are not allowed."
    );
  }

  // Parse New Date to UTC
  let rescheduleDate;
  try {
    if (typeof newDate === "string") {
      const [y, m, d] = newDate.split("T")[0].split("-");
      rescheduleDate = new Date(
        Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d))
      );
    } else {
      const d = new Date(newDate);
      rescheduleDate = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
      );
    }
  } catch (e) {
    throw new ApiError(400, "Invalid Date Format");
  }

  // 2. Find new slot
  // Note: appointment.doctorId is just the ID (not populated here usually, and if it is, we need _id)
  // Safely extract ID
  const doctorId = appointment.doctorId._id || appointment.doctorId;

  const newSlot = await Slot.findOne({
    doctorId: doctorId,
    date: rescheduleDate,
    slotNumber: newSlotNumber,
    status: "AVAILABLE",
  });

  if (!newSlot) {
    throw new ApiError(404, "New slot is not available");
  }

  const dObj = new Date(newSlot.date);
  const year = dObj.getUTCFullYear();
  const month = dObj.getUTCMonth();
  const dateVal = dObj.getUTCDate();
  const { hours, minutes } = parseTimeToHoursMinutes(newSlot.startTime);
  const pad = (num) => String(num).padStart(2, "0");
  const isoString = `${year}-${pad(month + 1)}-${pad(dateVal)}T${pad(hours)}:${pad(minutes)}:00+05:30`;
  const slotDateTime = new Date(isoString);
  const now = new Date();

  if (slotDateTime.getTime() <= now.getTime() + 10 * 60 * 1000) {
    throw new ApiError(
      400,
      "Cannot reschedule to a slot that has already passed."
    );
  }

  // 3. Free up old slot
  await Slot.findByIdAndUpdate(appointment.slotId, {
    status: "AVAILABLE",
    bookedBy: null,
  });

  // 4. Book new slot
  newSlot.status = "BOOKED";
  newSlot.bookedBy = appointment.patientId;
  await newSlot.save();

  // 5. Update appointment with History
  // Preserve old details in history
  appointment.rescheduleFrom = {
    date: appointment.date,
    timeSlots: appointment.timeSlots,
  };

  appointment.date = rescheduleDate;
  appointment.slotId = newSlot._id;
  appointment.slotNumber = newSlotNumber;
  appointment.timeSlots = `${newSlot.startTime} - ${newSlot.endTime}`; // Update Time String
  appointment.status = "RESCHEDULED";
  appointment.rescheduleAt = new Date();
  appointment.rescheduleReason = reason || "User requested reschedule";

  if (meetingType) {
    appointment.meetingType = meetingType;
  }

  await appointment.save();

  // Update Stats (Sync Reschedule history)
  Doctor.findById(appointment.doctorId)
    .setOptions({ includeInactive: true })
    .then((doc) => {
      if (doc)
        doc
          .updateDoctorStats()
          .catch((err) => console.error("Stats Update Error:", err));
    });

  return res
    .status(200)
    .json(
      new ApiResponse(200, appointment, "Appointment rescheduled successfully")
    );
});

export {
  myAppointments,
  getDoctorAppointments,
  getAppointmentDetailsBySlotId,
  getAvailableSlots,
  applyForBooking,
  cancelBooking,
  updateAppointmentStatus,
  rescheduleAppointment,
};
