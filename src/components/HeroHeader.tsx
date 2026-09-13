import React from 'react';
import { Play, Pause, Share2, Settings2, Clock, Music2, Headphones, Sparkles, Heart } from 'lucide-react';
import { Playlist } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { formatTotalDuration, getSafeAccentColor } from '../utils/format';

interface HeroHeaderProps {
  playlist: Playlist;
  onOpenShare: () => void;
  onOpenOwnerDashboard: () => void;
  isOwnerUnlocked: boolean;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  playlist,
  onOpenShare,
  onOpenOwnerDashboard,
  isOwnerUnlocked,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay, currentPlaylist } = usePlayer();

  const isCurrentPlaylistPlaying =
    isPlaying && currentPlaylist?.id === playlist.id;

  const totalDuration = playlist.songs.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalPlays = playlist.songs.reduce((acc, s) => acc + (s.plays || 0), 0);
  const accent = getSafeAccentColor(playlist.accentColor);

  const handleListenNow = () => {
    if (currentPlaylist?.id === playlist.id && currentSong) {
      togglePlay();
    } else if (playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist);
    }
  };

  return (
    <div className="relative overflow-hidden pt-6 pb-10 sm:py-12 border-b border-white/10">
      {/* Ambient Radial Accent Glow */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] opacity-40 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: accent }}
      />
      <div
        className="absolute top-10 right-0 w-80 h-80 rounded-full blur-[160px] opacity-25 pointer-events-none"
        style={{ backgroundColor: accent }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
          {/* Large Cover Artwork with Glow */}
          <div className="relative group flex-shrink-0">
            <div
              className="absolute -inset-1 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500"
              style={{ backgroundColor: accent }}
            />
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-neutral-900 flex-shrink-0">
              <img
                src={playlist.coverImage}
                alt={playlist.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              {isCurrentPlaylistPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                  <div className="flex items-end gap-1.5 h-10">
                    <span className="w-1.5 bg-white rounded-full animate-bounce h-6" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce h-10 delay-100" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce h-8 delay-200" />
                    <span className="w-1.5 bg-white rounded-full animate-bounce h-5 delay-300" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Playlist Info & Actions */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {playlist.isPrivate ? 'Private Playlist' : 'Shared Playlist'}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                • Curated for friends
              </span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight text-white leading-tight">
              {playlist.name}
            </h1>

            {playlist.description && (
              <p className="text-neutral-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                {playlist.description}
              </p>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-neutral-300 pt-1">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                <Music2 className="w-4 h-4 text-neutral-400" />
                <span><strong className="text-white">{playlist.songs.length}</strong> songs</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>{formatTotalDuration(totalDuration)}</span>
              </div>
              {totalPlays > 0 && (
                <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  <Headphones className="w-4 h-4 text-neutral-400" />
                  <span><strong className="text-white">{totalPlays}</strong> listens</span>
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                id="hero-listen-now-btn"
                onClick={handleListenNow}
                disabled={playlist.songs.length === 0}
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 10px 25px -5px ${accent}66`,
                }}
              >
                {isCurrentPlaylistPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause Playlist</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                    <span>Listen Now</span>
                  </>
                )}
              </button>

              <button
                id="hero-share-playlist-btn"
                onClick={onOpenShare}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Share2 className="w-4 h-4 text-fuchsia-300" />
                <span>Share Playlist</span>
              </button>

              {isOwnerUnlocked && (
                <button
                  id="hero-owner-dashboard-btn"
                  onClick={onOpenOwnerDashboard}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-full text-sm font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all duration-200 hover:scale-105"
                >
                  <Settings2 className="w-4 h-4" />
                  <span>Playlist Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
