import { Vector3 } from 'three';

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
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

