import { createElement } from './dom';

interface PauseMenuOptions {
  onResume: () => void;
  onSensitivityChange: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onMuteChange: (muted: boolean) => void;
  initialSensitivity: number;
  initialVolume: number;
  initialMuted: boolean;
}

export class PauseMenu {
  private readonly container: HTMLElement;
  private readonly sensitivityValue: HTMLElement;
  private readonly volumeValue: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly options: PauseMenuOptions;
  private currentSensitivity: number;
  private currentVolume: number;
  private muted: boolean;

  constructor(options: PauseMenuOptions) {
    this.options = options;
    this.currentSensitivity = options.initialSensitivity;
    this.currentVolume = options.initialVolume;
    this.muted = options.initialMuted;

    this.container = createElement('div', 'pause-menu');
    const panel = createElement('div', 'pause-panel');
    const label = createElement('div', 'eyebrow', 'SYSTEM');
    const title = createElement('h1', 'panel-title', 'Paused');
    const body = createElement('p', 'panel-body', 'Tune controls, adjust volume, and jump straight back into the encounter.');

    const sensitivityControl = this.createRangeControl(
      'Aim Sensitivity',
      '0.001',
      '0.005',
      '0.0001',
      this.currentSensitivity,
      (value) => {
        this.currentSensitivity = value;
        this.sensitivityValue.textContent = value.toFixed(4);
        localStorage.setItem('mouseSensitivity', String(value));
        this.options.onSensitivityChange(value);
      }
    );
    this.sensitivityValue = sensitivityControl.value;
    this.sensitivityValue.textContent = this.currentSensitivity.toFixed(4);

    const volumeControl = this.createRangeControl(
      'Master Volume',
      '0',
      '1',
      '0.01',
      this.currentVolume,
      (value) => {
        this.currentVolume = value;
        this.volumeValue.textContent = `${Math.round(value * 100)}%`;
        this.options.onVolumeChange(value);
      }
    );
    this.volumeValue = volumeControl.value;
    this.volumeValue.textContent = `${Math.round(this.currentVolume * 100)}%`;

    this.muteButton = createElement('button', 'hud-button secondary-button') as HTMLButtonElement;
    this.muteButton.addEventListener('click', () => {
      this.setMuted(!this.muted);
      this.options.onMuteChange(this.muted);
    });
    this.syncMuteLabel();

    const resumeButton = createElement('button', 'hud-button primary-button', 'Resume');
    resumeButton.addEventListener('click', () => {
      this.hide();
      this.options.onResume();
    });

    const footer = createElement('div', 'pause-footer');
    footer.append(this.muteButton, resumeButton);

    panel.append(label, title, body, sensitivityControl.container, volumeControl.container, footer);
    this.container.appendChild(panel);
    document.body.appendChild(this.container);

    this.options.onSensitivityChange(this.currentSensitivity);
    this.options.onVolumeChange(this.currentVolume);
    this.options.onMuteChange(this.muted);
  }

  public show(): void {
    this.container.classList.add('visible');
  }

  public hide(): void {
    this.container.classList.remove('visible');
  }

  public getSensitivity(): number {
    return this.currentSensitivity;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.syncMuteLabel();
  }

  private createRangeControl(
    labelText: string,
    min: string,
    max: string,
    step: string,
    initialValue: number,
    onInput: (value: number) => void
  ): { container: HTMLElement; input: HTMLInputElement; value: HTMLElement } {
    const container = createElement('div', 'field');
    const header = createElement('div', 'field-header');
    const label = createElement('label', 'field-label', labelText);
    const value = createElement('span', 'field-value');
    const input = createElement('input', 'slider') as HTMLInputElement;
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = String(initialValue);
    input.addEventListener('input', (event) => {
      onInput(Number.parseFloat((event.target as HTMLInputElement).value));
    });

    header.append(label, value);
    container.append(header, input);

    return { container, input, value };
  }

  private syncMuteLabel(): void {
    this.muteButton.textContent = this.muted ? 'Unmute (M)' : 'Mute (M)';
    this.muteButton.classList.toggle('active', this.muted);
  }
}
