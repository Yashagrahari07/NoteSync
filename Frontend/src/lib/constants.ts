// Application constants
export const APP_NAME = 'NoteSync';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    LOGOUT: '/users/logout',
    REFRESH_TOKEN: '/users/refresh-token',
    PROFILE: '/users/profile',
  },
  NOTES: {
    BASE: '/notes',
    BY_ID: (id: string) => `/notes/${id}`,
    COLLABORATORS: (id: string) => `/notes/${id}/collaborators`,
    PIN: (id: string) => `/notes/${id}/pin`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
} as const;

