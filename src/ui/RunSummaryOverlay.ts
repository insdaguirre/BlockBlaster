import { RunSummary } from '../types';
import { createElement } from './dom';

export class RunSummaryOverlay {
  protected readonly container: HTMLElement;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly stats: HTMLElement;
  private readonly badge: HTMLElement;

  constructor(
    containerId: string,
    buttonLabel: string,
    onRestart: () => void
  ) {
    this.container = createElement('div', 'run-summary-screen');
    this.container.id = containerId;

    const panel = createElement('div', 'run-summary-panel');
    this.badge = createElement('div', 'summary-badge', 'RUN END');
    this.title = createElement('h1', 'summary-title');
    this.subtitle = createElement('p', 'summary-subtitle');
    this.scoreValue = createElement('div', 'summary-score');
    this.stats = createElement('div', 'summary-stats');
    const button = createElement('button', 'hud-button primary-button', buttonLabel);

    button.addEventListener('click', () => onRestart());

    panel.append(this.badge, this.title, this.subtitle, this.scoreValue, this.stats, button);
    this.container.appendChild(panel);
    document.body.appendChild(this.container);
  }

  public show(summary: RunSummary, badgeLabel: string): void {
    this.badge.textContent = badgeLabel;
    this.title.textContent = summary.title;
    this.subtitle.textContent = summary.subtitle;
    this.scoreValue.textContent = String(summary.score);
    this.stats.replaceChildren(
      this.createStat('Kills', String(summary.kills)),
      this.createStat('Accuracy', `${Math.round(summary.accuracy * 100)}%`),
      this.createStat('Time', this.formatTime(summary.elapsedMs)),
      this.createStat('Kill Score', String(summary.killScore)),
      this.createStat('Accuracy Bonus', String(summary.accuracyBonus)),
      this.createStat('Time Bonus', String(summary.timeBonus)),
      this.createStat('High Score', String(summary.highScore)),
      this.createStat('Status', summary.isHighScore ? 'New personal best' : 'Logged')
    );
    this.container.classList.add('visible');
  }

  public hide(): void {
    this.container.classList.remove('visible');
  }

  private createStat(label: string, value: string): HTMLElement {
    const item = createElement('div', 'summary-stat');
    const statLabel = createElement('span', 'summary-stat-label', label);
    const statValue = createElement('span', 'summary-stat-value', value);
    item.append(statLabel, statValue);
    return item;
  }

  private formatTime(elapsedMs: number): string {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
