import * as mmb from 'music-metadata-browser';

export interface ExtractedAudioMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  trackNumber?: number;
  genre?: string;
  artworkUrl?: string;
  artworkBlob?: Blob;
}

/**
 * Intelligent filename parser fallback
 * Converts "01 - Blinding Lights.mp3" -> Title: "Blinding Lights"
 * Converts "Artist - Song.flac" -> Artist: "Artist", Title: "Song"
 */
export function parseFilenameMetadata(filename: string, defaultAlbum: string = ''): ExtractedAudioMetadata {
  // Strip extension (.mp3, .wav, .flac, .m4a, etc.)
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  const clean = withoutExt.replace(/_/g, ' ').trim();

  let artist = '';
  let album = defaultAlbum;
  let title = clean;
  let trackNumber: number | undefined = undefined;

  // Pattern: "01 - Artist - Title" or "01. Artist - Title"
  const trackArtistTitleMatch = clean.match(/^(\d+)[\s.-]+([^-]+)-[\s]+(.+)$/);
  if (trackArtistTitleMatch) {
    trackNumber = parseInt(trackArtistTitleMatch[1], 10);
    artist = trackArtistTitleMatch[2].trim();
    title = trackArtistTitleMatch[3].trim();
  } else {
    // Pattern: "Artist - Title"
    const artistTitleMatch = clean.match(/^([^-]+)-[\s]+(.+)$/);
    if (artistTitleMatch) {
      artist = artistTitleMatch[1].trim();
      title = artistTitleMatch[2].trim();
    } else {
      // Pattern: "01 - Title" or "01. Title" or "01 Title"
      const trackTitleMatch = clean.match(/^(\d+)[\s.-]+(.+)$/);
      if (trackTitleMatch) {
        trackNumber = parseInt(trackTitleMatch[1], 10);
        title = trackTitleMatch[2].trim();
      }
    }
  }

  // Clean remaining prefix numbering if any
  title = title.replace(/^\d+[\s.-]+/, '').trim() || clean;

  return {
    title: title || 'Untitled Track',
    artist: artist || 'Unknown Artist',
    album: album || 'Single',
    duration: 180,
    trackNumber,
  };
}

/**
 * Read duration accurately using in-browser HTMLAudioElement
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.preload = 'metadata';

      const cleanup = () => {
        URL.revokeObjectURL(url);
      };

      audio.onloadedmetadata = () => {
        const dur = Math.round(audio.duration);
        cleanup();
        resolve(dur > 0 && !isNaN(dur) ? dur : 180);
      };

      audio.onerror = () => {
        cleanup();
        resolve(180);
      };

      // Fallback timeout after 3 seconds
      setTimeout(() => {
        cleanup();
        resolve(180);
      }, 3000);
    } catch {
      resolve(180);
    }
  });
}

/**
 * Extract rich audio metadata using music-metadata-browser
 * Reads ID3v1, ID3v2, Vorbis, FLAC, MP4 tags & embedded album covers
 */
export async function extractAudioMetadata(file: File, fallbackAlbum: string = ''): Promise<ExtractedAudioMetadata> {
  const fallback = parseFilenameMetadata(file.name, fallbackAlbum);

  try {
    const metadata = await mmb.parseBlob(file);
    const common = metadata.common;
    const format = metadata.format;

    let artworkUrl: string | undefined = undefined;
    let artworkBlob: Blob | undefined = undefined;
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      try {
        const blob = new Blob([pic.data], { type: pic.format });
        artworkUrl = URL.createObjectURL(blob);
        artworkBlob = blob;
      } catch (err) {
        console.warn('Could not create artwork URL from picture blob', err);
      }
    }

    const duration = format.duration && !isNaN(format.duration) && format.duration > 0
      ? Math.round(format.duration)
      : await getAudioDuration(file);

    return {
      title: common.title?.trim() || fallback.title,
      artist: common.artist?.trim() || fallback.artist,
      album: common.album?.trim() || fallback.album,
      duration: duration || fallback.duration,
      trackNumber: common.track?.no || fallback.trackNumber,
      genre: common.genre && common.genre.length > 0 ? common.genre[0] : undefined,
      artworkUrl,
      artworkBlob,
    };
  } catch (err) {
    // If music-metadata-browser fails to parse (e.g. unknown tag format or stripped header),
    // calculate duration via Audio and use smart filename parser
    const duration = await getAudioDuration(file);
    return {
      ...fallback,
      duration,
    };
  }
}
