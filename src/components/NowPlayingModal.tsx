import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  Sparkles,
  Headphones,
  Clock,
  Radio,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime, formatNumber, getSafeAccentColor } from '../utils/format';
import { SongComment } from '../types';

interface NowPlayingModalProps {
  onCommentAdded?: (songId: string, comment: SongComment) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ onCommentAdded }) => {
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
    visualizerData,
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
    nowPlayingOpen,
    setNowPlayingOpen,
  } = usePlayer();

  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'comments'>('visualizer');

  if (!nowPlayingOpen || !currentSong) return null;

  const isLiked = likedSongs.has(currentSong.id);
  const accent = getSafeAccentColor(currentPlaylist?.accentColor);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentPlaylist) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(
        `/api/playlists/${currentPlaylist.id}/songs/${currentSong.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: authorName.trim() || 'A Friend',
            text: commentText.trim(),
            songTime: includeTimestamp ? Math.floor(currentTime) : undefined,
          }),
        }
      );

      if (res.ok) {
        const newComment = await res.json();
        currentSong.comments = currentSong.comments || [];
        currentSong.comments.push(newComment);
        if (onCommentAdded) {
          onCommentAdded(currentSong.id, newComment);
        }
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-3xl overflow-y-auto flex flex-col">
      {/* Dynamic Background Glow from Cover Art */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[180px] opacity-30 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: accent }}
      />

      {/* Header */}
      <div className="relative max-w-5xl w-full mx-auto px-6 py-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-violet-400" />
          <span className="font-display font-bold text-sm tracking-wide uppercase text-neutral-300">
            Now Playing • {currentPlaylist?.name}
          </span>
        </div>

        <button
          onClick={() => setNowPlayingOpen(false)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-5xl w-full mx-auto px-6 py-6 sm:py-8 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Left Side: Large Artwork & Visualizer */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          {/* Cover Art with Vinyl Glow */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-900 group">
            <img
              src={currentSong.coverImage || currentPlaylist?.coverImage}
              alt={currentSong.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
            {/* Live Audio Visualizer Overlay at bottom of artwork */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end justify-center gap-1 px-4 pb-3">
              {visualizerData.slice(0, 20).map((val, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full transition-all duration-75"
                  style={{
                    height: `${val}%`,
                    backgroundColor: accent,
                    opacity: 0.85,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Song Title, Artist & Like */}
          <div className="w-full max-w-sm mt-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-white truncate">
                {currentSong.title}
              </h2>
              <p className="text-sm text-neutral-400 truncate mt-0.5">
                {currentSong.artist} • {currentSong.album || currentPlaylist?.name}
              </p>
            </div>

            <button
              onClick={() => toggleLike(currentSong.id)}
              className={`p-3 rounded-full bg-white/5 hover:bg-white/10 transition-transform active:scale-125 ${
                isLiked ? 'text-rose-500' : 'text-neutral-400 hover:text-white'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Timeline & Slider */}
          <div className="w-full max-w-sm mt-4">
            <div className="relative group flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full pointer-events-none"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: accent,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-400 font-mono mt-1.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-4 sm:gap-6 mt-4">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffled ? 'text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              style={isShuffled ? { color: accent } : {}}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={prevSong}
              className="p-2 text-neutral-300 hover:text-white transition-colors active:scale-90"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: accent,
                boxShadow: `0 8px 30px ${accent}80`,
              }}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={nextSong}
              className="p-2 text-neutral-300 hover:text-white transition-colors active:scale-90"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-colors ${
                repeatMode !== 'off' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              style={repeatMode !== 'off' ? { color: accent } : {}}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 mt-4 w-full max-w-xs">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolumeLevel(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right Side: Tab Switcher (Visualizer / Friend Comments) */}
        <div className="w-full lg:w-1/2 flex flex-col h-[480px] bg-neutral-900/60 rounded-3xl border border-white/10 p-5 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
            <button
              onClick={() => setActiveTab('visualizer')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'visualizer'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Audio Spectrum</span>
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'comments'
                  ? 'bg-white/15 text-white shadow'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Friend Reactions ({(currentSong.comments || []).length})</span>
            </button>
          </div>

          {/* Tab 1: Dynamic Visualizer Spectrum */}
          {activeTab === 'visualizer' && (
            <div className="flex-1 flex flex-col justify-between py-4">
              <div className="text-center space-y-1">
                <div className="text-xs text-neutral-400 font-medium">
                  {isSynthFallback ? 'Synthesizer Reactive Engine' : 'Audio Frequency Resonance'}
                </div>
                <div className="text-sm font-semibold text-white">
                  {isPlaying ? 'Track active & streaming' : 'Paused'}
                </div>
              </div>

              {/* Large Animated Frequency Visualizer */}
              <div className="h-44 flex items-end justify-center gap-1.5 px-4">
                {visualizerData.map((val, idx) => (
                  <div
                    key={idx}
                    className="w-2 rounded-t-md transition-all duration-100"
                    style={{
                      height: `${val}%`,
                      background: `linear-gradient(to top, ${accent}, #a855f7)`,
                    }}
                  />
                ))}
              </div>

              {/* Song Meta pills */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-neutral-300">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-neutral-400" />
                  <span>{currentSong.plays || 0} Total Listens</span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <span>{currentSong.likes || 0} Favorites</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Comments & Friend Reactions */}
          {activeTab === 'comments' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Comments Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {(!currentSong.comments || currentSong.comments.length === 0) ? (
                  <div className="text-center py-12 text-neutral-400 text-xs">
                    No reactions yet. Be the first friend to leave a thought!
                  </div>
                ) : (
                  currentSong.comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="font-semibold text-white">{c.author}</span>
                        {c.songTime !== undefined && (
                          <button
                            onClick={() => seekTo(c.songTime!)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 hover:bg-violet-600/50 transition-colors font-mono"
                            title="Jump to time"
                          >
                            ▶ {formatTime(c.songTime)}
                          </button>
                        )}
                      </div>
                      <p className="text-neutral-200 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handlePostComment} className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-1/3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                  <div className="flex-1 flex items-center justify-between px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-neutral-300">
                    <span>Tag @ {formatTime(currentTime)}</span>
                    <input
                      type="checkbox"
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                      className="rounded accent-violet-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave a comment or reaction..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
