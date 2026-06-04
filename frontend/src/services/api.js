import axios from 'axios';
import toast from 'react-hot-toast';

// 1. Environment variables
// Automatically falls back to localhost if env variable is surprisingly missing
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  // 4. Secure cookies - instructs Axios to securely attach HttpOnly cookies to every outgoing request
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

let inMemoryAccessToken = localStorage.getItem("accessToken") || '';

export const getAccessToken = () => inMemoryAccessToken;
export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 3. Logout helper function
// Keeps session clearing logic in one clean, exported module
export const forceLogout = () => {
  setAccessToken('');
  // Return early if the user session is already cleared to avoid loops
  if (!localStorage.getItem("user")) {
    return;
  }
  localStorage.removeItem("user");
  
  // Trigger cross-tab logout synchronization
  window.localStorage.setItem('logoutEvent', Date.now().toString());

  // Check if we are on a protected route
  const protectedRoutes = ['/admin', '/doctor', '/patient'];
  const isProtected = protectedRoutes.some(route => window.location.pathname.startsWith(route));

  if (isProtected && window.location.pathname !== '/login') {
    window.location.href = '/login';
  } else if (window.location.pathname !== '/login') {
    // If we're on a public page, just reload to let Redux catch the logged-out state
    window.location.reload();
  }
};

// 4. Request Interceptor (Crucial for Cross-Domain Auth)
// Tries to send access token via Authorization header as a robust fallback for cross-site cookie blocking.
let isFirstRequest = true;
let connectionTimer = null;
let overlayElement = null;

const showConnectingOverlay = () => {
  if (overlayElement) return;

  overlayElement = document.createElement("div");
  overlayElement.id = "connection-waking-overlay";
  overlayElement.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      color: white;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      transition: opacity 0.3s ease;
    ">
      <div style="text-align: center; max-width: 400px; padding: 2rem;">
        <div style="
          width: 50px;
          height: 50px;
          border: 4px solid rgba(99, 102, 241, 0.2);
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem auto;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        "></div>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #f8fafc;">
          Connecting to secure server...
        </h3>
        <p style="font-size: 0.875rem; color: #94a3b8; line-height: 1.5; margin: 0;">
          Our backend is spinning up on Render. This usually takes up to 30 seconds after brief inactivity. Thank you for your patience!
        </p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  document.body.appendChild(overlayElement);
};

const hideConnectingOverlay = () => {
  if (overlayElement) {
    overlayElement.style.opacity = "0";
    setTimeout(() => {
      if (overlayElement && overlayElement.parentNode) {
        overlayElement.parentNode.removeChild(overlayElement);
      }
      overlayElement = null;
    }, 300);
  }
};

api.interceptors.request.use(
  (config) => {
    if (isFirstRequest && !connectionTimer) {
      connectionTimer = setTimeout(() => {
        showConnectingOverlay();
      }, 3000);
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (isFirstRequest) {
      isFirstRequest = false;
      if (connectionTimer) {
        clearTimeout(connectionTimer);
        connectionTimer = null;
      }
      hideConnectingOverlay();
    }
    return response;
  },
  async (error) => {
    if (isFirstRequest) {
      isFirstRequest = false;
      if (connectionTimer) {
        clearTimeout(connectionTimer);
        connectionTimer = null;
      }
      hideConnectingOverlay();
    }
    
    // 2. Network error handling
    // Triggers if the server is offline, CORS blocks the request, or internet is disconnected.
    if (!error.response) {
      if (!window.navigator.onLine) {
        toast.error("No internet connection available.");
      } else {
        toast.error("Network Error - Server unreachable. Please try again later.");
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // 5. Refresh token rotation
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh-token') &&
      !originalRequest.url.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then((token) => {
          if (token && typeof token === 'string') {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh access token - browser sends cookies automatically with credentials
        const response = await api.post(`/auth/refresh-token`);

        const newAccessToken = response.data?.data?.accessToken;

        if (newAccessToken) {
          setAccessToken(newAccessToken);
        }

        isRefreshing = false;
        processQueue(null, newAccessToken);

        // Replay the original request now that the token is refreshed
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;

        // Refresh failed, token is genuinely dead. Safely boot them out.
        forceLogout();
        return Promise.reject(err);
      }
    }

    // Default 401 error handling catching edge cases / unauthorized access
    if (error.response.status === 401) {
        const message = error.response.data?.message;
        console.error("401 ERROR CAUGHT IN INTERCEPTOR:", message, "URL:", originalRequest.url);
        if (
          message === "Invalid access token" ||
          message === "Unauthorized" ||
          message === "Invalid acess token" ||
          message === "Token expired"
        ) {
          console.error("FORCING LOGOUT due to:", message);
          forceLogout();
        }
    }

    return Promise.reject(error);
  }
);

export default api;
