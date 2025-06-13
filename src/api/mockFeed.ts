import { Video } from '../models/types';
export const mockVideos: Video[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `v${i}`,
  userId: 'u1',
  videoUrl: 'https://videos.pexels.com/video-files/31634320/13477389_1440_2560_30fps.mp4',
  thumbnailUrl: 'https://placehold.co/300x600',
  title: `Sample Video #${i}`,
  createdAt: new Date().toISOString(),
  isActive: true,
}));
