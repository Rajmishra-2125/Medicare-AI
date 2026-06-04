import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, googleLogin, reset } from "../../features/auth/AuthSlice";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { login2FA, reset2FARequired } from "../../features/auth/AuthSlice";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message, isTwoFactorRequired, twoFactorToken } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      switch (user.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "DOCTOR":
          navigate("/doctor/dashboard");
          break;
        case "PATIENT":
          navigate("/patient/home");
          break;
        default:
          navigate("/");
      }
      return;
    }

    if (isError) {
      toast.error(message);
    }

    if (isSuccess && user) {
      toast.success("Login Successful!");
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const userData = {
      email,
      password,
    };
    dispatch(login(userData));
  };

  const on2FASubmit = (e) => {
    e.preventDefault();
    if (totpCode.length !== 6 || isNaN(Number(totpCode))) {
      toast.error("Please enter a valid 6-digit verification code.");
      return;
    }
    dispatch(login2FA({ code: totpCode, twoFactorToken }));
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      dispatch(googleLogin({ googleToken: tokenResponse.access_token }));
    },
    onError: (error) => {
      toast.error("Google Login Failed! Please try again.");
      console.log("Login Failed:", error);
    },
  });

  const renderFormContent = () => {
    if (isTwoFactorRequired) {
      return (
        <form className="space-y-6" onSubmit={on2FASubmit}>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 justify-center">
              <Lock className="w-5 h-5 text-indigo-500" />
              Two-Factor Auth Required
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 text-center leading-relaxed">
              Your account is secured with 2FA. Please enter the 6-digit code from Google Authenticator / Authy to complete sign-in.
            </p>
            <label
              htmlFor="totpCode"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 text-center mb-1 tracking-wider uppercase"
            >
              Authenticator Code
            </label>
            <div className="mt-1 relative rounded-md shadow-xs">
              <input
                id="totpCode"
                name="totpCode"
                type="text"
                maxLength={6}
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000 000"
                className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-3xl tracking-widest font-mono transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify Code & Complete Login"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTotpCode("");
                dispatch(reset2FARequired());
              }}
              className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      );
    }

    return (
      <form className="space-y-6" onSubmit={onSubmit}>
        {/* Email Address */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Email Address
          </label>
          <div className="mt-1 relative rounded-md shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={onChange}
              placeholder="you@example.com"
              className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <div className="mt-1 relative rounded-md shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={onChange}
              placeholder="••••••••"
              className="appearance-none block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white sm:text-sm transition-colors"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 min-h-screen transition-colors duration-200">
      {/* Top Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 items-center justify-center shadow-sm border space-y-4 flex border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex w-40 justify-center items-center ">
          <Link
            to="/register"
            className="w-1/2 py-2 text-center text-lg font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all -mb-0.5"
          >
            Sign Up
          </Link>
          <div className="w-1/2 py-2 text-center text-lg font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-0.5">
            Login
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 ">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-200">
          <div className="md:flex">
            {/* Left Side - Branding & Features (Hidden on mobile, visible on md+) */}
            <div className="hidden md:block md:w-1/3 bg-linear-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 p-8 text-white">
              <div className="relative z-10">
                <div className="mt-12">
                  <h1 className="text-4xl font-bold mb-4 leading-tight">
                    Welcome Back!
                  </h1>
                  <p className="text-blue-100 text-lg mb-8">
                    Sign in to manage your appointments and health records
                    securely.
                  </p>

                  <div className="space-y-4">
                    {[
                      "Secure access to your data",
                      "Manage upcoming appointments",
                      "View prescription history",
                      "Connect with your doctors",
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Testimonial Card */}
              <div className="relative z-10 mt-15 bg-blue-700/50 dark:bg-blue-900/50 p-6 rounded-xl backdrop-blur-sm border border-blue-500/50">
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
                  "MediCare made healthcare so accessible. Booking appointments
                  is now just a few clicks away!"
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
                    <p className="text-xs text-blue-200">Patient since 2023</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full md:w-2/3 p-8">
              <div className="max-w-md mx-auto w-full flex flex-col justify-center h-full">
                <div className="mb-10 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Please enter your details to sign in.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors duration-200">
                  {renderFormContent()}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
