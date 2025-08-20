const UserPreferencesModel = require('../models/userPreferences.model');

class UserPreferencesService {
  static async getUserPreferences(userId) {
    try {
      let preferences = await UserPreferencesModel.findOne({ userId });
      
      if (!preferences) {
        // Create default preferences if they don't exist
        preferences = new UserPreferencesModel({ userId });
        await preferences.save();
      }
      
      return preferences;
    } catch (error) {
      throw new Error('Error fetching user preferences');
    }
  }

  static async updateUserPreferences(userId, updateData) {
    try {
      const preferences = await UserPreferencesModel.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, upsert: true }
      );
      
      return preferences;
    } catch (error) {
      throw new Error('Error updating user preferences');
    }
  }

  static async updateNotificationSettings(userId, notificationSettings) {
    try {
      const preferences = await UserPreferencesModel.findOneAndUpdate(
        { userId },
        { $set: { notifications: notificationSettings } },
        { new: true, upsert: true }
      );
      
      return preferences;
    } catch (error) {
      throw new Error('Error updating notification settings');
    }
  }

  static async updateRealTimeSettings(userId, realTimeSettings) {
    try {
      const preferences = await UserPreferencesModel.findOneAndUpdate(
        { userId },
        { $set: { realTime: realTimeSettings } },
        { new: true, upsert: true }
      );
      
      return preferences;
    } catch (error) {
      throw new Error('Error updating real-time settings');
    }
  }
}

module.exports = UserPreferencesService;
