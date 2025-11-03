import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchUserPreferences, 
  updateNotificationSettings,
  updateRealTimeSettings 
} from '../redux/slices/userPreferencesSlice';
import { Settings, Bell, Eye, EyeOff, Users, MousePointer } from 'lucide-react';

const NotificationSettings = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { notifications, realTime, loading } = useSelector(state => state.userPreferences);
  
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [localRealTime, setLocalRealTime] = useState(realTime);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUserPreferences());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    setLocalNotifications(notifications);
    setLocalRealTime(realTime);
  }, [notifications, realTime]);

  const handleNotificationChange = (key, value) => {
    const updated = { ...localNotifications, [key]: value };
    setLocalNotifications(updated);
    dispatch(updateNotificationSettings(updated));
  };

  const handleRealTimeChange = (key, value) => {
    const updated = { ...localRealTime, [key]: value };
    setLocalRealTime(updated);
    dispatch(updateRealTimeSettings(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Settings size={20} />
              Collaboration Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Notification Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={18} />
              Notifications
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Join/Leave Notifications</p>
                  <p className="text-xs text-gray-500">Show when users join or leave notes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localNotifications.joinLeave}
                    onChange={(e) => handleNotificationChange('joinLeave', e.target.checked)}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Collaborator Changes</p>
                  <p className="text-xs text-gray-500">Show when collaborators are added/removed</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localNotifications.collaboratorChanges}
                    onChange={(e) => handleNotificationChange('collaboratorChanges', e.target.checked)}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Live Edit Notifications</p>
                  <p className="text-xs text-gray-500">Show when others are actively editing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localNotifications.liveEdits}
                    onChange={(e) => handleNotificationChange('liveEdits', e.target.checked)}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>


            </div>
          </div>

          {/* Real-time Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Users size={18} />
              Real-time Features
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Show Presence</p>
                  <p className="text-xs text-gray-500">Display user presence indicators</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localRealTime.showPresence}
                    onChange={(e) => handleRealTimeChange('showPresence', e.target.checked)}
                    className="sr-only peer"
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
