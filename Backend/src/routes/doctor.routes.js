import { Router } from "express";
import {
  getDoctors,
  getMyProfile,
  updateDoctorProfile,
  getDoctorsBySpecialization,
  getDoctorsByMostFollowers,
  getDoctorPatients,
  getDoctorPrescriptions,
  emailPrescriptionController,
} from "../controllers/doctor.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { isDoctor } from "../middlewares/isDoctor.js";
import { isPatient } from "../middlewares/isPatient.js";

import { cacheMiddleware } from "../middlewares/cache.middleware.js";
import { searchDoctors } from "../controllers/doctorSearch.controllers.js";
import { getDoctorAnalytics } from "../controllers/doctorAnalytics.controllers.js";

const router = Router();

/**
 * @openapi
 * /doctors/profiles:
 *   get:
 *     summary: Retrieve list of all registered doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: List of doctors returned successfully.
 *
 * /doctors/my-profile:
 *   get:
 *     summary: Retrieve logged-in doctor profile details
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile returned successfully.
 */

// Get explicit current doctor profile
router
  .route("/my-profile")
  .get(verifyJWT, cacheMiddleware("doctor:profile", 300), getMyProfile);

// Get doctor stats and earnings metrics
router
  .route("/analytics")
  .get(verifyJWT, cacheMiddleware("doctor:analytics", 300), getDoctorAnalytics);

// Update doctor profile
router.route("/updateInfo").patch(verifyJWT, isDoctor, updateDoctorProfile);

// Advanced search route
router.route("/search").get(searchDoctors);

// Geting normal doctors list
router
  .route("/profiles")
  .get(cacheMiddleware("doctors:profiles", 3600), getDoctors);

// Get doctors availability by Specilization
router
  .route("/:specialization")
  .post(
    verifyJWT,
    cacheMiddleware("doctors:specialization", 3600),
    getDoctorsBySpecialization
  );

// Get doctors availability by Specilization and followers
router
  .route("/:specialization/mostfollowers")
  .post(
    verifyJWT,
    cacheMiddleware("doctors:followers", 3600),
    getDoctorsByMostFollowers
  );

// Get doctor's patients
router
  .route("/patients")
  .get(verifyJWT, cacheMiddleware("doctor:patients", 300), getDoctorPatients);

// Get doctor's prescriptions
router
  .route("/prescriptions")
  .get(
    verifyJWT,
    cacheMiddleware("doctor:prescriptions", 300),
    getDoctorPrescriptions
  );

// Email prescription
router
  .route("/send-prescription/:appointmentId")
  .post(verifyJWT, emailPrescriptionController);

export default router;
