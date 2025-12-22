const admin = require("firebase-admin");

if (!process.env.FIREBASE_ADMIN) {
  throw new Error("❌ FIREBASE_ADMIN env missing");
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_ADMIN)
  ),
});

module.exports = admin;