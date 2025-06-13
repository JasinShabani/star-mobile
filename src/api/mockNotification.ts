import { Notification } from '../models/types';
export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'weekly_rank', content: 'You are #1 this week!', isRead: false, createdAt: new Date().toISOString() },
  { id: 'n2', userId: 'u1', type: 'badge_awarded', content: '🔥 New badge: Rising Star', isRead: false, createdAt: new Date().toISOString() },
];
