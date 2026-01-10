const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const pendingInvitationSchema = new Schema({
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "note",
        required: true
    },
    noteTitle: {
        type: String,
        required: true
    },
    inviterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    inviterName: {
        type: String,
        required: true
    },
    inviterEmail: {
        type: String,
        required: true
    },
    inviteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    inviteeEmail: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
pendingInvitationSchema.index({ inviteeId: 1, status: 1 });
pendingInvitationSchema.index({ noteId: 1, inviteeId: 1 });
pendingInvitationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

module.exports = mongoose.model("pendingInvitation", pendingInvitationSchema);
