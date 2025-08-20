import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const fetchUserPreferences = createAsyncThunk(
  'userPreferences/fetchUserPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-preferences`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'userPreferences/updateNotificationSettings',
  async (notificationSettings, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-preferences/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notifications: notificationSettings }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRealTimeSettings = createAsyncThunk(
  'userPreferences/updateRealTimeSettings',
  async (realTimeSettings, { rejectWithValue }) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user-preferences/realtime`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ realTime: realTimeSettings }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update real-time settings');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const userPreferencesSlice = createSlice({
  name: 'userPreferences',
  initialState: {
    notifications: {
      joinLeave: true,
      collaboratorChanges: true,
      liveEdits: false,
      cursorMoves: false
    },
    realTime: {
      showCursors: true,
      showSelections: true,
      showPresence: true
    },
    loading: false,
    error: null
  },
  reducers: {
    updateNotificationSettingsLocal: (state, action) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateRealTimeSettingsLocal: (state, action) => {
      state.realTime = { ...state.realTime, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user preferences
      .addCase(fetchUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.realTime = action.payload.realTime;
      })
      .addCase(fetchUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update notification settings
      .addCase(updateNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update real-time settings
      .addCase(updateRealTimeSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRealTimeSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.realTime = action.payload.realTime;
      })
      .addCase(updateRealTimeSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  updateNotificationSettingsLocal, 
  updateRealTimeSettingsLocal, 
  clearError 
} = userPreferencesSlice.actions;

export default userPreferencesSlice.reducer;
