const admin = require("firebase-admin");

// 🔥 LOAD FROM ENV, NOT FILE
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = { admin, db };