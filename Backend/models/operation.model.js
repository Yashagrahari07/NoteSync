const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const operationSchema = new Schema({
  noteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "note", 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
  },
  userFullname: {
    type: String,
    required: true
  },
  type: { 
    type: String, 
    enum: ['insert', 'delete'], 
    required: true 
  },
  position: { 
    type: Number, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  version: { 
    type: Number, 
    required: true 
  },
  applied: { 
    type: Boolean, 
    default: false 
  },
  conflictResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  resolvedAt: {
    type: Date
  }
});

// Index for efficient querying
operationSchema.index({ noteId: 1, version: 1 });
operationSchema.index({ noteId: 1, timestamp: 1 });
operationSchema.index({ userId: 1, timestamp: 1 });

module.exports = mongoose.model("operation", operationSchema);
