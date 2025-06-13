import { createSlice } from '@reduxjs/toolkit';
import { mockVideos } from '../api/mockFeed';
const slice = createSlice({
  name: 'feed',
  initialState: { videos: mockVideos, current: 0 },
  reducers: {
    like: (s, a) => { console.log('[like]', a.payload); },
    skip: (s, a) => { s.current = (s.current + 1) % s.videos.length; },
  },
});
export const { like, skip } = slice.actions;
export default slice.reducer;