const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      // Create a custom error or just send response
      // For now, next(error) works if we have error handler, or res.status...
      const err = new Error('Not authorized, token failed');
      err.statusCode = 401; // basic
      next(err);
    }
  }

  if (!token) {
    res.status(401);
    const err = new Error('Not authorized, no token');
    err.statusCode = 401;
    next(err);
  }
};

module.exports = { protect };