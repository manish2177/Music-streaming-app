import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Maximize2,
  Heart,
  Music,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime, getSafeAccentColor } from '../utils/format';

export const PersistentPlayer: React.FC = () => {
  const {
    currentSong,
    currentPlaylist,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    likedSongs,
    isSynthFallback,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    setVolumeLevel,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    setNowPlayingOpen,
  } = usePlayer();

  if (!currentSong) return null;

  const isLiked = likedSongs.has(currentSong.id);
  const accent = getSafeAccentColor(currentPlaylist?.accentColor);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/90 backdrop-blur-2xl border-t border-white/10 shadow-2xl transition-all duration-300">
      {/* Synth / Network Fallback notification banner (subtle) */}
      {isSynthFallback && (
        <div className="bg-amber-500/15 border-b border-amber-500/20 px-4 py-1 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              Streaming via Ambient Chill Synthesizer (audio stream fallback active)
            </span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono flex-shrink-0 ml-2">
            66 BPM Lo-Fi
          </span>
        </div>
      )}

      {/* Main Bar Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-6">
        {/* Left: Track Info & Artwork */}
        <div className="flex items-center gap-3 min-w-0 w-1/4 sm:w-1/3">
          <button
            onClick={() => setNowPlayingOpen(true)}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10 shadow-md group focus:outline-none"
            title="Expand Now Playing"
          >
            <img
              src={currentSong.coverImage || currentPlaylist?.coverImage}
              alt={currentSong.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <button
              onClick={() => setNowPlayingOpen(true)}
              className="font-semibold text-xs sm:text-sm text-white truncate hover:underline text-left block w-full"
            >
              {currentSong.title}
            </button>
            <div className="text-[11px] sm:text-xs text-neutral-400 truncate">
              {currentSong.artist}
            </div>
          </div>

          <button
            onClick={() => toggleLike(currentSong.id)}
            className={`hidden sm:block p-2 rounded-full transition-colors active:scale-125 ${
              isLiked ? 'text-rose-500' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Timeline */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
          {/* Buttons row */}
          <div className="flex items-center gap-2 sm:gap-5">
            {/* Shuffle */}
            <button
              id="player-shuffle-btn"
              onClick={toggleShuffle}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                isShuffled
                  ? 'text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              style={isShuffled ? { color: accent } : {}}
              title={isShuffled ? 'Shuffle On' : 'Shuffle Off'}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              id="player-prev-btn"
              onClick={prevSong}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white transition-colors active:scale-90"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Play/Pause */}
            <button
              id="player-play-pause-btn"
              onClick={togglePlay}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: accent,
                boxShadow: `0 4px 16px ${accent}66`,
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              id="player-next-btn"
              onClick={nextSong}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white transition-colors active:scale-90"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              id="player-repeat-btn"
              onClick={toggleRepeat}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                repeatMode !== 'off'
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              style={repeatMode !== 'off' ? { color: accent } : {}}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Progress Timeline */}
          <div className="w-full flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
            <span className="w-9 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 group flex items-center">
              <input
                id="player-seek-slider"
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full pointer-events-none transition-all"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
            <span className="w-9 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Expand */}
        <div className="hidden md:flex items-center justify-end gap-3 w-1/4 sm:w-1/3">
          {/* Visualizer pill button */}
          <button
            onClick={() => setNowPlayingOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-neutral-300 border border-white/5 transition-colors"
            title="Now Playing & Visualizer"
          >
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden lg:inline">Visualizer</span>
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              id="player-volume-mute-btn"
              onClick={toggleMute}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              id="player-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
              className="w-20 sm:w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Expand */}
          <button
            id="player-expand-btn"
            onClick={() => setNowPlayingOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors"
            title="Full Screen / Now Playing"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
