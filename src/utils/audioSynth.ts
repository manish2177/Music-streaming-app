/**
 * Audio synthesis fallback:
 * If an external audio URL fails or is blocked by CORS/network in the sandbox iframe,
 * this generates a soothing, melodic chill Lo-Fi synthesizer loop so playback never fails.
 */
class ChillAudioSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentStep = 0;
  private timerId: any = null;
  private masterGain: GainNode | null = null;
  private volume = 0.8;

  // Lofi chord progression: Dm7 -> G7 -> Cmaj7 -> Am7
  private chords = [
    [293.66, 349.23, 440.0, 523.25], // D4, F4, A4, C5 (Dm7)
    [246.94, 329.63, 392.0, 493.88], // B3, E4, G4, B4 (Em7/G)
    [261.63, 329.63, 392.0, 493.88], // C4, E4, G4, B4 (Cmaj7)
    [220.0, 261.63, 329.63, 440.0],  // A3, C4, E4, A4 (Am7)
  ];

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
    }
  }

  public start() {
    if (this.isPlaying) return;
    this.initContext();
    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextBeat();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleNextBeat() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const chordIndex = Math.floor(this.currentStep / 4) % this.chords.length;
    const stepInChord = this.currentStep % 4;
    const chord = this.chords[chordIndex];

    const now = this.ctx.currentTime;

    // Play Rhodes piano style note
    if (stepInChord === 0 || stepInChord === 2) {
      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.06 * this.volume, now + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(noteGain);
        noteGain.connect(this.masterGain);

        osc.start(now + idx * 0.04);
        osc.stop(now + 1.3);
      });
    }

    // Soft warm sub-bass pulse
    if (stepInChord === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord[0] / 2, now);

      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + 0.08);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.9);
    }

    this.currentStep = (this.currentStep + 1) % 16;
    this.timerId = setTimeout(() => this.scheduleNextBeat(), 450); // ~66 BPM chill lofi tempo
  }
}

export const audioSynth = new ChillAudioSynth();
