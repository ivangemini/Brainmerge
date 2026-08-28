type FeedbackKind = 'merge' | 'spawn' | 'reward' | 'rescue';

export class AudioFeedback {
  private muted = false;
  private context: AudioContext | null = null;
  private button: HTMLButtonElement | null = null;
  private muteLabel = 'Mute sound';
  private unmuteLabel = 'Unmute sound';

  setLabels(muteLabel: string, unmuteLabel: string): void {
    this.muteLabel = muteLabel;
    this.unmuteLabel = unmuteLabel;
    this.ensureButton();
    this.syncButton();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.syncButton();
  }

  trigger(kind: FeedbackKind, anchor?: Element | null): void {
    this.vibrate(kind);
    this.burst(kind, anchor);
    if (!this.muted) this.tone(kind);
  }

  private ensureButton(): void {
    if (this.button) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.feedbackMute = 'true';
    button.className = 'audio-toggle';
    button.addEventListener('click', () => this.toggleMute());
    document.body.append(button);
    this.button = button;
  }

  private syncButton(): void {
    if (!this.button) return;
    this.button.textContent = this.muted ? '🔇' : '🔊';
    const label = this.muted ? this.unmuteLabel : this.muteLabel;
    this.button.setAttribute('aria-label', label);
    this.button.title = label;
    this.button.setAttribute('aria-pressed', String(this.muted));
  }

  private getContext(): AudioContext | null {
    if (this.context) return this.context;
    const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return null;
    this.context = new Context();
    return this.context;
  }

  private tone(kind: FeedbackKind): void {
    const context = this.getContext();
    if (!context) return;
    if (context.state === 'suspended') void context.resume();

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'reward' ? 0.09 : 0.065, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gain.connect(context.destination);

    const notes: Record<FeedbackKind, number[]> = {
      merge: [440, 660],
      spawn: [330, 415],
      reward: [523, 659, 784],
      rescue: [260, 390]
    };

    notes[kind].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = kind === 'rescue' ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      const offset = index * 0.045;
      oscillator.start(now + offset);
      oscillator.stop(now + 0.16 + offset);
    });
  }

  private vibrate(kind: FeedbackKind): void {
    if (!('vibrate' in navigator)) return;
    const pattern: Record<FeedbackKind, number | number[]> = {
      merge: 18,
      spawn: 10,
      reward: [14, 35, 22],
      rescue: [18, 30, 18]
    };
    navigator.vibrate(pattern[kind]);
  }

  private burst(kind: FeedbackKind, anchor?: Element | null): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = anchor?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const palette: Record<FeedbackKind, string[]> = {
      merge: ['#fff3a8', '#86c8c3', '#f6a24a', '#ffffff'],
      spawn: ['#86c8c3', '#f9edcf', '#ffffff', '#9d78aa'],
      reward: ['#ffd475', '#f6a24a', '#fff3a8', '#ffffff'],
      rescue: ['#9d78aa', '#f9edcf', '#86c8c3', '#ffffff']
    };

    for (let index = 0; index < 12; index += 1) {
      const particle = document.createElement('i');
      const angle = (Math.PI * 2 * index) / 12 + Math.random() * 0.3;
      const distance = 40 + Math.random() * 52;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = 6 + Math.random() * 5;
      particle.style.cssText = [
        'position:fixed',
        `left:${x - size / 2}px`,
        `top:${y - size / 2}px`,
        `width:${size}px`,
        `height:${size}px`,
        `border-radius:${index % 3 === 0 ? '3px' : '999px'}`,
        `background:${palette[kind][index % palette[kind].length]}`,
        'pointer-events:none',
        'z-index:80',
        'box-shadow:0 2px 6px rgba(52,42,56,.22)'
      ].join(';');
      document.body.append(particle);
      const animation = particle.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${90 + Math.random() * 180}deg) scale(.25)`, opacity: 0 }
      ], { duration: 460 + Math.random() * 190, easing: 'cubic-bezier(.2,.8,.2,1)' });
      animation.addEventListener('finish', () => particle.remove(), { once: true });
    }
  }
}
