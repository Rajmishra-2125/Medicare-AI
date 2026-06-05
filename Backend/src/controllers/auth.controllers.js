import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "crypto";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import mongoose, { set } from "mongoose";
import { Doctor } from "../models/doctor.models.js";
import { generatePatientId } from "../utils/idGenerators.js";
import { OAuth2Client } from "google-auth-library";
import { escapeHTML } from "../utils/sanitize.js";
import { createUserAccount } from "../services/userService.js";
import { sendEmail } from "../utils/sendEmail.js";
import { OTP } from "../models/otp.models.js";
import { Session } from "../models/session.models.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Dynamic cookie options builder resolving HTTP vs HTTPS environments
export const getCookieOptions = (req) => {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

// Generate Access and Refresh Token
export const generateAccessAndRefreshToken = async (userId, req = null) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Legacy support: save on User model
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Store in Session model if req is provided
    if (req) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await Session.create({
        userId: user._id,
        refreshToken,
        deviceInfo: {
          userAgent: req.headers["user-agent"] || "",
          ipAddress: req.ip || req.socket?.remoteAddress || "",
          device: "",
          os: "",
          browser: "",
        },
        expiresAt,
        isActive: true,
      });
    }

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

// Register new user
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, gender, password, phone, DOB } = req.body;

  if (!fullname || !email || !gender || !password || !phone || !DOB) {
    throw new ApiError(400, "All fields are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existeduser = await User.findOne({
    email: normalizedEmail,
  }).select("_id");

  if (existeduser) {
    throw new ApiError(409, "user already exists.");
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

    await OTP.deleteOne({ email: normalizedEmail });

    await OTP.create({
      email: normalizedEmail,
      otp,
    });

    // Send email asynchronously
    try {
      await sendEmail({
        email: normalizedEmail,
        subject: "MediCare - Verify Your Email",
        message: `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
      <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <div style="background:#2563eb; padding:25px; text-align:center;">
          <img 
            src="https://cdn-icons-png.flaticon.com/128/15753/15753044.png"
            alt="MediCare Logo"
            width="60"
            height="60"
            style="display:block; margin:0 auto 10px auto;"
          />
          <h1 style="color:white; margin:0;">MediCare</h1>
        </div>

        <div style="padding:30px;">
          <h2 style="color:#333;">Verify Your Email</h2>

          <p style="color:#555;">
            Welcome to <strong>MediCare</strong> 👋
          </p>

          <p style="color:#555;">
            Use the OTP below to verify your account:
          </p>

          <div style="text-align:center; margin:30px 0;">
            <div style="
              display:inline-block;
              padding:15px 25px;
              font-size:28px;
              letter-spacing:6px;
              font-weight:bold;
              background:#f1f5f9;
              border-radius:8px;
              border:1px dashed #2563eb;
              color:#2563eb;
              user-select:all;
            ">
              ${otp}
            </div>
          </div>

          <div style="text-align:center; margin-bottom:20px;">
            <a 
              href="mailto:?subject=MediCare OTP&body=Your OTP is ${otp}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#2563eb;
                color:white;
                text-decoration:none;
                border-radius:6px;
                font-size:14px;
                font-weight:600;
              "
            >
              📋 Copy OTP
            </a>
          </div>

          <p style="color:#777; font-size:14px;">
            This OTP expires in <strong>10 minutes</strong>.
          </p>

          <hr style="margin:30px 0; border:none; border-top:1px solid #eee;" />

          <p style="text-align:center; color:#999; font-size:12px;">
            © ${new Date().getFullYear()} MediCare. All rights reserved.
          </p>

        </div>
      </div>
    </div>
    `,
      });
    } catch (emailError) {
      console.log("Failed to send OTP email", emailError);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { email: normalizedEmail, isOTP: true },
          "OTP sent successfully. Please verify to complete registration."
        )
      );
  } catch (error) {
    console.log("OTP creation error", error);

    throw new ApiError(
      500,
      `Failed to send OTP: ${error?.message || "Something went wrong"}`
    );
  }
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  // validation

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "invalid password");
  }

  if (!user.isEmailVerified && user.authProvider === "LOCAL") {
    throw new ApiError(
      403,
      "Please verify your email address before logging in. Check your inbox for the OTP."
    );
  }

  if (user.isTwoFactorEnabled) {
    const twoFactorToken = jwt.sign(
      { _id: user._id, is2FA: true },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { twoFactorToken, is2FA: true, userId: user._id },
          "Two-Factor Authentication code is required to complete login."
        )
      );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
    req
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = getCookieOptions(req);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User loggedIn successfully"
      )
    );
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id).select("+refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Verify session in database (standard or grace period check)
    let activeSession = await Session.findOne({
      refreshToken: incomingRefreshToken,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    let isGracePeriod = false;

    if (!activeSession) {
      // Fallback: Check if it matches an old refresh token rotated recently (within 20s)
      const graceThreshold = new Date(Date.now() - 20000); // 20 seconds
      activeSession = await Session.findOne({
        oldRefreshToken: incomingRefreshToken,
        isActive: true,
        rotatedAt: { $gt: graceThreshold },
        expiresAt: { $gt: new Date() },
      });
      if (activeSession) {
        isGracePeriod = true;
      }
    }

    if (!activeSession) {
      throw new ApiError(401, "Session expired or invalid");
    }

    const options = getCookieOptions(req);
    let accessToken;
    let refreshToken;

    if (isGracePeriod) {
      // Concurrent request within grace period: reuse the already rotated refresh token
      refreshToken = activeSession.refreshToken;
      accessToken = user.generateAccessToken();
    } else {
      // Standard rotation: generate fresh tokens
      accessToken = user.generateAccessToken();
      refreshToken = user.generateRefreshToken();

      // Rotate within the same session instead of deleting it
      activeSession.oldRefreshToken = incomingRefreshToken;
      activeSession.refreshToken = refreshToken;
      activeSession.rotatedAt = new Date();
      activeSession.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      activeSession.lastUsedAt = new Date();
      await activeSession.save();

      // Legacy compatibility: save on User model
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
    }

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, { accessToken }, "access token is refreshed"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Google Auth
const googleAuthLogin = asyncHandler(async (req, res) => {
  const { googleToken } = req.body;

  if (!googleToken) {
    throw new ApiError(400, "Google token is required");
  }

  try {
    let email, name, picture, googleId;

    try {
      // First try to verify as an ID token (JWT)
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) throw new Error("Invalid Google token payload");

      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } catch (idTokenError) {
      // If it fails, assume it's an access_token (from useGoogleLogin hook)
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${googleToken}` },
          }
        );

        if (!response.ok) {
          throw new Error("Invalid Google token");
        }

        const data = await response.json();
        email = data.email;
        name = data.name;
        picture = data.picture;
        googleId = data.sub;
      } catch (accessTokenError) {
        throw new Error(
          "Failed to authenticate with Google: " + accessTokenError.message
        );
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user) {
      user = await createUserAccount({
        fullname: name,
        email: normalizedEmail,
        authProvider: "GOOGLE",
        googleId,
        profileImage: picture || "",
        isEmailVerified: true,
      });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
      req
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = getCookieOptions(req);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken },
          "Google OAuth login successful"
        )
      );
  } catch (error) {
    console.log("Google Auth Error:", error);
    throw new ApiError(401, error?.message || "Invalid Google token");
  }
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (incomingRefreshToken) {
    await Session.deleteOne({ refreshToken: incomingRefreshToken });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });

  const options = getCookieOptions(req);

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User loggedOut successfully"));
});

// Verify Email OTP and Create User
const verifyEmailOTP = asyncHandler(async (req, res) => {
  const { fullname, email, gender, password, phone, DOB, otp } = req.body;

  if (!email || !otp) {
    console.log("verifyEmailOTP failed: Missing email or otp");
    throw new ApiError(400, "Email and OTP are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find OTP record
  const otpRecord = await OTP.findOne({ email: normalizedEmail });

  if (!otpRecord) {
    console.log(
      "verifyEmailOTP failed: No OTP record found for",
      normalizedEmail
    );
    throw new ApiError(
      400,
      "OTP has expired or is invalid. Please request a new one."
    );
  }

  if (otpRecord.otp !== otp) {
    console.log("verifyEmailOTP failed: OTP mismatch");
    throw new ApiError(400, "Invalid Incorrect OTP");
  }

  // Delete OTP once verified
  await OTP.deleteOne({ email: normalizedEmail });

  let user;

  try {
    const escapedName = escapeHTML(fullname);

    user = await createUserAccount({
      fullname: escapedName,
      email: normalizedEmail,
      gender,
      password,
      phone,
      dateOfBirth: DOB,
      isEmailVerified: true,
    });

    // Send Welcome Email asynchronously
    try {
      await sendEmail({
        email: normalizedEmail,
        subject: "Welcome to MediCare!",
        message: `<h1>Your Account is Verified!</h1>
                  <p>Hi ${escapedName}, welcome to MediCare. You can now book appointments and manage your health seamlessly.</p>`,
      });
    } catch (welcomeErr) {
      console.log("Failed to send welcome email", welcomeErr);
    }
  } catch (error) {
    console.error("CRITICAL ERROR IN USER CREATION:", error);
    throw new ApiError(
      400,
      `User Creation Failed: ${error?.message || "Something went wrong"}`
    );
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
    req
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = getCookieOptions(req);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "Email verified and login successful"
      )
    );
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({
    email: normalizedEmail,
    authProvider: "LOCAL",
  });

  if (!user) {
    throw new ApiError(
      404,
      "No account found with this email, or the account was registered via Google."
    );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 mins

  user.resetPasswordToken = passwordResetToken;
  user.resetPasswordExpires = passwordResetExpires;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  const message = `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
      <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#2563eb; padding:25px; text-align:center;">
          <h1 style="color:white; margin:0;">MediCare</h1>
        </div>
        <div style="padding:30px;">
          <h2 style="color:#333;">Password Reset Request</h2>
          <p style="color:#555;">You requested a password reset. Please click the button below to reset your password. This link is valid for 15 minutes.</p>
          <div style="text-align:center; margin:30px 0;">
            <a href="${resetUrl}" style="display:inline-block; padding:12px 20px; background:#2563eb; color:white; text-decoration:none; border-radius:6px; font-weight:600;">Reset Password</a>
          </div>
          <p style="color:#777; font-size:14px;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "MediCare - Password Reset",
      message,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "If that email is registered, we have sent a password reset link."
        )
      );
  } catch (error) {
    console.error("Nodemailer Error: ", error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Error sending email. Please try again later.");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) throw new ApiError(400, "New password is required");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successful. You can now log in."
      )
    );
});

// Exporting all controller functions
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  googleAuthLogin,
  verifyEmailOTP,
  forgotPassword,
  resetPassword,
};
