import mongoose from "mongoose";
import { Doctor } from "../models/doctor.models.js";
import { Appointment } from "../models/appointment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Aggregates and returns detailed performance, revenue, and satisfaction statistics for the logged-in doctor.
 */
export const getDoctorAnalytics = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ doctorId: req.user._id });

  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found for this account.");
  }

  const doctorIdObj = doctor._id;

  // 1. Aggregate Appointment Status Counts
  const statusStats = await Appointment.aggregate([
    { $match: { doctorId: doctorIdObj } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const formattedStatusStats = {
    CONFIRMED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
    PENDING: 0,
    RESCHEDULED: 0,
    NO_SHOW: 0,
  };

  statusStats.forEach((stat) => {
    if (formattedStatusStats[stat._id] !== undefined) {
      formattedStatusStats[stat._id] = stat.count;
    }
  });

  // 2. Aggregate Monthly Revenue (Past 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1); // Set to start of month
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const revenueStats = await Appointment.aggregate([
    {
      $match: {
        doctorId: doctorIdObj,
        paymentStatus: "PAID",
        paidAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$paidAt" },
          month: { $month: "$paidAt" },
        },
        revenue: { $sum: "$consultationFee" },
        bookings: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Generate continuous list of past 6 months to ensure zero-revenue months are represented
  const monthsList = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    monthsList.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      monthName: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      revenue: 0,
      bookings: 0,
    });
  }

  revenueStats.forEach((stat) => {
    const matchingMonth = monthsList.find(
      (m) => m.year === stat._id.year && m.month === stat._id.month
    );
    if (matchingMonth) {
      matchingMonth.revenue = stat.revenue;
      matchingMonth.bookings = stat.bookings;
    }
  });

  // 3. Overall Performance Indicators
  const appointmentCompletionRate =
    doctor.totalAppointments > 0
      ? Math.round(
          (doctor.completedAppointments / doctor.totalAppointments) * 100
        )
      : 0;

  const analyticsData = {
    overview: {
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
      totalAppointments: doctor.totalAppointments,
      completedAppointments: doctor.completedAppointments,
      canceledAppointments: doctor.canceledAppointments,
      completionRate: appointmentCompletionRate,
      followersCount: doctor.followersCount,
    },
    statusDistribution: Object.keys(formattedStatusStats).map((key) => ({
      status: key,
      value: formattedStatusStats[key],
    })),
    monthlyRevenue: monthsList.map((m) => ({
      month: m.monthName,
      revenue: m.revenue,
      bookings: m.bookings,
    })),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        analyticsData,
        "Doctor dashboard analytics aggregated successfully."
      )
    );
});
