import api, { setAccessToken } from "./api";

// Register user
const register = async (userData) => {
  const response = await api.post("/auth/register", userData);

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data.data));
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
  }

  return response.data.data;
};

// Google Login user
const googleLogin = async (tokenData) => {
  const response = await api.post("/auth/google", tokenData);

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
  }

  return response.data.data.user;
};

// Login user
const login = async (userData) => {
  const response = await api.post("/auth/login", userData);

  if (response.data && response.data.data) {
    const { is2FA, user, accessToken } = response.data.data;
    if (is2FA) {
      return response.data.data; // Return raw 2FA payload (is2FA, twoFactorToken, userId)
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    if (accessToken) {
      setAccessToken(accessToken);
    }
  }

  return response.data.data.user;
};

// 2FA Methods
const setup2FA = async () => {
  const response = await api.post("/auth/2fa/setup");
  return response.data.data;
};

const verify2FA = async (code) => {
  const response = await api.post("/auth/2fa/verify", { code });
  return response.data.data;
};

const disable2FA = async (code) => {
  const response = await api.post("/auth/2fa/disable", { code });
  return response.data.data;
};

const login2FA = async (twoFactorData) => {
  const response = await api.post("/auth/2fa/login", twoFactorData);

  if (response.data && response.data.data) {
    const { user, accessToken } = response.data.data;
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    if (accessToken) {
      setAccessToken(accessToken);
    }
  }

  return response.data.data.user;
};

// Verify OTP
const verifyOTP = async (otpData) => {
  const response = await api.post("/auth/verify-otp", otpData);

  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data.data.user));
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
  }

  return response.data.data.user;
};

// Logout user
const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout failed on server", error);
  }
  localStorage.removeItem("user");
  setAccessToken("");
  window.localStorage.setItem('logoutEvent', Date.now().toString());
};

// Update user details
const updateAccountDetails = async (userData) => {
  const response = await api.patch("/users/update-account-details", userData);

  if (response.data) {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const updatedUser = { ...currentUser, ...response.data.data };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }
  return response.data.data;
};

// Updating account address
const updateAddressDetails = async (userData) => {
  const response = await api.patch("/users/update-account-address", userData);

  if (response.data) {
    // Ideally update local storage user if necessary, or rely on fetching current-user
    // For now, let's update the stored user if the response contains the updated user object
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const updatedUser = { ...currentUser, ...response.data.data };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }
  return response.data.data;
};

// Update user avatar
const updateAvatar = async (formData) => {
  const response = await api.patch("/users/update-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (response.data) {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    // response.data.data should be the full user object with new avatar
    const updatedUser = { ...currentUser, ...response.data.data };
    localStorage.setItem("user", JSON.stringify(updatedUser)); // Update local storage
  }

  return response.data.data;
};

// Change password
const changePassword = async (userData) => {
  const response = await api.patch("/users/change-password", userData);
  return response.data;
};

// Delete account
const deleteAccount = async (data) => {
  // data might contain password for confirmation
  const response = await api.delete("/users/delete-account", {
    data,
    headers: {
      "Content-Type": "application/json",
    },
  });
  localStorage.removeItem("user");
  setAccessToken("");
  return response.data;
};

const recoverAccount = async (userData) => {
  const response = await api.post("/users/recover-account", userData);
  return response.data;
};

// Check current auth status silently
const getCurrentUser = async () => {
  const response = await api.get("/users/current-user");
  if (response.data?.data) {
    localStorage.setItem("user", JSON.stringify(response.data.data));
  }
  return response.data.data;
};

const authService = {
  register,
  logout,
  login,
  googleLogin,
  verifyOTP,
  updateAccountDetails,
  updateAddressDetails,
  updateAvatar,
  changePassword,
  deleteAccount,
  recoverAccount,
  getCurrentUser,
  setup2FA,
  verify2FA,
  disable2FA,
  login2FA,
};

export default authService;
