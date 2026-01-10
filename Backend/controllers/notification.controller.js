const NotificationService = require('../services/notification.service');

class NotificationController {
  static async getUserNotifications(req, res) {
    try {
      const { limit = 50, skip = 0 } = req.query;
      const result = await NotificationService.getUserNotifications(
        req.user._id, 
        parseInt(limit), 
        parseInt(skip)
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await NotificationService.markNotificationAsRead(
        notificationId, 
        req.user._id
      );
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async markAllNotificationsAsRead(req, res) {
    try {
      const result = await NotificationService.markAllNotificationsAsRead(req.user._id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await NotificationService.deleteNotification(
        notificationId, 
        req.user._id
      );
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const count = await NotificationService.getUnreadCount(req.user._id);
      res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}

module.exports = NotificationController;
