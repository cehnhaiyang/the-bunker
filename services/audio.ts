export class AudioService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambienceNode: GainNode | null = null;
    private weatherNode: GainNode | null = null;
  
    init() {
      if (this.ctx) return;
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
      this.startAmbience();
    }
  
    private startAmbience() {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 50;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.ambienceNode = gain;
  
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;
      
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;
      noiseSrc.loop = true;
      
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 200;
      
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = 0.02;
      
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSrc.start();
      this.weatherNode = noiseGain;
    }
  
    setEnvironment(threatLevel: number, weather: string) {
      if (!this.ctx || !this.ambienceNode || !this.weatherNode) return;
      
      let ambVol = 0.04;
      if (threatLevel > 60) ambVol = 0.1;
      if (threatLevel > 85) ambVol = 0.18;
      this.ambienceNode.gain.setTargetAtTime(ambVol, this.ctx.currentTime, 1.0);
  
      let noiseVol = 0.02;
      if (weather === 'TOXIC_STORM') noiseVol = 0.15;
      if (weather === 'EMP_PULSE') noiseVol = 0.0;
      this.weatherNode.gain.setTargetAtTime(noiseVol, this.ctx.currentTime, 2.0);
    }
  
    playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1, slideTo: number | null = null) {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }
  
    playNoise(duration: number, type: 'white' | 'low' | 'high' | 'band' = 'white', vol = 0.1) {
      if (!this.ctx || !this.masterGain) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = type === 'low' ? 'lowpass' : (type === 'high' ? 'highpass' : 'bandpass');
      filter.frequency.value = type === 'low' ? 250 : (type === 'high' ? 6000 : 1500);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start();
    }
  
    uiHover() { this.playTone(1800, 'sine', 0.03, 0.015); }
    click() { this.playTone(1200, 'square', 0.05, 0.03); }
    error() { this.playTone(120, 'sawtooth', 0.6, 0.15, 60); }
    confirm() { this.playTone(600, 'square', 0.08, 0.04); setTimeout(() => this.playTone(900, 'square', 0.1, 0.04), 80); }
    process() {
      let i = 0;
      const int = setInterval(() => {
        // Note: This relies on external state to stop, or just runs briefly.
        // For simplicity in this port, we'll just run it a fixed times or let the caller handle it.
        // Here we'll just play a short burst.
        this.playTone(1500 + Math.random() * 1500, 'square', 0.03, 0.01);
        if (++i > 10) clearInterval(int);
      }, 80);
    }
    type() { this.playTone(3000, 'square', 0.01, 0.003); }
    droneStart() { this.playTone(80, 'sawtooth', 2.0, 0.1, 300); setTimeout(() => this.playNoise(2.5, 'low', 0.15), 300); }
    door() { this.playNoise(1.5, 'low', 0.2); this.playTone(50, 'sawtooth', 1.8, 0.2, 10); }
    death() { this.playTone(30, 'sawtooth', 5.0, 0.8, 5); this.playNoise(4.0, 'low', 0.5); }
    bang() { this.playNoise(0.8, 'low', 0.9); this.playTone(40, 'square', 0.6, 0.9, 5); }
    win() { this.playTone(440, 'sine', 0.5, 0.1); setTimeout(() => this.playTone(554, 'sine', 0.5, 0.1), 200); setTimeout(() => this.playTone(659, 'sine', 2.0, 0.15), 400); }
    heartbeat() { if (!this.ctx) return; this.playTone(35, 'sine', 0.15, 0.4); setTimeout(() => this.playTone(35, 'sine', 0.2, 0.3), 250); }
    gunfire() { this.playNoise(0.2, 'high', 0.4); this.playTone(80, 'sawtooth', 0.15, 0.5, 20); }
    geiger() { this.playNoise(0.01, 'high', 0.08); }
    elecSpark() { this.playNoise(0.05, 'high', 0.2); this.playTone(2000, 'sawtooth', 0.05, 0.1); }
  }
  
  export const audio = new AudioService();
