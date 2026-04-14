import { HudState } from '../types';
import { createElement } from './dom';

export class HUD {
  private readonly container: HTMLElement;
  private readonly healthFill: HTMLElement;
  private readonly healthValue: HTMLElement;
  private readonly ammoCurrent: HTMLElement;
  private readonly ammoReserve: HTMLElement;
  private readonly reloadIndicator: HTMLElement;
  private readonly scoreValue: HTMLElement;
  private readonly highScoreValue: HTMLElement;
  private readonly timerValue: HTMLElement;
  private readonly bossBar: HTMLElement;
  private readonly bossFill: HTMLElement;
  private readonly bossValue: HTMLElement;
  private readonly hitMarker: HTMLElement;
  private readonly crosshair: HTMLElement;
  private readonly damageVignette: HTMLElement;
  private readonly banner: HTMLElement;
  private readonly bannerTitle: HTMLElement;
  private readonly bannerSubtitle: HTMLElement;
  private readonly audioState: HTMLElement;
  private bannerTimeout: number | null = null;
  private shotAnimationTimeout: number | null = null;
  private hitMarkerTimeout: number | null = null;

  constructor() {
    this.container = document.getElementById('ui-overlay') ?? this.createContainer();
    this.damageVignette = createElement('div', 'damage-vignette');
    this.hitMarker = createElement('div', 'hit-marker');
    this.crosshair = this.createCrosshair();

    const topBar = createElement('div', 'hud-topbar');
    this.scoreValue = this.createMetric(topBar, 'Score');
    this.highScoreValue = this.createMetric(topBar, 'Best');
    this.timerValue = this.createMetric(topBar, 'Time');
    this.audioState = this.createMetric(topBar, 'Audio');

    this.banner = createElement('div', 'state-banner');
    this.bannerTitle = createElement('div', 'state-banner-title');
    this.bannerSubtitle = createElement('div', 'state-banner-subtitle');
    this.banner.append(this.bannerTitle, this.bannerSubtitle);

    const healthRail = createElement('div', 'health-rail');
    this.healthFill = createElement('div', 'health-fill');
    this.healthValue = createElement('div', 'health-value');
    healthRail.append(this.healthFill, this.healthValue);

    const ammoPanel = createElement('div', 'ammo-panel');
    const ammoLabel = createElement('div', 'metric-label', 'AMMO');
    const ammoNumbers = createElement('div', 'ammo-numbers');
    this.ammoCurrent = createElement('span', 'ammo-current');
    this.ammoReserve = createElement('span', 'ammo-reserve');
    ammoNumbers.append(this.ammoCurrent, this.ammoReserve);
    this.reloadIndicator = createElement('div', 'reload-indicator');
    ammoPanel.append(ammoLabel, ammoNumbers, this.reloadIndicator);

    this.bossBar = createElement('div', 'boss-bar');
    const bossLabel = createElement('div', 'metric-label', 'BOSS');
    const bossTrack = createElement('div', 'boss-track');
    this.bossFill = createElement('div', 'boss-fill');
    this.bossValue = createElement('div', 'boss-value');
    bossTrack.appendChild(this.bossFill);
    this.bossBar.append(bossLabel, bossTrack, this.bossValue);

    this.container.append(
      this.damageVignette,
      this.hitMarker,
      this.crosshair,
      topBar,
      this.banner,
      this.bossBar,
      healthRail,
      ammoPanel
    );
  }

  public update(state: HudState): void {
    const healthPercent = Math.max(0, Math.min(100, (state.health / state.maxHealth) * 100));
    this.healthFill.style.width = `${healthPercent}%`;
    this.healthValue.textContent = `${Math.ceil(state.health)} / ${state.maxHealth}`;
    this.ammoCurrent.textContent = `${state.currentMagAmmo}`;
    this.ammoReserve.textContent = `/ ${state.magazines}`;
    this.scoreValue.textContent = String(state.score);
    this.highScoreValue.textContent = String(state.highScore);
    this.timerValue.textContent = this.formatTime(state.elapsedMs);
    this.reloadIndicator.textContent = state.isReloading
      ? `RELOADING ${Math.floor(state.reloadProgress * 100)}%`
      : '';
    this.reloadIndicator.classList.toggle('visible', state.isReloading);
    this.container.style.setProperty('--health-ratio', `${state.health / state.maxHealth}`);
    this.damageVignette.classList.toggle('critical', state.health / state.maxHealth < 0.3);

    const lowAmmo = state.currentMagAmmo === 0 || state.currentMagAmmo <= state.maxMagAmmo * 0.3;
    this.ammoPanelState(lowAmmo, state.currentMagAmmo === 0);

    if (state.bossHealth !== undefined && state.bossMaxHealth !== undefined) {
      const bossPercent = Math.max(0, Math.min(100, (state.bossHealth / state.bossMaxHealth) * 100));
      this.bossFill.style.width = `${bossPercent}%`;
      this.bossValue.textContent = `${Math.ceil(state.bossHealth)} / ${state.bossMaxHealth}`;
      this.bossBar.classList.add('visible');
    } else {
      this.bossBar.classList.remove('visible');
    }
  }

  public animateShot(): void {
    this.crosshair.classList.add('fired');
    if (this.shotAnimationTimeout !== null) {
      window.clearTimeout(this.shotAnimationTimeout);
    }
    this.shotAnimationTimeout = window.setTimeout(() => {
      this.crosshair.classList.remove('fired');
      this.shotAnimationTimeout = null;
    }, 150);
  }

  public showHitMarker(): void {
    this.hitMarker.classList.add('visible');
    this.crosshair.classList.add('hit-confirmed');
    if (this.hitMarkerTimeout !== null) {
      window.clearTimeout(this.hitMarkerTimeout);
    }
    this.hitMarkerTimeout = window.setTimeout(() => {
      this.hitMarker.classList.remove('visible');
      this.crosshair.classList.remove('hit-confirmed');
      this.hitMarkerTimeout = null;
    }, 180);
  }

  public pulseDamage(): void {
    this.damageVignette.classList.remove('pulse');
    void this.damageVignette.offsetWidth;
    this.damageVignette.classList.add('pulse');
  }

  public showBanner(title: string, subtitle: string, duration: number = 1800): void {
    this.bannerTitle.textContent = title;
    this.bannerSubtitle.textContent = subtitle;
    this.banner.classList.add('visible');

    if (this.bannerTimeout !== null) {
      window.clearTimeout(this.bannerTimeout);
    }

    this.bannerTimeout = window.setTimeout(() => {
      this.banner.classList.remove('visible');
      this.bannerTimeout = null;
    }, duration);
  }

  public setMuted(muted: boolean): void {
    this.audioState.textContent = muted ? 'Muted' : 'Live';
  }

  private createContainer(): HTMLElement {
    const container = createElement('div');
    container.id = 'ui-overlay';
    document.body.appendChild(container);
    return container;
  }

  private createMetric(parent: HTMLElement, labelText: string): HTMLElement {
    const metric = createElement('div', 'hud-metric');
    const label = createElement('div', 'metric-label', labelText.toUpperCase());
    const value = createElement('div', 'metric-value');
    metric.append(label, value);
    parent.appendChild(metric);
    return value;
  }

  private createCrosshair(): HTMLElement {
    const crosshair = createElement('div', 'crosshair');
    ['top', 'right', 'bottom', 'left'].forEach((direction) => {
      crosshair.appendChild(createElement('span', `crosshair-line ${direction}`));
    });
    return crosshair;
  }

  private ammoPanelState(lowAmmo: boolean, empty: boolean): void {
    this.ammoCurrent.classList.toggle('warning', lowAmmo);
    this.ammoCurrent.classList.toggle('danger', empty);
  }

  private formatTime(elapsedMs: number): string {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
