import React, { useState } from "react";
import { User, Lock, Bell, Camera, Save, Mail, Phone } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  updateUserPersonalDetails,
  updateUserAvatar,
  changePassword,
} from "../../../../features/auth/AuthSlice";
import toast from "react-hot-toast";

const PatientSettings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [fullname, setFullname] = useState(user?.fullname || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const tabs = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "security", label: "Security & Passwords", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    toast.promise(dispatch(updateUserAvatar(formData)).unwrap(), {
      loading: "Uploading avatar to cloud...",
      success: "Avatar updated securely!",
      error: "Failed to upload avatar",
    });
  };

  const handleProfileSave = () => {
    const userData = { fullname, email, phone };
    toast.promise(dispatch(updateUserPersonalDetails(userData)).unwrap(), {
      loading: "Saving profile...",
      success: "Profile updated successfully!",
      error: "Failed to update profile",
    });
  };

  const handlePasswordSave = () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (!oldPassword || !newPassword) {
      toast.error("Please fill all password fields.");
      return;
    }

    toast
      .promise(
        dispatch(changePassword({ oldPassword, newPassword })).unwrap(),
        {
          loading: "Updating password...",
          success: "Password secured!",
          error: "Failed to change password",
        },
      )
      .then(() => {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-8 max-w-300 mx-auto mt-4 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Manage your personal profile and account preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-3 sticky top-4">
            <nav className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left
                    ${
                      activeTab === tab.id
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <tab.icon
                    className={`w-5 h-5 ${activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"}`}
                  />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 sm:p-8 min-h-125">
            {/* Profile Settings Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Patient Profile
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Update your personal information and photo.
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-indigo-100 dark:border-indigo-500/20">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt="Patient Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-sm border-[3px] border-white dark:border-slate-900 transition-colors cursor-pointer block">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div>
                    <label className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors cursor-pointer inline-block">
                      Change Photo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings Tab */}
            {activeTab === "security" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Security & Password
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Update your password and secure your account.
                  </p>
                </div>

                <div className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handlePasswordSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Choose what alerts you want to receive for your health care.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      id: "reminders",
                      label: "Appointment Reminders",
                      desc: "Get notified 24 hours before your consultation.",
                      defaultChecked: true,
                    },
                    {
                      id: "cancellations",
                      label: "Doctor Cancellations",
                      desc: "Receive alerts if your doctor reschedules.",
                      defaultChecked: true,
                    },
                    {
                      id: "reports",
                      label: "Medical Reports",
                      desc: "Alert when a new prescription or report is added.",
                      defaultChecked: true,
                    },
                    {
                      id: "promotions",
                      label: "Offers and Promotions",
                      desc: "Get occasional emails about health checkup discounts.",
                      defaultChecked: false,
                    },
                    {
                      id: "system",
                      label: "System Updates",
                      desc: "Essential system maintenance and update alerts.",
                      defaultChecked: true,
                    },
                  ].map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {setting.label}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {setting.desc}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          defaultChecked={setting.defaultChecked}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
