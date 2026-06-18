const admin = require("firebase-admin");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("🔥 Error parsing FIREBASE_SERVICE_ACCOUNT env variable:", err.message);
  }
} else {
  try {
    serviceAccount = require("./firebaseAdmin.json");
  } catch (err) {
    console.warn("⚠️ Warning: firebaseAdmin.json not found and FIREBASE_SERVICE_ACCOUNT env variable is missing. Firebase Admin SDK will not be initialized.");
  }
}

let db = null;
let auth = null;

if (serviceAccount) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  db = admin.firestore();
  auth = admin.auth();
} else {
  // Mock implementations to prevent immediate crash when other modules import db/auth
  db = {
    collection: () => {
      console.warn("⚠️ Firestore collection accessed but Firebase is not initialized!");
      return {
        doc: () => ({
          get: async () => ({ exists: false, data: () => null }),
          set: async () => {},
          update: async () => {},
          delete: async () => {},
        }),
        where: () => ({
          get: async () => ({ empty: true, docs: [] }),
        }),
      };
    }
  };
  auth = {
    verifyIdToken: async () => {
      throw new Error("Firebase Auth is disabled because no service account credentials were provided.");
    }
  };
}

module.exports = { db, auth, admin };
