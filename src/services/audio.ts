export type SoundEffect = 'tap' | 'pencil' | 'success' | 'alert';

class AudioFx {
  private context: AudioContext | null = null;
  private muted = false;
  setMuted(muted: boolean) { this.muted = muted; }
  async unlock() {
    if (this.muted) return;
    try {
      if (!this.context && typeof AudioContext !== 'undefined') this.context = new AudioContext();
      if (this.context?.state === 'suspended') await this.context.resume();
    } catch { /* Sound is an enhancement; never block gameplay. */ }
  }
  play(effect: SoundEffect) {
    if (this.muted || this.context?.state !== 'running') return;
    try {
      const ctx = this.context;
      const tones = effect === 'success' ? [523.25, 659.25, 783.99] : [effect === 'pencil' ? 900 : effect === 'alert' ? 160 : 420];
      tones.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + index * 0.065;
        const duration = effect === 'success' ? 0.23 : effect === 'alert' ? 0.12 : 0.045;
        oscillator.type = effect === 'alert' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        if (effect !== 'success') oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, start + duration);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.045, start + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        oscillator.connect(gain); gain.connect(ctx.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start); oscillator.stop(start + duration + 0.01);
      });
    } catch { /* Device changes and unavailable audio are nonfatal. */ }
  }
}
export const audio = new AudioFx();
