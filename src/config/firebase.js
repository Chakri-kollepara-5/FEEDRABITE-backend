const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_ADMIN)
  ),
});

const db = admin.firestore();

module.exports = {
  admin,
  db,
};