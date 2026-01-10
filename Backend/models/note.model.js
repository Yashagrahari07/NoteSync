const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: "Untitled Note",
  },
  content: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: "",
    trim: true,
    maxlength: 500
  },
  tags: {
    type: [String],
    default: []
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  owner: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    fullname: {
      type: String,
      required: true
    }
  },
  collaborators: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
      },
      email: {
        type: String,
        required: true
      },
      fullname: {
        type: String,
        required: true
      }
    }
  ],
  quote: {
    text: { type: String, default: '' },
    author: { type: String, default: '' }
  },
  // Note-specific settings for notifications and real-time collaboration
  settings: {
    notifications: {
      joinLeave: { type: Boolean, default: true },
      collaboratorChanges: { type: Boolean, default: true },
      liveEdits: { type: Boolean, default: true },
      cursorMoves: { type: Boolean, default: true }
    },
    realTime: {
      showCursors: { type: Boolean, default: true },
      showSelections: { type: Boolean, default: true },
      showPresence: { type: Boolean, default: true }
    }
  },
  // Phase 1: Enhanced real-time collaboration fields
  cursorPositions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    userFullname: String,
    position: {
      line: Number,
      ch: Number
    },
    timestamp: { type: Date, default: Date.now }
  }],
  createdOn: {
    type: Date,
    default: Date.now
  },
  updatedOn: {
    type: Date,
    default: Date.now
  }
});

noteSchema.pre("save", function (next) {
  this.updatedOn = Date.now();
  next();
});

// Indexes for efficient querying
noteSchema.index({ userId: 1, updatedOn: -1 });
noteSchema.index({ 'collaborators.userId': 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ isPinned: 1, updatedOn: -1 });

module.exports = mongoose.model("note", noteSchema);