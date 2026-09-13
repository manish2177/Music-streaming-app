import React, { useState, useRef } from 'react';
import { X, Plus, Sparkles, Disc3, Upload, Globe, Lock, Loader2, Image as ImageIcon } from 'lucide-react';
import { Playlist } from '../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (playlistData: any) => Promise<Playlist>;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80'
  );
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pin, setPin] = useState('1234');
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Image upload failed');
      }

      const data = await res.json();
      if (data.url) {
        setCoverImage(data.url);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError('Failed to upload image. Please try again or use an image URL.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        coverImage: coverImage.trim(),
        accentColor,
        ownerPin: pin.trim() || '1234',
        isPrivate,
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const coverPresets = [
    {
      title: 'Late Night Vibes',
      url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
      color: '#8b5cf6',
    },
    {
      title: 'Sunset Coastline',
      url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80',
      color: '#ec4899',
    },
    {
      title: 'Acoustic Coffee',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      color: '#06b6d4',
    },
    {
      title: 'Vintage Vinyl',
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop&q=80',
      color: '#f59e0b',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Create New Playlist</h3>
              <p className="text-xs text-neutral-400">
                Craft a separate playlist with its own songs, artwork, and link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Playlist Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Late Night Vibes, Road Trip, My Favorites"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Songs I listen to at night, driving vibes, relaxing beats..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Cover Image Upload & URL */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
              Cover Image
            </label>
            <div className="flex items-center gap-3">
              <img
                src={coverImage}
                alt="Cover Preview"
                className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-neutral-950 flex-shrink-0"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-neutral-500">or enter image URL</span>
                </div>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
          </div>

          {/* Quick Preset Themes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Quick Theme Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {coverPresets.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setCoverImage(preset.url);
                    setAccentColor(preset.color);
                  }}
                  className={`group relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                    coverImage === preset.url
                      ? 'border-violet-500 scale-102 shadow-md shadow-violet-500/30'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/55 p-1 flex items-end">
                    <span className="text-[10px] text-white font-medium truncate">
                      {preset.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Visibility */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
              Playlist Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                  !isPrivate
                    ? 'bg-violet-600/20 border-violet-500/50 text-white'
                    : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Public</div>
                  <div className="text-[11px] text-neutral-400">Anyone with link can listen</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                  isPrivate
                    ? 'bg-violet-600/20 border-violet-500/50 text-white'
                    : 'bg-neutral-950 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Private</div>
                  <div className="text-[11px] text-neutral-400">Restricted with Owner PIN</div>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 font-bold text-xs text-white shadow-xl shadow-violet-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Playlist...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Playlist</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
