const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

// Index for efficient paginated message history retrieval per group
messageSchema.index({ groupId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
