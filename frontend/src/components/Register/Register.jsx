import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  register,
  googleLogin,
  reset,
  verifyOTP,
} from "../../features/auth/AuthSlice";
import { useGoogleLogin } from "@react-oauth/google";
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../shared/Spinner";

const Register = () => {
  const [countryCode, setCountryCode] = useState("+91");
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "MALE", // Default
    DOB: "",
    role: "PATIENT", // Default
  });

  const {
    fullname,
    username,
    email,
    password,
    confirmPassword,
    phone,
    gender,
    DOB,
    role,
  } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    // Redirect if already logged in and verified
    if (user) {
      if (user.isOTP) {
        // Registration successful (OTP sent), navigate to verify-email with form data
        navigate("/verify-email", {
          state: { registrationData: formData },
        });
        return;
      }
      switch (user.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "DOCTOR":
          navigate("/doctor/dashboard");
          break;
        case "PATIENT":
          navigate("/");
          break;
        default:
          navigate("/");
      }
      return;
    }

    if (isError) {
      toast.error(message);
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch, formData]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      dispatch(googleLogin({ googleToken: tokenResponse.access_token }));
    },
    onError: (error) => {
      toast.error("Google Sign Up Failed! Please try again.");
      console.log("Login Failed:", error);
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const rawNumber = phone.replace(/\D/g, "");
    if (!rawNumber) {
      toast.error("Phone number is required");
      return;
    }
    if (countryCode === "+91" && rawNumber.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    const fullPhoneNumber = countryCode + rawNumber;

    const registrationData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key !== "confirmPassword") {
        if (key === "phone") {
          registrationData.append(key, fullPhoneNumber);
        } else {
          registrationData.append(key, formData[key]);
        }
      }
    });

    dispatch(register(registrationData));
  };

  return (
    <main className="bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 min-h-screen transition-colors duration-200">
      {/* Top Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 items-center justify-center shadow-sm border space-y-4 flex border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex w-40 justify-center items-center ">
          <div className="w-1/2 py-2 text-center text-lg font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-0.5">
            Sign Up
          </div>
          <Link
            to="/login"
            className="w-1/2 py-2 text-center text-lg font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all -mb-0.5"
          >
            Login
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 ">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
          <div className="md:flex">
            {/* Left Side - Branding & Features (Hidden on mobile, visible on md+) */}
            <div className="md:w-1/3 bg-linear-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 p-8 text-white">
              <div className="relative z-10">
                <div className="mt-12">
                  <h1 className="text-4xl font-bold mb-4 leading-tight">
                    Join MediCare
                  </h1>
                  <p className="text-blue-100 text-lg mb-10">
                    Create your account to access quality healthcare services at
                    your fingertips.
                  </p>

                  <div className="space-y-4">
                    {[
                      "Book appointments instantly",
                      "Consult with expert doctors",
                      "Access medical records",
                      "AI booking assistant",
                      "Get your prescriptions",
                      "24/7 support available",
                      "Get instant notifications",
                      "Secure and confidential",
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial Card */}
                  <div className="relative z-10 mt-10 bg-blue-700/50 dark:bg-blue-900/50 p-6 rounded-xl backdrop-blur-sm border border-blue-500/50">
                    <div className="flex items-center space-x-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg
                          key={s}
                          className="w-4 h-4 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="italic text-sm mb-4">
                      "MediCare made healthcare so accessible. Booking
                      appointments is now just a few clicks away!"
                    </p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                        <img
                          src="https://i.pravatar.cc/150?img=32"
                          alt="Sarah Johnson"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Sarah Johnson</p>
                        <p className="text-xs text-blue-200">
                          Patient since 2024
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="md:w-2/3 p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Your Account
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Join thousands of patients who trust MediCare for their
                  healthcare needs.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors duration-200">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="fullname"
                          value={fullname}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          name="username"
                          value={username}
                          onChange={handleChange}
                          placeholder="johndoe123"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          name="email"
                          value={email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="relative shrink-0">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="h-full pl-3 pr-8 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium appearance-none cursor-pointer"
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
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setFormData({ ...formData, phone: val });
                            }}
                            placeholder="99999 99999"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="date"
                          name="DOB"
                          value={DOB}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Gender
                      </label>
                      <div className="relative">
                        <select
                          name="gender"
                          value={gender}
                          onChange={handleChange}
                          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          name="password"
                          value={password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex justify-center items-center"
                  >
                    {isLoading ? (
                      <Spinner className="w-6 h-6 border-white" />
                    ) : (
                      <>
                        Create Account <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span className="ml-2">Google</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    Log in
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Register;
