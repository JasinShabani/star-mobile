export interface AppUser {
    id: string; username: string; email: string; displayName?: string;
    profileImageUrl?: string; location?: string; weeklyPoints: number;
    joinedAt: string;
  }
  export interface Video {
    id: string; userId: string; videoUrl: string; thumbnailUrl: string;
    title: string; createdAt: string; isActive: boolean;
  }
  export interface Comment {
    id: string; userId: string; videoId: string; content: string; createdAt: string;
  }
  export interface Notification {
    id: string; userId: string; type: 'badge_awarded' | 'weekly_rank';
    content: string; isRead: boolean; createdAt: string;
  }