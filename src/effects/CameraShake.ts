import * as THREE from 'three';

/** Trauma-based positional camera shake tuned for short combat feedback. */
export class CameraShake {
  private trauma = 0;
  private readonly maxOffset = 0.16;
  private readonly decayPerSecond = 2.8;
  private seed = 0;

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  public apply(camera: THREE.PerspectiveCamera, deltaTime: number): void {
    if (this.trauma <= 0) {
      return;
    }

    const intensity = this.trauma * this.trauma;
    this.seed += deltaTime * 30;
    const offsetX = Math.sin(this.seed * 1.7) * this.maxOffset * intensity;
    const offsetY = Math.sin(this.seed * 2.1 + 1.3) * this.maxOffset * 0.65 * intensity;
    const offsetZ = Math.sin(this.seed * 1.3 + 2.4) * this.maxOffset * 0.35 * intensity;
    camera.position.add(new THREE.Vector3(offsetX, offsetY, offsetZ));
    this.trauma = Math.max(0, this.trauma - this.decayPerSecond * deltaTime);
  }
}
