# MediCare Backend API

This repository contains the backend service for the **MediCare** Doctor Appointment Management System. Built with **Node.js**, **Express**, and **MongoDB**, this robust backend handles authentication, patient-doctor interactions, appointment scheduling, artificial intelligence (Gemini) chatbot features, real-time notifications via WebSockets, and secure payment processing.

---

## 🚀 Features & Architecture

- **Authentication & Authorization**: Secure JWT-based access with refresh tokens. Google OAuth is supported.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `PATIENT`, `DOCTOR`, and `ADMIN`.
- **Real-Time Communications**: Uses `Socket.io` for dynamic notifications and medical updates.
- **Artificial Intelligence Integration**: Built-in Google Generative AI (Gemini) integration in the `/agent` routes to power the MediBot assistant.
- **Payment Processing**: Integrated with `Cashfree` for seamless medical appointment transactions.
- **Caching & Rate Limiting**: Employs `Redis` along with `express-rate-limit` and `bottleneck` for scalable API performance.
- **Security**: Hardened via `helmet`, modern CORS configurations, and input validation.
- **Logging**: Robust, rotating file logs via `winston` and `morgan`.
- **Soft Delete Strategy**: Ensures data integrity by marking user, doctor, and patient profiles as `deleted` rather than hard purging. Scheduled chron jobs orchestrate final cleanup after a 30-day window.

---

## 🛠 Technology Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
- **Caching:** [Redis](https://redis.io/)
- **AI Agent:** [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai)
- **Websockets:** [Socket.io](https://socket.io/)
- **Payments:** [Cashfree](https://www.cashfree.com/)
- **Media Uploads:** [Cloudinary](https://cloudinary.com/) with Multer
- **Auth & Crypto:** `bcrypt`, `jsonwebtoken`, `google-auth-library`

---

## 📂 Project Structure

```bash
Backend/
├── src/
│   ├── app.js               # Express application and Middleware configuration
│   ├── index.js             # Main entry point and Server initialization
│   ├── socket.js            # Socket.io configuration and event handlers
│   ├── config/              # Environment and Redis/Cloudinary configuration
│   ├── controllers/         # Request handlers for HTTP routes
│   ├── db/                  # MongoDB Connection
│   ├── middlewares/         # Auth, Error handling, and validation filters
│   ├── models/              # Mongoose Data Schemas
│   ├── routes/              # Express API Route Definitions
│   ├── scripts/             # Useful maintenance scripts
│   ├── services/            # Reusable business logic (Auth, Payments)
│   ├── utils/               # Helpers: Async wrappers, ApiError, ApiResponse, Logger
│   └── validators/          # Data payload validation tools
├── ecosystem.config.cjs     # PM2 Configuration
├── Dockerfile               # Production Docker settings
└── package.json             # NPM dependencies and scripts
```

---

## 🌐 API Endpoint Overview

The API is versioned at `v1`. The base URL prefix is: `/api/v1`

| Resource          | Prefix             | Description                                                |
| ----------------- | ------------------ | ---------------------------------------------------------- |
| **Health**        | `/healthcheck`     | Service uptime and telemetry.                              |
| **Auth**          | `/auth`            | Login, Registration, OAuth, OTP verify, Tokens.            |
| **Admin**         | `/admin`           | System-wide management, Suspend accounts, global stats.    |
| **Users**         | `/users`           | Profile updates, avatar uploads, password modifications.   |
| **Doctors**       | `/doctors`         | Doctor directories, onboarding, verification, specialties. |
| **Appointments**  | `/appointments`    | Booking flow, cancellations, history, and status updates.  |
| **Slots**         | `/slots`           | Availability queries for doctors' time grids.              |
| **Medical Rec.**  | `/medical-records` | Manage patient prescriptions, history, and medical docs.   |
| **Payments**      | `/payments`        | Cashfree order creation and verification hooks.            |
| **Notifications** | `/notifications`   | Get unread alerts or mark notifications as viewed.         |
| **AI Agent**      | `/agent`           | Interact with the Gemini-powered MediBot assistant.        |

_(Detailed swagger/postman documentation to be hosted separately or via interactive `/docs` route if enabled)_

---

## 💻 Local Setup Instructions

### 1. Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** Instance (Local or Atlas)
- **Redis** Server (For caching and rate limiting)

### 2. Clone and Install

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install
```

### 3. Environment Variables

Create a `.env` file in the root of the `./Backend` directory using the provided `.env.sample`. Below are the critical keys required:

```ini
PORT=8000
MONGODB_URI=your_mongodb_cluster_url
CORS_ORIGIN=http://localhost:5173

# Authentication & Tokens
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# Email Transporter (SMTP)
MAIL_HOST=your_smtp_host
MAIL_PORT=your_smtp_port
MAIL_USER=your_smtp_user
MAIL_PASS=your_smtp_password

# External Integrations
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret

CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=SANDBOX

GEMINI_API_KEY=your_gemini_api_key

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 4. Running the Application

```bash
# Run in development mode (hot reload via nodemon)
npm run dev

# Run in production mode
npm start
```

By default, the server will launch on `http://localhost:8000`.

---

## 🧪 Background Jobs & Maintenance

Located in `src/jobs/`, the backend utilizes node-cron to periodically offload heavy database maintenance tasks.

- **Account Deletion Job**: Checks for accounts marked strictly for deletion more than 30 days ago and fully purges them and their relational dependencies (Appointments, slots, notifications) from MongoDB.

## 🤝 Contribution Structure

- **Formatting**: The project enforces prettier. Use `npm run format` prior to committing.
- **Error Handling**: Use the standardized `ApiError` class for all manual threshold exceptions.
- **Response Format**: Use the standardized `ApiResponse` wrapper in your controllers for consistency.
