import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public canvas: HTMLCanvasElement;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Scene - Beach setting
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87b9d9);
    this.scene.fog = new THREE.Fog(0x87b9d9, GAME_CONFIG.PERFORMANCE.FOG_NEAR, GAME_CONFIG.PERFORMANCE.FOG_FAR);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // Lighting - Beach setting (bright, warm sunlight)
    this.ambientLight = new THREE.AmbientLight(0xe8f6ff, 0.72);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xfff2cf, 1);
    this.directionalLight.position.set(18, 28, 12);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = GAME_CONFIG.PERFORMANCE.SHADOW_MAP_SIZE;
    this.directionalLight.shadow.mapSize.height = GAME_CONFIG.PERFORMANCE.SHADOW_MAP_SIZE;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 60;
    this.directionalLight.shadow.camera.left = -18;
    this.directionalLight.shadow.camera.right = 18;
    this.directionalLight.shadow.camera.top = 18;
    this.directionalLight.shadow.camera.bottom = -18;
    this.scene.add(this.directionalLight);

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public createMuzzleFlashLight(): THREE.PointLight {
    const light = new THREE.PointLight(0xffaa00, 2, 5);
    light.castShadow = false;
    return light;
  }
}
