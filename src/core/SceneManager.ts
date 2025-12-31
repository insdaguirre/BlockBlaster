import * as THREE from 'three';

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
    this.scene.background = new THREE.Color(0x87CEEB); // Bright sky blue for beach
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 80); // Lighter fog for beach

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
    // Use cheaper shadow type for better performance (will be overridden by directional light)
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Lighting - Beach setting (bright, warm sunlight)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient for beach
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xfff8dc, 0.9); // Warm sunlight color
    this.directionalLight.position.set(15, 25, 10); // Higher sun position
    this.directionalLight.castShadow = true;
    // Reduced shadow map resolution for better performance
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    // Use cheaper shadow type for better performance
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
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

