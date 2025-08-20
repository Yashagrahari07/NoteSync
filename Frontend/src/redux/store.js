import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // Use localStorage as the default storage
import authReducer from './slices/authSlice';
import userPreferencesReducer from './slices/userPreferencesSlice';

const persistConfig = {
  key: 'root', // Key for localStorage
  storage, // Use localStorage
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedUserPreferencesReducer = persistReducer(persistConfig, userPreferencesReducer);

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer, // Use the persisted reducer
    userPreferences: persistedUserPreferencesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'], // Ignore redux-persist actions
      },
    }),
});

export const persistor = persistStore(store); // Create a persistor
export default store;