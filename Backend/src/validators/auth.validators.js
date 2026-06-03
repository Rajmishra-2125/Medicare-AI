import { z } from "zod";

export const registerSchema = {
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(30),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullname: z.string().min(2, "Fullname must be at least 2 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
};

export const login2FASchema = {
  body: z.object({
    code: z.string().min(6, "Verification code must be 6 digits").max(6),
    twoFactorToken: z.string().min(1, "Two-factor token is required"),
  }),
};

export const verifyOTPSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().min(6, "OTP must be 6 digits").max(6),
    fullname: z.string().min(2, "Fullname must be at least 2 characters").optional(),
    gender: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    phone: z.string().optional(),
    DOB: z.string().optional(),
  }),
};

export const googleAuthSchema = {
  body: z.object({
    googleToken: z.string().min(1, "Google token is required"),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
};

export const resetPasswordSchema = {
  params: z.object({
    token: z.string().min(1, "Token is required"),
  }),
  body: z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
};
