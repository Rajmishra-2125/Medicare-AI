import { Router } from "express";
import {
  getAvailableSlots,
  applyForBooking,
  cancelBooking,
  myAppointments,
  getDoctorAppointments,
  getAppointmentDetailsBySlotId,
  updateAppointmentStatus,
  rescheduleAppointment,
} from "../controllers/appointment.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";

const router = Router();

/**
 * @openapi
 * /appointments:
 *   get:
 *     summary: Retrieve patient's appointments list
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments returned successfully.
 *
 * /appointments/checkslot:
 *   post:
 *     summary: Retrieve available slots for a doctor on a specific date
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - date
 *             properties:
 *               username:
 *                 type: string
 *               date:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of available slots.
 *
 * /appointments/bookslot:
 *   post:
 *     summary: Book an appointment slot
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slotNumber
 *               - date
 *               - username
 *               - reason
 *             properties:
 *               slotNumber:
 *                 type: string
 *               date:
 *                 type: string
 *               username:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Slot booked successfully.
 */

// Get my appointments
router
  .route("/")
  .get(verifyJWT, cacheMiddleware("patient:appointments", 300), myAppointments);

// Get doctor appointments
router
  .route("/doctor-appointments")
  .get(
    verifyJWT,
    cacheMiddleware("doctor:appointments", 300),
    getDoctorAppointments
  );

// Get/Update specific appointment
// Get Appointment details by Slot ID (New Route)
router.route("/slot/:slotId").get(verifyJWT, getAppointmentDetailsBySlotId);

// Update specific appointment (By Appointment ID)
router.route("/:appointmentId").patch(verifyJWT, updateAppointmentStatus);

// Reschedule
router
  .route("/:appointmentId/reschedule")
  .patch(verifyJWT, rescheduleAppointment);

// Checking availability by doctor username
router.route("/checkslot").post(verifyJWT, getAvailableSlots);

// Booking appointment
router.route("/bookslot").post(verifyJWT, applyForBooking);

// Cancelling appointment
router.route("/cancelslot").post(verifyJWT, cancelBooking);

export default router;
