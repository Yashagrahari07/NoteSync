const PendingInvitation = require('../models/pendingInvitation.model');
const Note = require('../models/note.model');
const NotificationModel = require('../models/notification.model');
const userModel = require('../models/user.model');

class InvitationController {
    // Accept a collaboration invitation
    static async acceptInvitation(req, res) {
        try {
            const { invitationId } = req.params;
            const userId = req.user._id;

            const invitation = await PendingInvitation.findOne({
                _id: invitationId,
                inviteeId: userId,
                status: 'pending'
            });

            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Invitation not found or already processed' }
                });
            }

            // Add user as collaborator to the note
            const note = await Note.findById(invitation.noteId);
            if (!note) {
                // Note was deleted, clean up invitation
                await PendingInvitation.findByIdAndDelete(invitationId);
                return res.status(404).json({
                    success: false,
                    error: { message: 'Note no longer exists' }
                });
            }

            // Check if already a collaborator
            const isAlreadyCollaborator = note.collaborators.some(
                c => c.userId.toString() === userId.toString()
            );

            if (!isAlreadyCollaborator) {
                const user = await userModel.findById(userId);
                note.collaborators.push({
                    userId: user._id,
                    email: user.email,
                    fullname: user.fullname
                });
                await note.save();
            }

            // Update invitation status
            invitation.status = 'accepted';
            await invitation.save();

            // Delete the notification
            await NotificationModel.deleteOne({
                invitationId: invitationId,
                userId: userId
            });

            // Create a success notification for the inviter
            await NotificationModel.create({
                userId: invitation.inviterId,
                type: 'collaboratorAdded',
                title: 'Invitation Accepted',
                message: `${req.user.fullname} accepted your invitation to collaborate`,
                noteId: invitation.noteId,
                noteTitle: invitation.noteTitle,
                noteOwner: invitation.inviterName
            });

            res.status(200).json({
                success: true,
                data: {
                    message: 'Invitation accepted successfully',
                    noteId: invitation.noteId,
                    noteTitle: invitation.noteTitle
                }
            });
        } catch (error) {
            console.error('Error accepting invitation:', error);
            res.status(500).json({
                success: false,
                error: { message: error.message }
            });
        }
    }

    // Reject a collaboration invitation
    static async rejectInvitation(req, res) {
        try {
            const { invitationId } = req.params;
            const userId = req.user._id;

            const invitation = await PendingInvitation.findOne({
                _id: invitationId,
                inviteeId: userId,
                status: 'pending'
            });

            if (!invitation) {
                return res.status(404).json({
                    success: false,
                    error: { message: 'Invitation not found or already processed' }
                });
            }

            // Update invitation status
            invitation.status = 'rejected';
            await invitation.save();

            // Delete the notification
            await NotificationModel.deleteOne({
                invitationId: invitationId,
                userId: userId
            });

            // Optionally notify the inviter that invitation was declined
            await NotificationModel.create({
                userId: invitation.inviterId,
                type: 'collaboratorRemoved',
                title: 'Invitation Declined',
                message: `${req.user.fullname} declined your invitation to collaborate`,
                noteId: invitation.noteId,
                noteTitle: invitation.noteTitle,
                noteOwner: invitation.inviterName
            });

            res.status(200).json({
                success: true,
                data: { message: 'Invitation declined' }
            });
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            res.status(500).json({
                success: false,
                error: { message: error.message }
            });
        }
    }

    // Get pending invitations for current user
    static async getPendingInvitations(req, res) {
        try {
            const userId = req.user._id;

            const invitations = await PendingInvitation.find({
                inviteeId: userId,
                status: 'pending'
            })
                .sort({ createdAt: -1 })
                .lean();

            res.status(200).json({
                success: true,
                data: invitations
            });
        } catch (error) {
            console.error('Error fetching invitations:', error);
            res.status(500).json({
                success: false,
                error: { message: error.message }
            });
        }
    }
}

module.exports = InvitationController;
