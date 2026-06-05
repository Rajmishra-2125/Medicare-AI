import { generateSecret, generateURI, verifySync } from "otplib";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateAccessAndRefreshToken } from "./auth.controllers.js";

// Backwards-compatible wrapper for modern functional otplib
const authenticator = {
  generateSecret() {
    return generateSecret();
  },
  keyuri(email, serviceName, secret) {
    return generateURI({ label: email, issuer: serviceName, secret });
  },
  verify({ token, secret }) {
    const result = verifySync({ token, secret });
    return result && result.valid === true;
  },
};

// Helper to generate cookies options
const getCookieOptions = (req) => {
  const isLocalhost =
    req.get("host")?.includes("localhost") ||
    req.get("host")?.includes("127.0.0.1");
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !isLocalhost,
    sameSite:
      process.env.NODE_ENV === "production" && !isLocalhost ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

/**
 * Initiates 2FA setup by generating a new secret and QR code.
 */
export const setup2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isTwoFactorEnabled) {
    throw new ApiError(400, "Two-Factor Authentication is already enabled");
  }

  const secret = authenticator.generateSecret();
  const serviceName = "MediCare Hospital";
  const otpauthUrl = authenticator.keyuri(user.email, serviceName, secret);

  const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);

  // Store temporary secret until verified
  user.twoFactorSecret = secret;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { secret, qrCode: qrCodeUrl },
        "2FA setup initiated. Please verify with a code."
      )
    );
});

/**
 * Verifies and enables 2FA for the user.
 */
export const verify2FA = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError(400, "TOTP Code is required");
  }

  // Explicitly fetch twoFactorSecret since it is not selected by default
  const user = await User.findById(req.user._id).select("+twoFactorSecret");

  if (!user || !user.twoFactorSecret) {
    throw new ApiError(400, "2FA setup has not been initiated");
  }

  const isVerified = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isVerified) {
    throw new ApiError(400, "Invalid TOTP verification code. Try again.");
  }

  user.isTwoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isTwoFactorEnabled: true },
        "Two-Factor Authentication enabled successfully"
      )
    );
});

/**
 * Disables 2FA authentication.
 */
export const disable2FA = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError(400, "TOTP Code is required to disable 2FA");
  }

  const user = await User.findById(req.user._id).select("+twoFactorSecret");

  if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
    throw new ApiError(400, "2FA is not enabled on this account");
  }

  const isVerified = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isVerified) {
    throw new ApiError(400, "Invalid verification code. 2FA remains active.");
  }

  user.isTwoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isTwoFactorEnabled: false },
        "Two-Factor Authentication disabled successfully"
      )
    );
});

/**
 * Completes login by verifying the TOTP code.
 */
export const login2FA = asyncHandler(async (req, res) => {
  const { code, twoFactorToken } = req.body;

  if (!code || !twoFactorToken) {
    throw new ApiError(400, "TOTP Code and 2FA Validation Token are required");
  }

  try {
    const decoded = jwt.verify(twoFactorToken, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded.is2FA) {
      throw new ApiError(400, "Invalid 2FA Validation Token");
    }

    const user = await User.findById(decoded._id).select("+twoFactorSecret");

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new ApiError(
        400,
        "Two-Factor Authentication is not active on this account"
      );
    }

    const isVerified = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isVerified) {
      throw new ApiError(400, "Invalid TOTP verification code. Try again.");
    }

    // Auth is successful, generate real login tokens
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
          "Two-Factor Authentication successful. Login completed."
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error.message || "Invalid or expired 2FA validation session"
    );
  }
});
