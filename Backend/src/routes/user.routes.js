import { Router } from "express";
import {
  getCurrentUser,
  updateAccountDetails,
  updateAddressDetails,
  updateUserAvatar,
  changeCurrentPassword,
  deleteAccount,
  recoverDeletedAccount,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

import rateLimit from "express-rate-limit";

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 attempts per 15 minutes
  message: {
    statusCode: 429,
    success: false,
    message: "Too many recovery attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// secured routes

// Get current user details
router.route("/current-user").get(verifyJWT, getCurrentUser);

// Update account details
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
router.route("/update-account-address").patch(verifyJWT, updateAddressDetails);

// Update user avatar
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// Change current password
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

// Delete user account
router.route("/delete-account").delete(verifyJWT, deleteAccount);

// Recover user account
router.route("/recover-account").post(sensitiveLimiter, recoverDeletedAccount);

export default router;
