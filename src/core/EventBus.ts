import * as THREE from 'three';

type GameEvents = {
  shotFired: { position: THREE.Vector3; isPlayer: boolean };
  triggerEmpty: undefined;
  reloadStarted: undefined;
  reloadCompleted: undefined;
  playerDamaged: { amount: number; health: number; maxHealth: number };
  enemyDamaged: { position: THREE.Vector3; isBoss: boolean };
  enemyDied: { position: THREE.Vector3; isBoss: boolean };
  bulletImpact: { position: THREE.Vector3; isPlayerBullet: boolean };
  bossSpawned: { position: THREE.Vector3 };
  gameOver: undefined;
  victory: undefined;
};

type EventKey = keyof GameEvents;
type Listener<T extends EventKey> = (payload: GameEvents[T]) => void;

/** Lightweight typed pub/sub used to decouple feedback systems from gameplay entities. */
export class EventBus {
  private listeners = new Map<EventKey, Set<Function>>();

  public on<T extends EventKey>(event: T, listener: Listener<T>): () => void {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  public emit<T extends EventKey>(event: T, payload: GameEvents[T]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => {
      (listener as Listener<T>)(payload);
    });
  }
}
