import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logout, reset } from "../../../../../features/auth/AuthSlice";
import toast from "react-hot-toast";
import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../../../context/ThemeContext";
import { clearNotifications } from "../../../../../features/notifications/notificationSlice";
import NotificationPanel from "../../../../../components/Header/NotificationPanel";

function Header({ toggleSidebar }) {
  const { theme, changeTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Real-time notifications from Redux
  const notifications = useSelector((state) => state.notifications?.items || []);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount || 0);

  const handleClear = () => {
    dispatch(clearNotifications());
  };

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setIsVisible(false); // Scrolling down
      } else {
        setIsVisible(true); // Scrolling up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  const handleLogout = () => {
    if (user?._id || user?.id) {
      sessionStorage.removeItem(`hasSeenWelcome_${user._id || user.id}`);
    }
    dispatch(logout());
    dispatch(reset());
    setIsDropdownOpen(false);
    navigate("/");
    toast.success("Logged out successfully");
  };

  return (
    <>
    <header
      className={`shadow sticky z-50 top-0 transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <nav className="bg-white dark:bg-[#0f172a] shadow-md border-b border-gray-100 dark:border-slate-800 px-4 lg:px-6 py-2.5">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen">
          <div className="flex items-center">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 mr-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 dark:text-white" />
            </button>

            <Link to="/" className="flex items-center">
              <img
                src="https://cdn-icons-png.flaticon.com/128/15753/15753044.png"
                className="mr-3 h-10 rounded-xl mx-3"
                alt="Logo"
              />
              <div>
                <h1 className="text-xl font-medium text-gray-900 dark:text-white">MediCare</h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center lg:order-2">
            {/* Theme Toggle Button */}
            <button
              onClick={() => changeTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 mr-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-white transition-all duration-300 shadow-sm hover:shadow-indigo-500/20 group"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-gray-100 group-hover:rotate-45 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 group-hover:-rotate-12 transition-transform duration-500" />
                )}
              </div>
            </button>

            {/* Notification Bell */}
            {user && (
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="p-2 mr-4 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-white hover:text-orange-500 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white overflow-hidden">
                    {user.profileImage && !imageError ? (
                      <img
                        src={user.profileImage}
                        alt={user.fullname}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <span className="hidden md:block font-medium">
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-100 dark:border-gray-700 z-50 animate-fade-in-down">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {user?.fullname || "Provider"}
                      </p>
                    </div>

                    <Link
                        to="/doctor/appointments"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <ClipboardList className="h-4 w-4" />
                        My Appointments
                      </Link>

                    <Link
                      to="/doctor/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-white border-0 hover:border-blue-600 bg-orange-600 hover:bg-indigo-600 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 focus:outline-none transition-colors duration-200"
              >
                Login
              </Link>
            )}

          </div>
        </div>
      </nav>
    </header>

      <NotificationPanel 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        notifications={notifications} 
        onClear={handleClear} 
      />
    </>
  );
}

export default Header;
