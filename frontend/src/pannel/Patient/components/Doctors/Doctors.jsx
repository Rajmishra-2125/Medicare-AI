import React, { useState, useEffect, useMemo } from "react";
import doctorService from "../../../../services/doctorService";
import DoctorCardSkeleton from "../../../../components/skeletons/DoctorCardSkeleton";
import EmptyState from "../../../../components/ui/EmptyState";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Star,
  MapPin,
  Calendar,
  Clock,
  Award,
  GraduationCap,
  Heart,
  Brain,
  Eye,
  Activity,
  Stethoscope,
  Bone,
  Baby,
  Users,
  CheckCircle,
  Video,
  X,
} from "lucide-react";
import DoctorReviewsModal from "./DoctorReviewsModal.jsx";

import { useDispatch, useSelector } from "react-redux";
import { getAllDoctors, searchDoctors } from "../../../../features/doctors/DoctorSlice";

function Doctors() {
  const dispatch = useDispatch();
  const { doctors, isLoading, isError, message } = useSelector(
    (state) => state.doctor
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [selectedExperience, setSelectedExperience] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [maxFee, setMaxFee] = useState(3000); // Consultation Fee Limit
  const [city, setCity] = useState(""); // City Location Limit
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedDoctorRating, setSelectedDoctorRating] = useState(null);

  // Debounced server-side faceted search dispatch
  useEffect(() => {
    let minExp = "";
    if (selectedExperience === "0-5") minExp = "0";
    else if (selectedExperience === "6-10") minExp = "6";
    else if (selectedExperience === "11-15") minExp = "11";
    else if (selectedExperience === "16+") minExp = "16";

    let minRating = "";
    if (selectedRating === "4.5+") minRating = "4.5";
    else if (selectedRating === "4.8+") minRating = "4.8";
    else if (selectedRating === "4.9+") minRating = "4.9";

    const params = {
      query: searchQuery,
      specialization: selectedSpecialty === "All" ? "" : selectedSpecialty,
      minExperience: minExp,
      minRating: minRating,
      maxFee: maxFee,
      city: city,
    };

    const debounceTimer = setTimeout(() => {
      dispatch(searchDoctors(params));
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [dispatch, searchQuery, selectedSpecialty, selectedExperience, selectedRating, maxFee, city]);

  // Map backend data to frontend structure once, using useMemo for efficiency
  const mappedDoctors = useMemo(() => {
    if (!doctors) return [];
    return doctors.map(doc => ({
      id: doc._id,
      name: doc.doctorDetails?.fullname || doc.doctor || "Doctor",
      specialty: doc.specialization || "General",
      subSpecialty: doc.qualification || "",
      experience: parseInt(doc.experience) || 0,
      rating: parseFloat(doc.rating).toFixed(1) || 0,
      reviews: doc.reviewCount || 0,
      patients: doc.totalAppointments || 0,
      education: doc.qualification || "Medical Degree",
      languages: ["English"], // Backend doesn't have languages field yet, defaulting
      location: doc.clinicAddress ? `${doc.clinicAddress.city}, ${doc.clinicAddress.state}` : (doc.clinicName || "Clinic"),
      availability: doc.availableDays?.join(", ") || "Mon-Fri",
      nextAvailable: "Today", // continuous availability assumed for now
      consultationFee: doc.consultationFee || 0,
      image: doc.doctorDetails?.profileImage || doc.profileImage || doc.image || doc.doctorId?.profileImage || `https://ui-avatars.com/api/?name=${doc.doctorDetails?.fullname || doc.doctor || doc.name || "Doctor"}&background=random`,
      about: doc.bio || `Experienced ${doc.specialization} specialist.`,
      achievements: [], // Backend doesn't have achievements field yet
      videoConsult: true, // Defaulting to true
      doctorId: doc.doctorId // Important for booking
    }));
  }, [doctors]);

  // Specialties for filtering
  // Dynamically generate specialties from fetched doctors
  const specialties = useMemo(() => {
    // Use the mappedDoctors for generating specialties
    const uniqueSpecialties = new Set(mappedDoctors.map(doc => doc.specialty));
    return [
      { name: "All", icon: Stethoscope },
      ...Array.from(uniqueSpecialties).sort().map(specialty => ({
        name: specialty,
        icon: getSpecialtyIcon(specialty)
      }))
    ];
  }, [mappedDoctors]); // Depend on mappedDoctors

  // Helper function to get icon for specialty
  function getSpecialtyIcon(specialty) {
    const iconMap = {
      'Cardiologist': Heart,
      'Neurologist': Brain,
      'Orthopedic Surgeon': Bone,
      'Ophthalmologist': Eye,
      'Pediatrician': Baby,
      'Dermatologist': Activity,
      'General Physician': Stethoscope,
      'Psychiatrist': Brain,
      'ENT Specialist': Activity,
      'Gynecologist': Activity,
      'Urologist': Activity,
      'Gastroenterologist': Activity
    };
    return iconMap[specialty] || Stethoscope;
  }

  // Filter doctors based on search and filters
  // Server aggregation pipeline returns pre-filtered and formatted doctors cleanly
  const filteredDoctors = mappedDoctors;

  const clearFilters = () => {
    setSelectedSpecialty("All");
    setSelectedExperience("All");
    setSelectedRating("All");
    setSearchQuery("");
    setMaxFee(3000);
    setCity("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header Banner */}
      <div className="bg-linear-to-br from-blue-600 to-indigo-700  text-white py-16 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Doctor
          </h1>
          <p className="text-xl text-blue-100 dark:text-blue-200">
            Browse our network of experienced healthcare professionals
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 transition-colors duration-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
            </div>

            {/* Filter Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-semibold transition-colors text-gray-700 dark:text-gray-200"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          <div
            className={`${showFilters ? "block" : "hidden"} lg:block mt-4 space-y-4`}
          >
            <div className="grid md:grid-cols-3 gap-4">
              {/* Specialty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Specialty
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  {specialties.map((specialty) => (
                    <option key={specialty.name} value={specialty.name}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience
                </label>
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  <option value="All">All Experience</option>
                  <option value="0-5">0-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="11-15">11-15 years</option>
                  <option value="16+">16+ years</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  <option value="All">All Ratings</option>
                  <option value="4.5+">4.5+ Stars</option>
                  <option value="4.8+">4.8+ Stars</option>
                  <option value="4.9+">4.9+ Stars</option>
                </select>
              </div>

              {/* Consultation Fee Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Consultation Fee (₹{maxFee})
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Delhi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Active Filters and Clear */}
            {(selectedSpecialty !== "All" ||
              selectedExperience !== "All" ||
              selectedRating !== "All" ||
              maxFee !== 3000 ||
              city !== "" ||
              searchQuery) && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {selectedSpecialty !== "All" && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                      {selectedSpecialty}
                      <button
                        onClick={() => setSelectedSpecialty("All")}
                        className="hover:text-blue-900 dark:hover:text-blue-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {selectedExperience !== "All" && (
                    <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm">
                      {selectedExperience} years
                      <button
                        onClick={() => setSelectedExperience("All")}
                        className="hover:text-green-900 dark:hover:text-green-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {selectedRating !== "All" && (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-sm">
                      {selectedRating} Rating
                      <button
                        onClick={() => setSelectedRating("All")}
                        className="hover:text-yellow-900 dark:hover:text-yellow-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {maxFee !== 3000 && (
                    <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm">
                      Max: ₹{maxFee}
                      <button
                        onClick={() => setMaxFee(3000)}
                        className="hover:text-purple-900 dark:hover:text-purple-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {city !== "" && (
                    <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
                      City: {city}
                      <button
                        onClick={() => setCity("")}
                        className="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {filteredDoctors.length}
            </span>{" "}
            doctors
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              <div className="w-5 h-5 flex flex-col gap-1">
                <div className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
                <div className="h-1 bg-current rounded"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Doctors Grid/List */}
        {isLoading ? (
          <DoctorCardSkeleton />
        ) : filteredDoctors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Doctors Found"
            description="We couldn't find any medical specialists matching your search queries or filter choices. Try widening your filters or search terms!"
            actionLabel="Clear All Search Filters"
            onActionClick={clearFilters}
          />
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-transparent dark:border-gray-700"
              >
                {/* Doctor Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {doctor.videoConsult && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video Available
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedDoctorRating(doctor)}
                    className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {doctor.rating}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({doctor.reviews} reviews)
                    </span>
                  </button>
                </div>

                {/* Doctor Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {doctor.name}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium mb-1">
                    {doctor.specialty}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {doctor.subSpecialty}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span>{doctor.experience} years experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{doctor.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{doctor.patients}+ patients treated</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Consultation Fee
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{doctor.consultationFee}
                      </p>
                    </div>
                    <Link
                      to="/patient/book-appointment"
                      state={{ doctor: doctor }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-blue-500/30"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-transparent dark:border-gray-700"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Doctor Image */}
                  <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                    {doctor.videoConsult && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Video
                      </div>
                    )}
                  </div>

                  {/* Doctor Details */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {doctor.name}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-semibold mb-1">
                          {doctor.specialty}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {doctor.subSpecialty}
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedDoctorRating(doctor)}
                        className="flex items-center gap-1 mt-2 md:mt-0 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors cursor-pointer"
                      >
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {doctor.rating}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({doctor.reviews} reviews)
                        </span>
                      </button>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {doctor.about}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            Education
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-200 truncate">
                            {doctor.education.split(",")[0]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            Experience
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">
                            {doctor.experience} years
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            Location
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-200 truncate">
                            {doctor.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            Available
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">
                            {doctor.availability.split(",")[0]}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {doctor.achievements
                        .slice(0, 3)
                        .map((achievement, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {achievement}
                          </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Consultation Fee
                          </p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            ₹{doctor.consultationFee}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Next Available
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                            {doctor.nextAvailable}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/patient/book-appointment"
                        state={{ doctor: doctor }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-blue-500/30"
                      >
                        Book Appointment
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDoctorRating && (
          <DoctorReviewsModal 
             doctor={selectedDoctorRating} 
             onClose={() => setSelectedDoctorRating(null)} 
          />
      )}
    </div>
  );
}

export default Doctors;
