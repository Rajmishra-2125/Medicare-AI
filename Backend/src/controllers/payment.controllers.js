import { Cashfree, CFEnvironment } from "cashfree-pg";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Appointment } from "../models/appointment.models.js";
import { Doctor } from "../models/doctor.models.js";
import { User } from "../models/user.models.js";
import { Slot } from "../models/slots.models.js";
import { sendEmail } from "../utils/sendEmail.js";
import { escapeHTML } from "../utils/sanitize.js";

// Initialize Cashfree instance
const getCashfreeInstance = () => {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    throw new ApiError(
      500,
      "Cashfree API keys are not configured in environment variables"
    );
  }

  // Use SANDBOX for dev/test, PRODUCTION for live
  const environment =
    process.env.CASHFREE_ENVIRONMENT === "PRODUCTION"
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;

  return new Cashfree(
    environment,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
  );
};

// Create a new Cashfree Order
export const createOrder = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    throw new ApiError(
      400,
      "appointmentId is required to generate payment order"
    );
  }

  const appointment =
    await Appointment.findById(appointmentId).populate("patientId");
  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const patientIdStr = appointment.patientId._id ? appointment.patientId._id.toString() : appointment.patientId.toString();
  if (patientIdStr !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to create a payment order for this appointment");
  }

  if (appointment.paymentStatus === "PAID") {
    throw new ApiError(400, "Appointment consultation fee is already paid");
  }

  const cashfree = getCashfreeInstance();

  // Cashfree amount is in standard decimals (e.g. 500.00)
  const fee = appointment.consultationFee
    ? Number(appointment.consultationFee)
    : 0;

  if (fee <= 0) {
    throw new ApiError(
      400,
      "Consultation fee is not valid for payment processing"
    );
  }

  const patient = appointment.patientId;
  const orderId = `order_${appointment._id}_${Date.now()}`;

  const request = {
    order_amount: fee,
    order_currency: "INR",
    order_id: orderId,
    customer_details: {
      customer_id: `cust_${patient._id}`,
      customer_name: patient.fullname || "Patient",
      customer_email: patient.email || "patient@medicare.com",
      customer_phone: patient.phone || "9999999999",
    },
  };

  try {
    const response = await cashfree.PGCreateOrder(request);

    // Save session ID for future reference
    appointment.cashfreeOrderId = response.data.order_id;
    appointment.cashfreeSessionId = response.data.payment_session_id;
    await appointment.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response.data,
          "Payment order created successfully"
        )
      );
  } catch (error) {
    console.error(
      "Cashfree Order Creation Error:",
      error.response?.data || error
    );
    throw new ApiError(500, "Failed to create payment order with Cashfree");
  }
});

// Verify payment status with Cashfree
export const verifyPayment = asyncHandler(async (req, res) => {
  const { order_id, appointmentId } = req.body;

  if (!order_id || !appointmentId) {
    throw new ApiError(400, "Missing required payment breakdown details");
  }

  const appointment = await Appointment.findById(appointmentId)
    .populate({
      path: "doctorId",
      populate: { path: "doctorId" }
    })
    .populate("patientId");

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  // IDOR check: Verify the appointment belongs to the logged in patient
  const patientIdStr = appointment.patientId._id ? appointment.patientId._id.toString() : appointment.patientId.toString();
  if (patientIdStr !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to verify payment for this appointment");
  }

  // Order binding verify
  if (!appointment.cashfreeOrderId || appointment.cashfreeOrderId !== order_id) {
    throw new ApiError(400, "Invalid payment order details for this appointment");
  }

  const cashfree = getCashfreeInstance();

  try {
    const response = await cashfree.PGFetchOrder(order_id);

    if (response.data.order_status !== "PAID") {
      appointment.paymentStatus = "FAILED";
      appointment.status = "CANCELLED";
      await appointment.save();

      // Free the Slot
      if (appointment.slotId) {
        await Slot.findByIdAndUpdate(appointment.slotId, {
          status: "AVAILABLE",
          bookedBy: null,
        });
      }

      throw new ApiError(
        400,
        "Payment verification failed. Order is not paid."
      );
    }

    // Payment is successful
    appointment.paymentStatus = "PAID";
    appointment.paymentMethod = "CASHFREE";
    appointment.status = "CONFIRMED"; // officially confirm it
    appointment.paidAt = new Date();
    appointment.cashfreeOrderId = order_id;

    await appointment.save();

    // Dispatch emails and stats using already populated objects (0 extra database hits!)
    const doctor = appointment.doctorId;
    if (doctor) {
      doctor
        .updateDoctorStats()
        .catch((err) => console.error("Stats Update Error:", err));

      try {
        const patientUser = appointment.patientId;
        const doctorUser = doctor.doctorId; // deep populated User model

        // Dispatch Patient Email in the background
        if (patientUser) {
          const patientNameEscaped = escapeHTML(patientUser.fullname);
          const doctorNameEscaped = escapeHTML(doctor.doctorDetails?.fullname || doctor.doctor);
          
          sendEmail({
            email: patientUser.email,
            subject: "Payment Received & Appointment Confirmed - MediCare",
            message: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                          <h1 style="color: #2563eb; text-align: center;">Appointment Confirmed! 🎉</h1>
                          <p style="font-size: 16px; color: #333;">Hi <strong>${patientNameEscaped}</strong>,</p>
                          <p style="font-size: 16px; color: #333;">Your payment was successful and your appointment has been confirmed! Here are your official booking details:</p>
                          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorNameEscaped}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${appointment.date.toDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointment.timeSlots}</p>
                            <p style="margin: 5px 0;"><strong>Consultation Fee:</strong> ₹${appointment.consultationFee} (PAID)</p>
                            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${escapeHTML(order_id)}</p>
                          </div>
                          <p style="font-size: 14px; color: #64748b; text-align: center;">Thank you for choosing MediCare!</p>
                        </div>`,
          }).catch(err => console.error("Failed to send patient confirmation email asynchronously:", err));
        }

        // Dispatch Doctor Email in the background
        if (doctorUser) {
          const doctorNameEscaped = escapeHTML(doctor.doctorDetails?.fullname || doctor.doctor);
          const patientNameEscaped = escapeHTML(patientUser?.fullname || "Patient");
          const reasonEscaped = escapeHTML(appointment.reason);

          sendEmail({
            email: doctorUser.email,
            subject: "Action Required: New Paid Patient Booking - MediCare",
            message: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                          <h1 style="color: #16a34a; text-align: center;">New Patient Scheduled! 🩺</h1>
                          <p style="font-size: 16px; color: #333;">Dr. <strong>${doctorNameEscaped}</strong>,</p>
                          <p style="font-size: 16px; color: #333;">Great news! A new patient has successfully booked and <b>PAID</b> for one of your available time slots.</p>
                          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0; color: #166534;"><strong>Patient Name:</strong> ${patientNameEscaped}</p>
                            <p style="margin: 5px 0; color: #166534;"><strong>Date:</strong> ${appointment.date.toDateString()}</p>
                            <p style="margin: 5px 0; color: #166534;"><strong>Time Slot:</strong> ${appointment.timeSlots}</p>
                            <p style="margin: 5px 0; color: #166534;"><strong>Reason for Visit:</strong> ${reasonEscaped}</p>
                          </div>
                        </div>`,
          }).catch(err => console.error("Failed to send doctor notification email asynchronously:", err));
        }
      } catch (emailError) {
        console.error("Email Dispatch Error After Payment:", emailError);
      }
    }

    return res
      .status(200)
      .json(new ApiResponse(200, appointment, "Payment verified successfully"));
  } catch (error) {
    console.error("Cashfree Fetch Order Error:", error.response?.data || error);
    throw new ApiError(500, "Failed to verify payment with Cashfree");
  }
});
