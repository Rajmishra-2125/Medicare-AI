import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },
    oldRefreshToken: {
      type: String,
      index: true,
    },
    rotatedAt: {
      type: Date,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      device: String,
      os: String,
      browser: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Session =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);

export { Session };
