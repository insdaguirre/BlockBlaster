import * as THREE from 'three';

type Particle = {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
};

/** Small pooled points system for impacts and death bursts. */
export class ParticleSystem {
  private readonly particles: Particle[];
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly geometry: THREE.BufferGeometry;
  private readonly points: THREE.Points;

  constructor(scene: THREE.Scene, maxParticles: number = 320) {
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.particles = Array.from({ length: maxParticles }, () => ({
      active: false,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      color: new THREE.Color(0xffffff),
      life: 0,
      maxLife: 1
    }));

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      vertexColors: true
    });

    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.hideInactiveParticles();
  }

  public burst(
    origin: THREE.Vector3,
    count: number,
    color: number,
    speed: number,
    life: number
  ): void {
    for (let i = 0; i < count; i++) {
      const particle = this.particles.find((candidate) => !candidate.active);
      if (!particle) {
        break;
      }

      particle.active = true;
      particle.position.copy(origin);
      particle.velocity.set(
        (Math.random() - 0.5) * speed,
        Math.random() * speed,
        (Math.random() - 0.5) * speed
      );
      particle.color.setHex(color);
      particle.life = life;
      particle.maxLife = life;
    }
  }

  public update(deltaTime: number): void {
    let needsUpdate = false;

    this.particles.forEach((particle, index) => {
      if (!particle.active) {
        return;
      }

      particle.life -= deltaTime;
      if (particle.life <= 0) {
        particle.active = false;
        this.positions[index * 3] = 9999;
        this.positions[index * 3 + 1] = 9999;
        this.positions[index * 3 + 2] = 9999;
        needsUpdate = true;
        return;
      }

      particle.position.addScaledVector(particle.velocity, deltaTime);
      particle.velocity.y -= deltaTime * 3.2;
      const alpha = particle.life / particle.maxLife;
      const color = particle.color.clone().multiplyScalar(alpha);

      this.positions[index * 3] = particle.position.x;
      this.positions[index * 3 + 1] = particle.position.y;
      this.positions[index * 3 + 2] = particle.position.z;
      this.colors[index * 3] = color.r;
      this.colors[index * 3 + 1] = color.g;
      this.colors[index * 3 + 2] = color.b;
      needsUpdate = true;
    });

    if (needsUpdate) {
      this.geometry.attributes.position.needsUpdate = true;
      this.geometry.attributes.color.needsUpdate = true;
    }
  }

  private hideInactiveParticles(): void {
    for (let i = 0; i < this.particles.length; i++) {
      this.positions[i * 3] = 9999;
      this.positions[i * 3 + 1] = 9999;
      this.positions[i * 3 + 2] = 9999;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}
