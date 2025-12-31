import { GAME_CONFIG } from '../utils/constants';

export class PlayerHealth {
  private health: number;
  private maxHealth: number;

  constructor() {
    this.maxHealth = GAME_CONFIG.PLAYER.MAX_HEALTH;
    this.health = this.maxHealth;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public getHealth(): number {
    return this.health;
  }

  public getMaxHealth(): number {
    return this.maxHealth;
  }

  public getHealthPercentage(): number {
    return this.health / this.maxHealth;
  }

  public isDead(): boolean {
    return this.health <= 0;
  }

  public reset(): void {
    this.health = this.maxHealth;
  }
}

