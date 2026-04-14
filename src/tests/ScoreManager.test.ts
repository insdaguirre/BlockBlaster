import { beforeEach, describe, expect, it } from 'vitest';
import { ScoreManager } from '../core/ScoreManager';

describe('ScoreManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates kill, accuracy, and time bonuses for a run summary', () => {
    const scoreManager = new ScoreManager();
    scoreManager.startRun(0);
    scoreManager.recordShot();
    scoreManager.recordShot();
    scoreManager.recordHit();
    scoreManager.recordKill(false);

    const summary = scoreManager.finishRun('victory', 10_000);

    expect(summary.killScore).toBe(125);
    expect(summary.accuracyBonus).toBe(600);
    expect(summary.timeBonus).toBe(2700);
    expect(summary.score).toBe(3425);
    expect(summary.isHighScore).toBe(true);
  });

  it('persists the highest score across runs', () => {
    const firstRun = new ScoreManager();
    firstRun.startRun(0);
    firstRun.recordKill(true);
    firstRun.finishRun('victory', 5_000);

    const secondRun = new ScoreManager();
    expect(secondRun.getHighScore()).toBeGreaterThan(0);

    secondRun.startRun(0);
    const summary = secondRun.finishRun('defeat', 60_000);

    expect(summary.highScore).toBe(firstRun.getHighScore());
    expect(summary.isHighScore).toBe(false);
  });
});
