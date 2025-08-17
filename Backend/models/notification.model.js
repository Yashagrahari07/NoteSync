const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  type: {
    type: String,
    enum: ['collaboratorAdded', 'collaboratorRemoved', 'liveEdit'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "note"
  },
  noteTitle: {
    type: String
  },
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    fullname: {
      type: String
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("notification", notificationSchema);
