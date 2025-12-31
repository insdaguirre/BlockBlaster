export class GameOverScreen {
  private container: HTMLElement;
  private onRestart: () => void;

  constructor(onRestart: () => void) {
    this.onRestart = onRestart;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'game-over-screen';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      z-index: 300;
      pointer-events: all;
      opacity: 0;
      transition: opacity 0.5s ease;
    `;

    const title = document.createElement('h1');
    title.textContent = 'Game Over';
    title.style.cssText = `
      font-size: 4em;
      margin-bottom: 30px;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
    `;

    const message = document.createElement('p');
    message.textContent = 'You have been defeated!';
    message.style.cssText = `
      font-size: 1.5em;
      margin-bottom: 40px;
      opacity: 0.9;
    `;

    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    restartButton.style.cssText = `
      padding: 15px 40px;
      font-size: 1.2em;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s, transform 0.1s;
    `;

    restartButton.addEventListener('mouseenter', () => {
      restartButton.style.background = '#45a049';
      restartButton.style.transform = 'scale(1.05)';
    });

    restartButton.addEventListener('mouseleave', () => {
      restartButton.style.background = '#4CAF50';
      restartButton.style.transform = 'scale(1)';
    });

    restartButton.addEventListener('click', () => {
      this.onRestart();
    });

    container.appendChild(title);
    container.appendChild(message);
    container.appendChild(restartButton);

    document.body.appendChild(container);

    return container;
  }

  public show(): void {
    this.container.style.display = 'flex';
    // Trigger fade in
    setTimeout(() => {
      this.container.style.opacity = '1';
    }, 10);
  }

  public hide(): void {
    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 500);
  }
}

