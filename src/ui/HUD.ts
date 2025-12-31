export class HUD {
  private container: HTMLElement;
  private healthBar: HTMLElement;
  private healthBarFill: HTMLElement;
  private ammoDisplay: HTMLElement;
  private bossHealthBar: HTMLElement | null = null;
  private bossHealthBarFill: HTMLElement | null = null;

  constructor() {
    this.container = document.getElementById('ui-overlay') || this.createContainer();
    this.createCrosshair();
    this.healthBar = this.createHealthBar();
    this.healthBarFill = this.healthBar.querySelector('.health-fill') as HTMLElement;
    this.ammoDisplay = this.createAmmoDisplay();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'ui-overlay';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
    `;
    document.body.appendChild(container);
    return container;
  }

  private createCrosshair(): HTMLElement {
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      pointer-events: none;
    `;

    // Create crosshair lines
    const horizontal = document.createElement('div');
    horizontal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 2px;
      background: rgba(255, 255, 255, 0.8);
      transform: translateY(-50%);
    `;

    const vertical = document.createElement('div');
    vertical.style.cssText = `
      position: absolute;
      left: 50%;
      top: 0;
      width: 2px;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      transform: translateX(-50%);
    `;

    crosshair.appendChild(horizontal);
    crosshair.appendChild(vertical);
    this.container.appendChild(crosshair);

    return crosshair;
  }

  private createHealthBar(): HTMLElement {
    const healthBarContainer = document.createElement('div');
    healthBarContainer.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 300px;
      height: 30px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 5px;
      overflow: hidden;
    `;

    const healthBarFill = document.createElement('div');
    healthBarFill.className = 'health-fill';
    healthBarFill.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ff0000 0%, #ff6600 50%, #00ff00 100%);
      transition: width 0.3s ease;
    `;

    const healthText = document.createElement('div');
    healthText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 14px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      pointer-events: none;
      z-index: 1;
    `;
    healthText.id = 'health-text';

    healthBarContainer.appendChild(healthBarFill);
    healthBarContainer.appendChild(healthText);
    this.container.appendChild(healthBarContainer);

    return healthBarContainer;
  }

  private createAmmoDisplay(): HTMLElement {
    const ammoContainer = document.createElement('div');
    ammoContainer.id = 'ammo-display';
    ammoContainer.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      pointer-events: none;
    `;
    this.container.appendChild(ammoContainer);
    return ammoContainer;
  }

  public update(health: number, maxHealth: number, ammo?: number, maxAmmo?: number, bossHealth?: number, bossMaxHealth?: number): void {
    const percentage = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    
    if (this.healthBarFill) {
      this.healthBarFill.style.width = `${percentage}%`;
    }

    const healthText = this.healthBar.querySelector('#health-text') as HTMLElement;
    if (healthText) {
      healthText.textContent = `${Math.ceil(health)} / ${maxHealth}`;
    }

    // Update ammo display
    if (this.ammoDisplay && ammo !== undefined && maxAmmo !== undefined) {
      this.ammoDisplay.textContent = `${ammo} / ${maxAmmo}`;
      // Change color when low on ammo
      if (ammo === 0) {
        this.ammoDisplay.style.color = '#ff0000';
      } else if (ammo <= maxAmmo * 0.3) {
        this.ammoDisplay.style.color = '#ffaa00';
      } else {
        this.ammoDisplay.style.color = '#ffffff';
      }
    }

    // Update boss health bar
    if (bossHealth !== undefined && bossMaxHealth !== undefined) {
      if (!this.bossHealthBar) {
        this.bossHealthBar = this.createBossHealthBar();
        this.bossHealthBarFill = this.bossHealthBar.querySelector('.boss-health-fill') as HTMLElement;
      }
      if (this.bossHealthBarFill) {
        const percentage = Math.max(0, Math.min(100, (bossHealth / bossMaxHealth) * 100));
        this.bossHealthBarFill.style.width = `${percentage}%`;
      }
      if (this.bossHealthBar) {
        this.bossHealthBar.style.display = 'block';
        const bossHealthText = this.bossHealthBar.querySelector('#boss-health-text') as HTMLElement;
        if (bossHealthText) {
          bossHealthText.textContent = `BOSS: ${Math.ceil(bossHealth)} / ${bossMaxHealth}`;
        }
      }
    } else {
      if (this.bossHealthBar) {
        this.bossHealthBar.style.display = 'none';
      }
    }
  }

  private createBossHealthBar(): HTMLElement {
    const bossHealthBarContainer = document.createElement('div');
    bossHealthBarContainer.style.cssText = `
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 40px;
      background: rgba(0, 0, 0, 0.7);
      border: 3px solid rgba(255, 0, 0, 0.9);
      border-radius: 5px;
      overflow: hidden;
    `;

    const bossHealthBarFill = document.createElement('div');
    bossHealthBarFill.className = 'boss-health-fill';
    bossHealthBarFill.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #ff0000 0%, #ff6600 50%, #ff0000 100%);
      transition: width 0.3s ease;
    `;

    const bossHealthText = document.createElement('div');
    bossHealthText.id = 'boss-health-text';
    bossHealthText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 16px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      pointer-events: none;
      z-index: 1;
    `;

    bossHealthBarContainer.appendChild(bossHealthBarFill);
    bossHealthBarContainer.appendChild(bossHealthText);
    this.container.appendChild(bossHealthBarContainer);

    return bossHealthBarContainer;
  }
}

