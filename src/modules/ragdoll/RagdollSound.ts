export type SoundName = 'spawn' | 'kick' | 'impact' | 'defeat' | 'bounce' | 'cheer';
export class RagdollSound {
  private context?: AudioContext;
  muted = false;
  play(name: SoundName) {
    if (this.muted) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume();
      const ctx = this.context; const osc = ctx.createOscillator(); const gain = ctx.createGain();
      const now = ctx.currentTime;
      const params: Record<SoundName, [OscillatorType, number, number, number]> = {
        spawn: ['sine', 340, 550, 0.14], kick: ['triangle', 205, 95, 0.20],
        impact: ['sine', 130, 70, 0.09], defeat: ['triangle', 460, 185, 0.38],
        bounce: ['sine', 260, 640, 0.24], cheer: ['triangle', 440, 880, 0.38],
      };
      const [wave, start, end, duration] = params[name];
      osc.type = wave; osc.frequency.setValueAtTime(start, now);
      osc.frequency.exponentialRampToValueAtTime(end, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(name === 'defeat' ? 0.055 : 0.085, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + duration + 0.01);
    } catch { /* Browsers may disable audio until interaction. */ }
  }
  dispose() { if (this.context) void this.context.close(); }
}
