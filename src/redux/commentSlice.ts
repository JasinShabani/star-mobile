import { createSlice } from '@reduxjs/toolkit';
import { mockComments } from '../api/mockComments';
const slice = createSlice({
  name: 'comments',
  initialState: { items: mockComments },
  reducers: {
    addComment: (s, a) => { s.items.push(a.payload); },
  },
});
export const { addComment } = slice.actions;
export default slice.reducer;