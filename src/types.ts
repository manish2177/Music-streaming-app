export interface SongComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  songTime?: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverImage: string;
  audioUrl: string;
  duration: number; // in seconds
  plays: number;
  likes: number;
  addedAt: string;
  comments?: SongComment[];
}

export interface Playlist {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string;
  accentColor: string;
  createdAt: string;
  isPrivate?: boolean;
  ownerPin?: string;
  songs: Song[];
  songCount?: number;
  totalDuration?: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentSong: Song | null;
  currentPlaylist: Playlist | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
}
