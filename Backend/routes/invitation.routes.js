const express = require('express');
const router = express.Router();
const InvitationController = require('../controllers/invitation.controller');
const { authUser } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authUser);

// Accept an invitation
router.post('/:invitationId/accept', InvitationController.acceptInvitation);

// Reject an invitation
router.post('/:invitationId/reject', InvitationController.rejectInvitation);

// Get pending invitations
router.get('/pending', InvitationController.getPendingInvitations);

module.exports = router;
