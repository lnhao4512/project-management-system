import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {
    setNotifications(state, action) {
      state.items = action.payload;
    },
    addNotification(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    setUnreadCount(state, action) {
      state.unreadCount = action.payload;
    },
    markRead(state, action) {
      const notif = state.items.find(n => n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.items.forEach(n => { n.isRead = true; });
      state.unreadCount = 0;
    },
    removeNotification(state, action) {
      const notif = state.items.find(n => n._id === action.payload);
      if (notif && !notif.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter(n => n._id !== action.payload);
    },
  },
});

export const {
  setNotifications,
  addNotification,
  setUnreadCount,
  markRead,
  markAllRead,
  removeNotification,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
