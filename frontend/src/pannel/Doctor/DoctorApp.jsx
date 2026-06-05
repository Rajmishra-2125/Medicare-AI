import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Lazy Loaded Doctor Panel Pages
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard.jsx"));
const ManagePatients = lazy(() => import("./pages/ManagePatients.jsx"));
const ManagePrescriptions = lazy(() => import("./pages/ManagePrescriptions.jsx"));
const DoctorAppointments = lazy(() => import("./pages/DoctorAppointments.jsx"));
const OnlineSessions = lazy(() => import("./pages/OnlineSessions.jsx"));
const DoctorProfile = lazy(() => import("./pages/DoctorProfile.jsx"));
const DoctorSettings = lazy(() => import("./pages/DoctorSettings.jsx"));

const DoctorApp = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <Routes>
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="online-sessions" element={<OnlineSessions />} />
        <Route path="appointments" element={<DoctorAppointments />} />
      <Route path="patients" element={<ManagePatients />} />
      <Route path="prescriptions" element={<ManagePrescriptions />} />
      <Route path="profile" element={<DoctorProfile />} />
      <Route path="settings" element={<DoctorSettings />} />
      {/* Catch-all for unknown doctor routes */}
      <Route path="" element={<Navigate to="/doctor/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default DoctorApp;
