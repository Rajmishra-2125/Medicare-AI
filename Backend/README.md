# ⚙️ MediCare Backend API Service Guide

The MediCare Backend is a robust, production-grade Express.js application designed to handle high-concurrency clinical appointment bookings, real-time messaging, WebRTC telemedicine connections, and AI-assisted triage services.

Built using **Node.js (v18+)**, **Express.js**, and **MongoDB (Mongoose ODM)**, the service features strict input validation, automatic API key rotation, distributed logging, memory caching via Redis, and comprehensive error tracking.

---

## 🏗️ Backend System Architecture

```
Backend/
├── src/
│   ├── app.js               # Express application initialization and middleware stacking
│   ├── index.js             # Server bootstrapper (DB connection, socket mount, cron launch)
│   ├── socket.js            # Socket.io connection handshakes and WebRTC signaling
│   ├── config/              # Redis client, Cloudinary CDN, and Swagger specifications
│   ├── db/                  # MongoDB connection setup using Mongoose
│   ├── controllers/         # Request controllers handling HTTP requests
│   ├── routes/              # Route mapping and mounting (versioned at /api/v1)
│   ├── models/              # Schema structures (User, Doctor, Appointment, Slot, etc.)
│   ├── services/            # Core logical layers (Gemini Service, Cashfree Integration, Mailer)
│   ├── jobs/                # node-cron worker tasks
│   ├── middlewares/         # Authorization checks, role filters, rate limits, and error handling
│   ├── utils/               # Structured wrappers: ApiError, ApiResponse, Logger
│   └── validators/          # Zod validation schemas
├── Dockerfile               # Docker production deployment configuration
├── ecosystem.config.cjs     # PM2 clustering configuration
└── package.json             # Service dependencies and runner scripts
```

---

## 🔌 API Endpoints Reference

The base path for all endpoints is `/api/v1`.

### 🔓 Public & Authentication Paths
| Method | Route | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/healthcheck` | None | Returns server health status |
| `POST` | `/auth/register` | RateLimit | Registers a new Doctor or Patient |
| `POST` | `/auth/login` | RateLimit | Authenticates user; returns JWT cookie + access token |
| `POST` | `/auth/verify-otp` | RateLimit | Verifies phone verification OTP code |
| `POST` | `/auth/refresh-token` | None | Validates HttpOnly refresh cookie; rotates access tokens |
| `POST` | `/auth/forgot-password` | None | Initiates reset-token email pipeline |
| `POST` | `/auth/reset-password/:token`| None | Sets new password via token verification |

### 👤 Profile & User Operations
| Method | Route | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | JWT | Fetches active authenticated user profile |
| `PATCH` | `/users/update-profile` | JWT | Updates user credentials & contact details |
| `POST` | `/users/avatar` | JWT + Multer | Uploads user profile image to Cloudinary CDN |
| `PATCH` | `/users/change-password` | JWT | Modifies account access credentials |

### 👨‍⚕️ Clinicians & Slots Grid
| Method | Route | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/doctors` | None | Lists verified doctors with filter options |
| `GET` | `/doctors/:id` | None | Fetches detailed clinical profile and reviews |
| `POST` | `/doctors/onboard` | JWT (Admin) | Onboards and verifies doctor credentials |
| `GET` | `/slots/:doctorId` | JWT | Queries clinician's availability calendar |
| `POST` | `/slots/create` | JWT (Doctor) | Manually initializes custom time availability slots |

### 📅 Consultation Bookings
| Method | Route | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/appointments/book` | JWT (Patient) | Instantiates a pending consultation booking |
| `GET` | `/appointments/history` | JWT | Fetches active user booking records |
| `PATCH` | `/appointments/cancel/:id` | JWT | Cancels booking and releases calendar slot |
| `PATCH` | `/appointments/status/:id` | JWT (Doctor) | Marks consultations as `COMPLETED` or `IN_PROGRESS` |

### 💳 Cashfree Payments
| Method | Route | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/create-order` | JWT + RateLimit| Creates Cashfree PG order & returns session ID |
| `POST` | `/payments/verify-payment` | JWT + RateLimit| Webhook verifying transaction signatures |

### 🤖 MediBot AI Triage (Gemini)
| Method | Route | Middleware | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/agent/chat` | JWT + RateLimit| Processes user prompt via Gemini AI engine |

---

## 💳 Cashfree Payment Gateway Integration

MediCare uses the official **Cashfree PG SDK (`cashfree-pg` v6.0.4)** to process all billing transactions.

### Flow Architecture
1.  **Order Initiation**: The patient requests a booking. The `/payments/create-order` controller verifies the doctor's fee, reserves the slot (`status: "RESERVED"`), creates a local Mongoose `Payment` entry, and invokes `Cashfree.PGCreateOrder()`.
2.  **Checkout Handshake**: Cashfree returns a `payment_session_id`. The backend forwards this session ID along with the environment (e.g., `SANDBOX` or `PRODUCTION`) to the client.
3.  **Payment Verification**: Once checkout completes, the frontend sends the Cashfree `order_id` to `/payments/verify-payment`. The backend verifies the signature using `Cashfree.PGFetchOrder(order_id)` and updates the appointment status to `CONFIRMED` and payment status to `PAID`.

### Expiry Policies
*   When orders are created, they are flagged as `PENDING`.
*   A minute-by-minute background worker cancels unpaid orders older than 15 minutes, automatically releasing the calendar slots back to `AVAILABLE`.

---

## 🤖 MediBot AI Assistant & Key Rotation Engine

MediBot leverages the Google Gemini model (defaulting to `gemini-2.5-flash`) via the `@google/generative-ai` SDK.

### Multi-Key Rotation Strategy
To prevent service interruptions due to API quota depletion (429 Rate Limits), the backend implements a rotating key manager in [gemini.service.js](file:///Users/rajmishra/Desktop/Doctor-appointment-project/doctor-appointment-project/Backend/src/services/gemini.service.js):
*   **Key Source**: Reads a comma-separated list from `GEMINI_API_KEYS` or numbered keys `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, and `GEMINI_API_KEY_3`.
*   **Quota Monitoring**: The service wraps GenAI executions in a try-catch block. If a `429 Too Many Requests` or quota limit exception occurs, it increments the key index, registers the switch, and automatically retries the operation with the next available key.
*   **Throttling**: A `bottleneck` scheduler limits throughput to **2 concurrent requests per second** (500ms spacing) to stay within free-tier quotas.

### Chat Memory Cache
Conversation histories are cached in **Redis** with a 30-minute expiration time. This keeps conversation histories fast and light without bloating the primary MongoDB collections.

---

## 🔌 Real-Time Communications & WebRTC

The backend uses **Socket.io** to support real-time user notifications and WebRTC telemedicine signaling in [socket.js](file:///Users/rajmishra/Desktop/Doctor-appointment-project/doctor-appointment-project/Backend/src/socket.js).

### Security & Token Verification
*   **Handshake Middleware**: All socket connections verify the client's JWT access token on connection:
    ```javascript
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = decoded;
    ```
*   Spoofing is prevented by binding the socket's room actions directly to `socket.user._id`.

### WebRTC Telemedicine Signaling Channels
Doctors and patients join virtual consultations via the following events:
*   `webrtc:join-room`: Validates that the appointment exists in MongoDB and that the connecting user is either the doctor or the patient associated with that appointment.
*   `webrtc:offer` / `webrtc:answer`: Relays SDP parameters between peers.
*   `webrtc:ice-candidate`: Relays connectivity candidates.
*   `webrtc:leave`: Notifies the peer that a user has exited the consultation room.

### Emission Throttling
A connection-level rate limiter checks incoming client events:
*   Limits each socket to a maximum of **60 messages per minute**.
*   Exceeding this limit triggers a `Rate limit exceeded` warning and ignores subsequent inputs for that minute.

---

## ⏰ Automated Cron Tasks

Background workers are scheduled using `node-cron` in [cron.js](file:///Users/rajmishra/Desktop/Doctor-appointment-project/doctor-appointment-project/Backend/src/jobs/cron.js):

1.  **Daily Slot Generation** (`0 0 * * *`):
    Runs daily at midnight. Generates doctor availability slots for the next 7 days for all active clinicians.
2.  **Payment Timeout Cleanup** (`* * * * *`):
    Runs every minute. Finds pending appointments older than 15 minutes, marks them as `CANCELLED` (reason: `"Auto-cancelled due to payment timeout"`), and frees up the booked slot back to `AVAILABLE`.
3.  **Render Self-Ping** (`*/10 * * * *`):
    Runs every 10 minutes. Hits the `/healthcheck` route to prevent the Render free-tier instance from falling asleep.

---

## 💻 Local Setup

1.  Clone and navigate to the directory:
    ```bash
    cd Backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    ```bash
    cp .env.sample .env
    ```
4.  Launch the services:
    ```bash
    # Development mode (with nodemon hot reloading)
    npm run dev

    # Production mode
    npm start
    ```
