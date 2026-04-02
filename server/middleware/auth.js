const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protects routes by verifying the JWT stored in an HTTP-only cookie.
 * On success, attaches the user document (without password) to req.user.
 */
const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid token. Please log in again.';
    return res.status(401).json({ message });
  }
};

module.exports = { protect };
