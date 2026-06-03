import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Doctor } from "../models/doctor.models.js";
import { Follow } from "../models/follow.models.js";
import { Appointment } from "../models/appointment.models.js";
import { generateDoctorId } from "../utils/idGenerators.js";
import { sendEmail } from "../utils/sendEmail.js";
import { prescriptionTemplate } from "../utils/emailTemplates.js";

const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.aggregate([
    {
      $match: {
        isVisible: true,
        isVerified: true
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "doctorId",
        foreignField: "_id",
        as: "doctorDetails",
        pipeline: [
          {
            $project: {
              fullname: 1,
              email: 1,
              username: 1,
              profileImage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        doctorDetails: {
          $first: "$doctorDetails",
        },
      },
    },
    {
      $match: {
        doctorDetails: { $exists: true },
        isVisible: true,
        isAcceptingNewPatients: true,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, doctors, "Doctors fetched successfully"));
});

const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  // Safely upsert the doctor profile. If they don't have one, it initializes with defaults.
  const doctorProfile = await Doctor.findOneAndUpdate(
    { doctorId: userId },
    {
      $setOnInsert: { doctorId: userId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const user = await User.findById(userId)
    .select("-password -refreshToken")
    .lean();

  // Aggregating the base user parameters with the Doctor explicit constraints
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...user,
        doctorInfo: doctorProfile,
      },
      "Doctor profile fetched successfully"
    )
  );
});

const updateDoctorProfile = asyncHandler(async (req, res) => {
  const {
    specialization,
    qualification,
    experience,
    consultationFee,
    clinicName,
    isVisible,
    isAcceptingNewPatients,
  } = req.body;

  if (
    !specialization ||
    !qualification ||
    !experience ||
    !consultationFee ||
    !clinicName
  ) {
    throw new ApiError(401, "invalid credentials");
  }

  const updateDoctorInfo = await Doctor.findOneAndUpdate(
    { doctorId: req.user?._id },
    {
      specialization: specialization,
      qualification: qualification,
      experience: experience,
      consultationFee: consultationFee,
      clinicName: clinicName,
      isVisible: isVisible,
      isAcceptingNewPatients: isAcceptingNewPatients,
    },
    {
      upsert: true,
      new: true,
    }
  ).setOptions({ includeInactive: true });

  if (!updateDoctorInfo) {
    throw new ApiError(401, "Doctor not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: updateDoctorInfo },
        "account details updated successfully"
      )
    );
});

const getDoctorsBySpecialization = asyncHandler(async (req, res) => {
  const { specialization } = req.params;

  if (!specialization) {
    throw new ApiError(404, "specilization is required");
  }

  const profile = await Doctor.aggregate([
    { $match: { specialization: specialization } },
    { $limit: 10 },
  ]);

  if (!profile) {
    throw new ApiError(404, "No doctors found for this specialization");
  }

  return res.status(200).json(new ApiResponse(200, profile, "Success"));
});

const getDoctorsByMostFollowers = asyncHandler(async (req, res) => {
  const { specialization } = req.params;

  if (!specialization) {
    throw new ApiError(400, "Specialization is required");
  }

  const sortingByFollowers = await Doctor.aggregate([
    {
      $match: {
        specialization: specialization,
      },
    },
    {
      $sort: {
        followersCount: -1,
      },
    },
    {
      $limit: 10,
    },
  ]);

  if (!sortingByFollowers) {
    throw new ApiError(404, "No doctors fonund");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: sortingByFollowers },
        "Top doctors by followers fetched successfully"
      )
    );
});

const getDoctorPatients = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (req.user.role !== "DOCTOR") {
    throw new ApiError(403, "Only doctors can access this route");
  }

  const doctorProfile = await Doctor.findOne({ doctorId: userId }).setOptions({
    includeInactive: true,
  });

  if (!doctorProfile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const patients = await Appointment.aggregate([
    { $match: { doctorId: doctorProfile._id } },
    {
      $group: {
        _id: "$patientId",
        lastVisit: { $max: "$date" },
        diagnoses: { $push: "$reason" },
        totalAppointments: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "patientDetails",
      },
    },
    { $unwind: "$patientDetails" },
    {
      $project: {
        _id: 1,
        lastVisit: 1,
        diagnoses: 1,
        totalAppointments: 1,
        name: "$patientDetails.fullname",
        email: "$patientDetails.email",
        phone: "$patientDetails.phone",
        age: "$patientDetails.age",
        gender: "$patientDetails.gender",
        profileImage: "$patientDetails.profileImage",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: patients },
        "Doctor patients fetched successfully"
      )
    );
});

const getDoctorPrescriptions = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (req.user.role !== "DOCTOR") {
    throw new ApiError(403, "Only doctors can access this route");
  }

  const doctorProfile = await Doctor.findOne({ doctorId: userId })
    .setOptions({
      includeInactive: true,
    })
    .lean();

  if (!doctorProfile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const prescriptions = await Appointment.find({
    doctorId: doctorProfile._id,
    "prescription.medications": { $exists: true, $not: { $size: 0 } },
  })
    .populate("patientId", "fullname email phone age gender")
    .sort({ date: -1 })
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { data: prescriptions },
        "Doctor prescriptions fetched successfully"
      )
    );
});

const emailPrescriptionController = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user?._id;

  const doctorProfile = await Doctor.findOne({ doctorId: userId }).setOptions({
    includeInactive: true,
  });
  if (!doctorProfile) throw new ApiError(404, "Doctor profile not found");

  const appointment = await Appointment.findById(appointmentId).populate(
    "patientId",
    "fullname email"
  );
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (appointment.doctorId.toString() !== doctorProfile._id.toString()) {
    throw new ApiError(403, "Not authorized to access this prescription");
  }

  if (
    !appointment.prescription ||
    !appointment.prescription.medications ||
    appointment.prescription.medications.length === 0
  ) {
    throw new ApiError(
      400,
      "No prescription generated for this appointment yet"
    );
  }

  const patientEmail = appointment.patientId.email;
  const patientName = appointment.patientId.fullname;

  const medsHtml = appointment.prescription.medications
    .map(
      (m) => `
    <li><strong>${m.name}</strong> - ${m.dosage || ""} (${m.frequency || ""})</li>
  `
    )
    .join("");

  const htmlMessage = prescriptionTemplate(
    patientName,
    doctorProfile.doctor,
    doctorProfile.clinicName,
    medsHtml,
    appointment.prescription.advice
  );

  await sendEmail({
    email: patientEmail,
    subject: `Your Prescription from Dr. ${doctorProfile.doctor}`,
    message: htmlMessage,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { success: true },
        "Prescription emailed successfully"
      )
    );
});

export {
  getDoctors,
  getMyProfile,
  updateDoctorProfile,
  getDoctorsBySpecialization,
  getDoctorsByMostFollowers,
  getDoctorPatients,
  getDoctorPrescriptions,
  emailPrescriptionController,
};
