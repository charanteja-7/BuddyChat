const Group = require('../models/Group');

/**
 * POST /api/groups
 * Creates a new group with the current user as both admin and first member.
 */
const createGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const group = await Group.create({
      name: name.trim(),
      admin: req.user._id,
      members: [req.user._id],
    });

    await group.populate('members', 'name email avatar isOnline');
    await group.populate('admin', 'name email avatar');

    return res.status(201).json({ message: 'Group created.', group });
  } catch (error) {
    console.error('createGroup error:', error.message);
    return res.status(500).json({ message: 'Server error while creating group.' });
  }
};

/**
 * GET /api/groups
 * Returns all groups the current user is a member of.
 */
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email avatar isOnline')
      .populate('admin', 'name email avatar')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ groups });
  } catch (error) {
    console.error('getGroups error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching groups.' });
  }
};

/**
 * POST /api/groups/join/:inviteCode
 * Lets a user join a group using its invite code.
 */
const joinByInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code.' });
    }

    // Prevent duplicate membership
    const alreadyMember = group.members.some(
      (memberId) => memberId.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(409).json({ message: 'You are already a member of this group.' });
    }

    group.members.push(req.user._id);
    await group.save();

    await group.populate('members', 'name email avatar isOnline');
    await group.populate('admin', 'name email avatar');

    return res.status(200).json({ message: 'Joined group successfully.', group });
  } catch (error) {
    console.error('joinByInvite error:', error.message);
    return res.status(500).json({ message: 'Server error while joining group.' });
  }
};

/**
 * GET /api/groups/:id
 * Returns details of a specific group (only accessible to members).
 */
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email avatar isOnline')
      .populate('admin', 'name email avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember = group.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
    }

    return res.status(200).json({ group });
  } catch (error) {
    console.error('getGroupById error:', error.message);
    return res.status(500).json({ message: 'Server error while fetching group.' });
  }
};

module.exports = { createGroup, getGroups, joinByInvite, getGroupById };
