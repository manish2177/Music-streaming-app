import React, { useState } from 'react';
import { Music, Share2, Shield, ShieldCheck, Plus, Disc3, Radio } from 'lucide-react';
import { Playlist } from '../types';

interface NavbarProps {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  onSelectPlaylist: (pl: Playlist) => void;
  onOpenCreatePlaylist: () => void;
  onOpenShare: () => void;
  isOwnerUnlocked: boolean;
  onToggleOwnerMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  playlists,
  currentPlaylist,
  onSelectPlaylist,
  onOpenCreatePlaylist,
  onOpenShare,
  isOwnerUnlocked,
  onToggleOwnerMode,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              My Playlist
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
              Music Sharing
            </span>
          </div>
        </div>

        {/* Playlist Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Playlist Dropdown */}
          <div className="relative">
            <button
              id="playlist-selector-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 text-sm font-medium text-neutral-200 transition-colors"
            >
              <Disc3 className="w-4 h-4 text-violet-400" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate text-left">
                {currentPlaylist?.name || 'Select Playlist'}
              </span>
              <span className="text-xs text-neutral-500">▼</span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-neutral-900 border border-white/10 shadow-2xl p-1.5 z-20 space-y-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Playlists
                  </div>
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        onSelectPlaylist(pl);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                        currentPlaylist?.id === pl.id
                          ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                          : 'text-neutral-200 hover:bg-white/5'
                      }`}
                    >
                      <img
                        src={pl.coverImage}
                        alt={pl.name}
                        className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                      />
                      <div className="truncate flex-1">
                        <div className="truncate font-medium">{pl.name}</div>
                        <div className="text-xs text-neutral-400">
                          {pl.songs?.length || 0} songs
                        </div>
                      </div>
                    </button>
                  ))}

                  <div className="pt-1 border-t border-white/10">
                    <button
                      id="navbar-create-playlist-btn"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenCreatePlaylist();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Create New Playlist</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Share Button */}
          <button
            id="navbar-share-btn"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-neutral-200 transition-colors"
            title="Share Playlist"
          >
            <Share2 className="w-4 h-4 text-fuchsia-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Owner Mode Toggle */}
          <button
            id="navbar-owner-mode-btn"
            onClick={onToggleOwnerMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isOwnerUnlocked
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 border border-white/10'
            }`}
            title={isOwnerUnlocked ? 'Owner Mode Active' : 'Enter Owner PIN'}
          >
            {isOwnerUnlocked ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Owner Active</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Owner Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
