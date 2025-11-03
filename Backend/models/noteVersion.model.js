const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const noteVersionSchema = new Schema({
  noteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "note", 
    required: true 
  },
  version: { 
    type: Number, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
  },
  createdByFullname: {
    type: String,
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  changes: [{
    type: { 
      type: String, 
      enum: ['insert', 'delete', 'update'] 
    },
    position: Number,
    content: String,
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "user" 
    },
    userFullname: String,
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  conflictResolved: {
    type: Boolean,
    default: false
  },
  conflictDetails: {
    operations: [{
      type: { type: String, enum: ['insert', 'delete'] },
      position: Number,
      content: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      userFullname: String,
      timestamp: Date
    }],
    resolution: {
      type: String,
      enum: ['local', 'remote', 'manual', 'last-write-wins']
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    resolvedAt: Date
  }
});

// Index for efficient querying
noteVersionSchema.index({ noteId: 1, version: -1 });
noteVersionSchema.index({ noteId: 1, createdAt: -1 });
noteVersionSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model("noteVersion", noteVersionSchema);
