# Feedra Backend Deployment Guide

This guide outlines how to deploy the Feedra backend to popular platforms.

## Prerequisites

- **MongoDB Atlas Cluster**: Ensure you have a cluster ready and the connection string.
- **Firebase Project**: You need `serviceAccountKey.json` contents or configured as environment variables.
- **Environment Variables**: Prepare the values from `.env.example`.

## Option 1: Render (Recommended for ease of use)

1. **Connect Repository**: Link your GitHub repository to Render.
2. **Create Web Service**: Select the repo.
3. **Runtime**: Node.js
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. **Environment Variables**: Add the following in the dashboard:
    - `NODE_ENV`: production
    - `MONGO_URI`: Your MongoDB connection string
    - `JWT_SECRET`: A strong secret
    - `FIREBASE_STORAGE_BUCKET`: Your Firebase Storage bucket name
    - `GOOGLE_APPLICATION_CREDENTIALS`: Path to json file. **Note**: For Render, it's easier to put the JSON content into a secret file or use a base64 encoded env var and decode it in `config/firebase.js`.
    
    *Alternative Firebase Setup for Render*:
    Encode your `serviceAccountKey.json` to base64:
    ```bash
    base64 -i serviceAccountKey.json -o serviceAccountBase64.txt
    ```
    Add `FIREBASE_SERVICE_ACCOUNT_BASE64` env var.
    Update `src/config/firebase.js` to read from this if file is missing.

## Option 2: Railway

1. **New Project**: Select "Deploy from GitHub repo".
2. **Variables**: Go to standard "Variables" tab and add all from `.env`.
3. **Start Command**: Railway automatically detects `npm start`.

## Option 3: Google Cloud Platform (App Engine)

1. Create `app.yaml` in the root:
    ```yaml
    runtime: nodejs18
    env_variables:
      NODE_ENV: "production"
      MONGO_URI: "your_mongo_uri"
      JWT_SECRET: "your_secret"
      # ... other env vars
    ```
2. Deploy:
    ```bash
    gcloud app deploy
    ```

## Post-Deployment Validation

- Hit the health check endpoint: `GET https://your-app-url/` -> Should return "Feedra API is running..."
- Test Login: `POST /api/auth/login` with a valid Firebase Token.
