const express = require('express');
const router = express.Router();
const UserPreferencesController = require('../controllers/userPreferences.controller');
const { authUser } = require('../middlewares/auth.middleware');

// Get user preferences
router.get('/', authUser, UserPreferencesController.getUserPreferences);

// Update user preferences
router.put('/', authUser, UserPreferencesController.updateUserPreferences);

// Update notification settings
router.put('/notifications', authUser, UserPreferencesController.updateNotificationSettings);

// Update real-time settings
router.put('/realtime', authUser, UserPreferencesController.updateRealTimeSettings);

module.exports = router;
