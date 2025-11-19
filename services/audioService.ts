// Synthesizer using Web Audio API
class AudioService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private enabled: boolean = true;
    private isMusicPlaying: boolean = false;
    private nextNoteTime: number = 0;
    private timerID: number | null = null;
    private tempo: number = 130;
    private lookahead: number = 25.0;
    private scheduleAheadTime: number = 0.1;
    private currentNote: number = 0;

    // Cyberpunk/Techno Bassline
    private bassline = [
        55, 0, 55, 110, 
        55, 0, 82, 0, 
        55, 0, 55, 110, 
        55, 0, 73, 65
    ];

    constructor() {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.4;

        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.musicGain.gain.value = 0.25;

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);
        this.sfxGain.gain.value = 0.6;
      } catch (e) {
        console.error("Web Audio API not supported", e);
      }
    }
  
    public setEnabled(enabled: boolean) {
      this.enabled = enabled;
      if (this.ctx) {
        if (enabled) {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            this.startMusic();
        } else {
            this.stopMusic();
        }
      }
    }

    // --- Music Sequencer ---

    private nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat * 0.25; // Sixteenth notes
        this.currentNote++;
        if (this.currentNote >= this.bassline.length) {
            this.currentNote = 0;
        }
    }

    private scheduleNote(beatNumber: number, time: number) {
        if (!this.ctx || !this.musicGain) return;

        const freq = this.bassline[beatNumber];
        if (freq === 0) return; // Rest

        const osc = this.ctx.createOscillator();
        const envelope = this.ctx.createGain();

        osc.frequency.value = freq;
        osc.type = 'sawtooth';

        // Filter for bass pluck
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, time);
        filter.frequency.exponentialRampToValueAtTime(1000, time + 0.05);
        filter.frequency.exponentialRampToValueAtTime(200, time + 0.2);

        envelope.gain.setValueAtTime(0.8, time);
        envelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + 0.2);
    }

    private scheduler() {
        if (!this.ctx) return;
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentNote, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    public startMusic() {
        if (this.isMusicPlaying || !this.enabled || !this.ctx) return;
        this.isMusicPlaying = true;
        this.currentNote = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduler();
    }

    public stopMusic() {
        this.isMusicPlaying = false;
        if (this.timerID) {
            window.clearTimeout(this.timerID);
            this.timerID = null;
        }
    }
  
    // --- SFX ---

    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.5) {
      if (!this.enabled || !this.ctx || !this.sfxGain) return;
  
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
  
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
  
      gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
  
      osc.connect(gain);
      gain.connect(this.sfxGain);
  
      osc.start(this.ctx.currentTime + startTime);
      osc.stop(this.ctx.currentTime + startTime + duration);
    }
  
    public playSwordAttack() {
      if (!this.enabled || !this.ctx || !this.sfxGain) return;
      
      const t = this.ctx.currentTime;
      
      // White Noise burst (Impact)
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      
      noise.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);

      // Sharp high sweep (Sword ring)
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(2000, t + 0.1);
      
      oscGain.gain.setValueAtTime(0.3, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      
      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  
    public playVictoryJingle() {
      if (!this.enabled || !this.ctx) return;
      const now = 0;
      // Major Arpeggio
      this.playTone(523.25, 'square', 0.2, now, 0.3); // C
      this.playTone(659.25, 'square', 0.2, now + 0.1, 0.3); // E
      this.playTone(783.99, 'square', 0.2, now + 0.2, 0.3); // G
      this.playTone(1046.50, 'square', 0.6, now + 0.3, 0.4); // High C
      
      // Victory Chord
      setTimeout(() => {
          this.playTone(523.25, 'sawtooth', 0.5, 0, 0.2);
          this.playTone(783.99, 'sawtooth', 0.5, 0, 0.2);
      }, 300);
    }
  
    public playDamage() {
      if (!this.enabled || !this.ctx || !this.sfxGain) return;
      
      const t = this.ctx.currentTime;
      
      // Low frequency punch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      osc.type = 'sawtooth';
      
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      
      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(t);
      osc.stop(t + 0.2);
    }

    public playError() {
        if (!this.enabled || !this.ctx) return;
        // Harsh buzz
        this.playTone(80, 'sawtooth', 0.3, 0, 0.4);
        this.playTone(75, 'square', 0.3, 0, 0.4);
    }
  
    public playClick() {
      if (!this.enabled || !this.ctx) return;
      this.playTone(1500, 'sine', 0.05, 0, 0.1);
    }
}
  
export const audioManager = new AudioService();