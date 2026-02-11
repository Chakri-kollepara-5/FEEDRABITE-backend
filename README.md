# Feedra Backend

Production-grade backend for **Feedra** — A Real-Time Food Redistribution Platform.

## Features

- **Authentication**: Firebase Auth + JWT Session Management.
- **Role-Based Access Control**: Donor, NGO, Volunteer, Admin.
- **Food Donation Management**: Create, view nearby, status updates, image upload.
- **Real-time Chat**: Messaging between users (Donor <-> NGO/Volunteer).
- **Notifications**: Push notifications via Firebase Cloud Messaging (FCM).
- **Impact Metrics**: Track meals saved and CO2 reduction.
- **Admin Panel API**: User management and analytics.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time / Auth**: Firebase (Auth, Firestore, Storage, Messaging/FCM)
- **Security**: Helmet, CORS, Rate Limiting (prepared)

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Instance (Local or Atlas)
- Firebase Project (Service Account Key)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment:
   - Copy `.env.example` to `.env`
   - Fill in `MONGO_URI`, `JWT_SECRET`, and Firebase paths.
   - Place `serviceAccountKey.json` in the root (or configure via env).

### Running Locally

```bash
# Development mode (nodemon)
npm run dev

# Production mode
npm start
```

## API Documentation

- **Auth**: `POST /api/auth/login`
- **Donations**:
  - `POST /api/donations/create`
  - `GET /api/donations/nearby?long=...&lat=...`
  - `GET /api/donations/my-donations`
- **Chat**:
  - `POST /api/chat/send`
  - `GET /api/chat/conversations`
- **Admin**:
  - `GET /api/admin/users`
  - `GET /api/admin/donation-analytics`

## Folder Structure

- `src/config`: Configuration (DB, Firebase)
- `src/controllers`: Request handlers
- `src/middlewares`: Auth, Validation, Error Handling
- `src/models`: Database Schemas
- `src/routes`: API Route definitions
- `src/services`: Business logic (Chat, Notifications, Upload)
- `src/utils`: Helpers

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) used for instructions.
