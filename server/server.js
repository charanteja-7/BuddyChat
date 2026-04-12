require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/uploadRoutes');
const initSocket = require('./sockets');

// ── App & HTTP server setup ───────────────────────────────────────────────────

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Required for cookies to be sent cross-origin
  })
);
app.use(express.json());
app.use(cookieParser());

// Global rate limit — defence-in-depth against volumetric abuse
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Health-check endpoint
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
  });
});

// ── Socket.IO ─────────────────────────────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

initSocket(io);

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`BuddyChat server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start();
