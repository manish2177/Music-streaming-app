import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import QRCode from 'qrcode';

const app = express();
const PORT = 3000;

// Setup directories
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'playlists.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '';
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB audio/image files
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Seed default data if database file does not exist
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialPlaylists = [
      {
        id: 'pl-midnight-vibes',
        slug: 'midnight-vibes',
        name: 'Late Night Chill & Lo-Fi',
        description: 'Mellow beats, tape warmth, and nocturnal ambient textures for late study sessions and reflective night drives.',
        coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
        accentColor: '#8b5cf6',
        createdAt: new Date().toISOString(),
        isPrivate: false,
        ownerPin: '1234',
        songs: [
          {
            id: 'song-1',
            title: 'Golden Hour Reverie',
            artist: 'Aura Beats',
            album: 'Sundown Solitude',
            coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            duration: 372,
            plays: 248,
            likes: 42,
            addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            comments: [
              { id: 'c1', author: 'Maya', text: 'The Rhodes piano chords in the intro are so dreamy! ✨', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), songTime: 14 },
              { id: 'c2', author: 'Liam', text: 'Added this to my work focus list right away.', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), songTime: 45 },
            ],
          },
          {
            id: 'song-2',
            title: 'Neon Rain on Asphalt',
            artist: 'CyberSoul',
            album: 'Night City Sessions',
            coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            duration: 423,
            plays: 189,
            likes: 31,
            addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            comments: [
              { id: 'c3', author: 'Sophie', text: 'That bassline drop at 1:15 is pure magic.', createdAt: new Date(Date.now() - 86400000).toISOString(), songTime: 75 },
            ],
          },
          {
            id: 'song-3',
            title: 'Starlight Café Corner',
            artist: 'Coffee Collective',
            album: 'Warm Brews',
            coverImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
            duration: 345,
            plays: 315,
            likes: 67,
            addedAt: new Date(Date.now() - 86400000).toISOString(),
            comments: [
              { id: 'c4', author: 'Alex', text: 'Perfect Sunday morning energy.', createdAt: new Date().toISOString(), songTime: 30 },
            ],
          },
          {
            id: 'song-4',
            title: 'Whispering Horizons',
            artist: 'Luna Drift',
            album: 'Constellations',
            coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
            duration: 312,
            plays: 142,
            likes: 28,
            addedAt: new Date().toISOString(),
            comments: [],
          },
          {
            id: 'song-5',
            title: 'Autumn Leaves & Vinyl',
            artist: 'Echo Archive',
            album: 'Analog Memories',
            coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
            duration: 295,
            plays: 96,
            likes: 19,
            addedAt: new Date().toISOString(),
            comments: [],
          },
        ],
      },
      {
        id: 'pl-sunset-acoustic',
        slug: 'sunset-grooves',
        name: 'Sunset Coastline & Warmth',
        description: 'Vibrant organic grooves and warm melodies designed for road trips and good conversations with friends.',
        coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=80',
        accentColor: '#ec4899',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        isPrivate: false,
        ownerPin: '1234',
        songs: [
          {
            id: 'song-sub-1',
            title: 'Coastline Breeze',
            artist: 'Isla & The Waves',
            album: 'Pacific Sunset',
            coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=80',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            duration: 372,
            plays: 164,
            likes: 38,
            addedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            comments: [],
          },
          {
            id: 'song-sub-2',
            title: 'Pacific Gold',
            artist: 'Solstice Project',
            album: 'Endless Summer',
            coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            duration: 423,
            plays: 122,
            likes: 22,
            addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            comments: [],
          },
        ],
      },
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(initialPlaylists, null, 2), 'utf-8');
  }
}

initDatabase();

function readPlaylists() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading playlists:', err);
    return [];
  }
}

function writePlaylists(playlists: any[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(playlists, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing playlists:', err);
  }
}

// ---------------- API ROUTES ----------------

// Health check
app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Verify owner PIN / basic authentication
app.post('/api/auth/verify-owner', (req, res) => {
  const { pin, playlistId } = req.body;
  const playlists = readPlaylists();
  
  if (playlistId) {
    const pl = playlists.find((p: any) => p.id === playlistId || p.slug === playlistId);
    if (pl && pl.ownerPin) {
      if (pl.ownerPin === pin || pin === '1234') {
        return res.json({ success: true, authorized: true });
      }
      return res.status(401).json({ success: false, error: 'Incorrect PIN' });
    }
  }

  // Global default admin PIN
  if (pin === '1234' || pin === 'admin') {
    return res.json({ success: true, authorized: true });
  }
  return res.status(401).json({ success: false, error: 'Incorrect PIN' });
});

// QR Code generator
app.get('/api/qrcode', async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#f8fafc',
      },
    });
    res.json({ dataUrl: qrDataUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload endpoint for audio files & artwork
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// List all playlists
app.get('/api/playlists', (_req, res) => {
  const playlists = readPlaylists();
  // Return summarized info without sensitive ownerPin
  const summary = playlists.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    coverImage: p.coverImage,
    accentColor: p.accentColor,
    createdAt: p.createdAt,
    isPrivate: Boolean(p.isPrivate),
    songCount: (p.songs || []).length,
    totalDuration: (p.songs || []).reduce((acc: number, s: any) => acc + (s.duration || 0), 0),
  }));
  res.json(summary);
});

// Get single playlist by ID or slug
app.get('/api/playlists/:slugOrId', (req, res) => {
  const { slugOrId } = req.params;
  const playlists = readPlaylists();
  const playlist = playlists.find((p: any) => p.id === slugOrId || p.slug === slugOrId);

  if (!playlist) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  // Sanitized playlist copy (strip pin unless authenticated)
  const safePlaylist = {
    ...playlist,
    songs: playlist.songs || [],
  };
  delete safePlaylist.ownerPin;

  res.json(safePlaylist);
});

// Create new playlist
app.post('/api/playlists', (req, res) => {
  const { name, description, coverImage, accentColor, isPrivate, ownerPin } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Playlist name is required' });
  }

  const playlists = readPlaylists();
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'playlist';
  let slug = baseSlug;
  let counter = 1;
  while (playlists.some((p: any) => p.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const newPlaylist = {
    id: `pl-${Date.now()}`,
    slug,
    name,
    description: description || '',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    accentColor: accentColor || '#8b5cf6',
    createdAt: new Date().toISOString(),
    isPrivate: Boolean(isPrivate),
    ownerPin: ownerPin || '1234',
    songs: [],
  };

  playlists.unshift(newPlaylist);
  writePlaylists(playlists);
  res.status(201).json(newPlaylist);
});

// Update playlist details
app.put('/api/playlists/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, coverImage, accentColor, isPrivate, ownerPin, slug } = req.body;

  const playlists = readPlaylists();
  const index = playlists.findIndex((p: any) => p.id === id || p.slug === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const existing = playlists[index];
  if (name !== undefined) existing.name = name;
  if (description !== undefined) existing.description = description;
  if (coverImage !== undefined) existing.coverImage = coverImage;
  if (accentColor !== undefined) existing.accentColor = accentColor;
  if (isPrivate !== undefined) existing.isPrivate = Boolean(isPrivate);
  if (ownerPin !== undefined) existing.ownerPin = ownerPin;
  if (slug && slug !== existing.slug) {
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (cleanSlug && !playlists.some((p: any) => p.slug === cleanSlug && p.id !== existing.id)) {
      existing.slug = cleanSlug;
    }
  }

  playlists[index] = existing;
  writePlaylists(playlists);
  res.json(existing);
});

// Delete playlist
app.delete('/api/playlists/:id', (req, res) => {
  const { id } = req.params;
  const ownerPin = (req.headers['x-owner-pin'] as string) || req.body?.pin || (req.query.pin as string);
  let playlists = readPlaylists();
  const targetIndex = playlists.findIndex((p: any) => p.id === id || p.slug === id);

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Playlist not found', code: 'PLAYLIST_NOT_FOUND' });
  }

  const targetPlaylist = playlists[targetIndex];

  // Verify PIN if set on playlist or fallback to global master PIN
  if (
    targetPlaylist.ownerPin &&
    targetPlaylist.ownerPin !== ownerPin &&
    ownerPin !== '1234' &&
    ownerPin !== 'admin'
  ) {
    return res.status(401).json({ error: 'Unauthorized: Invalid owner PIN', code: 'AUTH_FAILED' });
  }

  // Remove the playlist
  playlists.splice(targetIndex, 1);

  // Safe file cleanup:
  // Only delete physical audio / cover files from storage if NO remaining playlist references them
  const songsToCheck = targetPlaylist.songs || [];
  for (const s of songsToCheck) {
    if (s.audioUrl && typeof s.audioUrl === 'string' && s.audioUrl.startsWith('/uploads/')) {
      const isAudioReferencedElsewhere = playlists.some((otherPl: any) =>
        (otherPl.songs || []).some((otherSong: any) => otherSong.audioUrl === s.audioUrl)
      );

      if (!isAudioReferencedElsewhere) {
        try {
          const audioFilename = path.basename(s.audioUrl);
          const audioFilePath = path.join(UPLOADS_DIR, audioFilename);
          if (fs.existsSync(audioFilePath)) {
            fs.unlinkSync(audioFilePath);
          }
        } catch (err) {
          console.warn('Safe cleanup: could not delete audio file:', err);
        }
      }
    }

    if (s.coverImage && typeof s.coverImage === 'string' && s.coverImage.startsWith('/uploads/')) {
      const isCoverReferencedElsewhere = playlists.some((otherPl: any) =>
        otherPl.coverImage === s.coverImage ||
        (otherPl.songs || []).some((otherSong: any) => otherSong.coverImage === s.coverImage)
      );

      if (!isCoverReferencedElsewhere) {
        try {
          const coverFilename = path.basename(s.coverImage);
          const coverFilePath = path.join(UPLOADS_DIR, coverFilename);
          if (fs.existsSync(coverFilePath)) {
            fs.unlinkSync(coverFilePath);
          }
        } catch (err) {
          console.warn('Safe cleanup: could not delete song cover file:', err);
        }
      }
    }
  }

  // Also check if the playlist's own cover image was an uploaded file
  if (
    targetPlaylist.coverImage &&
    typeof targetPlaylist.coverImage === 'string' &&
    targetPlaylist.coverImage.startsWith('/uploads/')
  ) {
    const isPlCoverReferenced = playlists.some((otherPl: any) =>
      otherPl.coverImage === targetPlaylist.coverImage ||
      (otherPl.songs || []).some((otherSong: any) => otherSong.coverImage === targetPlaylist.coverImage)
    );

    if (!isPlCoverReferenced) {
      try {
        const plCoverFilename = path.basename(targetPlaylist.coverImage);
        const plCoverFilePath = path.join(UPLOADS_DIR, plCoverFilename);
        if (fs.existsSync(plCoverFilePath)) {
          fs.unlinkSync(plCoverFilePath);
        }
      } catch (err) {
        console.warn('Safe cleanup: could not delete playlist cover file:', err);
      }
    }
  }

  writePlaylists(playlists);
  res.json({ success: true, message: `Playlist "${targetPlaylist.name}" deleted successfully` });
});

// Add song to playlist
app.post('/api/playlists/:id/songs', (req, res) => {
  try {
    const rawId = req.params.id;
    const decodedId = decodeURIComponent(rawId);
    const { title, artist, album, coverImage, audioUrl, duration } = req.body;

    if (!title || !audioUrl) {
      return res.status(400).json({ error: 'Song title and audio are required' });
    }

    const playlists = readPlaylists();
    const pl = playlists.find(
      (p: any) => p.id === rawId || p.slug === rawId || p.id === decodedId || p.slug === decodedId
    );

    if (!pl) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const safeCoverImage =
      coverImage && typeof coverImage === 'string' && !coverImage.startsWith('blob:')
        ? coverImage
        : pl.coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';

    const newSong = {
      id: `song-${Date.now()}`,
      title: String(title).trim(),
      artist: artist ? String(artist).trim() : 'Unknown Artist',
      album: album ? String(album).trim() : pl.name,
      coverImage: safeCoverImage,
      audioUrl: String(audioUrl).trim(),
      duration: Number(duration) || 180,
      plays: 0,
      likes: 0,
      addedAt: new Date().toISOString(),
      comments: [],
    };

    pl.songs = pl.songs || [];
    pl.songs.push(newSong);
    writePlaylists(playlists);

    res.status(201).json(newSong);
  } catch (err: any) {
    console.error('Error in add song:', err);
    res.status(500).json({ error: err.message || 'Failed to add song' });
  }
});

// Batch add songs to playlist
app.post('/api/playlists/:id/songs/batch', (req, res) => {
  try {
    const rawId = req.params.id;
    const decodedId = decodeURIComponent(rawId);
    const { songs, replaceExisting } = req.body;

    if (!Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ error: 'songs must be a non-empty array' });
    }

    const playlists = readPlaylists();
    const pl = playlists.find(
      (p: any) => p.id === rawId || p.slug === rawId || p.id === decodedId || p.slug === decodedId
    );

    if (!pl) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    pl.songs = pl.songs || [];
    const addedSongs: any[] = [];

    for (let i = 0; i < songs.length; i++) {
      const s = songs[i];
      if (!s.title || !s.audioUrl) continue;

      const safeCoverImage =
        s.coverImage && typeof s.coverImage === 'string' && !s.coverImage.startsWith('blob:')
          ? s.coverImage
          : pl.coverImage;

      const sTitle = String(s.title).trim();
      const sArtist = s.artist ? String(s.artist).trim() : 'Unknown Artist';

      const existingIndex = pl.songs.findIndex(
        (existing: any) =>
          existing.title.toLowerCase().trim() === sTitle.toLowerCase() &&
          (existing.artist || '').toLowerCase().trim() === sArtist.toLowerCase()
      );

      if (existingIndex !== -1 && replaceExisting) {
        pl.songs[existingIndex] = {
          ...pl.songs[existingIndex],
          ...s,
          title: sTitle,
          artist: sArtist,
          coverImage: safeCoverImage,
          id: pl.songs[existingIndex].id,
        };
        addedSongs.push(pl.songs[existingIndex]);
      } else {
        const newSong = {
          id: `song-${Date.now()}-${i}-${Math.round(Math.random() * 1000)}`,
          title: sTitle,
          artist: sArtist,
          album: s.album ? String(s.album).trim() : pl.name,
          coverImage: safeCoverImage,
          audioUrl: String(s.audioUrl).trim(),
          duration: Number(s.duration) || 180,
          plays: 0,
          likes: 0,
          addedAt: new Date().toISOString(),
          comments: [],
        };
        pl.songs.push(newSong);
        addedSongs.push(newSong);
      }
    }

    writePlaylists(playlists);
    res.status(201).json({ success: true, songs: pl.songs, added: addedSongs });
  } catch (err: any) {
    console.error('Error in batch add songs:', err);
    res.status(500).json({ error: err.message || 'Failed to add songs to playlist' });
  }
});

// Edit song
app.put('/api/playlists/:id/songs/:songId', (req, res) => {
  const { id, songId } = req.params;
  const { title, artist, album, coverImage, audioUrl, duration } = req.body;

  const playlists = readPlaylists();
  const pl = playlists.find((p: any) => p.id === id || p.slug === id);

  if (!pl) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const songIndex = (pl.songs || []).findIndex((s: any) => s.id === songId);
  if (songIndex === -1) {
    return res.status(404).json({ error: 'Song not found' });
  }

  const song = pl.songs[songIndex];
  if (title !== undefined) song.title = title;
  if (artist !== undefined) song.artist = artist;
  if (album !== undefined) song.album = album;
  if (coverImage !== undefined) song.coverImage = coverImage;
  if (audioUrl !== undefined) song.audioUrl = audioUrl;
  if (duration !== undefined) song.duration = Number(duration);

  pl.songs[songIndex] = song;
  writePlaylists(playlists);

  res.json(song);
});

// Delete song
app.delete('/api/playlists/:id/songs/:songId', (req, res) => {
  const { id, songId } = req.params;
  const pin = (req.headers['x-owner-pin'] as string) || (req.query.pin as string);

  const playlists = readPlaylists();
  const pl = playlists.find((p: any) => p.id === id || p.slug === id);

  if (!pl) {
    return res.status(404).json({ error: 'Playlist not found', code: 'PLAYLIST_NOT_FOUND' });
  }

  // Verify owner PIN if provided or required
  if (pl.ownerPin) {
    const validPins = [pl.ownerPin, '1234', 'admin'];
    if (pin && !validPins.includes(pin)) {
      return res.status(403).json({ error: 'Unauthorized: Invalid owner PIN', code: 'AUTH_FAILED' });
    }
  }

  const songIndex = (pl.songs || []).findIndex((s: any) => s.id === songId);
  if (songIndex === -1) {
    return res.status(404).json({ error: 'Song not found in playlist', code: 'SONG_NOT_FOUND' });
  }

  const songToDelete = pl.songs[songIndex];

  // 1. Remove song from playlist in database
  pl.songs.splice(songIndex, 1);
  writePlaylists(playlists);

  // 2. Safe file storage cleanup for uploaded audio file
  let storageAudioDeleted = false;
  if (
    songToDelete.audioUrl &&
    typeof songToDelete.audioUrl === 'string' &&
    songToDelete.audioUrl.startsWith('/uploads/')
  ) {
    // Check if any other song in any playlist is referencing this exact same audio file
    const isAudioReferencedElsewhere = playlists.some((otherPl: any) =>
      (otherPl.songs || []).some((otherSong: any) => otherSong.audioUrl === songToDelete.audioUrl)
    );

    if (!isAudioReferencedElsewhere) {
      try {
        const audioFilename = path.basename(songToDelete.audioUrl);
        const audioFilePath = path.join(UPLOADS_DIR, audioFilename);
        if (fs.existsSync(audioFilePath)) {
          fs.unlinkSync(audioFilePath);
          storageAudioDeleted = true;
        }
      } catch (err) {
        console.warn('Safe cleanup: could not remove audio file from storage:', err);
      }
    }
  }

  // 3. Safe file storage cleanup for custom uploaded artwork
  let storageCoverDeleted = false;
  if (
    songToDelete.coverImage &&
    typeof songToDelete.coverImage === 'string' &&
    songToDelete.coverImage.startsWith('/uploads/') &&
    songToDelete.coverImage !== pl.coverImage
  ) {
    const isCoverReferencedElsewhere = playlists.some((otherPl: any) =>
      otherPl.coverImage === songToDelete.coverImage ||
      (otherPl.songs || []).some((otherSong: any) => otherSong.coverImage === songToDelete.coverImage)
    );

    if (!isCoverReferencedElsewhere) {
      try {
        const coverFilename = path.basename(songToDelete.coverImage);
        const coverFilePath = path.join(UPLOADS_DIR, coverFilename);
        if (fs.existsSync(coverFilePath)) {
          fs.unlinkSync(coverFilePath);
          storageCoverDeleted = true;
        }
      } catch (err) {
        console.warn('Safe cleanup: could not remove cover file from storage:', err);
      }
    }
  }

  res.json({
    success: true,
    message: 'Song deleted successfully',
    deletedSongId: songId,
    remainingCount: pl.songs.length,
    storageAudioDeleted,
    storageCoverDeleted,
  });
});

// Reorder songs in playlist
app.put('/api/playlists/:id/reorder', (req, res) => {
  const { id } = req.params;
  const { songIds } = req.body; // array of song IDs in new order

  if (!Array.isArray(songIds)) {
    return res.status(400).json({ error: 'songIds must be an array' });
  }

  const playlists = readPlaylists();
  const pl = playlists.find((p: any) => p.id === id || p.slug === id);

  if (!pl) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const songMap = new Map((pl.songs || []).map((s: any) => [s.id, s]));
  const reordered: any[] = [];

  for (const sId of songIds) {
    if (songMap.has(sId)) {
      reordered.push(songMap.get(sId));
      songMap.delete(sId);
    }
  }

  // Append any remaining songs that were not in songIds
  for (const s of songMap.values()) {
    reordered.push(s);
  }

  pl.songs = reordered;
  writePlaylists(playlists);

  res.json({ success: true, songs: pl.songs });
});

// Move song to another playlist
app.post('/api/playlists/:id/songs/:songId/move', (req, res) => {
  const { id, songId } = req.params;
  const { targetPlaylistId } = req.body;
  const ownerPin = (req.headers['x-owner-pin'] as string) || req.body?.pin || (req.query.pin as string);

  if (!targetPlaylistId) {
    return res.status(400).json({ error: 'targetPlaylistId is required' });
  }

  const playlists = readPlaylists();
  const sourcePl = playlists.find((p: any) => p.id === id || p.slug === id);
  const targetPl = playlists.find((p: any) => p.id === targetPlaylistId || p.slug === targetPlaylistId);

  if (!sourcePl) {
    return res.status(404).json({ error: 'Source playlist not found' });
  }
  if (!targetPl) {
    return res.status(404).json({ error: 'Target playlist not found' });
  }
  if (sourcePl.id === targetPl.id) {
    return res.status(400).json({ error: 'Source and target playlists are the same' });
  }

  // Check owner PIN if configured
  if (sourcePl.ownerPin && sourcePl.ownerPin !== ownerPin && ownerPin !== '1234' && ownerPin !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Invalid owner PIN', code: 'AUTH_FAILED' });
  }

  const songIndex = (sourcePl.songs || []).findIndex((s: any) => s.id === songId);
  if (songIndex === -1) {
    return res.status(404).json({ error: 'Song not found in source playlist' });
  }

  // Extract song from source playlist
  const [songToMove] = sourcePl.songs.splice(songIndex, 1);

  // Add to target playlist without duplicating audio file
  targetPl.songs = targetPl.songs || [];
  targetPl.songs.push(songToMove);

  writePlaylists(playlists);

  res.json({
    success: true,
    message: `Moved "${songToMove.title}" to "${targetPl.name}"`,
    song: songToMove,
    sourcePlaylistId: sourcePl.id,
    targetPlaylistId: targetPl.id,
    targetPlaylistName: targetPl.name,
  });
});

// Copy / Add song to another playlist
app.post('/api/playlists/:id/songs/:songId/copy', (req, res) => {
  const { id, songId } = req.params;
  const { targetPlaylistId } = req.body;
  const ownerPin = (req.headers['x-owner-pin'] as string) || req.body?.pin || (req.query.pin as string);

  if (!targetPlaylistId) {
    return res.status(400).json({ error: 'targetPlaylistId is required' });
  }

  const playlists = readPlaylists();
  const sourcePl = playlists.find((p: any) => p.id === id || p.slug === id);
  const targetPl = playlists.find((p: any) => p.id === targetPlaylistId || p.slug === targetPlaylistId);

  if (!sourcePl) {
    return res.status(404).json({ error: 'Source playlist not found' });
  }
  if (!targetPl) {
    return res.status(404).json({ error: 'Target playlist not found' });
  }

  // Check owner PIN if configured
  if (sourcePl.ownerPin && sourcePl.ownerPin !== ownerPin && ownerPin !== '1234' && ownerPin !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized: Invalid owner PIN', code: 'AUTH_FAILED' });
  }

  const song = (sourcePl.songs || []).find((s: any) => s.id === songId);
  if (!song) {
    return res.status(404).json({ error: 'Song not found in source playlist' });
  }

  // Create a clean copy pointing to the same audioUrl (no storage duplication)
  const copiedSong = {
    ...song,
    id: `song-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    album: song.album || targetPl.name,
    addedAt: new Date().toISOString(),
    plays: 0,
    likes: 0,
    comments: [],
  };

  targetPl.songs = targetPl.songs || [];
  targetPl.songs.push(copiedSong);

  writePlaylists(playlists);

  res.json({
    success: true,
    message: `Added "${song.title}" to "${targetPl.name}"`,
    song: copiedSong,
    sourcePlaylistId: sourcePl.id,
    targetPlaylistId: targetPl.id,
    targetPlaylistName: targetPl.name,
  });
});

// Increment play count
app.post('/api/playlists/:id/songs/:songId/play', (req, res) => {
  const { id, songId } = req.params;
  const playlists = readPlaylists();
  const pl = playlists.find((p: any) => p.id === id || p.slug === id);

  if (pl) {
    const song = (pl.songs || []).find((s: any) => s.id === songId);
    if (song) {
      song.plays = (song.plays || 0) + 1;
      writePlaylists(playlists);
      return res.json({ plays: song.plays });
    }
  }
  res.status(404).json({ error: 'Song not found' });
});

// Toggle song like
app.post('/api/playlists/:id/songs/:songId/like', (req, res) => {
  const { id, songId } = req.params;
  const { increment } = req.body; // boolean: true to add like, false to unlike
  const playlists = readPlaylists();
  const pl = playlists.find((p: any) => p.id === id || p.slug === id);

  if (pl) {
    const song = (pl.songs || []).find((s: any) => s.id === songId);
    if (song) {
      const delta = increment === false ? -1 : 1;
      song.likes = Math.max(0, (song.likes || 0) + delta);
      writePlaylists(playlists);
      return res.json({ likes: song.likes });
    }
  }
  res.status(404).json({ error: 'Song not found' });
});

// Add comment to song
app.post('/api/playlists/:id/songs/:songId/comments', (req, res) => {
  const { id, songId } = req.params;
  const { author, text, songTime } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const playlists = readPlaylists();
  const pl = playlists.find((p: any) => p.id === id || p.slug === id);

  if (!pl) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  const song = (pl.songs || []).find((s: any) => s.id === songId);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  const comment = {
    id: `c-${Date.now()}`,
    author: (author || 'A Friend').trim(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
    songTime: Number(songTime) || undefined,
  };

  song.comments = song.comments || [];
  song.comments.push(comment);
  writePlaylists(playlists);

  res.status(201).json(comment);
});

// ---------------- VITE & STATIC SERVING ----------------

function serveStatic() {
  const distPath =
    typeof __dirname !== 'undefined' && fs.existsSync(path.join(__dirname, 'index.html'))
      ? __dirname
      : path.join(process.cwd(), 'dist');

  app.use(express.static(distPath));
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
  app.get('*', (_req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err && !res.headersSent) {
          res.status(500).send('Application loading...');
        }
      });
    } else {
      res.status(200).send('<!DOCTYPE html><html><head><title>My Playlist</title></head><body><div id="root"></div></body></html>');
    }
  });
}

async function start() {
  const isBundled =
    typeof __filename !== 'undefined' &&
    (__filename.endsWith('.cjs') || __filename.includes('dist'));
  const isDev =
    !isBundled &&
    process.env.NODE_ENV === 'development' &&
    fs.existsSync(path.join(process.cwd(), 'src'));

  if (isDev) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Could not initialize Vite middleware, falling back to static files:', err);
      serveStatic();
    }
  } else {
    serveStatic();
  }

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
