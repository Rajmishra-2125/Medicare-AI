import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  googleAuthLogin,
  verifyEmailOTP,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controllers.js";
import {
  setup2FA,
  verify2FA,
  disable2FA,
  login2FA,
} from "../controllers/twoFactor.controllers.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  login2FASchema,
  verifyOTPSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from "../validators/auth.validators.js";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new patient or doctor
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullname
 *               - phone
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullname:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [PATIENT, DOCTOR, ADMIN]
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User registered successfully.
 *
 * /auth/login:
 *   post:
 *     summary: Login user and return credentials
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful.
 *
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access and refresh tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 */

// Register new user
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxcount: 1,
    },
  ]),
  validateSchema(registerSchema),
  registerUser
);

// Login user
router.route("/login").post(validateSchema(loginSchema), loginUser);
router.route("/2fa/login").post(validateSchema(login2FASchema), login2FA);

// Google OAuth Login
router.route("/google").post(validateSchema(googleAuthSchema), googleAuthLogin);

// Verify OTP
router.route("/verify-otp").post(upload.none(), validateSchema(verifyOTPSchema), verifyEmailOTP);

// Refresh access token
router.route("/refresh-token")
  .get(refreshAccessToken)
  .post(validateSchema(refreshTokenSchema), refreshAccessToken);

// <=> Secured routes <=>

// Logout user
router.route("/logout").post(verifyJWT, logoutUser);

// Get new refresh token
router.route("/refresh-tokens").get(verifyJWT, refreshAccessToken);

// Two-Factor Authentication routes
router.route("/2fa/setup").post(verifyJWT, setup2FA);
router.route("/2fa/verify").post(verifyJWT, verify2FA);
router.route("/2fa/disable").post(verifyJWT, disable2FA);

// Password Reset
router.route("/forgot-password").post(validateSchema(forgotPasswordSchema), forgotPassword);
router.route("/reset-password/:token").post(validateSchema(resetPasswordSchema), resetPassword);

// Exporting all routes
export default router;
