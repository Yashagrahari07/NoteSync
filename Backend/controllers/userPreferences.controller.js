const UserPreferencesService = require('../services/userPreferences.service');

class UserPreferencesController {
  static async getUserPreferences(req, res) {
    try {
      const preferences = await UserPreferencesService.getUserPreferences(req.user._id);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateUserPreferences(req, res) {
    try {
      const { notifications, realTime } = req.body;
      const updateData = {};
      
      if (notifications) updateData.notifications = notifications;
      if (realTime) updateData.realTime = realTime;
      
      const preferences = await UserPreferencesService.updateUserPreferences(req.user._id, updateData);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateNotificationSettings(req, res) {
    try {
      const { notifications } = req.body;
      const preferences = await UserPreferencesService.updateNotificationSettings(req.user._id, notifications);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateRealTimeSettings(req, res) {
    try {
      const { realTime } = req.body;
      const preferences = await UserPreferencesService.updateRealTimeSettings(req.user._id, realTime);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = UserPreferencesController;
