# FPS Block Game

A first-person shooter game with block-style 3D graphics built with Three.js, TypeScript, and Vite.

## Features

- **First-Person Shooter Gameplay**: Smooth FPS controls with mouse look and WASD movement
- **Block-Style Graphics**: Minecraft-inspired block-based 3D world and characters
- **Enemy AI**: Enemies with patrol, chase, and attack behaviors
- **Weapon System**: Raycast shooting with muzzle flash effects
- **Health System**: Player and enemy health with visual feedback
- **Level Design**: Procedurally generated block-based level with obstacles and cover

## Controls

- **WASD** - Move (forward, backward, strafe left, strafe right)
- **Mouse** - Look around (first-person camera)
- **Left Click** - Shoot
- **Space** - Jump

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This will create an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

The game is a static site and can be deployed to any static hosting service.

### Vercel

1. Install Vercel CLI (if not already installed):
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Netlify

1. Install Netlify CLI (if not already installed):
```bash
npm i -g netlify-cli
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy --prod --dir=dist
```

Or connect your GitHub repository to Netlify and set:
- Build command: `npm run build`
- Publish directory: `dist`

### GitHub Pages

1. Build the project:
```bash
npm run build
```

2. Push the `dist` folder contents to the `gh-pages` branch, or use a GitHub Action to automate this.

## Project Structure

```
Game_Test/
├── src/
│   ├── main.ts              # Entry point
│   ├── core/                # Core game systems
│   │   ├── Game.ts          # Main game loop
│   │   ├── SceneManager.ts  # Three.js scene setup
│   │   └── InputManager.ts  # Input handling
│   ├── player/              # Player systems
│   │   ├── PlayerController.ts
│   │   └── PlayerHealth.ts
│   ├── weapon/              # Weapon systems
│   │   ├── Weapon.ts
│   │   └── Gun.ts
│   ├── enemy/               # Enemy systems
│   │   ├── Enemy.ts
│   │   ├── EnemyAI.ts
│   │   └── EnemyHealth.ts
│   ├── world/               # World generation
│   │   ├── WorldGenerator.ts
│   │   ├── Block.ts
│   │   └── CollisionDetector.ts
│   ├── ui/                  # User interface
│   │   ├── HUD.ts
│   │   └── GameOverScreen.ts
│   ├── utils/               # Utilities
│   │   ├── constants.ts
│   │   └── math.ts
│   └── types/               # TypeScript types
│       └── index.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

### Core Systems

- **Game Loop**: Uses `requestAnimationFrame` for smooth 60 FPS rendering
- **Scene Management**: Three.js scene with lighting, shadows, and fog
- **Input Handling**: Keyboard and mouse input with pointer lock for FPS controls

### Player System

- **Movement**: Velocity-based physics with gravity and ground collision
- **Camera**: First-person perspective with mouse look (pitch/yaw)
- **Health**: Health system with visual HUD feedback

### Weapon System

- **Shooting**: Raycast-based hit detection using Three.js Raycaster
- **Visual Effects**: Muzzle flash using PointLight
- **Hit Detection**: Instant hit detection on enemies

### Enemy System

- **AI States**: 
  - **Patrol**: Random waypoint navigation
  - **Chase**: Follows player when in detection range
  - **Attack**: Attacks player when in range
- **Block Models**: Procedurally generated block-style 3D models
- **Health**: Enemy health system with damage feedback

### World System

- **Level Generation**: Procedurally generates block-based level
- **Collision Detection**: AABB (Axis-Aligned Bounding Box) collision detection
- **Blocks**: Ground, walls, and obstacles for cover

## Extending the Game

### Adding New Weapons

1. Create a new weapon class extending `Weapon.ts`
2. Implement the `update()` and `reset()` methods
3. Add weapon switching logic in `Game.ts`

### Adding New Enemy Types

1. Create a new enemy class or extend `Enemy.ts`
2. Customize the model in `createEnemyModel()`
3. Adjust AI behavior in `EnemyAI.ts` if needed

### Adding New Levels

1. Modify `WorldGenerator.ts` to create different level layouts
2. Add new block types in `Block.ts`
3. Adjust spawn points and obstacles

### Adding Sound Effects

1. Add audio files to `public/` directory
2. Use Web Audio API or HTML5 Audio in weapon/enemy systems
3. Play sounds on events (shoot, hit, enemy death, etc.)

## Performance

The game is optimized for 60 FPS on modern browsers:
- Efficient collision detection (AABB)
- Shadow map optimization
- Object pooling ready (for projectiles if added)
- Frustum culling (handled by Three.js)

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari

Requires WebGL support.

## License

This project is open source and available for educational purposes.

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D graphics library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool and dev server

