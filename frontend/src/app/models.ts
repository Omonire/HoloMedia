export interface User {
  id: number;
  username: string;
  full_name: string;
  bio: string;
  avatar_color: string;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
  post_count: number;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
  is_self?: boolean;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  artwork_url: string | null;
  preview_url: string | null;
  duration_ms: number | null;
  explicit: boolean;
  spotify_url: string | null;
}

export interface Post {
  id: number;
  content: string;
  image_url: string | null;
  video_url: string | null;
  sound: string | null;
  sound_track_id: string | null;
  sound_artist: string | null;
  sound_artwork: string | null;
  sound_preview: string | null;
  sound_url: string | null;
  group_id: number | null;
  created_at: string;
  author: User;
  likes_count: number;
  comments_count: number;
  liked: boolean;
  my_reaction: string | null;
  reactions: Record<string, number>;
  reposts_count: number;
  reposted: boolean;
  bookmarks_count: number;
  bookmarked: boolean;
  is_repost: boolean;
  repost_of: Post | null;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  icon_color: string;
  created_at: string;
  members_count: number;
  posts_count: number;
  created_by: User;
  is_member?: boolean;
  is_creator?: boolean;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: User;
}

export interface Message {
  id: number;
  content: string;
  read: boolean;
  created_at: string;
  sender_id: number;
  recipient_id: number;
  mine: boolean;
}

export interface Conversation {
  user: User;
  last_message: Message;
  unread: number;
}

export interface NotificationItem {
  id: number;
  kind: 'follow' | 'like' | 'comment' | 'message' | 'repost' | 'group';
  read: boolean;
  post_id: number | null;
  created_at: string;
  actor: User;
}
