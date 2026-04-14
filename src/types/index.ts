import { Vector3 } from 'three';

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
}

export interface PlayerState {
  position: Vector3;
  health: number;
  maxHealth: number;
  isGrounded: boolean;
  velocity: Vector3;
}

export interface EnemyState {
  id: string;
  position: Vector3;
  health: number;
  maxHealth: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
  target?: Vector3;
}

export interface WeaponState {
  isShooting: boolean;
  lastShotTime: number;
  fireRate: number;
  damage: number;
}

export interface InputState {
  keys: Set<string>;
  mouseButtons: Set<number>;
  mouseDelta: { x: number; y: number };
  isPointerLocked: boolean;
}

export interface RunSummary {
  score: number;
  killScore: number;
  accuracyBonus: number;
  timeBonus: number;
  shotsFired: number;
  shotsHit: number;
  kills: number;
  bossDefeated: boolean;
  elapsedMs: number;
  accuracy: number;
  isHighScore: boolean;
  highScore: number;
  title: string;
  subtitle: string;
}

export interface HudState {
  health: number;
  maxHealth: number;
  currentMagAmmo: number;
  magazines: number;
  maxMagAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  bossHealth?: number;
  bossMaxHealth?: number;
  score: number;
  highScore: number;
  elapsedMs: number;
}
