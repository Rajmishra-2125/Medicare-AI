# 🎨 MediCare Frontend Development Guide

This guide details the frontend architecture, state model, routing schema, and third-party integrations for the **MediCare** Doctor Appointment Management System Patient, Clinician, and Administration application.

The frontend is built on **React 19.2** and compiled using **Vite 7.2** for optimized client bundles. It uses **Tailwind CSS v4** for interface layouts and styling.

---

## 🛠️ Technology Stack

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.0` | Core UI engine |
| **Vite** | `^7.2.4` | Hot Module Replacement (HMR) build tool |
| **React Router** | `^7.13.0` | Client-side routing and layout switching |
| **Redux Toolkit** | `^2.11.2` | Global state management |
| **Tailwind CSS** | `^4.1.18` | Styling engine |
| **Axios** | `^1.13.4` | HTTP client wrapper |
| **Socket.io Client**| `^4.8.3` | Real-time events and WebRTC connection signals |
| **Cashfree SDK** | `^1.0.7` | Dynamic modal checkout client |
| **Sentry Browser** | `^10.53.1` | Automated runtime crash monitoring |

---

## 📂 Directory Layout

```
frontend/
├── public/
│   ├── sw.js                 # PWA Service Worker (offline assets & offline cache)
│   └── ...
├── src/
│   ├── assets/               # Vectors, dynamic animations, and brand logos
│   ├── components/           # Reusable shared components (skeletons, loaders, policies)
│   ├── context/              # Global contexts (Theme, Socket.io connection state)
│   ├── features/             # Redux state slices
│   │   ├── auth/             # Session checking and signup actions
│   │   ├── admin/            # Central stats calculations
│   │   ├── appointments/     # Slot reservation records
│   │   ├── agent/            # MediBot chat history sync
│   │   └── ...
│   ├── hooks/                # Custom utility hooks (debounce filters, auth guards)
│   ├── lib/                  # Shadcn setup utils
│   ├── pannel/               # Role-Specific Micro-Portals
│   │   ├── Admin/            # Admin controls, transaction logs, user tables
│   │   ├── Doctor/           # Clinician dashboards, e-prescriptions, slots
│   │   └── Patient/          # Home panels, doctors listings, appointment checkout
│   ├── services/             # Axios instance wrapper and API bindings
│   ├── store/                # Redux Toolkit centralized store configuration
│   ├── utils/                # Date and input validators (including Indian phone prefixes)
│   ├── App.jsx               # Role-based runtime layout selector
│   ├── index.css             # Tailwind base styles and CSS custom HSL variables
│   └── main.jsx              # React app mount, routing declarations, and Sentry hooks
├── vite.config.js            # Vite bundler configuration and manual code-splitting
├── tailwind.config.js        # Legacy config references (Tailwind v4 uses CSS config imports)
└── package.json              # Client scripts and dependencies
```

---

## ⚙️ Core Configuration

### 1. Vite Configuration (`vite.config.js`)
Configured to optimize framework execution, support absolute path aliases (`@/`), and implement manual code-splitting (chunks for Sentry, Firebase, pdf generators, charts, and vendor dependencies):

```javascript
import { fileURLToPath } from "url";
import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "/", // Resolves routing reload issues on nested paths
  plugins: [tailwindcss()],
  server: {
    headers: {
      // Allows Google OAuth popups to operate correctly
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'framework';
            if (id.includes('@sentry')) return 'sentry';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
            if (id.includes('recharts') || id.includes('d3')) return 'charts';
            if (id.includes('firebase')) return 'firebase';
            return 'vendor';
          }
        },
      },
    },
  },
});
```

---

## 🗃️ Redux State Architecture

Central state management is managed via **Redux Toolkit (`@reduxjs/toolkit`)** in `src/store/store.js`.

### Authentication Slice (`src/features/auth/AuthSlice.js`)
Handles session checking, login parameters, and OTP status flags:
*   `checkAuthStatus`: Fires on page load to verify the active session token and load current user metadata.
*   `loginUser`: Authenticates user credentials and triggers real-time notification listener mounts.
*   `logoutUser`: Invalidates tokens, triggers cross-tab logout synchronization, and resets state.

### Cross-Tab Logout Sync
To synchronize security states across multiple tabs, a listener in `App.jsx` handles local storage mutation triggers:
```javascript
useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key === 'logoutEvent') {
      window.location.href = '/login';
    }
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

---

## 🛣️ Client-Side Routing

Routes are declared using React Router's `createBrowserRouter` in `src/main.jsx`.

The root `<App />` component acts as a **runtime portal selector**, rendering the corresponding layout base based on user roles:
*   **ADMIN** user role loads the `AdminLayout` and redirects to `/admin/dashboard`.
*   **DOCTOR** user role loads the `DoctorLayout` and redirects to `/doctor/dashboard`.
*   **PATIENT** user role loads the `PatientLayout` and redirects to `/patient/home`.
*   **Unauthenticated / Visitors** bypass role layouts and view the standard public `Layout` pages (`/home`, `/about`, `/contact`, `/doctors`).

### Protected Route Implementation
The routing model wraps pages using custom middleware components:
1.  **`ProtectedRoute`**: Inspects user sessions, redirecting unauthenticated traffic to `/login`.
2.  **`RoleRoute`**: Enforces strict permissions (e.g. restricts access to `/admin` paths only to users with the `ADMIN` role).

---

## 🌐 API Integrations

### 1. Central Axios Instance (`src/services/api.js`)
Configured with custom handlers:
*   Base URL is read from `import.meta.env.VITE_API_URL`.
*   Includes `withCredentials: true` to exchange secure HttpOnly cookies.
*   Interceptors inject access tokens into requests using the `Authorization: Bearer <Token>` header.
*   Captures `401 Unauthorized` responses to trigger token rotation or force redirect to the login portal.

### 2. Cashfree Payment Gateway Checkout
Checkout triggers dynamically load the Cashfree SDK in `PaymentPage.jsx`:
```javascript
import { load } from '@cashfreepayments/cashfree-js';

const handlePayNow = async () => {
  // 1. Create order on the backend to obtain session ID
  const orderRes = await paymentService.createOrder(appointmentId);
  const order = orderRes.data;

  // 2. Instantiate Cashfree SDK dynamically mapping local server settings
  const isProduction = order.cf_environment === "PRODUCTION";
  const cashfree = await load({
    mode: isProduction ? "production" : "sandbox",
  });

  // 3. Launch Checkout Modal Overlay
  const checkoutOptions = {
    paymentSessionId: order.payment_session_id,
    redirectTarget: "_modal",
  };

  cashfree.checkout(checkoutOptions).then(async (result) => {
    if (result.paymentDetails) {
      // 4. Verify transaction status with Backend API
      await paymentService.verifyPayment({
        order_id: order.order_id,
        appointmentId: appointmentId
      });
      toast.success("Payment confirmed successfully!");
    } else if (result.error) {
      toast.error(result.error.message || "Payment cancelled.");
    }
  });
};
```

---

## 🔌 WebSockets & WebRTC consultation Setup

Real-time notifications and consultation room signaling are managed via `SocketContext.jsx`.

### Tele-Consultation Signaling System
During video consultations in `ConsultationWorkspace.jsx`, Socket.io handles WebRTC connection signals:
*   **Event `webrtc:join-room`**: Connects patient and clinician to a shared room matching the consultation ID.
*   **Event `webrtc:offer` / `webrtc:answer`**: Transports peer session descriptions (SDP parameters).
*   **Event `webrtc:ice-candidate`**: Distributes connection routing options dynamically.
*   **Event `webrtc:leave`**: Cleans up peer connections and notifies the other participant.

---

## 📱 User Interface Features & Styling

### Phone Input Validation
To satisfy Indian compliance rules for Cashfree integrations:
*   The registration and appointment forms include a phone validation utility.
*   Indian prefixes (`+91`) require a valid country code selection and enforce a strict 10-digit format check.

### Modern Responsive Design
The UI is styled with custom HSL color maps and modern Tailwind layouts:
*   **Glassmorphism Effects**: Cards are styled with custom `backdrop-blur` properties and transparent border borders.
*   **Currency Representation**: All billing references display prices in Indian Rupees (`₹`) to align with Cashfree integration rules.
*   **Theme Management**: Dark and light themes are managed via a custom react context (`ThemeContext.jsx`), switching class tokens on the root `<html>` element.

---

## 💻 Local Setup & Execution

1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment keys:
    ```bash
    cp .env.example .env
    ```
4.  Run in Development mode:
    ```bash
    npm run dev
    ```
    *Open `http://localhost:5173` to view the running client.*
5.  Generate a production bundle:
    ```bash
    npm run build
    ```
    *Saves optimized output chunks to `frontend/build`.*