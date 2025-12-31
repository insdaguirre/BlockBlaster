// Game constants
export const GAME_CONFIG = {
  PLAYER: {
    SPEED: 5,
    JUMP_FORCE: 8,
    GRAVITY: -20,
    GROUND_HEIGHT: 0,
    MAX_HEALTH: 100,
    HEIGHT: 1.8,
    RADIUS: 0.3
  },
  WEAPON: {
    FIRE_RATE: 600, // milliseconds between shots
    DAMAGE: 25,
    RANGE: 100,
    MUZZLE_FLASH_DURATION: 100, // milliseconds
    MAX_AMMO: 30,
    BULLET_SPEED: 50
  },
  ENEMY: {
    MAX_HEALTH: 50,
    SPEED: 2,
    PATROL_SPEED: 1,
    DETECTION_RANGE: 15,
    ATTACK_RANGE: 8,
    ATTACK_DAMAGE: 10,
    ATTACK_COOLDOWN: 2000, // milliseconds
    SIZE: 1,
    SHOOT_RANGE: 20,
    SHOOT_COOLDOWN: 1500, // milliseconds
    BULLET_SPEED: 40,
    BULLET_DAMAGE: 15
  },
  BOSS: {
    MAX_HEALTH: 200,
    SPEED: 2.5,
    PATROL_SPEED: 1.2,
    DETECTION_RANGE: 30,
    ATTACK_RANGE: 10,
    ATTACK_DAMAGE: 20,
    ATTACK_COOLDOWN: 1500, // milliseconds
    SIZE: 1.5,
    SHOOT_RANGE: 25,
    SHOOT_COOLDOWN: 800, // milliseconds
    BULLET_SPEED: 45,
    BULLET_DAMAGE: 20
  },
  WORLD: {
    BLOCK_SIZE: 1,
    GROUND_SIZE: 150,
    GRID_SIZE: 150
  }
};

