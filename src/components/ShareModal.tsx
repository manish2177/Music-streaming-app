import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, Share2, Send, MessageCircle, ExternalLink, Download } from 'lucide-react';
import { Playlist } from '../types';

interface ShareModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ playlist, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  if (!isOpen || !playlist) return null;

  // Compute shareable URL
  const origin = window.location.origin;
  const shareUrl = `${origin}/playlist/${playlist.slug || playlist.id}`;

  useEffect(() => {
    let active = true;
    setLoadingQr(true);
    fetch(`/api/qrcode?url=${encodeURIComponent(shareUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.dataUrl) {
          setQrDataUrl(data.dataUrl);
        }
      })
      .catch((err) => {
        console.error('Failed to load QR code', err);
      })
      .finally(() => {
        if (active) setLoadingQr(false);
      });

    return () => {
      active = false;
    };
  }, [shareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${playlist.name} on My Playlist`,
          text: `Listen to "${playlist.name}" on My Playlist! No login required.`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  };

  // Social URLs
  const encodedUrl = encodeURIComponent(shareUrl);
  const shareText = encodeURIComponent(`Listen to my playlist "${playlist.name}" 🎵`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Share Playlist</h3>
              <p className="text-xs text-neutral-400">
                Friends can open and listen instantly without an account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist Snapshot Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5">
          <img
            src={playlist.coverImage}
            alt={playlist.name}
            className="w-12 h-12 rounded-xl object-cover shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-white truncate">{playlist.name}</div>
            <div className="text-xs text-neutral-400">
              {playlist.songs.length} songs • Free instant playback
            </div>
          </div>
        </div>

        {/* Share Link Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Shareable Link
          </label>
          <div className="flex items-center gap-2">
            <input
              id="share-link-input"
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-white/10 text-xs text-neutral-200 font-mono focus:outline-none"
            />
            <button
              id="copy-share-link-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/20 active:scale-95 flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
          <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center shadow-md flex-shrink-0">
            {loadingQr ? (
              <div className="text-xs text-neutral-400 animate-pulse">Generating...</div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="Playlist QR Code" className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-12 h-12 text-neutral-600" />
            )}
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="font-semibold text-sm text-white flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode className="w-4 h-4 text-violet-400" />
              <span>Scan to Listen on Mobile</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Friends can point their phone camera at this QR code to load the playlist immediately.
            </p>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${playlist.slug || 'playlist'}-qrcode.png`}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300 pt-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR Code Image</span>
              </a>
            )}
          </div>
        </div>

        {/* Social Share Shortcuts */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Quick Share
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-300 text-xs font-medium transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/20 text-sky-300 text-xs font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-200 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>X / Twitter</span>
            </a>

            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
