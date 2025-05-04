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