const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authUser } = require('../middlewares/auth.middleware');

// Get user notifications
router.get('/', authUser, NotificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', authUser, NotificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', authUser, NotificationController.markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', authUser, NotificationController.markAllNotificationsAsRead);

// Delete notification
router.delete('/:notificationId', authUser, NotificationController.deleteNotification);

module.exports = router;
