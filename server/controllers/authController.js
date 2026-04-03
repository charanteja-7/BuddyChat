const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Input sanitization ───────────────────────────────────────────────────────

/**
 * Coerces a value to a plain string and strips any leading/trailing whitespace.
 * Prevents NoSQL operator injection (e.g. { $gt: "" }) from reaching Mongoose.
 */
const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : String(value ?? '').trim());

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Signs a JWT and writes it to an HTTP-only cookie on the response.
 * @param {object} res  - Express response object
 * @param {string} userId - MongoDB ObjectId string of the user
 */
const issueTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

/**
 * Returns a sanitized user object (no password field).
 */
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  isOnline: user.isOnline,
  createdAt: user.createdAt,
});

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new user account and issues a JWT cookie.
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const safeEmail = sanitizeString(email).toLowerCase();

    const existingUser = await User.findOne({ email: safeEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const user = await User.create({ name: sanitizeString(name), email: safeEmail, password });

    issueTokenCookie(res, user._id);

    return res.status(201).json({
      message: 'Account created successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * POST /api/auth/login
 * Verifies credentials and issues a JWT cookie.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const safeEmail = sanitizeString(email).toLowerCase();

    // Explicitly select password since the schema excludes it by default
    const user = await User.findOne({ email: safeEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Mark user online
    user.isOnline = true;
    await user.save({ validateBeforeSave: false });

    issueTokenCookie(res, user._id);

    return res.status(200).json({
      message: 'Logged in successfully.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * POST /api/auth/logout
 * Clears the JWT cookie.
 */
const logout = async (req, res) => {
  try {
    // Mark user offline if authenticated (best-effort)
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { isOnline: false });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({ message: 'Server error during logout.' });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's profile.
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: sanitizeUser(req.user) });
  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, logout, getMe };
