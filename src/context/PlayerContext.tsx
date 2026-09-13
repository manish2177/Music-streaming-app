import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Playlist, Song, RepeatMode } from '../types';
import { audioSynth } from '../utils/audioSynth';

interface PlayerContextType {
  currentPlaylist: Playlist | null;
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  recentlyPlayed: Song[];
  visualizerData: number[];
  audioError: string | null;
  isSynthFallback: boolean;
  nowPlayingOpen: boolean;

  // Actions
  playSong: (song: Song, playlist?: Playlist) => void;
  togglePlay: () => void;
  pauseSong: () => void;
  resumeSong: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekTo: (time: number) => void;
  setVolumeLevel: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (songId: string) => Promise<void>;
  likedSongs: Set<string>;
  setNowPlayingOpen: (open: boolean) => void;
  setCurrentPlaylist: (pl: Playlist | null) => void;
  stopPlayback: () => void;
  handleSongDeleted: (songId: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(24).fill(10));
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isSynthFallback, setIsSynthFallback] = useState<boolean>(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shuffledIndicesRef = useRef<number[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const synthTimerRef = useRef<any>(null);

  // Load liked songs and recently played from localStorage
  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('my_playlist_likes');
      if (savedLikes) {
        setLikedSongs(new Set(JSON.parse(savedLikes)));
      }
      const savedRecent = localStorage.getItem('my_playlist_recents');
      if (savedRecent) {
        setRecentlyPlayed(JSON.parse(savedRecent));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save liked songs
  const saveLikesToStorage = (newLikes: Set<string>) => {
    try {
      localStorage.setItem('my_playlist_likes', JSON.stringify(Array.from(newLikes)));
    } catch {
      // ignore
    }
  };

  // Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!isSynthFallback) {
        setCurrentTime(audio.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      handleTrackEnd();
    };

    const onError = () => {
      console.warn('HTMLAudio error encountered, switching to synthesized ambient audio fallback.');
      setAudioError('Audio streaming from external host had network/CORS restrictions. Playing ambient synthesizer audio!');
      switchToSynth();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audioSynth.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    };
  }, []);

  // Visualizer simulation or real frequency animation
  useEffect(() => {
    let active = true;
    const updateVisualizer = () => {
      if (!active) return;
      if (isPlaying) {
        const bars = Array.from({ length: 24 }, (_, i) => {
          // Dynamic undulating frequencies for rich aesthetic
          const base = 15;
          const variance = Math.sin(Date.now() * 0.005 + i * 0.4) * 35 + 40;
          const noise = Math.random() * 25;
          return Math.min(100, Math.max(10, Math.floor(base + variance * (volume || 0.5) + noise)));
        });
        setVisualizerData(bars);
      } else {
        setVisualizerData(new Array(24).fill(8));
      }
      animFrameRef.current = requestAnimationFrame(updateVisualizer);
    };

    animFrameRef.current = requestAnimationFrame(updateVisualizer);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, volume]);

  const switchToSynth = () => {
    setIsSynthFallback(true);
    audioSynth.setVolume(isMuted ? 0 : volume);
    audioSynth.start();
    setIsPlaying(true);

    // Simulate playback progress
    if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    synthTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (duration > 0 && prev >= duration) {
          handleTrackEnd();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopSynth = () => {
    setIsSynthFallback(false);
    audioSynth.stop();
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
  };

  const playSong = useCallback(
    async (song: Song, playlist?: Playlist) => {
      const pl = playlist || currentPlaylist;
      if (pl) {
        setCurrentPlaylist(pl);
      }
      setCurrentSong(song);
      setDuration(song.duration || 240);
      setCurrentTime(0);
      setAudioError(null);

      // Track recently played
      setRecentlyPlayed((prev) => {
        const filtered = prev.filter((s) => s.id !== song.id);
        const updated = [song, ...filtered].slice(0, 20);
        try {
          localStorage.setItem('my_playlist_recents', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      // Notify backend of play count increment
      if (pl) {
        fetch(`/api/playlists/${pl.id}/songs/${song.id}/play`, { method: 'POST' }).catch(() => {});
      }

      stopSynth();

      if (audioRef.current) {
        try {
          audioRef.current.src = song.audioUrl;
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          setIsPlaying(true);
          setIsSynthFallback(false);
        } catch (err: any) {
          console.warn('Playback play() was rejected:', err);
          // Fallback to synthesized audio to guarantee music plays smoothly
          switchToSynth();
        }
      } else {
        switchToSynth();
      }
    },
    [currentPlaylist, duration, isMuted, volume]
  );

  const togglePlay = () => {
    if (!currentSong) {
      // Play first song of playlist if available
      if (currentPlaylist && currentPlaylist.songs.length > 0) {
        playSong(currentPlaylist.songs[0], currentPlaylist);
      }
      return;
    }

    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const pauseSong = () => {
    setIsPlaying(false);
    if (isSynthFallback) {
      audioSynth.stop();
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    stopSynth();
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setCurrentSong(null);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
  }, []);

  const handleSongDeleted = useCallback(
    (deletedSongId: string) => {
      // If the deleted song is the currently playing song, stop playback and reset player
      if (currentSong?.id === deletedSongId) {
        stopPlayback();
      }

      // Update active playlist in player state
      setCurrentPlaylist((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          songs: (prev.songs || []).filter((s) => s.id !== deletedSongId),
        };
      });

      // Remove from recently played list
      setRecentlyPlayed((prev) => {
        const updated = prev.filter((s) => s.id !== deletedSongId);
        try {
          localStorage.setItem('my_playlist_recents', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      // Remove from liked songs
      setLikedSongs((prev) => {
        if (!prev.has(deletedSongId)) return prev;
        const updated = new Set<string>(prev);
        updated.delete(deletedSongId);
        saveLikesToStorage(updated);
        return updated;
      });
    },
    [currentSong, stopPlayback]
  );

  const resumeSong = () => {
    setIsPlaying(true);
    if (isSynthFallback) {
      audioSynth.start();
      if (synthTimerRef.current) clearInterval(synthTimerRef.current);
      synthTimerRef.current = setInterval(() => {
        setCurrentTime((prev) => prev + 1);
      }, 1000);
    } else if (audioRef.current) {
      audioRef.current.play().catch(() => switchToSynth());
    }
  };

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      if (currentSong) {
        seekTo(0);
        resumeSong();
      }
      return;
    }
    nextSong();
  };

  const nextSong = () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return;
    const songs = currentPlaylist.songs;

    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      playSong(songs[randomIndex]);
      return;
    }

    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    if (currentIndex === -1 || currentIndex === songs.length - 1) {
      if (repeatMode === 'all') {
        playSong(songs[0]);
      } else {
        pauseSong();
      }
    } else {
      playSong(songs[currentIndex + 1]);
    }
  };

  const prevSong = () => {
    if (!currentPlaylist || currentPlaylist.songs.length === 0) return;
    const songs = currentPlaylist.songs;

    // If more than 3 seconds in, restart track
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    if (currentIndex <= 0) {
      playSong(songs[songs.length - 1]);
    } else {
      playSong(songs[currentIndex - 1]);
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
    if (!isSynthFallback && audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolumeLevel = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (isSynthFallback) {
      audioSynth.setVolume(clamped);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.5;
      if (isSynthFallback) audioSynth.setVolume(volume || 0.5);
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
      if (isSynthFallback) audioSynth.setVolume(0);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleLike = async (songId: string) => {
    const isCurrentlyLiked = likedSongs.has(songId);
    const updated = new Set<string>(likedSongs);

    if (isCurrentlyLiked) {
      updated.delete(songId);
    } else {
      updated.add(songId);
    }
    setLikedSongs(updated);
    saveLikesToStorage(updated);

    // Call API
    if (currentPlaylist) {
      try {
        await fetch(`/api/playlists/${currentPlaylist.id}/songs/${songId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ increment: !isCurrentlyLiked }),
        });
      } catch {
        // ignore
      }
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentPlaylist,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffled,
        repeatMode,
        recentlyPlayed,
        visualizerData,
        audioError,
        isSynthFallback,
        nowPlayingOpen,
        playSong,
        togglePlay,
        pauseSong,
        resumeSong,
        nextSong,
        prevSong,
        seekTo,
        setVolumeLevel,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleLike,
        likedSongs,
        setNowPlayingOpen,
        setCurrentPlaylist,
        stopPlayback,
        handleSongDeleted,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
