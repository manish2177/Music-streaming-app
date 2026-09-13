import React, { useState, useEffect, useCallback } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Playlist, Song, SongComment } from './types';
import { Navbar } from './components/Navbar';
import { PlaylistNavigation } from './components/PlaylistNavigation';
import { HeroHeader } from './components/HeroHeader';
import { SongList } from './components/SongList';
import { PersistentPlayer } from './components/PersistentPlayer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { ShareModal } from './components/ShareModal';
import { OwnerDashboardModal } from './components/OwnerDashboardModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { Radio, Loader2, Music4 } from 'lucide-react';

function PlaylistApp() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);

  // Modals
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerInitialTab, setOwnerInitialTab] = useState<
    'playlists' | 'add-song' | 'settings' | 'manage'
  >('playlists');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { setCurrentPlaylist, playSong, currentSong, setNowPlayingOpen, handleSongDeleted } = usePlayer();

  // Load all playlists and parse URL slug on initial mount
  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await fetch('/api/playlists');
      if (!res.ok) throw new Error('Failed to fetch playlists');
      const data = await res.json();
      setPlaylists(data);

      // Check current pathname for /playlist/:slug
      const path = window.location.pathname;
      const match = path.match(/\/playlist\/([^/]+)/);
      const targetSlug = match ? match[1] : null;

      let chosen = data[0];
      if (targetSlug) {
        const found = data.find((p: any) => p.slug === targetSlug || p.id === targetSlug);
        if (found) chosen = found;
      }

      if (chosen) {
        await loadFullPlaylist(chosen.slug || chosen.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFullPlaylist = async (slugOrId: string) => {
    try {
      const res = await fetch(`/api/playlists/${slugOrId}`);
      if (!res.ok) return;
      const full = await res.json();
      setActivePlaylist(full);
      setCurrentPlaylist(full);

      // Update browser URL without reload if needed
      if (window.location.pathname !== `/playlist/${full.slug}`) {
        window.history.pushState(null, '', `/playlist/${full.slug}`);
      }
    } catch (err) {
      console.error('Failed to load playlist details', err);
    }
  };

  useEffect(() => {
    fetchPlaylists();

    // Listen to popstate (back/forward button)
    const onPopState = () => {
      const match = window.location.pathname.match(/\/playlist\/([^/]+)/);
      if (match) {
        loadFullPlaylist(match[1]);
      }
    };
    window.addEventListener('popstate', onPopState);

    // Check if owner was previously unlocked this session
    if (sessionStorage.getItem('my_playlist_owner_unlocked') === 'true') {
      setIsOwnerUnlocked(true);
    }

    return () => window.removeEventListener('popstate', onPopState);
  }, [fetchPlaylists]);

  // Playlist switching
  const handleSelectPlaylist = (pl: Playlist) => {
    loadFullPlaylist(pl.slug || pl.id);
  };

  // Owner authentication
  const handleUnlockOwner = async (pin: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          playlistId: activePlaylist?.id,
        }),
      });

      if (res.ok) {
        setIsOwnerUnlocked(true);
        sessionStorage.setItem('my_playlist_owner_unlocked', 'true');
        sessionStorage.setItem('my_playlist_owner_pin', pin);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleToggleOwnerMode = () => {
    if (isOwnerUnlocked) {
      // Open dashboard directly in My Playlists view
      setOwnerInitialTab('playlists');
      setOwnerModalOpen(true);
    } else {
      setOwnerModalOpen(true);
    }
  };

  // Add song
  const handleAddSong = async (songData: any) => {
    if (!activePlaylist) return;
    const res = await fetch(`/api/playlists/${activePlaylist.id}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(songData),
    });

    if (res.ok) {
      const newSong = await res.json();
      const updatedSongs = [...activePlaylist.songs, newSong];
      const updatedPlaylist = { ...activePlaylist, songs: updatedSongs };
      setActivePlaylist(updatedPlaylist);
      setCurrentPlaylist(updatedPlaylist);

      // Update playlists list
      setPlaylists((prev) =>
        prev.map((p) => (p.id === activePlaylist.id ? { ...p, songs: updatedSongs } : p))
      );
    }
  };

  // Batch songs added handler
  const handleBatchSongsAdded = (updatedSongs: Song[]) => {
    if (!activePlaylist) return;
    const updated = { ...activePlaylist, songs: updatedSongs };
    setActivePlaylist(updated);
    setCurrentPlaylist(updated);
    setPlaylists((prev) =>
      prev.map((p) => (p.id === activePlaylist.id ? { ...p, songs: updatedSongs } : p))
    );
  };

  // Edit song
  const handleEditSong = async (songId: string, data: Partial<Song>) => {
    if (!activePlaylist) return;
    const res = await fetch(`/api/playlists/${activePlaylist.id}/songs/${songId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updatedSong = await res.json();
      const updatedSongs = activePlaylist.songs.map((s) =>
        s.id === songId ? { ...s, ...updatedSong } : s
      );
      const updated = { ...activePlaylist, songs: updatedSongs };
      setActivePlaylist(updated);
      setCurrentPlaylist(updated);
    }
  };

  // Delete song
  const handleDeleteSong = async (songId: string): Promise<void> => {
    if (!activePlaylist) return;

    const pin = sessionStorage.getItem('my_playlist_owner_pin') || '1234';

    const res = await fetch(`/api/playlists/${activePlaylist.id}/songs/${songId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-pin': pin,
      },
    });

    if (!res.ok) {
      let message = 'Unable to delete this song. Please try again.';
      try {
        const errorData = await res.json();
        if (errorData.code === 'AUTH_FAILED') {
          message = 'Permission denied: Invalid owner PIN.';
        } else if (errorData.code === 'SONG_NOT_FOUND') {
          message = 'Song was not found in this playlist.';
        } else if (errorData.error) {
          message = errorData.error;
        }
      } catch (parseErr) {
        console.error('Failed to parse error response:', parseErr);
      }
      console.error('DELETE /api/playlists/... failed with status:', res.status, res.statusText);
      throw new Error(message);
    }

    // Update frontend state immediately without requiring reload
    const updatedSongs = activePlaylist.songs.filter((s) => s.id !== songId);
    const updated = { ...activePlaylist, songs: updatedSongs };
    setActivePlaylist(updated);
    setCurrentPlaylist(updated);

    // Update playlists cache
    setPlaylists((prev) =>
      prev.map((p) => (p.id === activePlaylist.id ? { ...p, songs: updatedSongs } : p))
    );

    // If deleted song is currently playing, stop playback and clean player state
    handleSongDeleted(songId);
  };

  // Reorder songs
  const handleReorderSongs = async (songIds: string[]) => {
    if (!activePlaylist) return;

    // Optimistic update
    const songMap = new Map<string, Song>(activePlaylist.songs.map((s) => [s.id, s]));
    const reordered: Song[] = [];
    for (const id of songIds) {
      const s = songMap.get(id);
      if (s) {
        reordered.push(s);
      }
    }

    const updated = { ...activePlaylist, songs: reordered };
    setActivePlaylist(updated);
    setCurrentPlaylist(updated);

    try {
      await fetch(`/api/playlists/${activePlaylist.id}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds }),
      });
    } catch (err) {
      console.error('Failed to sync song order', err);
    }
  };

  // Update playlist
  const handleUpdatePlaylist = async (updatedData: Partial<Playlist>) => {
    if (!activePlaylist) return;
    const res = await fetch(`/api/playlists/${activePlaylist.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    if (res.ok) {
      const saved = await res.json();
      const updatedPlaylist = { ...activePlaylist, ...saved };
      setActivePlaylist(updatedPlaylist);
      setCurrentPlaylist(updatedPlaylist);

      setPlaylists((prev) =>
        prev.map((p) => (p.id === activePlaylist.id ? { ...p, ...saved } : p))
      );

      if (saved.slug && saved.slug !== activePlaylist.slug) {
        window.history.pushState(null, '', `/playlist/${saved.slug}`);
      }
    }
  };

  // Delete playlist
  const handleDeletePlaylist = async (id: string) => {
    const pin = sessionStorage.getItem('my_playlist_owner_pin') || '1234';
    const res = await fetch(`/api/playlists/${id}`, {
      method: 'DELETE',
      headers: {
        'x-owner-pin': pin,
      },
    });

    if (res.ok) {
      const remaining = playlists.filter((p) => p.id !== id);
      setPlaylists(remaining);
      if (remaining.length > 0) {
        await loadFullPlaylist(remaining[0].slug || remaining[0].id);
      } else {
        setActivePlaylist(null);
        setCurrentPlaylist(null);
      }
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete playlist');
    }
  };

  // Move song between playlists
  const handleMoveSong = async (songId: string, targetPlaylistId: string) => {
    if (!activePlaylist) return;
    const pin = sessionStorage.getItem('my_playlist_owner_pin') || '1234';
    const res = await fetch(`/api/playlists/${activePlaylist.id}/songs/${songId}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-pin': pin,
      },
      body: JSON.stringify({ targetPlaylistId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to move song');
    }

    const data = await res.json();
    const updatedSongs = activePlaylist.songs.filter((s) => s.id !== songId);
    const updatedPlaylist = { ...activePlaylist, songs: updatedSongs };
    setActivePlaylist(updatedPlaylist);
    setCurrentPlaylist(updatedPlaylist);
    await fetchPlaylists();
    return data;
  };

  // Copy song between playlists
  const handleCopySong = async (songId: string, targetPlaylistId: string) => {
    if (!activePlaylist) return;
    const pin = sessionStorage.getItem('my_playlist_owner_pin') || '1234';
    const res = await fetch(`/api/playlists/${activePlaylist.id}/songs/${songId}/copy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-owner-pin': pin,
      },
      body: JSON.stringify({ targetPlaylistId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add song to playlist');
    }

    const data = await res.json();
    await fetchPlaylists();
    return data;
  };

  // Create new playlist
  const handleCreatePlaylist = async (data: any) => {
    const res = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const created = await res.json();
      setPlaylists((prev) => [created, ...prev]);
      setActivePlaylist(created);
      setCurrentPlaylist(created);
      window.history.pushState(null, '', `/playlist/${created.slug}`);
      return created;
    }
    throw new Error('Could not create playlist');
  };

  const handleCommentAdded = (songId: string, comment: SongComment) => {
    if (!activePlaylist) return;
    setActivePlaylist((prev) => {
      if (!prev) return null;
      const updatedSongs = prev.songs.map((s) => {
        if (s.id === songId) {
          const comments = s.comments || [];
          return { ...s, comments: [...comments, comment] };
        }
        return s;
      });
      return { ...prev, songs: updatedSongs };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm font-medium text-neutral-400">Loading your music experience...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Navbar */}
      <Navbar
        playlists={playlists}
        currentPlaylist={activePlaylist}
        onSelectPlaylist={handleSelectPlaylist}
        onOpenCreatePlaylist={() => setCreateModalOpen(true)}
        onOpenShare={() => setShareModalOpen(true)}
        isOwnerUnlocked={isOwnerUnlocked}
        onToggleOwnerMode={handleToggleOwnerMode}
      />

      {/* Playlist Navigation Ribbon */}
      <PlaylistNavigation
        playlists={playlists}
        currentPlaylist={activePlaylist}
        onSelectPlaylist={handleSelectPlaylist}
        onOpenCreatePlaylist={() => setCreateModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 pb-32">
        {activePlaylist ? (
          <>
            <HeroHeader
              playlist={activePlaylist}
              onOpenShare={() => setShareModalOpen(true)}
              onOpenOwnerDashboard={() => {
                setOwnerInitialTab('settings');
                setOwnerModalOpen(true);
              }}
              isOwnerUnlocked={isOwnerUnlocked}
            />

            <SongList
              playlist={activePlaylist}
              isOwnerUnlocked={isOwnerUnlocked}
              onOpenOwnerAddSong={() => {
                setOwnerInitialTab('add-song');
                setOwnerModalOpen(true);
              }}
              onEditSong={() => {
                setOwnerInitialTab('manage');
                setOwnerModalOpen(true);
              }}
              onDeleteSong={handleDeleteSong}
              onReorderSongs={handleReorderSongs}
              onOpenComments={(song) => {
                if (currentSong?.id !== song.id) {
                  playSong(song, activePlaylist);
                }
                setNowPlayingOpen(true);
              }}
            />
          </>
        ) : (
          <div className="text-center py-24 px-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto">
              <Music4 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-display">No Playlists Found</h2>
            <p className="text-neutral-400 text-sm max-w-md mx-auto">
              Create your very first private or public playlist to share with friends!
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-white shadow-lg transition-colors"
            >
              Create First Playlist
            </button>
          </div>
        )}
      </main>

      {/* Persistent Bottom Music Player */}
      <PersistentPlayer />

      {/* Expanded Now Playing Modal */}
      <NowPlayingModal onCommentAdded={handleCommentAdded} />

      {/* Share Playlist Modal */}
      <ShareModal
        playlist={activePlaylist}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Owner Dashboard Modal */}
      {activePlaylist && (
        <OwnerDashboardModal
          playlist={activePlaylist}
          playlists={playlists}
          isOpen={ownerModalOpen}
          onClose={() => setOwnerModalOpen(false)}
          isOwnerUnlocked={isOwnerUnlocked}
          onUnlockOwner={handleUnlockOwner}
          onSelectPlaylist={handleSelectPlaylist}
          onCreatePlaylistClick={() => setCreateModalOpen(true)}
          onSharePlaylistClick={(pl) => {
            setActivePlaylist(pl);
            setShareModalOpen(true);
          }}
          onAddSong={handleAddSong}
          onBatchSongsAdded={handleBatchSongsAdded}
          onUpdatePlaylist={handleUpdatePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onEditSong={handleEditSong}
          onDeleteSong={handleDeleteSong}
          onMoveSong={handleMoveSong}
          onCopySong={handleCopySong}
          onReorderSongs={handleReorderSongs}
          initialTab={ownerInitialTab}
        />
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <PlaylistApp />
    </PlayerProvider>
  );
}
