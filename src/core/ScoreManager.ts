import { RunSummary } from '../types';

const HIGH_SCORE_KEY = 'blockblasterHighScore';
const ENEMY_POINTS = 125;
const BOSS_POINTS = 900;
const MAX_TIME_BONUS = 3000;
const TIME_BONUS_DECAY_PER_SECOND = 30;
const MAX_ACCURACY_BONUS = 1200;

/** Tracks run stats, calculates score, and persists the best run locally. */
export class ScoreManager {
  private shotsFired = 0;
  private shotsHit = 0;
  private kills = 0;
  private killScore = 0;
  private runStartMs = 0;
  private runEndMs: number | null = null;
  private bossDefeated = false;
  private highScore = ScoreManager.loadHighScore();

  /** Starts a new run and clears prior transient stats. */
  public startRun(startMs: number = performance.now()): void {
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.kills = 0;
    this.killScore = 0;
    this.runStartMs = startMs;
    this.runEndMs = null;
    this.bossDefeated = false;
  }

  /** Records a fired player shot. */
  public recordShot(): void {
    this.shotsFired += 1;
  }

  /** Records a landed player hit. */
  public recordHit(): void {
    this.shotsHit += 1;
  }

  /** Records a defeated target and awards points for it. */
  public recordKill(isBoss: boolean): void {
    this.kills += 1;
    if (isBoss) {
      this.killScore += BOSS_POINTS;
      this.bossDefeated = true;
    } else {
      this.killScore += ENEMY_POINTS;
    }
  }

  /** Ends the current run and persists a new high score when earned. */
  public finishRun(
    outcome: 'victory' | 'defeat',
    endMs: number = performance.now()
  ): RunSummary {
    this.runEndMs = endMs;
    const summary = this.buildSummary(outcome);

    if (summary.score > this.highScore) {
      this.highScore = summary.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore));
      return { ...summary, isHighScore: true, highScore: this.highScore };
    }

    return summary;
  }

  public getLiveScore(): number {
    return this.killScore + this.getAccuracyBonus() + this.getTimeBonus(this.getElapsedMs());
  }

  public getElapsedMs(nowMs: number = performance.now()): number {
    const end = this.runEndMs ?? nowMs;
    return Math.max(0, end - this.runStartMs);
  }

  public getAccuracy(): number {
    if (this.shotsFired === 0) {
      return 0;
    }

    return this.shotsHit / this.shotsFired;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public getShotsFired(): number {
    return this.shotsFired;
  }

  public getShotsHit(): number {
    return this.shotsHit;
  }

  public getKills(): number {
    return this.kills;
  }

  private buildSummary(outcome: 'victory' | 'defeat'): RunSummary {
    const elapsedMs = this.getElapsedMs();
    const timeBonus = this.getTimeBonus(elapsedMs);
    const accuracyBonus = this.getAccuracyBonus();
    const score = this.killScore + timeBonus + accuracyBonus;

    return {
      score,
      killScore: this.killScore,
      accuracyBonus,
      timeBonus,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      kills: this.kills,
      bossDefeated: this.bossDefeated,
      elapsedMs,
      accuracy: this.getAccuracy(),
      isHighScore: score > this.highScore,
      highScore: Math.max(this.highScore, score),
      title: outcome === 'victory' ? 'Mission Complete' : 'Run Terminated',
      subtitle: outcome === 'victory'
        ? 'The beachhead is secure.'
        : 'The invasion held this round.'
    };
  }

  private getAccuracyBonus(): number {
    return Math.round(this.getAccuracy() * MAX_ACCURACY_BONUS);
  }

  private getTimeBonus(elapsedMs: number): number {
    const seconds = elapsedMs / 1000;
    return Math.max(0, Math.round(MAX_TIME_BONUS - (seconds * TIME_BONUS_DECAY_PER_SECOND)));
  }

  private static loadHighScore(): number {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
