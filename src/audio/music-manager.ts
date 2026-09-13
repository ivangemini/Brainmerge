export type MusicTrack = 'main' | 'campaign' | 'world1' | 'world2' | 'raid';

type AudioSettings = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
};

const TRACKS: Record<MusicTrack, string> = {
  main: './public/audio/music/cotton-toys.mp3',
  campaign: './public/audio/music/sandbox-serenade.mp3',
  world1: './public/audio/music/lily-paddling.wav',
  world2: './public/audio/music/powerline-cappuccino.mp3',
  raid: './public/audio/music/one-two-exterminate.mp3'
};

const SETTINGS_KEY = 'brainmerge.audio.v1';
const FADE_MS = 1_000;

const DEFAULT_SETTINGS: AudioSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.35,
  sfxVolume: 0.7
};

export class MusicManager {
  private audio: HTMLAudioElement | null = null;
  private current: MusicTrack | null = null;
  private fadeTimers = new Map<HTMLAudioElement, number>();
  private unlocked = false;
  private settingsOpen = false;
  private active = true;
  private settings: AudioSettings = this.loadSettings();
  private labels = {
    settings: 'Audio settings',
    music: 'Music',
    sfx: 'Sound effects',
    close: 'Close audio settings'
  };

  constructor() {
    document.addEventListener('pointerdown', () => {
      this.unlocked = true;
      if (this.current) void this.start(this.current);
    }, { once: true, capture: true });
    document.addEventListener('keydown', () => {
      this.unlocked = true;
      if (this.current) void this.start(this.current);
    }, { once: true, capture: true });
    document.addEventListener('visibilitychange', () => {
      if (!this.audio) return;
      if (document.hidden) this.audio.pause();
      else if (this.current && this.active) void this.start(this.current);
    });
    window.addEventListener('brainmerge:music-request', (event) => {
      const track = (event as CustomEvent<{ track?: MusicTrack | null }>).detail?.track;
      if (track) this.playMusic(track);
      else this.stopMusic();
    });
    window.dispatchEvent(new CustomEvent('brainmerge:sfx-setting', {
      detail: { enabled: this.settings.sfxEnabled, volume: this.settings.sfxVolume }
    }));
  }

  setLabels(labels: Partial<typeof this.labels>): void {
    this.labels = { ...this.labels, ...labels };
    this.ensureControls();
  }

  playMusic(track: MusicTrack): void {
    if (this.current === track && this.audio) {
      if (this.active) void this.start(track);
      return;
    }
    this.current = track;
    if (this.audio) this.fadeOut(this.audio);
    if (this.settings.musicEnabled && this.active && this.unlocked) void this.start(track);
  }

  stopMusic(): void {
    this.current = null;
    if (this.audio) {
      this.fadeOut(this.audio);
      this.audio = null;
    }
  }

  pauseMusic(): void {
    this.audio?.pause();
  }

  resumeMusic(): void {
    if (this.current && this.active) void this.start(this.current);
  }

  setActive(active: boolean): void {
    this.active = active;
    if (!active) this.pauseMusic();
    else this.resumeMusic();
  }

  setMusicEnabled(enabled: boolean): void {
    this.settings.musicEnabled = enabled;
    this.saveSettings();
    if (enabled) this.resumeMusic();
    else this.pauseMusic();
    this.updateControls();
  }

  setSfxEnabled(enabled: boolean): void {
    this.settings.sfxEnabled = enabled;
    this.saveSettings();
    window.dispatchEvent(new CustomEvent('brainmerge:sfx-setting', { detail: { enabled } }));
    this.updateControls();
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = clamp(volume);
    if (this.audio) this.audio.volume = this.settings.musicVolume;
    this.saveSettings();
    this.updateControls();
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = clamp(volume);
    window.dispatchEvent(new CustomEvent('brainmerge:sfx-setting', { detail: { volume: this.settings.sfxVolume } }));
    this.saveSettings();
    this.updateControls();
  }

  private ensureControls(): void {
    const panel = document.querySelector<HTMLElement>('[data-audio-settings-panel]');
    if (!panel) return;
    if (panel.dataset.audioBound === 'true') {
      this.updateControls(panel);
      return;
    }
    panel.dataset.audioBound = 'true';
    const toggle = document.querySelector<HTMLButtonElement>('[data-audio-settings-toggle]');
    toggle?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.settingsOpen = !this.settingsOpen;
      this.updateControls(panel);
      if (this.settingsOpen) panel.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    });
    panel.querySelector('[data-audio-settings-close]')?.addEventListener('click', (event) => {
      event.preventDefault();
      this.settingsOpen = false;
      this.updateControls(panel);
      toggle?.focus({ preventScroll: true });
    });
    panel.querySelector('[data-audio-music]')?.addEventListener('change', (event) => this.setMusicEnabled((event.target as HTMLInputElement).checked));
    panel.querySelector('[data-audio-sfx]')?.addEventListener('change', (event) => this.setSfxEnabled((event.target as HTMLInputElement).checked));
    panel.querySelector('[data-audio-music-volume]')?.addEventListener('input', (event) => this.setMusicVolume(Number((event.target as HTMLInputElement).value)));
    panel.querySelector('[data-audio-sfx-volume]')?.addEventListener('input', (event) => this.setSfxVolume(Number((event.target as HTMLInputElement).value)));
    this.updateControls(panel);
  }

  private updateControls(panel = document.querySelector<HTMLElement>('[data-audio-settings-panel]')): void {
    if (!panel) return;
    const title = panel.querySelector('[data-audio-settings-title]');
    const musicLabel = panel.querySelector('[data-audio-music-label]');
    const sfxLabel = panel.querySelector('[data-audio-sfx-label]');
    if (title) title.textContent = this.labels.settings;
    if (musicLabel) musicLabel.textContent = this.labels.music;
    if (sfxLabel) sfxLabel.textContent = this.labels.sfx;
    const toggle = document.querySelector<HTMLButtonElement>('[data-audio-settings-toggle]');
    toggle?.setAttribute('aria-label', this.labels.settings);
    toggle?.setAttribute('aria-expanded', String(this.settingsOpen));
    panel.querySelector<HTMLButtonElement>('[data-audio-settings-close]')?.setAttribute('aria-label', this.labels.close);
    panel.hidden = !this.settingsOpen;
    const music = panel.querySelector<HTMLInputElement>('[data-audio-music]');
    const sfx = panel.querySelector<HTMLInputElement>('[data-audio-sfx]');
    const musicVolume = panel.querySelector<HTMLInputElement>('[data-audio-music-volume]');
    const sfxVolume = panel.querySelector<HTMLInputElement>('[data-audio-sfx-volume]');
    if (music) music.checked = this.settings.musicEnabled;
    if (sfx) sfx.checked = this.settings.sfxEnabled;
    if (musicVolume) musicVolume.value = String(this.settings.musicVolume);
    if (sfxVolume) sfxVolume.value = String(this.settings.sfxVolume);
  }

  private async start(track: MusicTrack): Promise<void> {
    if (!this.settings.musicEnabled || !this.active || !this.unlocked || document.hidden) return;
    if (!this.audio || this.audio.dataset.track !== track) {
      const audio = new Audio(TRACKS[track]);
      audio.dataset.track = track;
      audio.loop = true;
      audio.preload = 'metadata';
      audio.volume = 0;
      audio.addEventListener('error', () => undefined);
      this.audio = audio;
    }
    const audio = this.audio;
    audio.volume = Math.max(audio.volume, 0.001);
    try {
      await audio.play();
    } catch {
      return;
    }
    this.animateVolume(audio, this.settings.musicVolume);
  }

  private fadeOut(audio: HTMLAudioElement): void {
    this.animateVolume(audio, 0, () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    });
  }

  private animateVolume(audio: HTMLAudioElement, target: number, done?: () => void): void {
    const previous = this.fadeTimers.get(audio);
    if (previous !== undefined) window.clearInterval(previous);
    const from = audio.volume;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - started) / FADE_MS);
      audio.volume = from + (target - from) * progress;
      if (progress >= 1) {
        window.clearInterval(timer);
        this.fadeTimers.delete(audio);
        done?.();
      }
    }, 40);
    this.fadeTimers.set(audio, timer);
  }

  private loadSettings(): AudioSettings {
    try {
      const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as Partial<AudioSettings> | null;
      return {
        musicEnabled: raw?.musicEnabled !== false,
        sfxEnabled: raw?.sfxEnabled !== false,
        musicVolume: clamp(raw?.musicVolume ?? DEFAULT_SETTINGS.musicVolume),
        sfxVolume: clamp(raw?.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume)
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Restricted storage must not prevent gameplay.
    }
  }
}

function clamp(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : DEFAULT_SETTINGS.musicVolume;
}
