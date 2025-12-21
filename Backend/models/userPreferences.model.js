const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userPreferencesSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true,
    unique: true
  },
  notifications: {
    joinLeave: { type: Boolean, default: true },
    collaboratorChanges: { type: Boolean, default: true },
    liveEdits: { type: Boolean, default: false },
    cursorMoves: { type: Boolean, default: false }
  },
  realTime: {
    showCursors: { type: Boolean, default: true },
    showSelections: { type: Boolean, default: true },
    showPresence: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userPreferencesSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
userPreferencesSchema.index({ userId: 1 }); // Already unique, but explicit index

module.exports = mongoose.model("userPreferences", userPreferencesSchema);
