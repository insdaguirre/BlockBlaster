export class PauseMenu {
  private container: HTMLElement;
  private sensitivitySlider!: HTMLInputElement;
  private sensitivityValue!: HTMLElement;
  private onResume: () => void;
  private onSensitivityChange: (value: number) => void;
  private currentSensitivity: number = 0.002;

  constructor(onResume: () => void, onSensitivityChange: (value: number) => void) {
    this.onResume = onResume;
    this.onSensitivityChange = onSensitivityChange;
    // Load settings first (before creating container)
    this.loadSettings();
    this.container = this.createContainer();
    // Apply loaded settings after container is created
    if (this.sensitivitySlider) {
      this.sensitivitySlider.value = this.currentSensitivity.toString();
      this.updateSensitivityDisplay();
      this.onSensitivityChange(this.currentSensitivity);
    }
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'pause-menu';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      z-index: 400;
      pointer-events: all;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    const title = document.createElement('h1');
    title.textContent = 'PAUSED';
    title.style.cssText = `
      font-size: 4em;
      margin-bottom: 40px;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
    `;

    // Sensitivity control
    const sensitivityContainer = document.createElement('div');
    sensitivityContainer.style.cssText = `
      margin-bottom: 30px;
      width: 400px;
    `;

    const sensitivityLabel = document.createElement('label');
    sensitivityLabel.textContent = 'Aim Sensitivity:';
    sensitivityLabel.style.cssText = `
      display: block;
      font-size: 1.2em;
      margin-bottom: 10px;
    `;

    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 15px;
    `;

    this.sensitivitySlider = document.createElement('input');
    this.sensitivitySlider.type = 'range';
    this.sensitivitySlider.min = '0.001';
    this.sensitivitySlider.max = '0.005';
    this.sensitivitySlider.step = '0.0001';
    this.sensitivitySlider.value = this.currentSensitivity.toString();
    this.sensitivitySlider.style.cssText = `
      flex: 1;
      height: 8px;
      background: #333;
      border-radius: 5px;
      outline: none;
    `;

    this.sensitivityValue = document.createElement('span');
    this.sensitivityValue.style.cssText = `
      min-width: 80px;
      font-size: 1.1em;
      font-weight: bold;
    `;
    this.updateSensitivityDisplay();

    this.sensitivitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.currentSensitivity = value;
      this.updateSensitivityDisplay();
      this.onSensitivityChange(value);
      this.saveSettings();
    });

    sliderContainer.appendChild(this.sensitivitySlider);
    sliderContainer.appendChild(this.sensitivityValue);
    sensitivityContainer.appendChild(sensitivityLabel);
    sensitivityContainer.appendChild(sliderContainer);

    // Resume button
    const resumeButton = document.createElement('button');
    resumeButton.textContent = 'Resume (ESC)';
    resumeButton.style.cssText = `
      padding: 15px 40px;
      font-size: 1.2em;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s, transform 0.1s;
      margin-top: 20px;
    `;

    resumeButton.addEventListener('mouseenter', () => {
      resumeButton.style.background = '#45a049';
      resumeButton.style.transform = 'scale(1.05)';
    });

    resumeButton.addEventListener('mouseleave', () => {
      resumeButton.style.background = '#4CAF50';
      resumeButton.style.transform = 'scale(1)';
    });

    resumeButton.addEventListener('click', () => {
      this.hide();
    });

    container.appendChild(title);
    container.appendChild(sensitivityContainer);
    container.appendChild(resumeButton);

    document.body.appendChild(container);

    return container;
  }

  private updateSensitivityDisplay(): void {
    this.sensitivityValue.textContent = this.currentSensitivity.toFixed(4);
  }

  private saveSettings(): void {
    localStorage.setItem('mouseSensitivity', this.currentSensitivity.toString());
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('mouseSensitivity');
    if (saved) {
      this.currentSensitivity = parseFloat(saved);
    }
  }

  public show(): void {
    this.container.style.display = 'flex';
    setTimeout(() => {
      this.container.style.opacity = '1';
    }, 10);
  }

  public hide(): void {
    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.style.display = 'none';
      this.onResume();
    }, 300);
  }

  public isVisible(): boolean {
    return this.container.style.display === 'flex';
  }

  public getSensitivity(): number {
    return this.currentSensitivity;
  }
}

