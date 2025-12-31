import { InputState } from '../types';

export class InputManager {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  private onPointerLockChange: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputState = {
      keys: new Set(),
      mouseButtons: new Set(),
      mouseDelta: { x: 0, y: 0 },
      isPointerLocked: false
    };

    this.onPointerLockChange = () => {
      this.inputState.isPointerLocked = 
        document.pointerLockElement === canvas ||
        (document as any).mozPointerLockElement === canvas ||
        (document as any).webkitPointerLockElement === canvas;
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.inputState.keys.add(e.key.toLowerCase());
    });

    document.addEventListener('keyup', (e) => {
      this.inputState.keys.delete(e.key.toLowerCase());
    });

    // Mouse button events
    this.canvas.addEventListener('mousedown', (e) => {
      this.inputState.mouseButtons.add(e.button);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.inputState.mouseButtons.delete(e.button);
    });

    // Mouse movement (only when pointer locked)
    document.addEventListener('mousemove', (e) => {
      if (this.inputState.isPointerLocked) {
        const movementX = e.movementX || (e as any).mozMovementX || 0;
        const movementY = e.movementY || (e as any).mozMovementY || 0;
        // Cap mouse delta to prevent large jumps (smooth aim)
        const maxDelta = 50; // Maximum pixels per frame
        this.inputState.mouseDelta.x += Math.max(-maxDelta, Math.min(maxDelta, movementX));
        this.inputState.mouseDelta.y += Math.max(-maxDelta, Math.min(maxDelta, movementY));
      }
    });

    // Pointer lock events
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mozpointerlockchange', this.onPointerLockChange);
    document.addEventListener('webkitpointerlockchange', this.onPointerLockChange);

    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public requestPointerLock(): void {
    this.canvas.requestPointerLock = 
      this.canvas.requestPointerLock ||
      (this.canvas as any).mozRequestPointerLock ||
      (this.canvas as any).webkitRequestPointerLock;
    
    if (this.canvas.requestPointerLock) {
      this.canvas.requestPointerLock();
    }
  }

  public getInputState(): InputState {
    return this.inputState;
  }

  public isKeyPressed(key: string): boolean {
    return this.inputState.keys.has(key.toLowerCase());
  }

  public isMouseButtonPressed(button: number): boolean {
    return this.inputState.mouseButtons.has(button);
  }

  public getMouseDelta(): { x: number; y: number } {
    const delta = { ...this.inputState.mouseDelta };
    this.inputState.mouseDelta.x = 0;
    this.inputState.mouseDelta.y = 0;
    return delta;
  }

  public isPointerLocked(): boolean {
    return this.inputState.isPointerLocked;
  }

  public cleanup(): void {
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mozpointerlockchange', this.onPointerLockChange);
    document.removeEventListener('webkitpointerlockchange', this.onPointerLockChange);
  }
}

