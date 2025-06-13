import { Comment } from '../models/types';
export const mockComments: Comment[] = [
  { id: 'c1', userId: 'u2', videoId: 'v0', content: 'Nice!', createdAt: new Date().toISOString() },
  { id: 'c2', userId: 'u3', videoId: 'v0', content: 'Awesome video 👍', createdAt: new Date().toISOString() },
];