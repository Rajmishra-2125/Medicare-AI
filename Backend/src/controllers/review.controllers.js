import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Review } from "../models/review.models.js";
import { Appointment } from "../models/appointment.models.js"; // Ensure appointment is completed
import { Doctor } from "../models/doctor.models.js";

// Add a review
const addReview = asyncHandler(async (req, res) => {
  const { appointmentId, rating, comment } = req.body;
  const patientId = req.user?._id;

  if (!appointmentId || !rating) {
    throw new ApiError(400, "Appointment ID and Rating are required");
  }

  // 1. Verify Appointment (Matches to patient)
  // Strict Rule: Reviews only allowed on completed appointments
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId: patientId,
    status: "COMPLETED",
  });

  if (!appointment) {
    throw new ApiError(400, "Completed appointment not found or does not belong to you.");
  }

  // Check if appointment is already reviewed
  const existingReview = await Review.findOne({ appointmentId: appointmentId });
  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this appointment.");
  }

  // 2. Create Review
  // We map appointment.doctorId (Doctor Profile ID) to Review.doctorId
  const review = await Review.create({
    patientId,
    doctorId: appointment.doctorId,
    appointmentId,
    rating,
    comment,
    isApproved: true, // Auto-approve
  });

  // 3. Flag Appointment as correctly reviewed
  appointment.isReviewed = true;
  await appointment.save();

  // 4. Update Doctor's Stats (Ratings + Counts)
  const doctor = await Doctor.findById(appointment.doctorId);
  if (doctor) {
    await doctor.updateDoctorStats();
  }

  return res
    .status(201)
    .json(new ApiResponse(201, review, "Review added successfully"));
});

// Get reviews for a specific doctor
const getDoctorReviews = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!doctorId) {
    throw new ApiError(400, "Doctor ID is required");
  }

  // Use aggregations or simple find
  const reviews = await Review.find({ doctorId: doctorId })
    .populate("patientId", "fullName avatar") // Show reviwer details
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Review.countDocuments({ doctorId: doctorId });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { reviews, total, page, limit },
        "Reviews fetched successfully"
      )
    );
});

// Delete a review
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user?._id;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Allow deletion if User owns it (Patient)
  if (review.patientId.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this review");
  }

  await Review.findByIdAndDelete(reviewId);

  // Update rating
  const doctor = await Doctor.findById(review.doctorId);
  if (doctor) {
    await doctor.updateDoctorStats();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

export { addReview, getDoctorReviews, deleteReview };
