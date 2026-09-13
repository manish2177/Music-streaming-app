import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Shield,
  Upload,
  Music,
  Image as ImageIcon,
  Sparkles,
  Settings,
  ListMusic,
  PlusCircle,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Check,
  AlertCircle,
  Lock,
  Loader2,
  Plus,
  Disc3,
  ArrowRightLeft,
  Copy,
  Share2,
  Globe,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { Playlist, Song } from '../types';
import { AudioUploadQueue } from './AudioUploadQueue';

interface OwnerDashboardModalProps {
  playlist: Playlist;
  playlists: Playlist[];
  isOpen: boolean;
  onClose: () => void;
  isOwnerUnlocked: boolean;
  onUnlockOwner: (pin: string) => Promise<boolean>;
  onSelectPlaylist: (playlist: Playlist) => void;
  onCreatePlaylistClick: () => void;
  onSharePlaylistClick?: (playlist: Playlist) => void;
  onAddSong: (newSongData: any) => Promise<void>;
  onBatchSongsAdded?: (updatedSongs: Song[]) => void;
  onUpdatePlaylist: (updatedData: Partial<Playlist>) => Promise<void>;
  onDeletePlaylist: (id: string) => Promise<void>;
  onEditSong: (songId: string, data: Partial<Song>) => Promise<void>;
  onDeleteSong: (songId: string) => Promise<void>;
  onMoveSong?: (songId: string, targetPlaylistId: string) => Promise<any>;
  onCopySong?: (songId: string, targetPlaylistId: string) => Promise<any>;
  onReorderSongs: (reorderedSongIds: string[]) => void;
  initialTab?: 'playlists' | 'add-song' | 'settings' | 'manage';
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

function formatDate(isoString?: string): string {
  if (!isoString) return 'Recent';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export const OwnerDashboardModal: React.FC<OwnerDashboardModalProps> = ({
  playlist,
  playlists,
  isOpen,
  onClose,
  isOwnerUnlocked,
  onUnlockOwner,
  onSelectPlaylist,
  onCreatePlaylistClick,
  onSharePlaylistClick,
  onAddSong,
  onBatchSongsAdded,
  onUpdatePlaylist,
  onDeletePlaylist,
  onEditSong,
  onDeleteSong,
  onMoveSong,
  onCopySong,
  onReorderSongs,
  initialTab = 'playlists',
}) => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'add-song' | 'settings' | 'manage'>(
    initialTab
  );
  const [addMode, setAddMode] = useState<'batch' | 'single'>('batch');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Form states for Add Song
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songAlbum, setSongAlbum] = useState(playlist.name);
  const [audioMode, setAudioMode] = useState<'upload' | 'url'>('upload');
  const [audioUrl, setAudioUrl] = useState('');
  const [coverMode, setCoverMode] = useState<'upload' | 'url'>('upload');
  const [coverUrl, setCoverUrl] = useState(playlist.coverImage);
  const [durationInput, setDurationInput] = useState('180');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [addSongSuccess, setAddSongSuccess] = useState(false);

  // Form states for Playlist Settings
  const [plName, setPlName] = useState(playlist.name);
  const [plSlug, setPlSlug] = useState(playlist.slug);
  const [plDescription, setPlDescription] = useState(playlist.description);
  const [plCover, setPlCover] = useState(playlist.coverImage);
  const [plAccent, setPlAccent] = useState(playlist.accentColor);
  const [plIsPrivate, setPlIsPrivate] = useState(Boolean(playlist.isPrivate));
  const [plPin, setPlPin] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Song editing modal state
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Song deletion confirmation state
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeletingSong, setIsDeletingSong] = useState(false);
  const [deleteSongError, setDeleteSongError] = useState<string | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Playlist deletion confirmation state
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false);
  const [deletePlaylistError, setDeletePlaylistError] = useState<string | null>(null);

  // Move / Copy song state
  const [songToTransfer, setSongToTransfer] = useState<Song | null>(null);
  const [transferMode, setTransferMode] = useState<'move' | 'copy'>('move');
  const [isTransferringSong, setIsTransferringSong] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const plCoverFileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize state when active playlist changes
  useEffect(() => {
    setPlName(playlist.name);
    setPlSlug(playlist.slug);
    setPlDescription(playlist.description);
    setPlCover(playlist.coverImage);
    setPlAccent(playlist.accentColor);
    setPlIsPrivate(Boolean(playlist.isPrivate));
    setSongAlbum(playlist.name);
    setCoverUrl(playlist.coverImage);
  }, [playlist]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;

    setIsVerifyingPin(true);
    setPinError('');
    try {
      const success = await onUnlockOwner(pinInput);
      if (!success) {
        setPinError('Incorrect Owner PIN. (Default is 1234)');
      }
    } catch {
      setPinError('Failed to verify PIN. Please try again.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error('Upload failed');
    }
    const data = await res.json();
    return data.url;
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    try {
      const url = await uploadFile(file);
      setAudioUrl(url);

      if (!songTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setSongTitle(cleanName);
      }

      const tempAudio = new Audio(URL.createObjectURL(file));
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          setDurationInput(Math.round(tempAudio.duration).toString());
        }
      };
    } catch (err) {
      console.error(err);
      alert('Failed to upload audio file.');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      setCoverUrl(url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload artwork image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePlaylistCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile(file);
      setPlCover(url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload playlist cover.');
    }
  };

  const handleAddSingleSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !audioUrl.trim()) {
      alert('Song title and audio source are required.');
      return;
    }

    try {
      await onAddSong({
        title: songTitle.trim(),
        artist: songArtist.trim() || 'Unknown Artist',
        album: songAlbum.trim() || playlist.name,
        coverImage: coverUrl || playlist.coverImage,
        audioUrl,
        duration: parseInt(durationInput, 10) || 180,
      });

      setAddSongSuccess(true);
      setSongTitle('');
      setSongArtist('');
      setAudioUrl('');
      setTimeout(() => setAddSongSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to add song.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updateData: Partial<Playlist> = {
        name: plName.trim(),
        slug: plSlug.trim(),
        description: plDescription.trim(),
        coverImage: plCover,
        accentColor: plAccent,
        isPrivate: plIsPrivate,
      };
      if (plPin.trim()) {
        updateData.ownerPin = plPin.trim();
      }

      await onUpdatePlaylist(updateData);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleConfirmDeleteSong = async () => {
    if (!songToDelete || isDeletingSong) return;
    setIsDeletingSong(true);
    setDeleteSongError(null);

    try {
      const songTitle = songToDelete.title;
      await onDeleteSong(songToDelete.id);
      setSongToDelete(null);
      setDeleteSuccessMessage(`Song "${songTitle}" deleted successfully.`);
      setTimeout(() => {
        setDeleteSuccessMessage((prev) => (prev?.includes(songTitle) ? null : prev));
      }, 4000);
    } catch (err: any) {
      console.error('Delete song failed:', err);
      const msg = err?.message || 'Unable to delete this song. Please try again.';
      setDeleteSongError(msg);
    } finally {
      setIsDeletingSong(false);
    }
  };

  const handleConfirmDeletePlaylist = async () => {
    if (!playlistToDelete || isDeletingPlaylist) return;
    setIsDeletingPlaylist(true);
    setDeletePlaylistError(null);

    try {
      await onDeletePlaylist(playlistToDelete.id);
      setPlaylistToDelete(null);
      setActiveTab('playlists');
    } catch (err: any) {
      console.error('Delete playlist failed:', err);
      setDeletePlaylistError(err?.message || 'Failed to delete playlist.');
    } finally {
      setIsDeletingPlaylist(false);
    }
  };

  const handleExecuteSongTransfer = async (targetPlaylistId: string, targetPlaylistName: string) => {
    if (!songToTransfer || isTransferringSong) return;
    setIsTransferringSong(true);
    setTransferError(null);

    try {
      if (transferMode === 'move') {
        if (onMoveSong) {
          await onMoveSong(songToTransfer.id, targetPlaylistId);
        } else {
          const pin = sessionStorage.getItem('my_playlist_owner_pin') || '1234';
          const res = await fetch(`/api/playlists/${playlist.id}/songs/${songToTransfer.id}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-owner-pin': pin },
            body: JSON.stringify({ targetPlaylistId }),
          });
          if (!res.ok) throw new Error('Failed to move song');
        }
        setTransferSuccess(`Moved "${songToTransfer.title}" to "${targetPlaylistName}"`);
      } else {
        if (onCopySong) {
          await onCopySong(songToTransfer.id, targetPlaylistId);
        } else {
          const pin = sessionStorage.getItem('my_playlist_owner_pin') || '1234';
          const res = await fetch(`/api/playlists/${playlist.id}/songs/${songToTransfer.id}/copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-owner-pin': pin },
            body: JSON.stringify({ targetPlaylistId }),
          });
          if (!res.ok) throw new Error('Failed to add song copy');
        }
        setTransferSuccess(`Added "${songToTransfer.title}" to "${targetPlaylistName}"`);
      }

      setSongToTransfer(null);
      setTimeout(() => setTransferSuccess(null), 4000);
    } catch (err: any) {
      console.error('Transfer failed:', err);
      setTransferError(err?.message || 'Unable to complete transfer. Please try again.');
    } finally {
      setIsTransferringSong(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-white">
                  Owner Dashboard
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Manager Mode
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage playlists, songs, audio files, and sharing links
              </p>
            </div>
          </div>

          <button
            type="button"
            id="owner-dashboard-close-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier: If not unlocked, require PIN */}
        {!isOwnerUnlocked ? (
          <div className="p-8 text-center space-y-6 flex-1 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-violet-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-sm space-y-2">
              <h4 className="font-display font-bold text-xl text-white">Owner Authentication</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enter your owner PIN to manage playlists and audio. (Default PIN:{' '}
                <strong className="text-white font-mono">1234</strong>)
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-3">
              <input
                id="owner-pin-input"
                type="password"
                placeholder="Enter PIN (e.g. 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-white/15 text-center text-lg tracking-widest text-white font-mono focus:outline-none focus:border-violet-500"
                autoFocus
              />
              {pinError && <p className="text-xs text-rose-400">{pinError}</p>}
              <button
                type="submit"
                disabled={isVerifyingPin || !pinInput}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-sm text-white transition-all shadow-lg shadow-violet-600/30 active:scale-95 disabled:opacity-50"
              >
                {isVerifyingPin ? 'Verifying...' : 'Unlock Dashboard'}
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Dashboard Content */
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-2 border-b border-white/10 bg-neutral-950/40 flex-shrink-0 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  id="tab-my-playlists"
                  onClick={() => setActiveTab('playlists')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'playlists'
                      ? 'border-violet-500 text-violet-300'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>My Playlists</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-neutral-300">
                    {playlists.length}
                  </span>
                </button>

                <button
                  id="tab-manage-songs"
                  onClick={() => setActiveTab('manage')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'manage'
                      ? 'border-violet-500 text-violet-300'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <ListMusic className="w-4 h-4" />
                  <span>Manage Songs</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-neutral-300">
                    {playlist.songs.length}
                  </span>
                </button>

                <button
                  id="tab-add-songs"
                  onClick={() => setActiveTab('add-song')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'add-song'
                      ? 'border-violet-500 text-violet-300'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Songs</span>
                </button>

                <button
                  id="tab-settings"
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'border-violet-500 text-violet-300'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Playlist</span>
                </button>
              </div>

              {/* Current playlist context badge */}
              <div className="hidden md:flex items-center gap-2 py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs">
                <span className="text-neutral-400 text-[11px]">Active:</span>
                <img
                  src={playlist.coverImage}
                  alt={playlist.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-semibold text-white max-w-[130px] truncate">
                  {playlist.name}
                </span>
              </div>
            </div>

            {/* Notification messages */}
            {deleteSuccessMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{deleteSuccessMessage}</span>
                </div>
                <button
                  onClick={() => setDeleteSuccessMessage(null)}
                  className="text-emerald-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {transferSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{transferSuccess}</span>
                </div>
                <button
                  onClick={() => setTransferSuccess(null)}
                  className="text-violet-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: MY PLAYLISTS (GRID VIEW) */}
              {activeTab === 'playlists' && (
                <div className="space-y-6">
                  {/* Top Bar inside Playlists Tab */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-white">
                        My Playlists
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Create separate playlists with custom artwork, songs, and sharing links
                      </p>
                    </div>

                    <button
                      id="create-new-playlist-dashboard-btn"
                      onClick={onCreatePlaylistClick}
                      className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Playlist</span>
                    </button>
                  </div>

                  {/* Playlists Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {playlists.map((pl) => {
                      const isActive = playlist.id === pl.id;
                      const songCount = pl.songs ? pl.songs.length : (pl.songCount ?? 0);
                      const totalSecs =
                        pl.totalDuration ??
                        (pl.songs || []).reduce((acc, s) => acc + (s.duration || 0), 0);

                      return (
                        <div
                          key={pl.id}
                          id={`playlist-card-${pl.id}`}
                          className={`group relative rounded-2xl bg-neutral-950/70 border overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-xl ${
                            isActive
                              ? 'border-violet-500/80 ring-1 ring-violet-500/50 shadow-lg shadow-violet-500/10'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          {/* Card Header & Artwork */}
                          <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                            <img
                              src={pl.coverImage}
                              alt={pl.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                            {/* Top badges */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                              {isActive ? (
                                <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold tracking-wide shadow-md">
                                  CURRENT PLAYLIST
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-neutral-300 text-[10px] font-medium border border-white/10">
                                  {pl.isPrivate ? 'Private' : 'Public'}
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                {onSharePlaylistClick && (
                                  <button
                                    type="button"
                                    onClick={() => onSharePlaylistClick(pl)}
                                    className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-neutral-300 hover:text-white border border-white/10 transition-colors"
                                    title="Share Playlist"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPlaylistToDelete(pl)}
                                  className="p-1.5 rounded-full bg-black/60 hover:bg-rose-600/80 backdrop-blur-md text-neutral-300 hover:text-white border border-white/10 transition-colors"
                                  title="Delete Playlist"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Title on artwork */}
                            <div className="absolute bottom-2.5 left-3 right-3">
                              <h5 className="font-display font-bold text-white text-base truncate">
                                {pl.name}
                              </h5>
                            </div>
                          </div>

                          {/* Card Details */}
                          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed min-h-[2rem]">
                              {pl.description || 'No description provided.'}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-[11px] text-neutral-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Music className="w-3.5 h-3.5 text-violet-400" />
                                <span>{songCount} songs</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{formatDuration(totalSecs)}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 truncate">
                                <span>{formatDate(pl.createdAt)}</span>
                              </span>
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectPlaylist(pl);
                                  setActiveTab('manage');
                                }}
                                className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-xs text-white shadow-md transition-all text-center flex items-center justify-center gap-1.5 active:scale-95"
                              >
                                <Disc3 className="w-3.5 h-3.5" />
                                <span>Open Playlist</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  onSelectPlaylist(pl);
                                  setActiveTab('settings');
                                }}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors"
                                title="Edit Settings"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Create New Playlist Card Prompt */}
                    <button
                      type="button"
                      onClick={onCreatePlaylistClick}
                      className="rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/50 bg-white/2 hover:bg-violet-600/5 p-6 flex flex-col items-center justify-center text-center gap-3 transition-all min-h-[220px] group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-violet-600/20 group-hover:bg-violet-600/30 text-violet-400 flex items-center justify-center transition-colors">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm text-white group-hover:text-violet-300">
                          + Create New Playlist
                        </div>
                        <p className="text-xs text-neutral-500 max-w-[200px] mt-1">
                          Add a fresh mixtape for romantic, workout, or road trip tracks
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE SONGS */}
              {activeTab === 'manage' && (
                <div className="space-y-6">
                  {/* Playlist Header in Manage View */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={playlist.coverImage}
                        alt={playlist.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-white/10"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-white text-base truncate">
                            {playlist.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                            {playlist.songs.length} songs
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">
                          {playlist.description || 'Manage song order, move to other playlists, or edit details.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('add-song')}
                        className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Songs</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('playlists')}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-semibold transition-colors"
                      >
                        All Playlists
                      </button>
                    </div>
                  </div>

                  {/* Songs list */}
                  {playlist.songs.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-white/2 space-y-3">
                      <Music className="w-8 h-8 text-neutral-600 mx-auto" />
                      <div className="text-sm font-semibold text-neutral-300">
                        No songs in this playlist yet
                      </div>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        Upload MP3 files or audio folders to start playing music in "{playlist.name}"
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('add-song')}
                        className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold"
                      >
                        Upload Songs Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {playlist.songs.map((song, index) => (
                        <div
                          key={song.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs text-neutral-500 font-mono w-5">
                              {index + 1}
                            </span>
                            <img
                              src={song.coverImage || playlist.coverImage}
                              alt={song.title}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-neutral-950"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm text-white truncate">
                                {song.title}
                              </div>
                              <div className="text-xs text-neutral-400 truncate">
                                {song.artist}
                              </div>
                            </div>
                          </div>

                          {/* Action icons & Move/Copy Button */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Reorder Up */}
                            <button
                              type="button"
                              onClick={() => {
                                if (index > 0) {
                                  const newSongs = [...playlist.songs];
                                  const temp = newSongs[index - 1];
                                  newSongs[index - 1] = newSongs[index];
                                  newSongs[index] = temp;
                                  onReorderSongs(newSongs.map((s) => s.id));
                                }
                              }}
                              disabled={index === 0}
                              className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-20"
                              title="Move Up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>

                            {/* Reorder Down */}
                            <button
                              type="button"
                              onClick={() => {
                                if (index < playlist.songs.length - 1) {
                                  const newSongs = [...playlist.songs];
                                  const temp = newSongs[index + 1];
                                  newSongs[index + 1] = newSongs[index];
                                  newSongs[index] = temp;
                                  onReorderSongs(newSongs.map((s) => s.id));
                                }
                              }}
                              disabled={index === playlist.songs.length - 1}
                              className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-20"
                              title="Move Down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Move / Copy dropdown toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                setSongToTransfer(song);
                                setTransferMode('move');
                                setTransferError(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/40 text-neutral-300 hover:text-violet-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                              title="Move or Copy song to another playlist"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Move / Copy ▾</span>
                            </button>

                            {/* Edit Song Details */}
                            <button
                              type="button"
                              onClick={() => setEditingSong(song)}
                              className="p-1.5 text-neutral-400 hover:text-white"
                              title="Edit Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Song */}
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteSongError(null);
                                setSongToDelete(song);
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete Song"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADD SONGS */}
              {activeTab === 'add-song' && (
                <div className="space-y-6">
                  {/* Current Playlist Banner */}
                  <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={playlist.coverImage}
                        alt={playlist.name}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] uppercase font-bold text-violet-400 tracking-wider">
                          Current Playlist Target
                        </span>
                        <div className="font-bold text-sm text-white truncate">
                          {playlist.name}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('playlists')}
                      className="text-xs text-violet-300 hover:text-white font-semibold underline underline-offset-2 flex-shrink-0"
                    >
                      Switch Playlist
                    </button>
                  </div>

                  {/* Mode switcher: Batch & Folder Upload vs Single / URL */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div>
                      <h4 className="font-display font-semibold text-white text-sm">
                        Add Music to "{playlist.name}"
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Choose your preferred method to import tracks
                      </p>
                    </div>

                    <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-white/10 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setAddMode('batch')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          addMode === 'batch'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Batch & Folder Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddMode('single')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          addMode === 'single'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Single Track / URL
                      </button>
                    </div>
                  </div>

                  {/* SUB-VIEW 1: BATCH & FOLDER UPLOADER */}
                  {addMode === 'batch' && (
                    <AudioUploadQueue
                      playlist={playlist}
                      onBatchSuccess={(updatedSongs) => {
                        if (onBatchSongsAdded) {
                          onBatchSongsAdded(updatedSongs);
                        }
                        setAddSongSuccess(true);
                        setTimeout(() => setAddSongSuccess(false), 3000);
                      }}
                      onUploadSuccess={(updatedSongs) => {
                        if (onBatchSongsAdded) {
                          onBatchSongsAdded(updatedSongs);
                        }
                        setAddSongSuccess(true);
                        setTimeout(() => setAddSongSuccess(false), 3000);
                      }}
                    />
                  )}

                  {/* SUB-VIEW 2: SINGLE TRACK / URL */}
                  {addMode === 'single' && (
                    <form onSubmit={handleAddSingleSongSubmit} className="space-y-4 max-w-xl">
                      {addSongSuccess && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span>Song added to "{playlist.name}" successfully!</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                          Track Title *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Midnight Reverie"
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                            Artist
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Aura Beats"
                            value={songArtist}
                            onChange={(e) => setSongArtist(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                            Album
                          </label>
                          <input
                            type="text"
                            placeholder={playlist.name}
                            value={songAlbum}
                            onChange={(e) => setSongAlbum(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      </div>

                      {/* Audio File / URL */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                            Audio Source *
                          </label>
                          <div className="flex items-center gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() => setAudioMode('upload')}
                              className={`px-2 py-0.5 rounded ${
                                audioMode === 'upload' ? 'bg-white/10 text-white' : 'text-neutral-400'
                              }`}
                            >
                              File Upload
                            </button>
                            <button
                              type="button"
                              onClick={() => setAudioMode('url')}
                              className={`px-2 py-0.5 rounded ${
                                audioMode === 'url' ? 'bg-white/10 text-white' : 'text-neutral-400'
                              }`}
                            >
                              Direct URL
                            </button>
                          </div>
                        </div>

                        {audioMode === 'upload' ? (
                          <div>
                            <input
                              ref={audioFileInputRef}
                              type="file"
                              accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg"
                              onChange={handleAudioFileUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => audioFileInputRef.current?.click()}
                              disabled={uploadingAudio}
                              className="w-full py-4 border-2 border-dashed border-white/15 hover:border-violet-500/50 rounded-xl bg-white/2 hover:bg-white/5 flex flex-col items-center justify-center gap-2 text-xs text-neutral-300 transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-5 h-5 text-violet-400" />
                              <span>{uploadingAudio ? 'Uploading audio...' : 'Select Audio File from Device'}</span>
                              {audioUrl && <span className="text-emerald-400 text-[11px]">✓ Upload complete</span>}
                            </button>
                          </div>
                        ) : (
                          <input
                            type="url"
                            placeholder="https://example.com/track.mp3"
                            value={audioUrl}
                            onChange={(e) => setAudioUrl(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                            required
                          />
                        )}
                      </div>

                      {/* Artwork */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                            Track Artwork
                          </label>
                          <div className="flex items-center gap-1 text-xs">
                            <button
                              type="button"
                              onClick={() => setCoverMode('upload')}
                              className={`px-2 py-0.5 rounded ${
                                coverMode === 'upload' ? 'bg-white/10 text-white' : 'text-neutral-400'
                              }`}
                            >
                              File Upload
                            </button>
                            <button
                              type="button"
                              onClick={() => setCoverMode('url')}
                              className={`px-2 py-0.5 rounded ${
                                coverMode === 'url' ? 'bg-white/10 text-white' : 'text-neutral-400'
                              }`}
                            >
                              Image URL
                            </button>
                          </div>
                        </div>

                        {coverMode === 'upload' ? (
                          <div className="flex items-center gap-3">
                            <img
                              src={coverUrl}
                              alt="Cover Preview"
                              className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-neutral-950 flex-shrink-0"
                            />
                            <input
                              ref={coverFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleCoverFileUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => coverFileInputRef.current?.click()}
                              disabled={uploadingCover}
                              className="flex-1 py-2 px-3 border border-white/10 rounded-xl bg-neutral-950 hover:bg-white/5 text-xs text-neutral-300 text-center transition-colors"
                            >
                              {uploadingCover ? 'Uploading...' : 'Choose Artwork Image'}
                            </button>
                          </div>
                        ) : (
                          <input
                            type="url"
                            placeholder="https://example.com/cover.jpg"
                            value={coverUrl}
                            onChange={(e) => setCoverUrl(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                          />
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!audioUrl}
                        className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-sm text-white shadow-xl shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        Add Track to Playlist
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 4: PLAYLIST SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                  {settingsSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Playlist settings saved successfully!</span>
                    </div>
                  )}

                  {/* Playlist Name & Slug */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        Playlist Name *
                      </label>
                      <input
                        type="text"
                        value={plName}
                        onChange={(e) => setPlName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        Custom URL Slug
                      </label>
                      <input
                        type="text"
                        value={plSlug}
                        onChange={(e) => setPlSlug(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={plDescription}
                      onChange={(e) => setPlDescription(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Cover Artwork Upload / URL */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                      Cover Artwork
                    </label>
                    <div className="flex items-center gap-4">
                      <img
                        src={plCover}
                        alt="Playlist Cover"
                        className="w-20 h-20 rounded-2xl object-cover border border-white/10 bg-neutral-950 flex-shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <input
                          ref={plCoverFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePlaylistCoverUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => plCoverFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload New Cover Image</span>
                        </button>
                        <input
                          type="text"
                          value={plCover}
                          onChange={(e) => setPlCover(e.target.value)}
                          placeholder="Or enter image URL..."
                          className="w-full px-3 py-1.5 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visibility Setting */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                      Visibility & Privacy
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        type="button"
                        onClick={() => setPlIsPrivate(false)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium text-left transition-colors ${
                          !plIsPrivate
                            ? 'bg-violet-600/20 border-violet-500 text-white'
                            : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-white">Public</div>
                          <div className="text-[11px] text-neutral-400">Shareable with everyone</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlIsPrivate(true)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium text-left transition-colors ${
                          plIsPrivate
                            ? 'bg-violet-600/20 border-violet-500 text-white'
                            : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-white">Private</div>
                          <div className="text-[11px] text-neutral-400">Restricted with PIN</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                      Theme Accent Color
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { name: 'Violet', hex: '#8b5cf6' },
                        { name: 'Fuchsia', hex: '#d946ef' },
                        { name: 'Cyan', hex: '#06b6d4' },
                        { name: 'Emerald', hex: '#10b981' },
                        { name: 'Amber', hex: '#f59e0b' },
                        { name: 'Rose', hex: '#f43f5e' },
                      ].map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setPlAccent(color.hex)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                            plAccent === color.hex
                              ? 'border-white text-white font-bold bg-white/10'
                              : 'border-white/10 text-neutral-400 hover:border-white/30'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change PIN */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Change Owner PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current PIN"
                      value={plPin}
                      onChange={(e) => setPlPin(e.target.value)}
                      className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-sm text-white shadow-xl shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Playlist Settings'}
                  </button>

                  {/* Danger Zone: Delete Playlist */}
                  <div className="pt-6 border-t border-rose-500/20 space-y-3">
                    <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                      Danger Zone
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <div>
                        <div className="text-sm font-semibold text-white">Delete this Playlist</div>
                        <div className="text-xs text-neutral-400">
                          Remove "{playlist.name}" and its song associations.
                        </div>
                      </div>
                      <button
                        type="button"
                        id="delete-playlist-btn"
                        onClick={() => setPlaylistToDelete(playlist)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/20"
                      >
                        Delete Playlist
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      {/* Song Edit Sub-Modal */}
      {editingSong && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/15 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-white text-base">Edit Song Details</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={editingSong.title}
                  onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Artist</label>
                <input
                  type="text"
                  value={editingSong.artist}
                  onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Album</label>
                <input
                  type="text"
                  value={editingSong.album || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, album: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-white/10 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Artwork URL</label>
                <input
                  type="text"
                  value={editingSong.coverImage}
                  onChange={(e) => setEditingSong({ ...editingSong, coverImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-white/10 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSong(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onEditSong(editingSong.id, {
                    title: editingSong.title,
                    artist: editingSong.artist,
                    album: editingSong.album,
                    coverImage: editingSong.coverImage,
                  });
                  setEditingSong(null);
                }}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOVE / COPY SONG MODAL */}
      {songToTransfer && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            if (!isTransferringSong) {
              setSongToTransfer(null);
              setTransferError(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white font-display">Organize Song</h3>
                  <p className="text-xs text-neutral-400 truncate max-w-[240px]">
                    "{songToTransfer.title}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSongToTransfer(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode selection: Move vs Copy */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransferMode('move')}
                className={`flex flex-col p-3 rounded-xl border text-left transition-colors ${
                  transferMode === 'move'
                    ? 'bg-violet-600/20 border-violet-500 text-white'
                    : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-violet-400" />
                  <span>Move to Playlist</span>
                </div>
                <span className="text-[11px] text-neutral-400 mt-1">
                  Remove from "{playlist.name}" & add to target
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTransferMode('copy')}
                className={`flex flex-col p-3 rounded-xl border text-left transition-colors ${
                  transferMode === 'copy'
                    ? 'bg-violet-600/20 border-violet-500 text-white'
                    : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add to Another</span>
                </div>
                <span className="text-[11px] text-neutral-400 mt-1">
                  Keep in current and also make available in target
                </span>
              </button>
            </div>

            {/* Destination playlist selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                Select Destination Playlist
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {playlists
                  .filter((p) => p.id !== playlist.id)
                  .map((targetPl) => (
                    <button
                      key={targetPl.id}
                      type="button"
                      disabled={isTransferringSong}
                      onClick={() => handleExecuteSongTransfer(targetPl.id, targetPl.name)}
                      className="w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-950 hover:bg-violet-600/15 border border-white/10 hover:border-violet-500/40 text-left transition-colors group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={targetPl.coverImage}
                          alt={targetPl.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate group-hover:text-violet-300">
                            {targetPl.name}
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            {targetPl.songs?.length || 0} songs
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-violet-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                        {transferMode === 'move' ? 'Move here →' : 'Add copy →'}
                      </span>
                    </button>
                  ))}
                {playlists.filter((p) => p.id !== playlist.id).length === 0 && (
                  <div className="text-center py-6 text-xs text-neutral-400 space-y-2">
                    <p>No other playlists created yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSongToTransfer(null);
                        onCreatePlaylistClick();
                      }}
                      className="text-violet-400 hover:text-violet-300 font-bold underline"
                    >
                      + Create another playlist
                    </button>
                  </div>
                )}
              </div>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {transferError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE SONG CONFIRMATION MODAL */}
      {songToDelete && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingSong) {
              setSongToDelete(null);
              setDeleteSongError(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white font-display">Delete this song?</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  This will remove the song from your playlist. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Song Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <img
                src={songToDelete.coverImage || playlist.coverImage}
                alt={songToDelete.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-neutral-950"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {songToDelete.title}
                </div>
                <div className="text-xs text-neutral-400 truncate mt-0.5">
                  {songToDelete.artist || 'Unknown Artist'}
                </div>
                {songToDelete.duration && (
                  <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                    {Math.floor(songToDelete.duration / 60)}:
                    {String(songToDelete.duration % 60).padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>

            {deleteSongError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{deleteSongError}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingSong}
                onClick={() => {
                  if (!isDeletingSong) {
                    setSongToDelete(null);
                    setDeleteSongError(null);
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingSong}
                onClick={handleConfirmDeleteSong}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingSong ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PLAYLIST CONFIRMATION MODAL */}
      {playlistToDelete && (
        <div
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingPlaylist) {
              setPlaylistToDelete(null);
              setDeletePlaylistError(null);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-neutral-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white font-display">
                  Delete “{playlistToDelete.name}”?
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  This will remove the playlist and its song associations. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Target playlist card preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <img
                src={playlistToDelete.coverImage}
                alt={playlistToDelete.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-neutral-950"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">
                  {playlistToDelete.name}
                </div>
                <div className="text-xs text-neutral-400 truncate mt-0.5">
                  {playlistToDelete.songs?.length || 0} songs •{' '}
                  {formatDuration(
                    playlistToDelete.totalDuration ||
                      (playlistToDelete.songs || []).reduce((a, s) => a + (s.duration || 0), 0)
                  )}
                </div>
              </div>
            </div>

            {deletePlaylistError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{deletePlaylistError}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingPlaylist}
                onClick={() => {
                  if (!isDeletingPlaylist) {
                    setPlaylistToDelete(null);
                    setDeletePlaylistError(null);
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeletingPlaylist}
                onClick={handleConfirmDeletePlaylist}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingPlaylist ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Playlist…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Playlist</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
