import React, { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Skeleton from "../common/Skeleton";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  MapPin,
  FileText,
  CreditCard,
  Bot,
  Video,
  Building,
  Users,
  Activity,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  Star,
} from "lucide-react";
import MyAppointments from "../../pannel/Patient/components/Appointments/MyAppointments";
import appointmentService from "../../services/appointmentService";
import doctorService from "../../services/doctorService";

function Appointments() {
  const location = useLocation();
  const selectedDoctor = location.state?.doctor;
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("book"); // book, myAppointments

  const [countryCode, setCountryCode] = useState("+91");

  // Booking Form State
  const [formData, setFormData] = useState({
    patientName: "",
    email: "",
    phone: "",
    selectedDoctor: selectedDoctor?.id || "",
    specialty: selectedDoctor?.specialty || "",
    appointmentDate: "",
    appointmentTime: "",
    appointmentType: "in-person",
    reason: "",
  });

  useEffect(() => {
    if (user) {
      const fullPhone = user?.phone || "";
      const match = fullPhone.match(/^(\+91|\+1|\+44|\+61|\+971|\+86|\+81|\+49)(.+)$/);
      let code = "+91";
      let num = fullPhone;
      if (match) {
        code = match[1];
        num = match[2];
      } else if (fullPhone.startsWith("+")) {
        const matchGeneral = fullPhone.match(/^(\+[0-9]{1,4})([0-9]+)$/);
        if (matchGeneral) {
          code = matchGeneral[1];
          num = matchGeneral[2];
        }
      }
      setCountryCode(code);

      setFormData((prev) => ({
        ...prev,
        patientName: user.fullname || "",
        email: user.email || "",
        phone: num,
      }));
    }
  }, [user]);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookedAppointmentDetails, setBookedAppointmentDetails] =
    useState(null);

  // My Appointments State
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // All Doctors State for dropdown
  const [allDoctors, setAllDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Available slots for selected doctor + date
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState(null);

  // Fetch all doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const data = await doctorService.getAllDoctors();

        // Map the data to match expected structure
        const mappedDoctors = data.map((doc) => ({
          id: doc._id,
          name: doc.doctorDetails?.fullname || doc.doctor || "Doctor",
          specialty: doc.specialization || "General",
          // `Doctor.doctor` is the username used by backend booking endpoints.
          username: doc.doctor,
          doctorId: doc.doctorId,
        }));

        // Sort the data alphabetically
        const sortedDoctors = mappedDoctors.sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setAllDoctors(sortedDoctors || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch available slots whenever doctor/date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.selectedDoctor || !formData.appointmentDate) return;

      const doctor = allDoctors.find((d) => d.id === formData.selectedDoctor);
      const doctorUsername = doctor?.username;
      if (!doctorUsername) return;

      setLoadingSlots(true);
      setAvailableSlots([]);
      setSelectedSlotDetails(null);
      setFormData((prev) => ({ ...prev, appointmentTime: "" }));

      try {
        const res = await appointmentService.checkAvailableSlots(
          doctorUsername,
          formData.appointmentDate,
        );

        const slots = Array.isArray(res?.data) ? res.data : res || [];
        setAvailableSlots(Array.isArray(slots) ? slots : []);
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to fetch available slots",
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.selectedDoctor, formData.appointmentDate, allDoctors]);

  // Fetch appointments on mount and when tab changes to myAppointments
  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const data = await appointmentService.getMyAppointments();
      const appointmentsList = data.data || data || []; // Handle potential nesting
      setMyAppointments(
        Array.isArray(appointmentsList) ? appointmentsList : [],
      );
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Handle route based tab selection
  useEffect(() => {
    if (location.pathname === "/my-appointments") {
      setActiveTab("myAppointments");
    }
  }, [location.pathname]);


  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await doctorService.getAllDoctors();
        if (data && data.length > 0) {
          const formattedDoctors = data.map((doc) => ({
            name: doc.fullName,
            specialty: doc.specialty,
            username: doc.username,
          }));
          setDoctors(formattedDoctors);
        }
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        // Keep the default doctors if fetch fails
      }
    };
    fetchDoctors();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === "phone") {
      val = value.replace(/\D/g, "");
    }
    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle doctor selection
  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const doctor = allDoctors.find((d) => d.id === doctorId);
    setFormData((prev) => ({
      ...prev,
      selectedDoctor: doctorId,
      specialty: doctor?.specialty || "",
    }));
  };

  const handleSlotChange = (e) => {
    const slotNumber = e.target.value;
    const slot = availableSlots.find((s) => s.slotNumber === slotNumber);

    setFormData((prev) => ({
      ...prev,
      appointmentTime: slotNumber,
    }));

    setSelectedSlotDetails(slot || null);

    if (formErrors.appointmentTime) {
      setFormErrors((prev) => ({
        ...prev,
        appointmentTime: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.patientName.trim()) errors.patientName = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email is invalid";
    const rawNumber = formData.phone.replace(/\D/g, "");
    if (!rawNumber) {
      errors.phone = "Phone is required";
    } else if (countryCode === "+91" && rawNumber.length !== 10) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }
    if (!formData.selectedDoctor)
      errors.selectedDoctor = "Please select a doctor";
    if (!formData.appointmentDate) errors.appointmentDate = "Date is required";
    if (!formData.appointmentTime) errors.appointmentTime = "Time is required";
    if (!formData.reason.trim()) errors.reason = "Reason is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the doctor's details from the selected doctor ID
      const doctor = allDoctors.find((d) => d.id === formData.selectedDoctor);

      if (!doctor || !doctor.username) {
        throw new Error("Doctor not found");
      }

      // Book appointment via API
      const appointmentData = {
        slotNumber: formData.appointmentTime,
        // Pass YYYY-MM-DD directly; backend normalizes to UTC midnight.
        date: formData.appointmentDate,
        username: doctor.username,
        reason: formData.reason,
        meetingType: formData.appointmentType === "video" ? "ONLINE" : "IN_PERSON",
      };

      const response =
        await appointmentService.bookAppointment(appointmentData);
      const bookedAppointment = response?.data || response;

      setBookedAppointmentDetails({
        id: bookedAppointment?.appointmentId || bookedAppointment?._id,
        doctorName: doctor.name, // Use doctor name instead of ID
        specialty: doctor.specialty,
        date: formData.appointmentDate,
        time: selectedSlotDetails
          ? `${selectedSlotDetails.startTime} - ${selectedSlotDetails.endTime}`
          : bookedAppointment?.timeSlots || formData.appointmentTime,
        type:
          formData.appointmentType === "video"
            ? "ONLINE"
            : "IN_PERSON",
        status: bookedAppointment?.status || "CONFIRMED",
      });

      setBookingSuccess(true);
    } catch (error) {
      console.error("Booking error:", error);
      alert(
        error.response?.data?.message ||
          "Failed to book appointment. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      patientName: "",
      email: "",
      phone: "",
      selectedDoctor: "",
      specialty: "",
      appointmentDate: "",
      appointmentTime: "",
      appointmentType: "",
      reason: "",
    });
    setBookingSuccess(false);
    setBookedAppointmentDetails(null);
    setAvailableSlots([]);
    setSelectedSlotDetails(null);
    setFormErrors({});
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white py-16 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Book Appointment
              </h1>
              <p className="text-xl text-blue-100 dark:text-blue-200 mt-2">
                Schedule your consultation with our expert doctors
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-8 transition-colors duration-200">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("book")}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-semibold transition-colors ${
                  activeTab === "book"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </button>
            </nav>
          </div>
        </div>

        {/* Book Appointment Tab */}
        {activeTab === "book" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              {!bookingSuccess ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 transition-colors duration-200">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Patient Information
                  </h2>

                  <form onSubmit={handleSubmit}>
                    {/* Personal Information */}
                    <div className="space-y-6 mb-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Full Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="text"
                              name="patientName"
                              value={formData.patientName}
                              onChange={handleInputChange}
                              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                                formErrors.patientName
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="John Doe"
                            />
                          </div>
                          {formErrors.patientName && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.patientName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address *
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                                formErrors.email
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="john@example.com"
                            />
                          </div>
                          {formErrors.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number *
                          </label>
                          <div className="flex gap-2">
                            <div className="relative shrink-0">
                              <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="h-full pl-3 pr-8 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium appearance-none cursor-pointer"
                              >
                                <option value="+91">🇮🇳 +91</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+61">🇦🇺 +61</option>
                                <option value="+971">🇦🇪 +971</option>
                                <option value="+86">🇨🇳 +86</option>
                                <option value="+81">🇯🇵 +81</option>
                                <option value="+49">🇩🇪 +49</option>
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                              </div>
                            </div>
                            <div className="relative flex-1">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                                  formErrors.phone
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                placeholder="99999 99999"
                              />
                            </div>
                          </div>
                          {formErrors.phone && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.phone}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Age *
                            </label>
                            <input
                              type="number"
                              name="age"
                              value={formData.age}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                                formErrors.age
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="30"
                              min="1"
                              max="120"
                            />
                            {formErrors.age && (
                              <p className="text-red-500 text-sm mt-1">
                                {formErrors.age}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Gender *
                            </label>
                            <select
                              name="gender"
                              value={formData.gender}
                              onChange={handleInputChange}
                              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                                formErrors.gender
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                            {formErrors.gender && (
                              <p className="text-red-500 text-sm mt-1">
                                {formErrors.gender}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Appointment Details
                    </h3>
                    <div className="space-y-6 mb-8">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Doctor *
                          </label>
                          <select
                            name="selectedDoctor"
                            value={formData.selectedDoctor}
                            onChange={handleDoctorChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                              formErrors.selectedDoctor
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            <option value="">Choose a doctor</option>
                            {loadingDoctors ? (
                              <option disabled>Loading doctors...</option>
                            ) : (
                              allDoctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </option>
                              ))
                            )}
                          </select>
                          {formErrors.selectedDoctor && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.selectedDoctor}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Specialty
                          </label>
                          <input
                            type="text"
                            name="specialty"
                            value={formData.specialty}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
                            placeholder="Auto-filled"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="md:w-1/2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Date *
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              type="date"
                              name="appointmentDate"
                              value={formData.appointmentDate}
                              onChange={handleInputChange}
                              min={today}
                              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                                formErrors.appointmentDate
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          </div>
                          {formErrors.appointmentDate && (
                            <p className="text-red-500 text-sm mt-1">
                              {formErrors.appointmentDate}
                            </p>
                          )}
                        </div>

                        <div className="w-full">
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Available Time Slots *
                            </label>
                            {loadingSlots && (
                              <div className="flex items-center text-sm text-indigo-500 gap-1 font-semibold animate-pulse">
                                Fetching availability...
                              </div>
                            )}
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700 transition-all">
                            {loadingSlots ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {[...Array(8)].map((_, i) => (
                                  <Skeleton
                                    key={i}
                                    className="h-19 rounded-xl w-full"
                                  />
                                ))}
                              </div>
                            ) : !formData.appointmentDate ? (
                              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>
                                  Please select a date first to view available
                                  times
                                </p>
                              </div>
                            ) : !availableSlots ||
                              availableSlots.length === 0 ? (
                              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>
                                  No slots available on this date. Try another
                                  day!
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {availableSlots.map((slot) => {
                                  const isSelected =
                                    formData.appointmentTime ===
                                    slot.slotNumber;
                                  return (
                                    <button
                                      key={slot._id || slot.slotNumber}
                                      type="button"
                                      onClick={() =>
                                        handleSlotChange({
                                          target: { value: slot.slotNumber },
                                        })
                                      }
                                      className={`relative px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all transform hover:-translate-y-0.5 ${
                                        isSelected
                                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm"
                                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm"
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-0.5 shadow-md">
                                          <CheckCircle className="w-3 h-3" />
                                        </div>
                                      )}
                                      <div className="flex flex-col gap-0.5 text-center">
                                        <span className="text-base font-bold whitespace-nowrap">
                                          {slot.startTime}
                                        </span>
                                        <span className="text-xs opacity-70 whitespace-nowrap">
                                          to {slot.endTime}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          {formErrors.appointmentTime && (
                            <p className="text-red-500 text-sm mt-2 font-medium">
                              {formErrors.appointmentTime}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Appointment Type *
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                appointmentType: "in-person",
                              }))
                            }
                            className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                              formData.appointmentType === "in-person"
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <Building className="w-5 h-5" />
                            <span className="font-semibold">In-Person</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                appointmentType: "video",
                              }))
                            }
                            className={`p-4 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                              formData.appointmentType === "video"
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <Video className="w-5 h-5" />
                            <span className="font-semibold">Video Call</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reason for Visit *
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                          <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                              formErrors.reason
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="Please describe your reason for booking..."
                            rows="3"
                          />
                        </div>
                        {formErrors.reason && (
                          <p className="text-red-500 text-sm mt-1">
                            {formErrors.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Book Appointment
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Success Message
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 transition-colors duration-200">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      Appointment Confirmed!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      Your appointment has been successfully booked
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
                      <div className="grid md:grid-cols-2 gap-4 text-left">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Appointment ID
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {bookedAppointmentDetails?.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Patient Name
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {formData.patientName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Doctor
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {bookedAppointmentDetails?.doctorName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Specialty
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {bookedAppointmentDetails?.specialty}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Date & Time
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {bookedAppointmentDetails?.date} at{" "}
                            {bookedAppointmentDetails?.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Type
                          </p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {formData.appointmentType === "video"
                              ? "Video Consultation"
                              : "In-Person Visit"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => setActiveTab("myAppointments")}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        <Activity className="w-5 h-5" />
                        View My Appointments
                      </button>
                      <button
                        onClick={resetForm}
                        className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        <Calendar className="w-5 h-5" />
                        Book Another
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              {/* Quick Tips */}
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-blue-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Before Your Appointment
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Arrive 15 minutes early</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Bring insurance card and ID</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <span>List current medications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                    <span>Prepare questions for doctor</span>
                  </li>
                </ul>
              </div>

              {/* Need Help */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-transparent dark:border-gray-700 transition-colors duration-200">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                  Need Help?
                </h3>
                <div className="space-y-3">
                  <a
                    href="tel:+1234567890"
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-transparent dark:border-gray-600"
                  >
                    <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Call Us
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        +1 234 567 890
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Selected Doctor Info */}
              {selectedDoctor && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-transparent dark:border-gray-700 transition-colors duration-200">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                    Selected Doctor
                  </h3>
                  <div className="flex items-start gap-4">
                    <img
                      src={selectedDoctor.image}
                      alt={selectedDoctor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {selectedDoctor.name}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {selectedDoctor.specialty}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {selectedDoctor.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Appointments Tab */}
        {activeTab === "myAppointments" && (
          <MyAppointments
            appointments={myAppointments}
            loading={loadingAppointments}
            onRefresh={fetchAppointments}
          />
        )}
      </div>
    </div>
  );
}

export default Appointments;
