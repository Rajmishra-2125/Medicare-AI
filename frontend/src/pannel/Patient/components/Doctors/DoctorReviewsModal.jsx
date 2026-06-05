import React, { useState, useEffect } from "react";
import { Star, X, Loader2, MessageSquare, AlertCircle } from "lucide-react";
import reviewService from "../../../../services/reviewService";

function DoctorReviewsModal({ doctor, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (doctor?.id || doctor?._id || doctor?.doctorId) {
      // Try to extract the backend _id for the doctor.
      // Depending on the datastructure, it might be heavily nested.
      const idToFetch = doctor.id || doctor._id || doctor.doctorId;
      fetchReviews(idToFetch);
    }
  }, [doctor]);

  const fetchReviews = async (doctorId) => {
    try {
      setLoading(true);
      const res = await reviewService.getDoctorReviews(doctorId);
      // Depending on standard ApiResponse wrapper:
      const data = res.data?.reviews || res.reviews || [];
      setReviews(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch doctor reviews:", err);
      setError("Failed to load reviews. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <img 
                src={doctor.image || `https://ui-avatars.com/api/?name=${doctor.name || 'Doctor'}&background=random`} 
                alt={doctor.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reviews for {doctor.name}</h3>
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{doctor.rating}</span>
                <span className="text-gray-500 dark:text-gray-400">({doctor.reviews} ratings)</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading reviews...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-500">
              <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
              <p>{error}</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg">No reviews yet</p>
              <p className="text-sm">This doctor hasn't received any reviews.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shadow-sm shrink-0 uppercase">
                        {review.patientId?.fullname?.[0] || "P"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {review.patientId?.fullname || "Anonymous Patient"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center flex-row bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                      <span className="font-bold text-yellow-700 dark:text-yellow-500 text-sm mr-1">{review.rating}.0</span>
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorReviewsModal;
