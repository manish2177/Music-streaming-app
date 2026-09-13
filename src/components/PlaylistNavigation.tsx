import React from 'react';
import { Disc3, Plus, Music2, Globe, Lock } from 'lucide-react';
import { Playlist } from '../types';

interface PlaylistNavigationProps {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  onSelectPlaylist: (playlist: Playlist) => void;
  onOpenCreatePlaylist: () => void;
}

export const PlaylistNavigation: React.FC<PlaylistNavigationProps> = ({
  playlists,
  currentPlaylist,
  onSelectPlaylist,
  onOpenCreatePlaylist,
}) => {
  return (
    <nav
      id="playlist-navigation-bar"
      aria-label="My Playlists"
      className="w-full border-b border-white/5 bg-neutral-950/90 backdrop-blur-md sticky top-16 z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Navigation Label & Counter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
            <Disc3 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 hidden sm:inline-block">
            My Playlists
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
            {playlists.length}
          </span>
        </div>

        {/* Scrollable Playlist Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1 max-w-full">
          {playlists.map((pl) => {
            const isActive = currentPlaylist?.id === pl.id;
            const songCount = pl.songs ? pl.songs.length : (pl.songCount ?? 0);

            return (
              <button
                key={pl.id}
                id={`nav-playlist-${pl.id}`}
                onClick={() => onSelectPlaylist(pl)}
                style={{
                  borderColor: isActive ? pl.accentColor || '#8b5cf6' : undefined,
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-md border ring-1 ring-white/10'
                    : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/5 hover:border-white/15'
                }`}
              >
                <img
                  src={pl.coverImage}
                  alt={pl.name}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0 border border-white/10"
                />
                <span className="max-w-[130px] sm:max-w-[180px] truncate">{pl.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-neutral-400'
                  }`}
                >
                  {songCount}
                </span>
                {pl.isPrivate && (
                  <Lock className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
                )}
              </button>
            );
          })}

          {/* Quick Create Playlist Button */}
          <button
            id="nav-create-playlist-btn"
            onClick={onOpenCreatePlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600/15 hover:bg-violet-600/25 border border-dashed border-violet-500/40 text-violet-300 hover:text-white text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
