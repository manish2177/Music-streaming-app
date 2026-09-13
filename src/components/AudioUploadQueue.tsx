import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  UploadCloud,
  FolderUp,
  FileAudio,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Music,
  Trash2,
  Edit2,
  Check,
  Pause,
  AlertTriangle,
  Loader2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Playlist, Song } from '../types';
import { extractAudioMetadata, ExtractedAudioMetadata } from '../utils/audioMetadata';
import { formatFileSize, formatTime } from '../utils/format';

export type UploadStatus = 'waiting' | 'uploading' | 'processing' | 'completed' | 'failed';

export interface QueueItem {
  id: string;
  file: File;
  filename: string;
  fileSize: number;
  status: UploadStatus;
  progress: number;
  errorMsg?: string;
  metadata: ExtractedAudioMetadata;
  isDuplicate: boolean;
  duplicateAction: 'skip' | 'upload' | 'replace';
  uploadedAudioUrl?: string;
  uploadedCoverUrl?: string;
  isEditing?: boolean;
}

interface AudioUploadQueueProps {
  playlist: Playlist;
  onUploadSuccess?: (updatedSongs: Song[]) => void;
  onBatchSuccess?: (updatedSongs: Song[]) => void;
  onClose?: () => void;
}

const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.wma'];

export function isAudioFile(file: File): boolean {
  if (file.type && file.type.startsWith('audio/')) return true;
  const name = file.name.toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export const AudioUploadQueue: React.FC<AudioUploadQueueProps> = ({
  playlist,
  onUploadSuccess,
  onBatchSuccess,
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [uncommittedItems, setUncommittedItems] = useState<{ item: QueueItem; audioUrl: string; coverUrl?: string }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const notifySuccess = useCallback(
    (updatedSongs: Song[]) => {
      if (onBatchSuccess) onBatchSuccess(updatedSongs);
      if (onUploadSuccess) onUploadSuccess(updatedSongs);
    },
    [onBatchSuccess, onUploadSuccess]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const activeUploadsRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  const abortControllerRef = useRef<boolean>(false);

  // Check duplicate against playlist songs
  const checkDuplicate = useCallback(
    (metadata: ExtractedAudioMetadata, filename: string): boolean => {
      const titleLower = metadata.title.toLowerCase().trim();
      const artistLower = metadata.artist.toLowerCase().trim();
      const filenameLower = filename.toLowerCase().trim();

      return (playlist.songs || []).some((s) => {
        const sTitle = s.title.toLowerCase().trim();
        const sArtist = (s.artist || '').toLowerCase().trim();
        const sUrl = (s.audioUrl || '').toLowerCase();

        const exactTitleMatch = sTitle === titleLower;
        const artistMatch = sArtist === artistLower || artistLower === 'unknown artist';
        const fileMatch = sUrl.includes(filenameLower);

        return (exactTitleMatch && artistMatch) || fileMatch;
      });
    },
    [playlist.songs]
  );

  // Process selected files and extract metadata asynchronously
  const addFilesToQueue = async (files: File[]) => {
    const audioFiles = files.filter(isAudioFile);
    if (audioFiles.length === 0) {
      setStatusMessage('No supported audio files found. Supported: MP3, WAV, M4A, AAC, FLAC, OGG, OPUS, WMA.');
      setTimeout(() => setStatusMessage(null), 5000);
      return;
    }

    setIsScanning(true);
    setStatusMessage(`Scanning & extracting metadata for ${audioFiles.length} song${audioFiles.length > 1 ? 's' : ''}...`);

    const newItems: QueueItem[] = [];

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      // Extract metadata (ID3 tags / filename fallback)
      const metadata = await extractAudioMetadata(file, playlist.name);
      const isDup = checkDuplicate(metadata, file.name);

      newItems.push({
        id: `queue-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        filename: file.name,
        fileSize: file.size,
        status: 'waiting',
        progress: 0,
        metadata,
        isDuplicate: isDup,
        duplicateAction: isDup ? 'skip' : 'upload',
      });
    }

    setQueue((prev) => [...prev, ...newItems]);
    setIsScanning(false);
    setStatusMessage(`Added ${audioFiles.length} song${audioFiles.length > 1 ? 's' : ''} to upload queue.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle standard multi-file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Handle folder upload selection
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  // Handle drag and drop with directory traversal support
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    if (!items) {
      if (e.dataTransfer.files) {
        addFilesToQueue(Array.from(e.dataTransfer.files));
      }
      return;
    }

    setIsScanning(true);
    setStatusMessage('Traversing folders and scanning audio files...');

    const gatheredFiles: File[] = [];

    const traverseEntry = async (entry: any): Promise<void> => {
      if (!entry) return;
      if (entry.isFile) {
        await new Promise<void>((resolve) => {
          entry.file((file: File) => {
            if (isAudioFile(file)) {
              gatheredFiles.push(file);
            }
            resolve();
          }, () => resolve());
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readEntries = async (): Promise<void> => {
          const entries: any[] = await new Promise((resolve) => {
            dirReader.readEntries((results: any[]) => resolve(results || []), () => resolve([]));
          });
          if (entries.length > 0) {
            for (const subEntry of entries) {
              await traverseEntry(subEntry);
            }
            await readEntries();
          }
        };
        await readEntries();
      }
    };

    try {
      const entryPromises: Promise<void>[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null;
          if (entry) {
            entryPromises.push(traverseEntry(entry));
          } else {
            const file = item.getAsFile();
            if (file && isAudioFile(file)) {
              gatheredFiles.push(file);
            }
          }
        }
      }
      await Promise.all(entryPromises);

      if (gatheredFiles.length > 0) {
        await addFilesToQueue(gatheredFiles);
      } else {
        setStatusMessage('No supported audio files found in dropped items.');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error traversing dropped items', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Upload single file with progress tracking
  const uploadSingleItem = (item: QueueItem): Promise<{ audioUrl: string; coverUrl?: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      activeUploadsRef.current.set(item.id, xhr);

      const formData = new FormData();
      formData.append('file', item.file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, progress: Math.min(percent, 98), status: 'uploading' } : q
            )
          );
        }
      };

      xhr.onload = async () => {
        activeUploadsRef.current.delete(item.id);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            let finalCoverUrl = playlist.coverImage;

            // If embedded picture blob exists, upload it as a static image file
            if (item.metadata.artworkBlob) {
              try {
                const imgFormData = new FormData();
                const mime = item.metadata.artworkBlob.type || 'image/jpeg';
                const ext = mime.includes('png') ? 'png' : 'jpg';
                imgFormData.append('file', item.metadata.artworkBlob, `cover-${Date.now()}.${ext}`);
                const imgRes = await fetch('/api/upload', { method: 'POST', body: imgFormData });
                if (imgRes.ok) {
                  const imgData = await imgRes.json();
                  if (imgData.url) finalCoverUrl = imgData.url;
                }
              } catch {
                // Safely fallback to playlist cover image
              }
            } else if (item.metadata.artworkUrl && !item.metadata.artworkUrl.startsWith('blob:')) {
              finalCoverUrl = item.metadata.artworkUrl;
            }

            resolve({
              audioUrl: response.url,
              coverUrl: finalCoverUrl,
            });
          } catch {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        activeUploadsRef.current.delete(item.id);
        reject(new Error('Network connection error'));
      };

      xhr.onabort = () => {
        activeUploadsRef.current.delete(item.id);
        reject(new Error('Upload aborted'));
      };

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  };

  // Commit songs to playlist in robust chunks with retry
  const commitSongsToPlaylist = async (
    items: { item: QueueItem; audioUrl: string; coverUrl?: string }[]
  ) => {
    if (items.length === 0) return;
    setIsCommitting(true);
    setCommitError(null);
    setStatusMessage(`Saving ${items.length} song${items.length > 1 ? 's' : ''} to playlist...`);

    const replaceAny = items.some(({ item }) => item.duplicateAction === 'replace');
    const BATCH_SIZE = 15;
    let latestSongs = playlist.songs || [];
    let savedCount = 0;
    const targetPlaylistId = playlist.id || playlist.slug;

    try {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        const songsPayload = chunk.map(({ item, audioUrl, coverUrl }) => ({
          title: item.metadata.title,
          artist: item.metadata.artist,
          album: item.metadata.album || playlist.name,
          coverImage: coverUrl && !coverUrl.startsWith('blob:') ? coverUrl : playlist.coverImage,
          audioUrl: audioUrl,
          duration: item.metadata.duration || 180,
          trackNumber: item.metadata.trackNumber,
        }));

        let chunkSaved = false;
        let lastErrorMsg = 'Failed to save songs to playlist';

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch(`/api/playlists/${encodeURIComponent(targetPlaylistId)}/songs/batch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                songs: songsPayload,
                replaceExisting: replaceAny,
              }),
            });

            if (!res.ok) {
              const errBody = await res.json().catch(() => ({}));
              throw new Error(errBody.error || `Server returned status ${res.status}`);
            }

            const data = await res.json();
            if (data.songs) {
              latestSongs = data.songs;
              chunkSaved = true;
              savedCount += chunk.length;
              notifySuccess(latestSongs);
              break;
            }
          } catch (err: any) {
            lastErrorMsg = err.message || 'Network connection failed';
            console.warn(`Commit chunk attempt ${attempt} failed:`, err);
            if (attempt < 3) {
              await new Promise((r) => setTimeout(r, attempt * 800));
            }
          }
        }

        if (!chunkSaved) {
          throw new Error(lastErrorMsg);
        }
      }

      setUncommittedItems([]);
      setStatusMessage(`Successfully saved ${savedCount} song${savedCount > 1 ? 's' : ''} to playlist!`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to commit uploaded songs to playlist', err);
      const msg = err.message || 'Network error while saving songs to playlist';
      setCommitError(msg);
      setUncommittedItems(items);
      setStatusMessage(`Audio uploaded, but saving to playlist failed: ${msg}. Click 'Retry Saving' to commit without re-uploading.`);
    } finally {
      setIsCommitting(false);
    }
  };

  // Start concurrent batch uploading
  const startUpload = async () => {
    if (queue.length === 0 || isUploading) return;

    abortControllerRef.current = false;
    setIsUploading(true);

    const CONCURRENCY_LIMIT = 3;
    const itemsToUpload = queue.filter(
      (item) => (item.status === 'waiting' || item.status === 'failed') && item.duplicateAction !== 'skip'
    );

    if (itemsToUpload.length === 0) {
      setIsUploading(false);
      setStatusMessage('No files ready to upload (some may be marked to skip).');
      return;
    }

    const pendingQueue = [...itemsToUpload];
    const completedItems: { item: QueueItem; audioUrl: string; coverUrl?: string }[] = [];

    const worker = async (): Promise<void> => {
      while (pendingQueue.length > 0 && !abortControllerRef.current) {
        const nextItem = pendingQueue.shift();
        if (!nextItem) break;

        // Set status to uploading
        setQueue((prev) =>
          prev.map((q) => (q.id === nextItem.id ? { ...q, status: 'uploading', progress: 5, errorMsg: undefined } : q))
        );

        try {
          const result = await uploadSingleItem(nextItem);
          completedItems.push({ item: nextItem, ...result });

          setQueue((prev) =>
            prev.map((q) =>
              q.id === nextItem.id
                ? {
                    ...q,
                    status: 'completed',
                    progress: 100,
                    uploadedAudioUrl: result.audioUrl,
                    uploadedCoverUrl: result.coverUrl,
                  }
                : q
            )
          );
        } catch (err: any) {
          if (abortControllerRef.current) {
            setQueue((prev) =>
              prev.map((q) => (q.id === nextItem.id ? { ...q, status: 'waiting', progress: 0 } : q))
            );
          } else {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === nextItem.id
                  ? {
                      ...q,
                      status: 'failed',
                      errorMsg: err.message || 'Failed to upload',
                    }
                  : q
              )
            );
          }
        }
      }
    };

    // Run parallel workers up to CONCURRENCY_LIMIT
    const activeWorkers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, itemsToUpload.length) }, () => worker());
    await Promise.all(activeWorkers);

    setIsUploading(false);

    // Commit all successfully uploaded songs into the playlist via batch endpoint
    if (completedItems.length > 0) {
      await commitSongsToPlaylist(completedItems);
    }
  };

  // Cancel currently running uploads
  const cancelUpload = () => {
    abortControllerRef.current = true;
    activeUploadsRef.current.forEach((xhr) => xhr.abort());
    activeUploadsRef.current.clear();
    setIsUploading(false);

    setQueue((prev) =>
      prev.map((q) => (q.status === 'uploading' ? { ...q, status: 'waiting', progress: 0 } : q))
    );
    setStatusMessage('Upload cancelled.');
  };

  // Retry an individual failed item
  const retryItem = async (itemId: string) => {
    const item = queue.find((q) => q.id === itemId);
    if (!item) return;

    setQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'uploading', progress: 10, errorMsg: undefined } : q))
    );

    try {
      const result = await uploadSingleItem(item);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? {
                ...q,
                status: 'completed',
                progress: 100,
                uploadedAudioUrl: result.audioUrl,
                uploadedCoverUrl: result.coverUrl,
              }
            : q
        )
      );

      // Save single song to playlist
      const targetPlaylistId = playlist.id || playlist.slug;
      const res = await fetch(`/api/playlists/${encodeURIComponent(targetPlaylistId)}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.metadata.title,
          artist: item.metadata.artist,
          album: item.metadata.album || playlist.name,
          coverImage: result.coverUrl && !result.coverUrl.startsWith('blob:') ? result.coverUrl : playlist.coverImage,
          audioUrl: result.audioUrl,
          duration: item.metadata.duration,
        }),
      });

      if (res.ok) {
        const newSong = await res.json();
        notifySuccess([...(playlist.songs || []), newSong]);
      }
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId ? { ...q, status: 'failed', errorMsg: err.message || 'Retry failed' } : q
        )
      );
    }
  };

  // Remove individual item from queue
  const removeItem = (id: string) => {
    const xhr = activeUploadsRef.current.get(id);
    if (xhr) {
      xhr.abort();
      activeUploadsRef.current.delete(id);
    }
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  // Clear all or completed items
  const clearQueue = () => {
    if (isUploading) cancelUpload();
    setQueue([]);
  };

  // Update item metadata
  const updateItemMetadata = (id: string, updates: Partial<ExtractedAudioMetadata>) => {
    setQueue((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const updatedMeta = { ...q.metadata, ...updates };
          const isDup = checkDuplicate(updatedMeta, q.filename);
          return {
            ...q,
            metadata: updatedMeta,
            isDuplicate: isDup,
          };
        }
        return q;
      })
    );
  };

  // Set duplicate action
  const setDuplicateAction = (id: string, action: 'skip' | 'upload' | 'replace') => {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, duplicateAction: action } : q))
    );
  };

  // Metrics
  const totalCount = queue.length;
  const completedCount = queue.filter((q) => q.status === 'completed').length;
  const failedCount = queue.filter((q) => q.status === 'failed').length;
  const waitingCount = queue.filter((q) => q.status === 'waiting' && q.duplicateAction !== 'skip').length;
  const overallProgress = totalCount > 0
    ? Math.round(queue.reduce((acc, cur) => acc + cur.progress, 0) / totalCount)
    : 0;

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.wma"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // Directory attributes for browser folder selection
        {...({ webkitdirectory: '', directory: '', mozdirectory: '' } as any)}
        onChange={handleFolderSelect}
        className="hidden"
      />

      {/* Main Upload Selector & Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
          isDragOver
            ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
            : 'border-white/10 hover:border-white/20 bg-neutral-900/60'
        }`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-fuchsia-600/30 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-bold text-lg text-white">Add Music to Playlist</h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Drag & drop audio files or whole folders here, or pick an option below
            </p>
          </div>

          {/* Action Buttons: Upload Files & Upload Folder */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isScanning}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50"
            >
              <FileAudio className="w-4 h-4" />
              Upload Files
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={isUploading || isScanning}
              className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 border border-white/10 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <FolderUp className="w-4 h-4 text-violet-400" />
              Upload Entire Folder
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
            <span>Supports MP3, WAV, M4A, AAC, FLAC, OGG, OPUS</span>
            <span>•</span>
            <span>Up to 100MB per song</span>
          </div>
        </div>
      </div>

      {/* Scanning Feedback */}
      {isScanning && (
        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-violet-950/40 border border-violet-500/20 text-violet-300 text-xs sm:text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          <span>{statusMessage || 'Reading folder contents and parsing song metadata...'}</span>
        </div>
      )}

      {/* Status banner */}
      {statusMessage && !isScanning && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900 border border-white/10 text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-neutral-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Uncommitted songs retry banner */}
      {commitError && uncommittedItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-rose-100">Files uploaded, but saving to playlist was interrupted</p>
              <p className="text-rose-300/80 text-xs">{commitError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => commitSongsToPlaylist(uncommittedItems)}
            disabled={isCommitting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {isCommitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving to Playlist...
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Retry Saving ({uncommittedItems.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Queue Section */}
      {queue.length > 0 && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900 border border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-display font-bold text-sm text-white">Upload Queue</h4>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 text-[11px] font-medium">
                  {queue.length} {queue.length === 1 ? 'song' : 'songs'}
                </span>
                {completedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                    {completedCount} completed
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-medium">
                    {failedCount} failed
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                {isUploading
                  ? `Uploading ${completedCount + 1} of ${totalCount} songs (${overallProgress}%)`
                  : `${waitingCount} song${waitingCount === 1 ? '' : 's'} ready to upload`}
              </p>
            </div>

            {/* Queue Action Buttons */}
            <div className="flex items-center gap-2">
              {isUploading ? (
                <button
                  type="button"
                  onClick={cancelUpload}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Cancel Upload
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startUpload}
                  disabled={waitingCount === 0 && failedCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-violet-600/30 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {failedCount > 0 && waitingCount === 0 ? 'Retry Failed' : 'Start Upload'}
                </button>
              )}

              <button
                type="button"
                onClick={clearQueue}
                disabled={isUploading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors disabled:opacity-40"
                title="Clear All"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Overall Progress Bar */}
          {(isUploading || overallProgress > 0) && (
            <div className="space-y-1.5 px-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Total Progress</span>
                <span className="font-mono text-violet-400 font-semibold">{overallProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-300 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Individual Queue Items List */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {queue.map((item, idx) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.status === 'uploading'
                    ? 'bg-violet-950/20 border-violet-500/40 shadow-md shadow-violet-950/50'
                    : item.status === 'completed'
                    ? 'bg-neutral-900/90 border-emerald-500/20'
                    : item.status === 'failed'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-neutral-900/80 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Artwork / Icon Thumbnail */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 border border-white/10 flex items-center justify-center">
                    {item.metadata.artworkUrl ? (
                      <img
                        src={item.metadata.artworkUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-5 h-5 text-neutral-500" />
                    )}
                    {item.status === 'completed' && (
                      <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Info and editable metadata */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {item.isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
                        <input
                          type="text"
                          value={item.metadata.title}
                          onChange={(e) => updateItemMetadata(item.id, { title: e.target.value })}
                          placeholder="Title"
                          className="px-2.5 py-1 text-xs rounded-lg bg-neutral-950 border border-white/20 text-white"
                        />
                        <input
                          type="text"
                          value={item.metadata.artist}
                          onChange={(e) => updateItemMetadata(item.id, { artist: e.target.value })}
                          placeholder="Artist"
                          className="px-2.5 py-1 text-xs rounded-lg bg-neutral-950 border border-white/20 text-white"
                        />
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate">
                          {item.metadata.title}
                        </span>
                        <span className="text-xs text-neutral-400 truncate">
                          • {item.metadata.artist}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                      <span className="truncate max-w-[180px]">{item.filename}</span>
                      <span>•</span>
                      <span>{formatFileSize(item.fileSize)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {formatTime(item.metadata.duration)}
                      </span>
                    </div>

                    {/* Duplicate Warning & Choices */}
                    {item.isDuplicate && item.status !== 'completed' && (
                      <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>This song may already exist in your playlist.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDuplicateAction(item.id, 'skip')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                              item.duplicateAction === 'skip'
                                ? 'bg-amber-400 text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-300 hover:text-white'
                            }`}
                          >
                            Skip
                          </button>
                          <button
                            type="button"
                            onClick={() => setDuplicateAction(item.id, 'upload')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                              item.duplicateAction === 'upload'
                                ? 'bg-amber-400 text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-300 hover:text-white'
                            }`}
                          >
                            Upload Anyway
                          </button>
                          <button
                            type="button"
                            onClick={() => setDuplicateAction(item.id, 'replace')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors ${
                              item.duplicateAction === 'replace'
                                ? 'bg-amber-400 text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-300 hover:text-white'
                            }`}
                          >
                            Replace Existing
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Individual progress bar */}
                    {item.status === 'uploading' && (
                      <div className="pt-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                          <span>Uploading...</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-violet-500 transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {item.status === 'failed' && item.errorMsg && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {item.errorMsg}
                      </p>
                    )}
                  </div>

                  {/* Status Badges & Controls */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Status Pill */}
                    {item.status === 'waiting' && (
                      <span className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-400 text-[10px] font-medium">
                        Waiting
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-medium flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {item.progress}%
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Done
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => retryItem(item.id)}
                        className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                        title="Retry upload"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                    )}

                    {/* Quick Edit metadata toggle */}
                    {item.status !== 'uploading' && item.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() =>
                          setQueue((prev) =>
                            prev.map((q) => (q.id === item.id ? { ...q, isEditing: !q.isEditing } : q))
                          )
                        }
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit title & artist"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                      title="Remove from queue"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
