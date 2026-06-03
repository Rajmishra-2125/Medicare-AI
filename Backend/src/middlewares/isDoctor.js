import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const isDoctor = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request");
  }

  if (req.user.role !== "DOCTOR") {
    throw new ApiError(403, "Forbidden: Only doctors can access this resource");
  }

  next();
});
