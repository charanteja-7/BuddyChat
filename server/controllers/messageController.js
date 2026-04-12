const Message = require('../models/Message');
const Group = require('../models/Group');

/**
 * Verifies the requesting user is a member of the given group.
 * Returns the group document on success, or sends an error response.
 */
const verifyMembership = async (userId, groupId, res) => {
  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404).json({ message: 'Group not found.' });
    return null;
  }

  const isMember = group.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );
  if (!isMember) {
    res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
    return null;
  }

  return group;
};

/**
 * GET /api/messages/:groupId?page=1&limit=50
 * Returns paginated messages for a group, newest-first.
 */
const getMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const group = await verifyMembership(req.user._id, groupId, res);
    if (!group) return;

    const [messages, total] = await Promise.all([
      Message.find({ groupId })
        .populate('sender', 'name email avatar')
        .populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'name avatar' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ groupId }),
    ]);

    return res.status(200).json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    console.error('getMessages error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching messages.' });
  }
};

/**
 * POST /api/messages/:groupId
 * Saves a new message to the DB. Acts as an HTTP fallback when sockets are unavailable.
 */
const sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, mediaUrl, mediaType, replyTo } = req.body;

    if ((!content || !content.trim()) && !mediaUrl) {
      return res.status(400).json({ message: 'Message content or media is required.' });
    }

    const group = await verifyMembership(req.user._id, groupId, res);
    if (!group) return;

    const message = await Message.create({
      sender: req.user._id,
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

    return res.status(201).json({ message });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    return res.status(500).json({ message: 'Server error while sending message.' });
  }
};

module.exports = { getMessages, sendMessage };
