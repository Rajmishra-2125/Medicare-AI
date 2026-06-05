import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters long"],
      maxlength: [50, "Full name must be at most 50 characters long"],
    },
    patientId: {
      type: String,
      unique: true,
      sparse: true, // allow null values for Doctor and Admin
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "LOCAL";
      },
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // important for security
    },
    authProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE"],
      default: "LOCAL",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["PATIENT", "DOCTOR", "ADMIN"],
      default: "PATIENT",
      required: true,
      index: true,
    },
    profileImage: {
      type: String, // cloudinary URL
      default: "",
    },
    phone: {
      type: String,
      required: function () {
        return this.authProvider === "LOCAL";
      },
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please provide a valid phone number"],
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // account status and management fields
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "PENDING_DELETION", "SUSPENDED", "BANNED", "DELETED"],
      default: "ACTIVE",
      index: true,
    },
    deletionScheduledAt: {
      type: Date,
      default: null,
    },
    deletionExecutionDate: {
      type: Date,
      default: null,
    },
    deletionReason: {
      type: String,
      default: null,
    },
    // Two-Factor Authentication fields
    twoFactorSecret: {
      type: String,
      select: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    // Authentication tokens
    refreshToken: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hashing password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Instance method to compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate JWT tokens
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Automaticaly filter out inactive users on find queries
userSchema.pre(/^find/, function () {
  if (!this.getOptions().includeInactive) {
    this.find({ isActive: true });
  }
});

// Virtual for full Address
userSchema.virtual("fullAddress").get(function () {
  if (!this.address) return null;

  const { street, city, state, zipCode, country } = this.address;
  return `${street ? street + ", " : ""}${city ? city + ", " : ""}${state ? state + ", " : ""}${zipCode ? zipCode + ", " : ""}${country || ""}`;
});

import { invalidateCachePattern } from "../middlewares/cache.middleware.js";

userSchema.post("save", async function () {
  try {
    await Promise.all([
      invalidateCachePattern("admin:users:*"),
      invalidateCachePattern("admin:dashboard:*"),
      invalidateCachePattern("admin:doctors:*"),
    ]);
  } catch (err) {
    console.error("Failed to invalidate caches on user save:", err);
  }
});

userSchema.post(/^findOneAnd/, async function () {
  try {
    await Promise.all([
      invalidateCachePattern("admin:users:*"),
      invalidateCachePattern("admin:dashboard:*"),
      invalidateCachePattern("admin:doctors:*"),
    ]);
  } catch (err) {
    console.error("Failed to invalidate caches on user update:", err);
  }
});

export const User = mongoose.model("User", userSchema);
