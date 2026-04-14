import { EventBus } from '../core/EventBus';
import { SoundEffect, playSoundEffect } from './SoundLibrary';

const DEFAULT_VOLUME = 0.7;

/** Procedural Web Audio wrapper with persistent volume and mute controls. */
export class AudioManager {
  private readonly eventBus: EventBus;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = this.loadVolume();
  private muted = this.loadMuted();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.bindEvents();
  }

  public async resume(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.syncGain();
    }

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('masterVolume', String(this.volume));
    this.syncGain();
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem('audioMuted', String(muted));
    this.syncGain();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private bindEvents(): void {
    this.eventBus.on('shotFired', () => this.play(SoundEffect.Gunshot));
    this.eventBus.on('reloadStarted', () => this.play(SoundEffect.ReloadClick));
    this.eventBus.on('triggerEmpty', () => this.play(SoundEffect.EmptyClick));
    this.eventBus.on('enemyDamaged', () => this.play(SoundEffect.EnemyHit));
    this.eventBus.on('enemyDied', () => this.play(SoundEffect.EnemyDeath));
    this.eventBus.on('bossSpawned', () => this.play(SoundEffect.BossRoar));
    this.eventBus.on('victory', () => this.play(SoundEffect.VictoryJingle));
    this.eventBus.on('gameOver', () => this.play(SoundEffect.GameOver));
  }

  private play(sound: SoundEffect): void {
    if (!this.context || !this.masterGain) {
      return;
    }

    playSoundEffect(this.context, this.masterGain, sound);
  }

  private syncGain(): void {
    if (!this.masterGain) {
      return;
    }

    this.masterGain.gain.value = this.muted ? 0 : this.volume;
  }

  private loadVolume(): number {
    const value = Number.parseFloat(localStorage.getItem('masterVolume') ?? '');
    return Number.isFinite(value) ? value : DEFAULT_VOLUME;
  }

  private loadMuted(): boolean {
    return localStorage.getItem('audioMuted') === 'true';
  }
}
