const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
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
  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  ],
  quote: {
    text: { type: String, default: '' },
    author: { type: String, default: '' }
  },
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

module.exports = mongoose.model("note", noteSchema);