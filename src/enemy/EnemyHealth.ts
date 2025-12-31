import { GAME_CONFIG } from '../utils/constants';

export class EnemyHealth {
  private health: number;
  private maxHealth: number;

  constructor() {
    this.maxHealth = GAME_CONFIG.ENEMY.MAX_HEALTH;
    this.health = this.maxHealth;
  }

  public takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
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

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public setMaxHealth(maxHealth: number): void {
    const ratio = this.health / this.maxHealth;
    this.maxHealth = maxHealth;
    this.health = this.maxHealth * ratio;
  }
}

