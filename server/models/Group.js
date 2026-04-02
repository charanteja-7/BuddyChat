const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [80, 'Group name cannot exceed 80 characters'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Unique shareable code used for invite-link joins
    inviteCode: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

// Generate a cryptographically random invite code before first save
groupSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = crypto.randomBytes(6).toString('hex'); // 12-char hex string
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);
