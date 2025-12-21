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