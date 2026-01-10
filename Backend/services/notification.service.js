const NotificationModel = require('../models/notification.model');

class NotificationService {
  static async createNotification(notificationData) {
    try {
      const notification = new NotificationModel(notificationData);
      await notification.save();
      return notification;
    } catch (error) {
      throw new Error('Error creating notification');
    }
  }

  static async getUserNotifications(userId, limit = 50, skip = 0) {
    try {
      const notifications = await NotificationModel.find({ userId })
        .select('type title message noteId noteTitle noteOwner invitationId isRead createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const unreadCount = await NotificationModel.countDocuments({
        userId,
        isRead: false
      });

      return { notifications, unreadCount };
    } catch (error) {
      throw new Error('Error fetching notifications');
    }
  }

  static async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await NotificationModel.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      )
        .select('type title message noteId noteTitle noteOwner invitationId isRead createdAt')
        .lean();
      return notification;
    } catch (error) {
      throw new Error('Error marking notification as read');
    }
  }

  static async markAllNotificationsAsRead(userId) {
    try {
      await NotificationModel.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      return { success: true };
    } catch (error) {
      throw new Error('Error marking all notifications as read');
    }
  }

  static async deleteNotification(notificationId, userId) {
    try {
      const notification = await NotificationModel.findOneAndDelete({
        _id: notificationId,
        userId
      });
      return notification;
    } catch (error) {
      throw new Error('Error deleting notification');
    }
  }

  static async getUnreadCount(userId) {
    try {
      const count = await NotificationModel.countDocuments({
        userId,
        isRead: false
      });
      return count;
    } catch (error) {
      throw new Error('Error getting unread count');
    }
  }

  // Create collaborator change notifications
  static async createCollaboratorNotification(type, noteId, noteTitle, noteOwner, targetUserId, actionUser) {
    try {
      let title, message;

      if (type === 'collaboratorAdded') {
        title = 'Added to Note';
        message = `${actionUser.fullname} added you as a collaborator`;
      } else if (type === 'collaboratorRemoved') {
        title = 'Removed from Note';
        message = `${actionUser.fullname} removed you as a collaborator`;
      }

      const notification = await this.createNotification({
        userId: targetUserId,
        type,
        title,
        message,
        noteId,
        noteTitle,
        noteOwner: noteOwner ? noteOwner.fullname : 'Unknown'
      });


      return notification;
    } catch (error) {
      console.error('Error creating collaborator notification:', error);
      throw new Error('Error creating collaborator notification');
    }
  }
}

module.exports = NotificationService;
