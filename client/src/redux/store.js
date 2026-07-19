import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tasksReducer from './slices/tasksSlice';
import projectsReducer from './slices/projectsSlice';
import notificationsReducer from './slices/notificationsSlice';
import teamsReducer from './slices/teamsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    projects: projectsReducer,
    notifications: notificationsReducer,
    teams: teamsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled'],
      },
    }),
  devTools: import.meta.env.DEV,
});
