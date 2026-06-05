import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
    },
    slotNumber: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Appointment date is required"],
      index: true,
    },
    timeSlots: {
      type: String,
      required: [true, "Time slot is required"],
    },
    status: {
      type: String,
      enum: [
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
        "PENDING",
        "RESCHEDULED",
        "NO_SHOW",
      ],
      default: "PENDING",
      index: true,
    },
    reason: {
      type: String,
      required: [true, "Reason for appointment is required"],
      maxlength: [500, "Reason cannot exceed 500 characters"],
    },
    symptoms: {
      type: [String],
      default: [],
    },

    // Cancellation Information
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Rescheduling Information
    rescheduleFrom: {
      date: Date,
      timeSlots: String,
    },
    reschedulingHistory: [
      {
        fromDate: Date,
        fromTimeSlots: String,
        toDate: Date,
        toTimeSlots: String,
        rescheduledAt: Date,
        reason: String,
        rescheduledBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    rescheduleAt: {
      type: Date,
      default: null,
    },
    rescheduleReason: {
      type: String,
      default: null,
    },

    // Payment Information
    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: [
        "CREDIT_CARD",
        "DEBIT_CARD",
        "UPI",
        "WALLET",
        "CASH",
        "RAZORPAY",
        "CASHFREE",
      ],
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    cashfreeOrderId: {
      type: String,
      index: true,
    },
    cashfreeSessionId: {
      type: String,
      index: true,
    },
    paidAt: {
      type: Date,
    },

    // Prescription Information & Notes
    prescription: {
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
          instructions: String,
        },
      ],
      tests: [
        {
          name: String,
          instructions: String,
        },
      ],
      advice: String,
      followUpDate: Date,
      expiryDate: Date,
      refillsRemaining: {
        type: Number,
        default: 0,
      },
      pharmacyDetails: {
        name: String,
        phone: String,
        address: String,
      },
    },
    doctorNotes: {
      type: String,
      maxlength: [1000, "Doctor notes cannot exceed 1000 characters"],
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },

    // Meeting Information(for online appointments)
    meetingLink: {
      type: String,
    },
    meetingType: {
      type: String,
      enum: ["IN_PERSON", "ONLINE", "PHONE"],
    },
    meetingPassword: {
      type: String,
    },

    // creation timestamp
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ date: 1, timeSlots: 1 });

// Prevent double booking for the same doctor at the same date and time slot
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlots: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["CONFIRMED", "PENDING", "RESCHEDULED"] },
    },
  }
);

import { invalidateCachePattern } from "../middlewares/cache.middleware.js";

appointmentSchema.post("save", async function () {
  try {
    await Promise.all([
      invalidateCachePattern("doctor:analytics:*"),
      invalidateCachePattern("doctor:appointments:*"),
      invalidateCachePattern("doctor:patients:*"),
      invalidateCachePattern("doctor:prescriptions:*"),
      invalidateCachePattern("patient:appointments:*"),
      invalidateCachePattern("admin:appointments:*"),
      invalidateCachePattern("admin:dashboard:*"),
      invalidateCachePattern("admin:slots:*"),
    ]);
  } catch (err) {
    console.error("Failed to invalidate caches on appointment save:", err);
  }
});

appointmentSchema.post(/^findOneAnd/, async function () {
  try {
    await Promise.all([
      invalidateCachePattern("doctor:analytics:*"),
      invalidateCachePattern("doctor:appointments:*"),
      invalidateCachePattern("doctor:patients:*"),
      invalidateCachePattern("doctor:prescriptions:*"),
      invalidateCachePattern("patient:appointments:*"),
      invalidateCachePattern("admin:appointments:*"),
      invalidateCachePattern("admin:dashboard:*"),
      invalidateCachePattern("admin:slots:*"),
    ]);
  } catch (err) {
    console.error("Failed to invalidate caches on appointment update:", err);
  }
});

export const Appointment = mongoose.model("Appointment", appointmentSchema);
