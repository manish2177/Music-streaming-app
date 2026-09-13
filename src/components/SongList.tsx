import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  MessageSquare,
  Clock,
  ArrowUpDown,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Edit2,
  Headphones,
  Search,
  PlusCircle,
} from 'lucide-react';
import { Playlist, Song } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { formatTime, formatNumber, getSafeAccentColor } from '../utils/format';

interface SongListProps {
  playlist: Playlist;
  isOwnerUnlocked: boolean;
  onOpenOwnerAddSong: () => void;
  onEditSong: (song: Song) => void;
  onDeleteSong: (songId: string) => void;
  onReorderSongs: (reorderedSongIds: string[]) => void;
  onOpenComments: (song: Song) => void;
}

export const SongList: React.FC<SongListProps> = ({
  playlist,
  isOwnerUnlocked,
  onOpenOwnerAddSong,
  onEditSong,
  onDeleteSong,
  onReorderSongs,
  onOpenComments,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay, toggleLike, likedSongs } = usePlayer();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  const accent = getSafeAccentColor(playlist.accentColor);

  const songs = playlist.songs || [];
  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.album && s.album.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRowClick = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      playSong(song, playlist);
    }
  };

  const handleMoveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index <= 0) return;
    const newSongs = [...songs];
    const temp = newSongs[index - 1];
    newSongs[index - 1] = newSongs[index];
    newSongs[index] = temp;
    onReorderSongs(newSongs.map((s) => s.id));
  };

  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index >= songs.length - 1) return;
    const newSongs = [...songs];
    const temp = newSongs[index + 1];
    newSongs[index + 1] = newSongs[index];
    newSongs[index] = temp;
    onReorderSongs(newSongs.map((s) => s.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Controls Bar: Search & Admin actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            id="song-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search songs or artists in this playlist..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-900/90 border border-white/10 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {isOwnerUnlocked && (
          <button
            id="songlist-add-song-btn"
            onClick={onOpenOwnerAddSong}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Songs</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {songs.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-white/10 bg-neutral-900/30">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-neutral-400">
            <Play className="w-8 h-8 ml-1" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white mb-1">
            This playlist is currently empty
          </h3>
          <p className="text-sm text-neutral-400 max-w-sm mx-auto mb-6">
            {isOwnerUnlocked
              ? 'Upload audio files or add song links to get started.'
              : 'The owner has not uploaded any songs to this playlist yet.'}
          </p>
          {isOwnerUnlocked && (
            <button
              onClick={onOpenOwnerAddSong}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/30"
            >
              Add First Song
            </button>
          )}
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-sm">
          No songs matched your search "{searchTerm}"
        </div>
      ) : (
        /* Song Table / List */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">Title & Artist</th>
                <th className="py-3 px-4 hidden md:table-cell">Album</th>
                <th className="py-3 px-4 text-center hidden sm:table-cell">Plays</th>
                <th className="py-3 px-4 text-center">
                  <Heart className="w-4 h-4 inline-block text-neutral-400" />
                </th>
                <th className="py-3 px-4 text-right">
                  <Clock className="w-4 h-4 inline-block text-neutral-400" />
                </th>
                <th className="py-3 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSongs.map((song, idx) => {
                const isSelected = currentSong?.id === song.id;
                const isCurrentPlaying = isSelected && isPlaying;
                const isLiked = likedSongs.has(song.id);
                const originalIndex = songs.findIndex((s) => s.id === song.id);

                return (
                  <tr
                    key={song.id}
                    onClick={() => handleRowClick(song)}
                    className={`group relative cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-white/10 text-white'
                        : 'hover:bg-white/5 text-neutral-300'
                    }`}
                  >
                    {/* Index or Play indicator */}
                    <td className="py-3 px-3 text-center text-sm font-medium">
                      <div className="relative flex items-center justify-center w-8 h-8 mx-auto">
                        {isCurrentPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            <span
                              className="w-1 bg-current rounded-full animate-bounce h-2"
                              style={{ color: accent }}
                            />
                            <span
                              className="w-1 bg-current rounded-full animate-bounce h-4 delay-100"
                              style={{ color: accent }}
                            />
                            <span
                              className="w-1 bg-current rounded-full animate-bounce h-3 delay-200"
                              style={{ color: accent }}
                            />
                          </div>
                        ) : (
                          <>
                            <span className="group-hover:hidden text-neutral-500 text-xs">
                              {originalIndex + 1}
                            </span>
                            <Play className="w-4 h-4 hidden group-hover:block fill-current text-white ml-0.5" />
                          </>
                        )}
                      </div>
                    </td>

                    {/* Title, Artist, Artwork */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/10">
                          <img
                            src={song.coverImage || playlist.coverImage}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-semibold text-sm truncate ${
                              isSelected ? 'text-white font-bold' : 'text-neutral-100'
                            }`}
                            style={isSelected ? { color: accent } : {}}
                          >
                            {song.title}
                          </div>
                          <div className="text-xs text-neutral-400 truncate mt-0.5">
                            {song.artist}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Album */}
                    <td className="py-3 px-4 text-sm text-neutral-400 truncate hidden md:table-cell max-w-[180px]">
                      {song.album || playlist.name}
                    </td>

                    {/* Plays count */}
                    <td className="py-3 px-4 text-center text-xs text-neutral-400 hidden sm:table-cell">
                      {formatNumber(song.plays || 0)}
                    </td>

                    {/* Like button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song.id);
                        }}
                        className={`p-1.5 rounded-full transition-transform active:scale-125 ${
                          isLiked
                            ? 'text-rose-500'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                        title={isLiked ? 'Unlike' : 'Like'}
                      >
                        <Heart
                          className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                        />
                      </button>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-right text-xs text-neutral-400 font-mono">
                      {formatTime(song.duration || 180)}
                    </td>

                    {/* Options / Reorder / Comments */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-end gap-1">
                        {/* Comments button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenComments(song);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-white transition-colors relative"
                          title="View or add comments"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {(song.comments?.length || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-600 text-[9px] font-bold text-white flex items-center justify-center">
                              {song.comments?.length}
                            </span>
                          )}
                        </button>

                        {/* Owner Reorder Buttons */}
                        {isOwnerUnlocked && (
                          <div className="flex items-center">
                            <button
                              onClick={(e) => handleMoveUp(originalIndex, e)}
                              disabled={originalIndex === 0}
                              className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleMoveDown(originalIndex, e)}
                              disabled={originalIndex === songs.length - 1}
                              className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* More Menu (Edit/Delete) */}
                        {isOwnerUnlocked && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuSongId(
                                  activeMenuSongId === song.id ? null : song.id
                                );
                              }}
                              className="p-1 text-neutral-400 hover:text-white rounded"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuSongId === song.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuSongId(null);
                                  }}
                                />
                                <div className="absolute right-0 top-6 w-36 rounded-xl bg-neutral-900 border border-white/15 shadow-2xl p-1.5 z-30 space-y-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuSongId(null);
                                      onEditSong(song);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-200 hover:bg-white/10"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>Edit Info</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuSongId(null);
                                      onDeleteSong(song.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-500/20"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
