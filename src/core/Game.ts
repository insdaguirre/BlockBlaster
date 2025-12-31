import { SceneManager } from './SceneManager';
import { InputManager } from './InputManager';
import { PlayerController } from '../player/PlayerController';
import { PlayerHealth } from '../player/PlayerHealth';
import { Gun } from '../weapon/Gun';
import { WorldGenerator } from '../world/WorldGenerator';
import { Enemy } from '../enemy/Enemy';
import { Boss } from '../enemy/Boss';
import { HUD } from '../ui/HUD';
import { GameOverScreen } from '../ui/GameOverScreen';
import { PauseMenu } from '../ui/PauseMenu';
import { GameState } from '../types';
import { Bullet } from '../weapon/Bullet';
import { GAME_CONFIG } from '../utils/constants';
import * as THREE from 'three';

export class Game {
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private playerController: PlayerController;
  private playerHealth: PlayerHealth;
  private gun: Gun;
  private worldGenerator: WorldGenerator;
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private bullets: Bullet[] = [];
  private hud: HUD;
  private gameOverScreen: GameOverScreen;
  private pauseMenu: PauseMenu;
  private gameState: GameState;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private enemySpawnPoints: THREE.Vector3[] = [];
  private lastDamageTime: number = 0;
  private damageCooldown: number = 500; // milliseconds
  private bossSpawned: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.sceneManager = new SceneManager(canvas);
    this.inputManager = new InputManager(canvas);
    
    this.gameState = {
      isPlaying: false,
      isPaused: false,
      isGameOver: false
    };

    // Initialize systems
    this.worldGenerator = new WorldGenerator(this.sceneManager.scene);
    this.worldGenerator.generate();
    this.enemySpawnPoints = this.worldGenerator.getEnemySpawnPoints();

    // Player
    const playerStartPos = this.worldGenerator.getPlayerSpawnPoint();
    this.playerHealth = new PlayerHealth();
    this.playerController = new PlayerController(
      this.sceneManager.camera,
      playerStartPos,
      this.inputManager,
      this.worldGenerator.getCollisionDetector()
    );

    // Weapon
    this.gun = new Gun(
      this.sceneManager.camera,
      this.sceneManager.scene,
      this.inputManager,
      this.worldGenerator.getCollisionDetector()
    );

    // UI
    this.hud = new HUD();
    this.gameOverScreen = new GameOverScreen(() => this.restart());
    this.pauseMenu = new PauseMenu(
      () => this.resume(),
      (sensitivity) => this.playerController.setSensitivity(sensitivity)
    );
    
    // Load saved sensitivity on start
    const savedSensitivity = this.pauseMenu.getSensitivity();
    this.playerController.setSensitivity(savedSensitivity);

    // Setup start screen
    this.setupStartScreen();
    this.setupPauseHandling();
  }

  private setupStartScreen(): void {
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');

    if (startButton) {
      startButton.addEventListener('click', () => {
        if (startScreen) {
          startScreen.classList.add('hidden');
        }
        this.start();
      });
    }
  }

  private setupPauseHandling(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (this.gameState.isPlaying && !this.gameState.isGameOver) {
          if (this.gameState.isPaused) {
            this.resume();
          } else {
            this.pause();
          }
        }
      }
    });
  }

  private pause(): void {
    this.gameState.isPaused = true;
    this.pauseMenu.show();
    // Release pointer lock when pausing
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  private resume(): void {
    this.gameState.isPaused = false;
    this.pauseMenu.hide();
    // Request pointer lock when resuming
    this.inputManager.requestPointerLock();
  }

  public start(): void {
    this.gameState.isPlaying = true;
    this.inputManager.requestPointerLock();
    this.spawnEnemies();
    this.gameLoop(0);
  }

  private spawnEnemies(): void {
    this.enemies = [];
    const enemyCount = 4; // 3-5 enemies as per plan

    for (let i = 0; i < enemyCount && i < this.enemySpawnPoints.length; i++) {
      const spawnPoint = this.enemySpawnPoints[i];
      const enemy = new Enemy(
        spawnPoint,
        this.sceneManager.scene,
        () => this.playerController.getPosition(),
        this.worldGenerator.getCollisionDetector()
      );
      this.enemies.push(enemy);
    }
  }

  private gameLoop(currentTime: number): void {
    if (!this.gameState.isPlaying || this.gameState.isGameOver || this.gameState.isPaused) {
      // Still render when paused (for visual continuity)
      if (this.gameState.isPaused) {
        this.sceneManager.render();
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
      }
      return;
    }

    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Cap delta time to prevent large jumps
    const clampedDelta = Math.min(deltaTime, 0.1);

    this.update(clampedDelta);
    this.render();

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number): void {
    // Update player
    this.playerController.update(deltaTime);

    // Update weapon and get new bullets
    const newBullet = this.gun.update(deltaTime, this.enemies, this.playerController.getPosition());
    if (newBullet) {
      this.bullets.push(newBullet);
    }

    // Limit active bullets for performance (max 50)
    const MAX_BULLETS = 50;
    if (this.bullets.length > MAX_BULLETS) {
      // Remove oldest bullets
      for (let i = 0; i < this.bullets.length - MAX_BULLETS; i++) {
        this.bullets[i].dispose();
        this.bullets.splice(i, 1);
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);

      // Skip collision checks if bullet already hit world (from update method)
      if (bullet.isExpired()) {
        bullet.dispose();
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collisions based on bullet type (only if bullet hasn't hit world)
      let bulletHit = false;
      
      if (bullet.getIsPlayerBullet()) {
        // Player bullet - check collisions with enemies
        for (const enemy of this.enemies) {
          if (bullet.checkEnemyCollision(enemy.getPosition(), GAME_CONFIG.ENEMY.SIZE)) {
            enemy.takeDamage(bullet.getDamage());
            bulletHit = true;
            break;
          }
        }
        
        // Check boss if not hit yet
        if (!bulletHit && this.boss) {
          if (bullet.checkEnemyCollision(this.boss.getPosition(), GAME_CONFIG.BOSS.SIZE)) {
            this.boss.takeDamage(bullet.getDamage());
            bulletHit = true;
          }
        }
      } else {
        // Enemy bullet - check collision with player
        const playerPos = this.playerController.getPosition();
        if (bullet.checkPlayerCollision(playerPos, GAME_CONFIG.PLAYER.RADIUS)) {
          const currentTime = Date.now();
          if (currentTime - this.lastDamageTime >= this.damageCooldown) {
            this.playerHealth.takeDamage(bullet.getDamage());
            this.lastDamageTime = currentTime;
          }
          bulletHit = true;
        }
      }
      
      // Remove bullet if it hit something
      if (bulletHit) {
        bullet.dispose();
        this.bullets.splice(i, 1);
        continue;
      }
    }

    // Update enemies (iterate backwards to safely remove)
    const playerPosition = this.playerController.getPosition();
    const UPDATE_DISTANCE = 50; // Only update enemies within this distance
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const distanceToEnemy = playerPosition.distanceTo(enemy.getPosition());
      
      // Skip updates for distant enemies (performance optimization)
      if (distanceToEnemy > UPDATE_DISTANCE) {
        continue;
      }
      
      const enemyBullet = enemy.update(deltaTime, playerPosition);
      
      // Check if enemy attacks player (melee)
      if (enemy.isAttacking() && enemy.getDistanceToPlayer() < 2) {
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime >= this.damageCooldown) {
          this.playerHealth.takeDamage(GAME_CONFIG.ENEMY.ATTACK_DAMAGE);
          this.lastDamageTime = currentTime;
        }
      }

      // Get enemy bullets
      if (enemyBullet) {
        this.bullets.push(enemyBullet);
      }

      // Remove dead enemies
      if (enemy.isDead()) {
        this.sceneManager.remove(enemy.getMesh());
        this.enemies.splice(i, 1);
      }
    }

    // Spawn boss when all enemies are defeated
    if (this.enemies.length === 0 && !this.bossSpawned && this.boss === null) {
      this.spawnBoss();
    }

    // Update boss
    if (this.boss) {
      const bossBullet = this.boss.update(deltaTime, playerPosition);
      
      // Check if boss attacks player (melee)
      if (this.boss.isAttacking() && this.boss.getDistanceToPlayer() < 2) {
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime >= this.damageCooldown) {
          this.playerHealth.takeDamage(GAME_CONFIG.BOSS.ATTACK_DAMAGE);
          this.lastDamageTime = currentTime;
        }
      }

      // Get boss bullets
      if (bossBullet) {
        this.bullets.push(bossBullet);
      }

      // Remove dead boss
      if (this.boss.isDead()) {
        this.sceneManager.remove(this.boss.getMesh());
        this.boss = null;
        // Boss defeated - could trigger win condition here
      }
    }

    // Check player health
    if (this.playerHealth.isDead()) {
      this.handleGameOver();
    }

    // Update UI
    this.hud.update(
      this.playerHealth.getHealth(),
      this.playerHealth.getMaxHealth(),
      this.gun.getCurrentMagAmmo(),
      this.gun.getMagazines(),
      this.gun.getMaxMagAmmo(),
      this.gun.isReloadingNow(),
      this.gun.getReloadProgress(),
      this.boss ? this.boss.getHealth() : undefined,
      this.boss ? this.boss.getMaxHealth() : undefined
    );
  }

  private spawnBoss(): void {
    this.bossSpawned = true;
    // Spawn boss at a distance from player
    const playerPos = this.playerController.getPosition();
    const bossSpawnPos = new THREE.Vector3(
      playerPos.x + 20,
      playerPos.y,
      playerPos.z + 20
    );
    
    this.boss = new Boss(
      bossSpawnPos,
      this.sceneManager.scene,
      () => this.playerController.getPosition(),
      this.worldGenerator.getCollisionDetector()
    );
  }

  private render(): void {
    this.sceneManager.render();
  }

  private handleGameOver(): void {
    this.gameState.isGameOver = true;
    this.gameState.isPlaying = false;
    this.gameOverScreen.show();
  }

  public restart(): void {
    // Reset game state
    this.gameState.isGameOver = false;
    this.gameState.isPlaying = false;

    // Clear bullets
    this.bullets.forEach(bullet => {
      bullet.dispose();
    });
    this.bullets = [];

    // Reset player
    const playerStartPos = this.worldGenerator.getPlayerSpawnPoint();
    this.playerController.reset(playerStartPos);
    this.playerHealth.reset();

    // Clear enemies
    this.enemies.forEach(enemy => {
      this.sceneManager.remove(enemy.getMesh());
    });
    this.enemies = [];

    // Clear boss
    if (this.boss) {
      this.sceneManager.remove(this.boss.getMesh());
      this.boss = null;
    }
    this.bossSpawned = false;

    // Reset weapon (this resets ammo)
    this.gun.reset();

    // Reset damage cooldown
    this.lastDamageTime = 0;

    // Hide game over screen
    this.gameOverScreen.hide();

    // Restart game
    this.start();
  }

  public cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.inputManager.cleanup();
  }
}

