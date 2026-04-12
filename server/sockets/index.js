const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');

/**
 * Parses and verifies the JWT from the socket handshake cookies.
 * Returns the decoded payload or null on failure.
 */
const authenticateSocket = (socket) => {
  try {
    const rawCookies = socket.handshake.headers.cookie || '';
    const cookies = cookie.parse(rawCookies);
    const token = cookies.token;

    if (!token) return null;

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

/**
 * Registers all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  // ── Authentication middleware ───────────────────────────────────────────────
  io.use(async (socket, next) => {
    const decoded = authenticateSocket(socket);
    if (!decoded) {
      return next(new Error('Authentication error: invalid or missing token.'));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('Authentication error: user not found.'));
    }

    socket.user = user; // Attach user to socket for later use
    next();
  });

  // Track online users: userId (string) → Set of socketIds
  const onlineUsers = new Map();

  /**
   * Broadcasts the current online user list to all connected clients.
   */
  const broadcastOnlineUsers = () => {
    io.emit('online-users', Array.from(onlineUsers.keys()));
  };

  // ── Connection handler ──────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    // Track socket for this user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Mark user online in DB (only on first connection)
    if (onlineUsers.get(userId).size === 1) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
    }

    broadcastOnlineUsers();

    // ── request-online-users ──────────────────────────────────────────────────
    socket.on('request-online-users', () => {
      socket.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // ── join-room ─────────────────────────────────────────────────────────────
    socket.on('join-room', async (groupId) => {
      try {
        // Verify the user is actually a member before joining the room
        const group = await Group.findOne({ _id: groupId, members: socket.user._id });
        if (!group) {
          socket.emit('error', { message: 'Access denied or group not found.' });
          return;
        }

        socket.join(groupId);
        console.log(`User ${userId} joined room ${groupId}`);
      } catch (err) {
        console.error('join-room error:', err.message);
        socket.emit('error', { message: 'Failed to join room.' });
      }
    });

    // ── send-message ──────────────────────────────────────────────────────────
    socket.on('send-message', async ({ groupId, content, mediaUrl, mediaType, replyTo }) => {
      try {
        if (!groupId || (!content && !mediaUrl)) {
          socket.emit('error', { message: 'groupId and either content or mediaUrl are required.' });
          return;
        }

        // Verify membership before persisting
        const group = await Group.findOne({ _id: groupId, members: socket.user._id });
        if (!group) {
          socket.emit('error', { message: 'Access denied or group not found.' });
          return;
        }

        const message = await Message.create({
          sender: socket.user._id,
          groupId,
          content: content ? content.trim() : undefined,
          mediaUrl,
          mediaType,
          replyTo,
        });

        await message.populate('sender', 'name email avatar');
        if (message.replyTo) {
          await message.populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar' } });
        }

        // Broadcast to everyone in the room, including the sender
        io.to(groupId).emit('new-message', message);
      } catch (err) {
        console.error('send-message error:', err.message);
        socket.emit('error', { message: 'Failed to send message.' });
      }
    });

    // ── edit-message ──────────────────────────────────────────────────────────
    socket.on('edit-message', async ({ messageId, groupId, content }) => {
      try {
        const message = await Message.findOne({ _id: messageId, sender: socket.user._id });
        if (!message) return socket.emit('error', { message: 'Message not found or unauthorized' });
        
        message.content = content.trim();
        message.isEdited = true;
        await message.save();
        await message.populate('sender', 'name email avatar');

        io.to(groupId).emit('message-updated', message);
      } catch (err) {
        console.error('edit-message error:', err.message);
        socket.emit('error', { message: 'Failed to edit message.' });
      }
    });

    // ── delete-message ────────────────────────────────────────────────────────
    socket.on('delete-message', async ({ messageId, groupId }) => {
      try {
        const message = await Message.findOne({ _id: messageId, sender: socket.user._id });
        if (!message) return socket.emit('error', { message: 'Message not found or unauthorized' });

        message.isDeleted = true;
        message.content = undefined;
        message.mediaUrl = undefined;
        message.mediaType = undefined;
        await message.save();
        await message.populate('sender', 'name email avatar');

        io.to(groupId).emit('message-updated', message);
      } catch (err) {
        console.error('delete-message error:', err.message);
        socket.emit('error', { message: 'Failed to delete message.' });
      }
    });

    // ── mark-messages-read ────────────────────────────────────────────────────
    socket.on('mark-messages-read', async ({ groupId }) => {
      try {
        await Message.updateMany(
          { 
            groupId, 
            sender: { $ne: socket.user._id }, 
            readBy: { $ne: socket.user._id } 
          },
          { $addToSet: { readBy: socket.user._id } }
        );

        socket.to(groupId).emit('messages-read', { groupId, userId: socket.user._id });
      } catch (err) {
        console.error('mark-messages-read error:', err.message);
      }
    });

    // ── typing ────────────────────────────────────────────────────────────────
    socket.on('typing', ({ groupId }) => {
      if (!groupId) return;
      // Broadcast to room members except the sender
      socket.to(groupId).emit('user-typing', {
        userId,
        name: socket.user.name,
      });
    });

    // ── stop-typing ───────────────────────────────────────────────────────────
    socket.on('stop-typing', ({ groupId }) => {
      if (!groupId) return;
      socket.to(groupId).emit('user-stop-typing', { userId });
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // Only mark offline when the last socket for this user disconnects
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false });
        }
      }

      broadcastOnlineUsers();
    });
  });
};

module.exports = initSocket;
