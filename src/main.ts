import { Game } from './core/Game';

// Get canvas element
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

// Initialize game
const game = new Game(canvas);

// Handle page unload
window.addEventListener('beforeunload', () => {
  game.cleanup();
});

