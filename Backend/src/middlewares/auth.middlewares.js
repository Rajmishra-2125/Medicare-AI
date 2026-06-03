import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { Session } from "../models/session.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  let token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (token) {
    try {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      // Access token expired or invalid, proceed to try automatic refresh below
    }
  }

  // Silent Auto-Refresh using HttpOnly secure refreshToken cookie
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (incomingRefreshToken) {
    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(decodedToken?._id).select("+refreshToken");

      // Verify session in database
      const activeSession = await Session.findOne({
        refreshToken: incomingRefreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (user && activeSession) {
        // Generate fresh new tokens
        const accessTokenObj = user.generateAccessToken();
        const refreshTokenObj = user.generateRefreshToken();

        // Rotate the session in the database
        activeSession.refreshToken = refreshTokenObj;
        activeSession.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        activeSession.lastUsedAt = new Date();
        await activeSession.save();

        // Legacy compatibility: save on User model
        user.refreshToken = refreshTokenObj;
        await user.save({ validateBeforeSave: false });

        // Set secure HttpOnly cookies (localhost-aware)
        const isLocalhost = req.get("host")?.includes("localhost") || req.get("host")?.includes("127.0.0.1");
        const options = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" && !isLocalhost,
          sameSite: process.env.NODE_ENV === "production" && !isLocalhost ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        };

        res.cookie("accessToken", accessTokenObj, options);
        res.cookie("refreshToken", refreshTokenObj, options);

        req.user = await User.findById(user._id).select(
          "-password -refreshToken"
        );
        return next();
      }
    } catch (refreshError) {
      // Refresh token expired or compromised
    }
  }

  // If both access token and refresh token fail, the user is completely unauthorized
  throw new ApiError(401, "Unauthorized");
});
