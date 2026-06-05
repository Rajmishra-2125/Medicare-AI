import mongoose, { Schema } from "mongoose";

const slotSchema = new Schema(
  {
    slotNumber: {
      type: String,
      required: true,
      index: 1,
    },
    doctor: {
      type: String,
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    slotduration: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "BOOKED"],
      default: "AVAILABLE",
      index: true,
    },
    bookedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

slotSchema.index(
  {
    doctorId: 1,
    date: 1,
    startTime: 1,
  },
  { unique: true }
);

// Optimize availability queries
slotSchema.index({ doctorId: 1, status: 1, date: 1 });

import { invalidateCachePattern } from "../middlewares/cache.middleware.js";

slotSchema.post("save", async function (doc) {
  if (doc && doc.doctorId) {
    invalidateCachePattern(`slots:${doc.doctorId.toString()}:*`).catch((err) =>
      console.error("Failed to invalidate slots cache on post-save:", err)
    );
    invalidateCachePattern("admin:slots:*").catch((err) =>
      console.error("Failed to invalidate admin slots cache on post-save:", err)
    );
  }
});

slotSchema.post(/^findOneAnd/, async function (doc) {
  if (doc && doc.doctorId) {
    invalidateCachePattern(`slots:${doc.doctorId.toString()}:*`).catch((err) =>
      console.error("Failed to invalidate slots cache on post-query:", err)
    );
    invalidateCachePattern("admin:slots:*").catch((err) =>
      console.error(
        "Failed to invalidate admin slots cache on post-query:",
        err
      )
    );
  }
});

export const Slot = mongoose.model("Slot", slotSchema);
