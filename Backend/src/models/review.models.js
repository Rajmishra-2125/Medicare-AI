import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
  {
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
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
      trim: true,
    },

    // Review categories(optional detailed ratings)
    ratings: {
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      punctuality: {
        type: Number,
        min: 1,
        max: 5,
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
      },
    },

    // Moderation fields
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes - One review per patient per doctor per appointment
reviewSchema.index(
  { patientId: 1, doctorId: 1, appointmentId: 1 },
  { unique: true }
);
reviewSchema.index({ doctorId: 1, rating: -1 });

// Only fetch approved and non-deleted reviews by default
reviewSchema.pre(/^find/, function () {
  if (!this.getOptions().includeUnapproved) {
    this.find({ isApproved: true, isDeleted: false });
  }
});

import { invalidateCachePattern } from "../middlewares/cache.middleware.js";

reviewSchema.post("save", async function () {
  try {
    await Promise.all([
      invalidateCachePattern("doctors:*"),
      invalidateCachePattern("doctor:analytics:*"),
    ]);
  } catch (err) {
    console.error("Failed to invalidate caches on review save:", err);
  }
});

reviewSchema.post(/^findOneAnd/, async function () {
  try {
    await Promise.all([
      invalidateCachePattern("doctors:*"),
      invalidateCachePattern("doctor:analytics:*"),
    ]);
  } catch (err) {
    console.error("Failed to invalidate caches on review update:", err);
  }
});

export const Review = mongoose.model("Review", reviewSchema);
