import { createSlice } from '@reduxjs/toolkit';
import { mockNotifications } from '../api/mockNotification';
const slice = createSlice({
  name: 'notifications',
  initialState: { items: mockNotifications },
  reducers: {
    markRead: (s, a) => {
      const n = s.items.find((x) => x.id === a.payload);
      if (n) n.isRead = true;
    },
  },
});
export const { markRead } = slice.actions;
export default slice.reducer;
