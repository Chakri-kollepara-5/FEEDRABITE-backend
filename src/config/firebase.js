const admin = require('firebase-admin');

// Ensure that you have set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// pointing to your service account key JSON file path.
// Or initialize with explicit service account params (not recommended for production).

if (!admin.apps.length) {
  try {
    let serviceAccount;

    // Default: Try Base64 Env Var (Best for Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const buffer = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64');
      serviceAccount = JSON.parse(buffer.toString('utf-8'));
    } else {
      // Fallback: Try local file
      serviceAccount = require('./firebaseAdmin.json');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // storageBucket: process.env.FIREBASE_STORAGE_BUCKET 
    });
    console.log('Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

module.exports = admin;
