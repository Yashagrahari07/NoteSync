const NotificationService = require("../services/notification.service");

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const notifications = await NotificationService.getUserNotifications(
      req.user._id,
      parseInt(limit),
      parseInt(skip)
    );
    
    const unreadCount = await NotificationService.getUnreadCount(req.user._id);
    
    res.status(200).json({
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await NotificationService.markNotificationAsRead(
      notificationId,
      req.user._id
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllNotificationsAsRead(req.user._id);
    res.status(200).json({ 
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await NotificationService.deleteNotification(
      notificationId,
      req.user._id
    );
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user._id);
    res.status(200).json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
};
