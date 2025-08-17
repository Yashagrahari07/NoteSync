const Notification = require("../models/notification.model");
const UserModel = require("../models/user.model");
const Note = require("../models/note.model");

// Create a new notification
exports.createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Get notifications for a user
exports.getUserNotifications = async (userId, limit = 50, skip = 0) => {
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('noteId', 'title')
      .populate('actor.userId', 'fullname');
    
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read for a user
exports.markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

// Delete a notification
exports.deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId
    });
    return notification;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};

// Get unread notification count
exports.getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      userId,
      isRead: false
    });
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

// Create notification for user join/leave events
exports.createUserActivityNotification = async (type, noteId, actorId, targetUserIds) => {
  try {
    const [note, actor] = await Promise.all([
      Note.findById(noteId).select('title'),
      UserModel.findById(actorId).select('fullname')
    ]);

    if (!note || !actor) {
      console.error("Note or actor not found for notification");
      return;
    }

    const notificationData = {
      type,
      noteId,
      noteTitle: note.title,
      actor: {
        userId: actorId,
        fullname: actor.fullname
      }
    };

    // Set notification content based on type
    switch (type) {
      case 'userJoined':
        notificationData.title = 'User Joined Note';
        notificationData.message = `${actor.fullname} joined "${note.title}"`;
        break;
      case 'userLeft':
        notificationData.title = 'User Left Note';
        notificationData.message = `${actor.fullname} left "${note.title}"`;
        break;
      case 'collaboratorAdded':
        notificationData.title = 'Collaborator Added';
        notificationData.message = `${actor.fullname} added you as a collaborator to "${note.title}"`;
        break;
      case 'collaboratorRemoved':
        notificationData.title = 'Collaborator Removed';
        notificationData.message = `${actor.fullname} removed you from "${note.title}"`;
        break;
      default:
        return;
    }

    // Create notifications for all target users
    const notifications = targetUserIds.map(userId => ({
      ...notificationData,
      userId
    }));

    await Notification.insertMany(notifications);
    return notifications;
  } catch (error) {
    console.error("Error creating user activity notification:", error);
    throw error;
  }
};
