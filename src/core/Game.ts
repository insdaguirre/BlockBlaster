import * as THREE from 'three';
import { AudioManager } from '../audio/AudioManager';
import { Boss } from '../enemy/Boss';
import { Enemy } from '../enemy/Enemy';
import { CameraShake } from '../effects/CameraShake';
import { ParticleSystem } from '../effects/ParticleSystem';
import { PlayerController } from '../player/PlayerController';
import { PlayerHealth } from '../player/PlayerHealth';
import { HudState, GameState, RunSummary } from '../types';
import { GameOverScreen } from '../ui/GameOverScreen';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { VictoryScreen } from '../ui/VictoryScreen';
import { GAME_CONFIG } from '../utils/constants';
import { Bullet } from '../weapon/Bullet';
import { Gun } from '../weapon/Gun';
import { AssetLoader } from './AssetLoader';
import { EventBus } from './EventBus';
import { InputManager } from './InputManager';
import { SceneManager } from './SceneManager';
import { ScoreManager } from './ScoreManager';
import { WorldGenerator } from '../world/WorldGenerator';

interface ShockwaveEffect {
  mesh: THREE.Mesh;
  elapsed: number;
  duration: number;
}

export class Game {
  private readonly sceneManager: SceneManager;
  private readonly inputManager: InputManager;
  private readonly playerController: PlayerController;
  private readonly playerHealth: PlayerHealth;
  private readonly gun: Gun;
  private readonly worldGenerator: WorldGenerator;
  private readonly hud: HUD;
  private readonly gameOverScreen: GameOverScreen;
  private readonly victoryScreen: VictoryScreen;
  private readonly pauseMenu: PauseMenu;
  private readonly eventBus: EventBus;
  private readonly audioManager: AudioManager;
  private readonly scoreManager: ScoreManager;
  private readonly particleSystem: ParticleSystem;
  private readonly cameraShake: CameraShake;
  private readonly assetLoader: AssetLoader;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private bullets: Bullet[] = [];
  private gameState: GameState;
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private enemySpawnPoints: THREE.Vector3[] = [];
  private lastDamageTime = 0;
  private readonly damageCooldown = 500;
  private bossSpawned = false;
  private bossShockwave: ShockwaveEffect | null = null;
  private latestRunSummary: RunSummary | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.eventBus = new EventBus();
    this.audioManager = new AudioManager(this.eventBus);
    this.scoreManager = new ScoreManager();
    this.cameraShake = new CameraShake();
    this.assetLoader = new AssetLoader();
    this.sceneManager = new SceneManager(canvas);
    this.inputManager = new InputManager(canvas);
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      isVictory: false
    };

    this.worldGenerator = new WorldGenerator(this.sceneManager.scene);
    this.worldGenerator.generate();
    this.enemySpawnPoints = this.worldGenerator.getEnemySpawnPoints();

    const playerStartPos = this.worldGenerator.getPlayerSpawnPoint();
    this.playerHealth = new PlayerHealth();
    this.playerController = new PlayerController(
      this.sceneManager.camera,
      playerStartPos,
      this.inputManager,
      this.worldGenerator.getCollisionDetector()
    );

    this.gun = new Gun(
      this.sceneManager.camera,
      this.sceneManager.scene,
      this.inputManager,
      this.worldGenerator.getCollisionDetector(),
      this.eventBus
    );

    this.hud = new HUD();
    this.hud.setMuted(this.audioManager.isMuted());
    this.gameOverScreen = new GameOverScreen(() => this.restart());
    this.victoryScreen = new VictoryScreen(() => this.restart());

    const initialSensitivity = this.loadSensitivity();
    this.pauseMenu = new PauseMenu({
      onResume: () => this.resume(),
      onSensitivityChange: (sensitivity) => this.playerController.setSensitivity(sensitivity),
      onVolumeChange: (volume) => this.audioManager.setVolume(volume),
      onMuteChange: (muted) => {
        this.audioManager.setMuted(muted);
        this.hud.setMuted(muted);
      },
      initialSensitivity,
      initialVolume: this.audioManager.getVolume(),
      initialMuted: this.audioManager.isMuted()
    });
    this.playerController.setSensitivity(initialSensitivity);

    this.particleSystem = new ParticleSystem(this.sceneManager.scene);
    this.bindFeedbackSystems();
    this.setupStartScreen();
    this.setupGlobalShortcuts();
    this.updateStartScreenHighScore();
    this.sceneManager.render();
  }

  private bindFeedbackSystems(): void {
    this.eventBus.on('playerDamaged', () => {
      this.hud.pulseDamage();
      this.cameraShake.addTrauma(0.35);
    });

    this.eventBus.on('enemyDamaged', ({ position, isBoss }) => {
      this.hud.showHitMarker();
      this.cameraShake.addTrauma(isBoss ? 0.12 : 0.04);
      this.particleSystem.burst(position, isBoss ? 18 : 10, isBoss ? 0xff6a3d : 0x72d8ff, isBoss ? 4.5 : 3, 0.45);
    });

    this.eventBus.on('enemyDied', ({ position, isBoss }) => {
      this.particleSystem.burst(position, isBoss ? 36 : 18, isBoss ? 0xff7f50 : 0xb8f2ff, isBoss ? 6 : 4, isBoss ? 0.9 : 0.6);
      this.cameraShake.addTrauma(isBoss ? 0.75 : 0.12);
    });

    this.eventBus.on('bulletImpact', ({ position, isPlayerBullet }) => {
      this.particleSystem.burst(position, 8, isPlayerBullet ? 0xf7d67a : 0xffb199, 2.2, 0.22);
    });

    this.eventBus.on('bossSpawned', ({ position }) => {
      this.particleSystem.burst(position, 30, 0xff5b5b, 5.5, 1.1);
      this.cameraShake.addTrauma(0.7);
      this.hud.showBanner('Boss Contact', 'High-threat unit entering the beachhead.');
      this.createBossShockwave(position);
    });
  }

  private setupStartScreen(): void {
    const startButton = document.getElementById('start-button');

    startButton?.addEventListener('click', () => {
      document.getElementById('start-screen')?.classList.add('hidden');
      void this.audioManager.resume();
      this.start();
    });
  }

  private setupGlobalShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if ((key === 'escape' || key === 'esc') && this.gameState.isPlaying && !this.gameState.isGameOver && !this.gameState.isVictory) {
        if (this.gameState.isPaused) {
          this.resume();
        } else {
          this.pause();
        }
      }

      if (key === 'm' && !event.repeat) {
        const muted = this.audioManager.toggleMute();
        this.pauseMenu.setMuted(muted);
        this.hud.setMuted(muted);
      }
    });
  }

  private pause(): void {
    this.gameState.isPaused = true;
    this.pauseMenu.show();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  private resume(): void {
    if (!this.gameState.isPlaying || this.gameState.isGameOver || this.gameState.isVictory) {
      return;
    }

    this.gameState.isPaused = false;
    this.pauseMenu.hide();
    this.inputManager.requestPointerLock();
  }

  /** Starts a fresh gameplay run without showing the shell again. */
  public start(): void {
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.gameState.isGameOver = false;
    this.gameState.isVictory = false;
    this.latestRunSummary = null;
    this.scoreManager.startRun(performance.now());
    this.inputManager.requestPointerLock();
    this.spawnEnemies();
    this.lastTime = performance.now();
    this.sceneManager.render();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private spawnEnemies(): void {
    this.enemies = [];
    const enemyCount = 4;

    for (let i = 0; i < enemyCount && i < this.enemySpawnPoints.length; i++) {
      const spawnPoint = this.enemySpawnPoints[i];
      const enemy = new Enemy(
        spawnPoint,
        this.sceneManager.scene,
        () => this.playerController.getPosition(),
        this.worldGenerator.getCollisionDetector(),
        this.eventBus
      );
      this.enemies.push(enemy);
    }
  }

  private gameLoop(currentTime: number): void {
    if (!this.gameState.isPlaying || this.gameState.isGameOver || this.gameState.isVictory || this.gameState.isPaused) {
      if (this.gameState.isPaused) {
        this.render();
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
      }
      return;
    }

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number): void {
    this.playerController.update(deltaTime);
    this.updateWeapon(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBoss(deltaTime);
    this.updateEffects(deltaTime);
    this.updateHud();
    this.checkRunState();
  }

  private updateWeapon(deltaTime: number): void {
    const newBullet = this.gun.update(deltaTime, this.enemies, this.playerController.getPosition());
    if (!newBullet) {
      return;
    }

    this.bullets.push(newBullet);
    this.scoreManager.recordShot();
    this.hud.animateShot();

    if (this.bullets.length > 50) {
      const removed = this.bullets.shift();
      removed?.dispose();
    }
  }

  private updateBullets(deltaTime: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);

      if (bullet.isExpired()) {
        this.handleExpiredBullet(bullet, i);
        continue;
      }

      const hit = bullet.getIsPlayerBullet()
        ? this.checkPlayerBulletCollisions(bullet)
        : this.checkEnemyBulletCollision(bullet);

      if (hit) {
        bullet.dispose();
        this.bullets.splice(i, 1);
      }
    }
  }

  private checkPlayerBulletCollisions(bullet: Bullet): boolean {
    for (const enemy of this.enemies) {
      if (!bullet.checkEnemyCollision(enemy.getPosition(), GAME_CONFIG.ENEMY.SIZE)) {
        continue;
      }

      const killed = enemy.takeDamage(bullet.getDamage());
      this.scoreManager.recordHit();
      if (killed) {
        this.scoreManager.recordKill(false);
      }
      return true;
    }

    if (this.boss && bullet.checkEnemyCollision(this.boss.getPosition(), GAME_CONFIG.BOSS.SIZE)) {
      const killed = this.boss.takeDamage(bullet.getDamage());
      this.scoreManager.recordHit();
      if (killed) {
        this.scoreManager.recordKill(true);
      }
      return true;
    }

    return false;
  }

  private checkEnemyBulletCollision(bullet: Bullet): boolean {
    const playerPos = this.playerController.getPosition();
    if (!bullet.checkPlayerCollision(playerPos, GAME_CONFIG.PLAYER.RADIUS)) {
      return false;
    }

    this.applyPlayerDamage(bullet.getDamage());
    return true;
  }

  private handleExpiredBullet(bullet: Bullet, index: number): void {
    if (bullet.didHitWorld()) {
      const impactPosition = bullet.getImpactPosition();
      if (impactPosition) {
        this.eventBus.emit('bulletImpact', {
          position: impactPosition,
          isPlayerBullet: bullet.getIsPlayerBullet()
        });
      }
    }

    bullet.dispose();
    this.bullets.splice(index, 1);
  }

  private updateEnemies(deltaTime: number): void {
    const playerPosition = this.playerController.getPosition();
    const updateDistance = 50;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (playerPosition.distanceTo(enemy.getPosition()) > updateDistance) {
        continue;
      }

      const enemyBullet = enemy.update(deltaTime, playerPosition);
      if (enemy.isAttacking() && enemy.getDistanceToPlayer() < 2) {
        this.applyPlayerDamage(GAME_CONFIG.ENEMY.ATTACK_DAMAGE);
      }
      if (enemyBullet) {
        this.bullets.push(enemyBullet);
      }
      if (enemy.isDead()) {
        this.removeEnemy(i);
      }
    }

    if (this.enemies.length === 0 && !this.bossSpawned && this.boss === null) {
      this.spawnBoss();
    }
  }

  private updateBoss(deltaTime: number): void {
    if (!this.boss) {
      return;
    }

    const playerPosition = this.playerController.getPosition();
    const bossBullet = this.boss.update(deltaTime, playerPosition);
    if (this.boss.isAttacking() && this.boss.getDistanceToPlayer() < 2) {
      this.applyPlayerDamage(GAME_CONFIG.BOSS.ATTACK_DAMAGE);
    }
    if (bossBullet) {
      this.bullets.push(bossBullet);
    }
    if (this.boss.isDead()) {
      this.handleVictory();
    }
  }

  private updateEffects(deltaTime: number): void {
    this.particleSystem.update(deltaTime);
    this.cameraShake.apply(this.sceneManager.camera, deltaTime);
    this.updateBossShockwave(deltaTime);
  }

  private updateHud(): void {
    const hudState: HudState = {
      health: this.playerHealth.getHealth(),
      maxHealth: this.playerHealth.getMaxHealth(),
      currentMagAmmo: this.gun.getCurrentMagAmmo(),
      magazines: this.gun.getMagazines(),
      maxMagAmmo: this.gun.getMaxMagAmmo(),
      isReloading: this.gun.isReloadingNow(),
      reloadProgress: this.gun.getReloadProgress(),
      bossHealth: this.boss?.getHealth(),
      bossMaxHealth: this.boss?.getMaxHealth(),
      score: this.scoreManager.getLiveScore(),
      highScore: this.scoreManager.getHighScore(),
      elapsedMs: this.scoreManager.getElapsedMs()
    };

    this.hud.update(hudState);
  }

  private checkRunState(): void {
    if (this.playerHealth.isDead()) {
      this.handleGameOver();
    }
  }

  private spawnBoss(): void {
    this.bossSpawned = true;
    const playerPos = this.playerController.getPosition();
    const bossSpawnPos = new THREE.Vector3(playerPos.x + 20, playerPos.y, playerPos.z + 20);

    this.boss = new Boss(
      bossSpawnPos,
      this.sceneManager.scene,
      () => this.playerController.getPosition(),
      this.worldGenerator.getCollisionDetector(),
      this.eventBus
    );

    this.eventBus.emit('bossSpawned', { position: bossSpawnPos.clone() });
  }

  private render(): void {
    this.sceneManager.render();
  }

  private handleGameOver(): void {
    if (this.gameState.isGameOver || this.gameState.isVictory) {
      return;
    }

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    this.gameState.isGameOver = true;
    this.gameState.isPlaying = false;
    this.latestRunSummary = this.scoreManager.finishRun('defeat');
    this.gameOverScreen.show(this.latestRunSummary);
    this.updateStartScreenHighScore();
    this.eventBus.emit('gameOver', undefined);
  }

  private handleVictory(): void {
    if (!this.boss || this.gameState.isVictory || this.gameState.isGameOver) {
      return;
    }

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    this.sceneManager.remove(this.boss.getMesh());
    this.boss.dispose();
    this.boss = null;
    this.gameState.isVictory = true;
    this.gameState.isPlaying = false;
    this.latestRunSummary = this.scoreManager.finishRun('victory');
    this.victoryScreen.show(this.latestRunSummary);
    this.updateStartScreenHighScore();
    this.eventBus.emit('victory', undefined);
  }

  /** Resets transient game state and immediately starts a new run. */
  public restart(): void {
    this.gameState.isGameOver = false;
    this.gameState.isVictory = false;
    this.gameState.isPlaying = false;
    this.gameState.isPaused = false;
    this.lastDamageTime = 0;
    this.bossSpawned = false;
    this.latestRunSummary = null;

    this.clearBullets();
    this.clearEnemies();
    this.clearBoss();
    this.clearBossShockwave();

    const playerStartPos = this.worldGenerator.getPlayerSpawnPoint();
    this.playerController.reset(playerStartPos);
    this.playerHealth.reset();
    this.gun.reset();
    this.gameOverScreen.hide();
    this.victoryScreen.hide();

    void this.audioManager.resume();
    this.start();
  }

  public cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clearBullets();
    this.clearEnemies();
    this.clearBoss();
    this.clearBossShockwave();
    this.assetLoader.clear();
    this.inputManager.cleanup();
  }

  private applyPlayerDamage(amount: number): void {
    const currentTime = Date.now();
    if (currentTime - this.lastDamageTime < this.damageCooldown) {
      return;
    }

    this.playerHealth.takeDamage(amount);
    this.lastDamageTime = currentTime;
    this.eventBus.emit('playerDamaged', {
      amount,
      health: this.playerHealth.getHealth(),
      maxHealth: this.playerHealth.getMaxHealth()
    });
  }

  private removeEnemy(index: number): void {
    const enemy = this.enemies[index];
    this.sceneManager.remove(enemy.getMesh());
    enemy.dispose();
    this.enemies.splice(index, 1);
  }

  private clearBullets(): void {
    this.bullets.forEach((bullet) => bullet.dispose());
    this.bullets = [];
  }

  private clearEnemies(): void {
    this.enemies.forEach((enemy) => {
      this.sceneManager.remove(enemy.getMesh());
      enemy.dispose();
    });
    this.enemies = [];
  }

  private clearBoss(): void {
    if (!this.boss) {
      return;
    }

    this.sceneManager.remove(this.boss.getMesh());
    this.boss.dispose();
    this.boss = null;
  }

  private clearBossShockwave(): void {
    if (!this.bossShockwave) {
      return;
    }

    this.sceneManager.remove(this.bossShockwave.mesh);
    this.bossShockwave.mesh.geometry.dispose();
    (this.bossShockwave.mesh.material as THREE.MeshBasicMaterial).dispose();
    this.bossShockwave = null;
  }

  private createBossShockwave(position: THREE.Vector3): void {
    if (this.bossShockwave) {
      this.sceneManager.remove(this.bossShockwave.mesh);
    }

    const geometry = new THREE.RingGeometry(1.8, 2.2, 48);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff5b5b,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, 0.2, position.z);
    this.sceneManager.add(mesh);
    this.bossShockwave = { mesh, elapsed: 0, duration: 0.65 };
  }

  private updateBossShockwave(deltaTime: number): void {
    if (!this.bossShockwave) {
      return;
    }

    this.bossShockwave.elapsed += deltaTime;
    const progress = this.bossShockwave.elapsed / this.bossShockwave.duration;
    const scale = 1 + progress * 7;
    this.bossShockwave.mesh.scale.setScalar(scale);
    (this.bossShockwave.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.55 * (1 - progress));

    if (progress >= 1) {
      this.sceneManager.remove(this.bossShockwave.mesh);
      this.bossShockwave.mesh.geometry.dispose();
      (this.bossShockwave.mesh.material as THREE.MeshBasicMaterial).dispose();
      this.bossShockwave = null;
    }
  }

  private updateStartScreenHighScore(): void {
    const highScore = this.scoreManager.getHighScore();
    const target = document.getElementById('start-high-score');
    if (target) {
      target.textContent = `Best Run ${highScore}`;
    }
  }

  private loadSensitivity(): number {
    const stored = Number.parseFloat(localStorage.getItem('mouseSensitivity') ?? '');
    return Number.isFinite(stored) ? stored : 0.002;
  }
}
