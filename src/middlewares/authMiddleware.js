const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      // 1. Try decoding as a custom backend JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        // If we can't find the user by Mongo ID, maybe the JWT payload is just raw data
        req.user = decoded;
      }
      
      return next();
    } catch (jwtError) {
      // 2. Fallback to Firebase decoding (if frontend sent a raw Firebase token)
      const { admin } = require("../config/firebase");
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Look up corresponding MongoDB User document by firebaseUid
      const mongoUser = await User.findOne({ firebaseUid: decodedToken.uid });
      if (mongoUser) {
        req.user = mongoUser;
      } else {
        req.user = { id: decodedToken.uid, ...decodedToken };
      }
      return next();
    }
  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

authMiddleware.protect = authMiddleware;
module.exports = authMiddleware;