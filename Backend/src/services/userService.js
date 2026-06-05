import { User } from "../models/user.models.js";
import { generatePatientId } from "../utils/idGenerators.js";

/**
 * Creates a new Patient account, generates a custom patient ID, and saves to MongoDB.
 * Ensures DRY principles are strictly followed between Google Auth and Local Register verification.
 *
 * @param {object} userData - Details of the patient user to create.
 * @returns {Promise<object>} The created Mongoose User object.
 */
export const createUserAccount = async (userData) => {
  const {
    fullname,
    email,
    gender,
    password,
    phone,
    dateOfBirth,
    authProvider = "LOCAL",
    googleId,
    profileImage,
    isEmailVerified = false,
  } = userData;

  const patientId = await generatePatientId();

  return await User.create({
    fullname,
    email,
    gender,
    password,
    patientId,
    role: "PATIENT",
    phone,
    dateOfBirth,
    authProvider,
    googleId,
    profileImage,
    isEmailVerified,
  });
};
