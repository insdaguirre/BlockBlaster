# Final Game and Free Deployment Plan

---

## 1. Executive Summary

### Repo State

BlockBlaster is a fully playable browser-based first-person shooter built with TypeScript, Three.js, and Vite. The core game loop is complete: a player navigates a procedurally generated beach, defeats four enemy soldiers, and fights a boss. The architecture is clean, modular, and well-typed. It deploys today as a static web game with zero backend requirements.

The gap between "playable prototype" and "portfolio-grade product" is not about adding game systems — it is almost entirely about experience design: the shell, the presentation, the feel, and the finish.

### Recommended Direction

Lean aggressively into the existing voxel/geometric aesthetic as a deliberate design identity — not a limitation to apologize for. Pair it with a premium, minimal UI system inspired by early Monument Valley and Apple HIG principles. Add audio, screen-space feedback, a proper win condition, and a score system. Redesign the entire shell (start screen, menus, overlays) to feel intentional and elegant. Harden the architecture in one targeted pass. Ship on GitHub Pages with GitHub Actions CI/CD.

### Why This Direction

- **SWE mastery**: The existing architecture is structurally sound. The plan upgrades it with material sharing, spatial hashing, and a proper asset/audio pipeline — demonstrating engineering depth without rewriting what works.
- **Visual aesthetic**: The blocky Three.js geometry can look deliberate and premium with the right lighting, palette, typography, and composition. This is an easier lift than replacing art and produces a stronger result than trying to make it look realistic.
- **Free deployment**: GitHub Pages with GitHub Actions gives the cleanest CI/CD pipeline for a Vite static build, requires no account migration, and directly connects the deployed game to the source code — the best portfolio pairing.

---

## 2. Current Repo Audit

### Architecture Overview

The codebase is organized into seven coherent modules under `src/`:

- **`core/`** — Game loop (`Game.ts`), scene/renderer setup (`SceneManager.ts`), and input (`InputManager.ts`). `Game.ts` is the central coordinator and is 412 lines.
- **`player/`** — FPS movement/camera (`PlayerController.ts`) and health abstraction.
- **`weapon/`** — Abstract `Weapon` base, concrete `Gun` with magazine logic, and `Bullet` with step-based physics.
- **`enemy/`** — `Enemy` entity, `EnemyAI` state machine (idle/patrol/chase/attack/dead), health, and `Boss` subtype.
- **`world/`** — Procedural `WorldGenerator`, AABB `CollisionDetector`, and `Block` factory.
- **`ui/`** — DOM-based `HUD`, `PauseMenu`, `GameOverScreen`.
- **`utils/`** + **`types/`** — Constants, math helpers, shared interfaces.

Entry point is `main.ts` (18 lines). The game is entirely client-side. `index.html` provides the canvas and a small amount of inline CSS.

### Tech Stack

| Layer | Tool |
|---|---|
| Language | TypeScript 5.3, strict mode |
| Renderer | Three.js 0.160.0 |
| Build | Vite 5.0.8 |
| UI | DOM/HTML (no framework) |
| Assets | All procedural (no external files) |
| Storage | `localStorage` (sensitivity setting) |

### Rendering / Runtime Model

- `requestAnimationFrame` loop with delta time clamped at 100ms
- PerspectiveCamera, 75° FOV, YXZ rotation order
- PCFShadowMap at 1024×1024
- Linear fog at 30–60 units
- No WebGPU, no OffscreenCanvas — standard WebGL

### Deployment Model

Fully static. `netlify.toml` and `vercel.json` are both present and correctly configured. Output is `dist/` with a Three.js split chunk. No backend, no environment variables, no API keys.

### Existing Strengths

- Clean TypeScript with zero `any` — every type is named
- Correct resource disposal (geometry/material/mesh cleanup on entity death)
- `EnemyAI` state machine is well-structured and extensible
- Magazine-based gun system with reload progress
- Pointer lock + mouse delta capped to prevent jitter
- Bullet step-based movement prevents tunneling
- Muzzle flash PointLight and damage feedback flash show good game feel instinct
- README is exceptional (Mermaid diagrams, architecture walkthrough, contribution guide)
- Both Netlify and Vercel configs present — repo is deploy-ready today

### Existing Weaknesses

- **No audio system** — arguably the biggest single gap in perceived quality
- **No win condition** — defeating the boss does not trigger any success state or screen
- **No score or time tracking** — no quantitative measure of performance
- **UI is programmer-art** — Arial font, green `#4CAF50` buttons, inline style strings, no design system
- **No start screen identity** — the current overlay is a featureless dark div with white text
- **O(n) collision detection** — all blocks checked every frame; no spatial partitioning
- **No material sharing** — each block instantiates a unique `MeshStandardMaterial`
- **No particle system** — deaths, bullets, and impacts produce no visual feedback beyond a flash
- **No screen-space effects** — no vignette on damage, no chromatic aberration or blur
- **No camera shake** — boss hits and nearby explosions produce no positional feedback
- **Single wave, no replayability** — one map, one difficulty, no reason to play twice
- **No CI/CD pipeline** — manual deploys only

### Current Blockers to a Finished Premium Product

1. Missing win screen (game ends abruptly with no positive resolution)
2. No audio (silence is the fastest way to feel unfinished)
3. UI system lacks visual identity (typography and color are defaults)
4. No score/progression hook (nothing to share, nothing to beat)
5. No GitHub Actions workflow (no CI/CD for the deployment configs that already exist)

---

## 3. Product Vision for the Final Game

### Target Experience

A precisely 5–7 minute browser FPS that feels self-contained and complete. The player arrives at a URL, reads a title screen that communicates the game's personality in under 3 seconds, clicks once to start, plays through the wave and boss encounter, and sees a satisfying end state with a score. The experience respects the player's time because it has a clear arc: start, escalation, boss, resolution.

### Target User Impression

> "This is a real thing. Someone with taste and engineering ability built this."

That impression comes from:
- A title screen that looks designed, not assembled
- UI that is consistent, not cobbled together
- Audio that makes every action feel impactful
- A boss encounter that feels climactic
- An end screen that earns the moment

### Visual Tone

**Geometric minimalism with warmth.** The voxel aesthetic is a design choice — treated like Monument Valley or mini metro, not like a Minecraft knockoff. Clean forms, intentional color palette, strong contrast between the warm sandy environment and the cool tech-blue enemy glow. The UI exists in a separate design register from the world: dark, typographic, spatial, restrained.

### Interaction Tone

Precise, responsive, satisfying. Every action has a corresponding feeling: shots have recoil and audio snap, hits have flash and sound, reloads have visual progress, movement has momentum. Nothing feels floaty or silent.

### What Makes It Portfolio-Worthy

A portfolio game is not impressive because it has many features. It is impressive because every feature it has is complete and cohesive. BlockBlaster at 8 polished systems beats BlockBlaster at 20 half-finished ones. The current foundation is strong enough that the work ahead is almost entirely polish, feel, and finish — which is exactly the kind of engineering taste that is hard to fake.

### What Makes It Premium Rather Than Just Functional

- The start screen feels like a product, not an HTML file
- The HUD feels designed, not default
- The audio does not use royalty-free MP3s you've heard before
- The death screen does not just say "Game Over" on a black rectangle
- The boss fight has a moment — a visual escalation when it spawns
- The win state makes the player feel something

---

## 4. Gap Analysis

### Core Gameplay

| Item | Status | Severity |
|---|---|---|
| Player movement + shooting | Complete | — |
| Enemy AI state machine | Complete | — |
| Boss encounter | Functional, not climactic | Medium |
| Win condition / victory screen | Missing | Critical |
| Score system | Missing | High |
| Wave/difficulty progression | Missing | Medium |
| Power-ups or pickups | Missing | Low |

### Progression / Replayability

- Single wave, single difficulty, no score delta → no incentive to replay
- No high score persistence (localStorage is available and unused for scores)
- No difficulty selector
- No wave counter or timer

### Menus / UX

- Start screen: functional but has no visual identity
- Pause menu: Arial font, basic slider, green button — needs full redesign
- Game over: one line of text, no data about the run
- Victory screen: does not exist
- No transitions between states (instant cut vs. smooth fade)

### Visual Design

- No typography system (Arial everywhere)
- No color system (green for buttons is arbitrary)
- No consistent spacing unit
- HUD elements placed ad-hoc without grid or alignment logic
- Enemy and environment colors are functional but not deliberate
- No particle effects anywhere
- No screen-space feedback (low health vignette, hit flash is screen-wide white — too aggressive)

### Audio

- Zero audio implementation
- No scaffolding for Web Audio API
- This is the single largest perceived quality gap in the game

### Game Feel

- Camera shake: absent
- Screen effects: absent (single white flash on damage is too crude)
- Impact sounds: absent
- Knockback/stagger on hits: absent
- Death animations: enemies fall over (present) but no visual dissolve or particles
- Reload animation feedback: text only, no visual/audio feedback

### Technical Architecture

- `CollisionDetector`: O(n) linear scan of all world blocks — needs spatial hash grid
- Material creation: each `Block.create*()` allocates a unique material — needs shared material cache
- `Game.ts` `update()` method is 157 lines — should be decomposed into a system pipeline
- No `EventEmitter` or message bus — Game directly calls into all subsystems (works at current scale, will get messy with audio/particles)
- No asset loading system — currently unnecessary but needed once audio is added
- UI built with `innerHTML` string concatenation — needs at minimum a small DOM helper

### Performance

- No spatial hashing for collision — blocks are all checked linearly every frame
- Material instancing not used — many identical block types share no materials
- No level-of-detail system (acceptable at current scene size)
- Shadow map at 1024×1024 is fine; directional light frustum is not tightly fit

### Testing / QA

- No unit tests
- No integration tests
- No visual regression baseline
- TypeScript strict mode provides meaningful compile-time safety, but no runtime assertions

### Deployment / Release Readiness

- `netlify.toml` and `vercel.json` present but no GitHub Actions workflow
- No `robots.txt`, `og:image`, or social meta tags
- No favicon
- No analytics (optional but useful for a portfolio piece)
- `index.html` title is placeholder ("BlockBlaster") — fine, but no description meta

---

## 5. Recommended Roadmap

### Phase 1 — Foundation Cleanup (Prerequisites)

**Objective**: Fix the two critical missing states, add score, and set up CI/CD so all future work deploys automatically.

**Why it matters**: The game is not "done" until the player can win. A missing win state is a hard blocker on portfolio readiness. CI/CD should be set up first so every subsequent phase ships automatically.

**Tasks**:
1. Implement `VictoryScreen` component — mirrors `GameOverScreen` architecture, shows score + time
2. Wire boss death → victory state in `Game.ts`
3. Add `ScoreManager` utility: tracks kills × point value, time bonus, accuracy ratio
4. Display score on both game-over and victory screens
5. Persist high score to `localStorage`
6. Create `.github/workflows/deploy.yml` — runs `npm run build`, deploys `dist/` to GitHub Pages on push to `main`
7. Add `favicon.ico` and `og:image` meta to `index.html`

**Expected impact**: Game is now completable with a measurable outcome. Deployments are automated.

**Dependencies**: None — this phase is self-contained.

---

### Phase 2 — Audio System

**Objective**: Add a complete audio system using the Web Audio API.

**Why it matters**: Audio is responsible for ~40% of perceived game quality. Silence is the fastest signal that something is unfinished. This is the highest-ROI single phase in the plan.

**Tasks**:
1. Create `src/audio/AudioManager.ts` — Web Audio API `AudioContext` wrapper with gain control and mute toggle
2. Create `src/audio/SoundLibrary.ts` — named sound enum, procedural synthesis (no audio files needed initially; Web Audio API can synthesize all required sounds)
3. Implement procedural sound synthesis for:
   - Gunshot: filtered noise burst with sharp attack, 80ms decay
   - Reload click: high-pitched transient
   - Empty mag click: dry tick
   - Enemy hit: short pitched noise
   - Enemy death: low descending pitch
   - Boss roar on spawn: low frequency rumble
   - Victory jingle: three ascending tones
4. Wire sounds into: `Gun.ts` (shoot, reload, empty), `Enemy.ts` (hit, death), `Boss.ts` (spawn, hit, death), `Game.ts` (victory, gameover)
5. Add master volume control to pause menu
6. Add mute toggle (M key)

**Note on audio files vs procedural**: Procedural synthesis via Web Audio API is preferred for this project because it requires zero assets, zero loading time, zero licensing concerns, and produces a distinctive "designed" sound signature that matches the geometric visual aesthetic. This is the correct engineering and aesthetic choice.

**Expected impact**: Single largest improvement in perceived quality.

**Dependencies**: Phase 1 (clean game state flow required before wiring audio to state transitions).

---

### Phase 3 — Game Feel

**Objective**: Add the micro-feedback systems that make every action feel satisfying.

**Why it matters**: Game feel is the invisible layer of quality. A game with good feel at low graphical fidelity outperforms a game with high graphics and no feel. Every item here is mechanical and isolated — low risk, high reward.

**Tasks**:
1. **Camera shake** — Add `CameraShake.ts` utility: trauma-based shake system (add trauma on boss hit, nearby explosion; decay over 200ms)
2. **Hit vignette** — Replace full-screen white flash with a red radial vignette overlay (CSS `radial-gradient` on a zero-opacity div) when player takes damage
3. **Low health pulse** — Persistent slow red vignette pulsing at < 30% health
4. **Screen-space hit marker** — Small white cross that fades in 200ms on enemy hit (distinct from crosshair)
5. **Particle system** — Create `src/effects/ParticleSystem.ts`: pooled `THREE.Points` geometry, reused across effects
   - Enemy death: 20 particles burst in enemy color direction
   - Bullet impact on wall: 8 sand/metal chips
   - Boss hit: larger burst with slower decay
6. **Boss entrance** — On boss spawn, emit a shockwave ring (expanding `THREE.RingGeometry` plane) + camera shake + audio roar
7. **Crosshair feedback** — Crosshair spreads on shot, snaps back in 150ms; turns red briefly on hit

**Expected impact**: Transforms the game from "functional" to "feels good to play."

**Dependencies**: Phase 2 (audio wired before game feel pass so both land together).

---

### Phase 4 — Visual and UI Redesign

**Objective**: Replace the programmer-art UI shell with a coherent design system.

**Why it matters**: The in-game world can stay blocky — that's identity. The UI must feel designed. The current Arial/green-button aesthetic undercuts all the engineering work beneath it.

**Tasks**:

**Typography system**:
1. Add `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap')` to `index.html` (or embed Inter as a subset WOFF2 for zero-CDN)
2. Define CSS custom properties: `--font-primary: 'Inter', system-ui; --font-mono: 'SF Mono', monospace`
3. Establish four text styles: Display (title), Label (HUD), Body (menus), Caption (sub-info)

**Color system**:
1. Define CSS custom properties for the entire palette:
   - `--color-bg: #0a0a0f` (near-black with slight blue cast)
   - `--color-surface: rgba(12, 14, 20, 0.85)` (glass-dark for panels)
   - `--color-accent: #00d4ff` (matches existing enemy blue glow)
   - `--color-danger: #ff3b3b`
   - `--color-text: #f0f0f4`
   - `--color-text-muted: rgba(240,240,244,0.5)`
2. Remove all hardcoded hex colors from UI TypeScript files — replace with CSS variables

**HUD redesign**:
1. Health bar: thin (4px height), full-width bottom strip, animated width transition
2. Ammo: monospace numerals, bottom-right, larger current / smaller reserve
3. Crosshair: 1px lines, 8px gap, subtle opacity (0.7) — feels precision rather than arcade
4. Boss bar: slides in from top on spawn with a 300ms ease; labeled with "BOSS" in display font
5. Hit marker: small 12px `+` that fades in 150ms

**Start screen redesign**:
1. Full-screen canvas visible behind overlay (Three.js scene rendered, player frozen)
2. Centered card with: game title in Display font, one-line description, Start button
3. Start button: no background color, 1px border `--color-accent`, white text, subtle glow on hover
4. Subtle animated grain texture or scanline overlay for texture

**Pause menu redesign**:
1. Frosted-glass backdrop blur (`backdrop-filter: blur(12px)`)
2. Panel: `--color-surface` with 1px `--color-accent` border
3. All controls use consistent field/label pattern
4. Sensitivity: styled range input with custom thumb
5. No green buttons — primary action uses outline style with accent color

**Game over / victory redesign**:
1. Score displayed large in Display font
2. Stats breakdown: kills, accuracy %, time, high score comparison
3. Primary CTA: "Play Again" in accent outline style

**Expected impact**: This phase is responsible for the "portfolio-caliber" impression. It elevates every other system.

**Dependencies**: Phase 1 (score data available for screens), Phase 2 (audio wired so UI interactions have sound).

---

### Phase 5 — Architecture Hardening

**Objective**: Address the specific technical anti-patterns that would be visible to an engineer reviewing the code.

**Why it matters**: This is a portfolio. Engineers will read the code. The architecture should be as polished as the gameplay.

**Tasks**:
1. **Spatial hash grid for collision** — Replace O(n) block scan in `CollisionDetector.ts` with a 2D hash grid (cell size = block size). Collision lookup becomes O(1) average.
2. **Material cache in Block factory** — Add `BlockMaterialCache` singleton that returns shared `MeshStandardMaterial` instances keyed by material parameters. Reduces draw calls and GPU memory.
3. **Decompose `Game.ts` update loop** — Extract bullet update, enemy update, and collision resolution into named private methods. Target: `update()` is ≤ 50 lines.
4. **Simple event bus** — Add `src/core/EventBus.ts` (50 lines, typed events). Wire audio and particles as subscribers. Decouples `Gun`, `Enemy`, and `Boss` from knowing about audio/particles.
5. **Asset loader scaffold** — Add `src/core/AssetLoader.ts` even though current assets are procedural. This demonstrates production engineering awareness and is required if audio files are ever added.
6. **Add JSDoc to public interfaces** — `Game`, `PlayerController`, `EnemyAI`, `Gun` public methods should have single-line JSDoc. Not exhaustive — just the surface API.

**Expected impact**: Code reads like it was written by someone who ships production software.

**Dependencies**: Phases 1–4 complete (architecture changes are easier to make on a stable codebase).

---

### Phase 6 — Wave System and Replayability

**Objective**: Add minimal but meaningful progression so there's a reason to play more than once.

**Why it matters**: A portfolio piece that's replayable gets shared. This does not require a large overhaul — just the scaffolding to make the single wave expandable.

**Tasks**:
1. Introduce `WaveManager.ts` — defines enemy counts, spawn points, and boss threshold per wave
2. Add Wave 1 (current: 4 enemies + boss) and Wave 2 (6 enemies, faster, boss has +50 HP)
3. Add a "Wave Complete" interstitial (2 seconds, shows wave number, then spawns next wave)
4. Health pickup spawns after wave clear: a glowing green block that restores 25 HP on contact
5. Difficulty multiplier: enemy speed/damage scales by 10% per wave
6. Score multiplier: wave number × base score

**Implementation note**: `WaveManager` should be 80–100 lines. Do not overengineer this. The point is demonstrating the system, not building a full roguelite.

**Expected impact**: Replayability without scope explosion. Demonstrates systems thinking.

**Dependencies**: Phase 1 (score system), Phase 5 (clean architecture makes WaveManager easy to add).

---

### Phase 7 — Performance Hardening and QA

**Objective**: Confirm the game performs well on mid-range hardware and add minimal but meaningful tests.

**Tasks**:
1. Profile with browser DevTools — confirm 60 FPS stable on integrated GPU scenarios
2. Add `stats.js` or custom FPS counter visible only in dev mode (`?debug=1`)
3. Shadow frustum fitting: tighten directional light shadow camera to the playable area (reduces shadow map waste)
4. Confirm Three.js `dispose()` calls on all entity removal (audit `Enemy.die()`, `Boss.die()`, `Bullet.remove()`)
5. Write 3 unit tests for `CollisionDetector` spatial hash (using Vitest, already compatible with Vite config)
6. Write 2 unit tests for `ScoreManager` (kill values, time bonus calculation)
7. Add `npm run test` script to `package.json`

**Expected impact**: Code is verifiably correct in the systems that matter most. Performance is validated.

**Dependencies**: Phase 5 (spatial hash must exist before it can be tested).

---

## 6. Feature and System Recommendations

### Essential

**Procedural Audio System (Web Audio API)**
Building audio from first principles with the Web Audio API is technically impressive and aesthetically correct for this game. It demonstrates deep browser API knowledge, produces zero-latency sounds (unlike `<audio>` elements), and requires no asset pipeline. This is non-negotiable for a finished game.
- Complexity: Medium (3–4 days)
- Status: Essential

**Spatial Hash Grid Collision**
The current O(n) linear block scan is the most visible architectural weakness. A 2D hash grid is a standard game dev optimization, is ~80 lines of code, and demonstrates algorithms awareness to anyone reading the source.
- Complexity: Low (1 day)
- Status: Essential

**Victory Screen + Score System**
Without this, the game does not have an ending. Non-negotiable.
- Complexity: Low (1 day)
- Status: Essential

**Shared Material Cache**
Reducing from N unique materials to ~8 shared materials is a single-file change that cuts WebGL draw calls and GPU memory significantly. It demonstrates graphics API awareness.
- Complexity: Low (half day)
- Status: Essential

---

### High Value

**Camera Shake (Trauma System)**
The trauma-based shake system (popularized by Vlambeer) is a well-known game feel technique. Implementing it correctly (trauma + shake = `trauma² * maxOffset`) and referencing this decision in code comments demonstrates game development literacy.
- Complexity: Low (half day)
- Status: High value

**Event Bus**
Decoupling audio/particles from game entities via a typed event bus is the single clearest architectural upgrade that demonstrates production engineering instincts. It makes the codebase extensible without tight coupling.
- Complexity: Low (1 day)
- Status: High value

**UI Design System (CSS variables + Inter font)**
The fastest way to signal taste. Replacing arbitrary colors and Arial with a coherent system takes less than a day and transforms the perceived quality of everything in the UI layer.
- Complexity: Low (1 day)
- Status: High value

**Particle System (Pooled THREE.Points)**
A minimal pooled particle system adds significant visual feedback density. The key constraint is keeping it to a single file, reused across effects.
- Complexity: Medium (1.5 days)
- Status: High value

---

### Optional

**Difficulty Selector**
Easy/Normal/Hard on the start screen affects enemy count, speed, and boss HP. Adds perceived depth without new systems. Only worth adding after all essential and high-value work is done.
- Complexity: Low
- Status: Optional

**Leaderboard via Supabase Free Tier**
A serverless leaderboard using Supabase's free PostgreSQL tier would be technically impressive and create a social hook. However, it adds a backend dependency and operational overhead. Skip unless specifically targeting a "full-stack demo" portfolio angle.
- Complexity: High
- Status: Optional

**Mobile/Touch Controls**
Touch controls for a first-person shooter are inherently worse than mouse. The game is clearly desktop-native. Adding poor mobile support would hurt the experience. Skip.
- Complexity: High, negative ROI
- Status: Do not implement

**Terrain Editing / Block Placement**
This would change the genre of the game. Not in scope.
- Status: Out of scope

---

## 7. Visual and Experience Direction

### Interface Style

The game UI exists in two distinct registers that must never blur:
1. **The world**: voxel geometry, warm beach palette, sci-fi blue/orange enemy glow — this is expressive and stylized
2. **The interface**: dark, typographic, precise, minimal — this is the system layer, not the game layer

The HUD must feel like it belongs to a tool, not to the world. Think the UI from *Halo* or *Destiny* — a clean overlay sitting above the experience, not trying to be part of it.

### Typography Direction

Use **Inter** (Google Fonts, free, excellent rendering at small sizes) across all UI. Define exactly four styles and use nothing else:

```
Display:  Inter 300 / 48px / letter-spacing -1px / color --color-text
Label:    Inter 400 / 13px / letter-spacing 1.5px / UPPERCASE / color --color-text-muted
Body:     Inter 400 / 16px / line-height 1.6 / color --color-text
Mono:     'SF Mono', 'Fira Code', monospace / 14px / color --color-accent
```

Ammo count, health numbers, and score use the Mono style. Titles use Display. HUD labels (HEALTH, AMMO) use Label. Menu text uses Body.

### Color / Material Direction

```
Background:   #0a0a0f   (near-black, slight blue-black, not pure black)
Surface:      rgba(12, 14, 20, 0.85) with backdrop-filter: blur(12px)
Accent:       #00d4ff   (already present as enemy chest glow — use consistently)
Danger:       #ff3b3b   (health bar low, damage vignette)
Success:      #34c759   (health pickup, victory accent)
Text:         #f0f0f4   (not pure white — easier on eyes)
Text muted:   rgba(240, 240, 244, 0.45)
Border:       rgba(0, 212, 255, 0.2)  (accent at low opacity)
```

**The accent color `#00d4ff` should be the single connecting thread between the in-game enemy tech aesthetic and the UI system.** This makes the world and the HUD feel like they belong to the same product.

### Animation / Motion Philosophy

**Purposeful, not decorative.** Every animation must communicate state, not just look nice.

Rules:
- UI panels fade in at 150ms ease-out. They never slide in from offscreen (that's an app, not a game overlay).
- Health bar transitions width at 200ms ease-out — fast enough to feel responsive, slow enough to read.
- Boss bar slides down from `translateY(-100%)` on spawn — one exception to the fade rule because it is a dramatic moment.
- Score popups (kill points) float up from kill position in world-space using a DOM overlay element: appear instantly, drift 40px up over 800ms, fade out last 200ms.
- Damage vignette: instant in, 600ms fade out. Never flickers or loops.
- Button hover: 80ms opacity change only. No transforms, no shadows appearing. Restraint.

### HUD Principles

- **Minimum necessary information**: health, ammo, score, wave. Nothing else during normal play.
- **No decorative frames or panels around HUD elements** — numbers and bars exist directly in space, not in boxes.
- **Bottom strip for health**: a 3px line at the very bottom of the screen that shortens as health drops. Subtle. Peripheral vision reads it without demanding attention.
- **Ammo counter**: bottom-right, large current ammo in Mono font, small "/" and total mags in muted style.
- **Score**: top-right, small, Label style. Not prominent — the player is playing a game, not watching numbers.
- **Boss bar**: the only element with a frame — it earns one. Thin dark panel, full-width, slides from top. Labeled "BOSS" in Label style left of bar.

### Menu Design Principles

- Menus use `backdrop-filter: blur(16px)` with the dark surface color. They feel like iOS modals — not opaque overlays.
- Single centered column, generous vertical spacing (32px between elements minimum).
- No gradients on buttons. Outline style only: `1px solid --color-accent`, transparent background. On hover: `background: rgba(0,212,255,0.08)`. On active: `background: rgba(0,212,255,0.15)`.
- Range inputs: hide native appearance, style the track as a 1px line in border color, thumb as a 10px circle in accent color.
- Labels float above their inputs, never inline. Small caps.

### Effects Philosophy

The rule for effects: **every effect must have a referent**. An explosion particle burst says "something died here." A damage vignette says "you were hurt." A camera shake says "a large force was nearby." Effects without a clear referent are visual noise.

Specifically:
- Muzzle flash: keep it (already implemented) — shrink the duration to 60ms for snappier feel
- White damage flash: replace with the red vignette approach — more information, less violence
- Enemy death particles: 16 colored cubes (matching enemy material color) burst outward with physics for 600ms
- Boss spawn shockwave: a `RingGeometry` that scales from 0 to 8 radius over 400ms, opacity fading — this is a cinematic moment and deserves a 3D effect, not just screen-space
- Bullet impact: 6 small particles (sand color or metal color based on block type hit) — tiny but meaningful
- Kill score popup: the most important effect because it directly rewards the player

### How to Hit "Apple-Level Taste" Without Becoming Sterile

The risk with restraint is blandness. Apple-level taste means maximum signal per pixel, not minimum pixels. Specifically:

- Use one color (the accent) with conviction, not many colors used timidly
- Let the game world carry visual interest — the UI should not compete
- Every empty space is a choice, not an accident — the start screen's negative space is part of the design
- The single best "taste signal" you can add: the start screen shows the live Three.js scene playing in the background while the title card sits in front. This costs 20 lines of code and communicates that the developer knows both design and engineering.

---

## 8. Free Deployment Strategy

### Recommended: GitHub Pages + GitHub Actions

**Why GitHub Pages is the best fit for this repo:**

1. **Portfolio-native**: The deployed URL and the source repository are directly linked in the GitHub ecosystem. A portfolio reviewer goes from the live game to the source code in one click. No other platform provides this.
2. **Zero cost, no bandwidth caps**: GitHub Pages serves static files with Fastly CDN at no cost with no monthly bandwidth limit. Netlify free tier limits to 100GB/month; for a Three.js game this matters.
3. **CI/CD is one YAML file**: The `deploy.yml` workflow runs `npm run build` and deploys `dist/` using the official `actions/deploy-pages` action. This is standard, well-documented, and requires no platform account setup beyond what is already present.
4. **Reliability**: GitHub's infrastructure is among the most reliable in the industry for static hosting.
5. **Custom domain**: GitHub Pages supports custom domains with automatic TLS via Let's Encrypt. A custom domain requires a CNAME record only — no dashboard setup.
6. **No cold starts**: Unlike Vercel/Netlify functions (not relevant here, but worth noting), static file serving has zero cold start latency.

**Build/Deploy Model:**
```
git push origin main
  → GitHub Actions trigger
  → npm ci
  → npm run build (TypeScript check + Vite bundle)
  → dist/ deployed to gh-pages branch
  → Available at: https://{username}.github.io/BlockBlaster
```

**CI/CD — `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Vite config note**: Set `base: '/BlockBlaster/'` in `vite.config.ts` for GitHub Pages subdirectory deployment, or `base: '/'` if using a custom domain.

**Custom Domain Notes:**
- Add `CNAME` file to repo root with the domain (e.g., `blockblaster.io`)
- Add A records pointing to GitHub Pages IPs in DNS registrar
- TLS is automatic
- Free domain registrars: Freenom (limited TLD options), or just use the `github.io` subdomain

**Final Public Delivery:**
- Primary URL: `https://{username}.github.io/BlockBlaster`
- With custom domain: `https://blockblaster.io` (or similar)
- Game loads entirely from GitHub's CDN (Fastly)
- No server, no cold starts, no monthly cost

---

### Alternative 1: Netlify

**Already configured** — `netlify.toml` is correct and complete. Drag-drop `dist/` to Netlify or connect the GitHub repo for automatic deploys.

**Pros:**
- Excellent performance (Netlify Edge)
- Built-in branch previews (every PR gets a preview URL)
- Form handling, identity, and edge functions available if ever needed
- Zero configuration for this repo

**Cons:**
- Free tier has 100GB/month bandwidth cap — could matter for a popular game
- Deploy previews are slightly slower than GitHub Pages for pure static assets
- One more platform account to manage
- Less "portfolio-native" than GitHub Pages (no direct source↔game connection)

**Why it loses**: GitHub Pages is zero-overhead for a static game that lives in a GitHub repo. Netlify's extras (branch previews, forms) are irrelevant here.

---

### Alternative 2: Vercel

**Also already configured** — `vercel.json` is correct.

**Pros:**
- Excellent DX — `vercel --prod` deploys in under 60 seconds
- Automatic HTTPS, global CDN
- Preview deployments per branch
- Great Vite support (first-class framework detection)

**Cons:**
- Free tier: 100GB bandwidth, 6000 build minutes/month
- Vercel is positioning increasingly toward server-side frameworks (Next.js, etc.); static game hosting is not its primary use case
- `vercel.app` URL is less memorable than `github.io/{name}` for portfolio discovery

**Why it loses**: Vercel is excellent for full-stack projects. For a pure static game, GitHub Pages is equally fast, has no bandwidth cap, and integrates more naturally with the portfolio context.

---

## 9. Implementation Order

This sequence assumes a single engineer working on the project. Each step builds on the previous without orphaned work.

```
STEP 1 — Set up GitHub Actions CI/CD
  File: .github/workflows/deploy.yml
  Why first: Everything after this ships automatically. One commit = one deploy.
  Duration: 30 minutes

STEP 2 — Implement VictoryScreen + wire boss death
  Files: src/ui/VictoryScreen.ts, src/core/Game.ts
  Why: Game must have an ending before any polish work makes sense.
  Duration: 2 hours

STEP 3 — Implement ScoreManager
  File: src/utils/ScoreManager.ts
  Why: Score data is needed by both game-over and victory screens.
  Wire kill points, accuracy ratio, time bonus. Persist high score to localStorage.
  Duration: 2 hours

STEP 4 — Implement AudioManager + SoundLibrary (procedural)
  Files: src/audio/AudioManager.ts, src/audio/SoundLibrary.ts
  Why: Highest single-phase quality impact. Implement this before visual polish
  so audio and visuals can be tested together.
  Duration: 1–2 days

STEP 5 — Wire audio into all game events
  Files: Gun.ts, Enemy.ts, Boss.ts, Game.ts (victory/gameover transitions)
  Duration: 3 hours

STEP 6 — Implement EventBus
  File: src/core/EventBus.ts
  Refactor audio wiring to use events instead of direct calls.
  Duration: 3 hours (includes refactor)

STEP 7 — Implement spatial hash grid in CollisionDetector
  File: src/world/CollisionDetector.ts
  Why now: Architecture work is easier on a clean, tested game loop.
  Duration: 4 hours

STEP 8 — Implement material cache in Block factory
  File: src/world/Block.ts + new src/world/BlockMaterialCache.ts
  Duration: 2 hours

STEP 9 — Implement CSS design system
  Files: index.html (CSS custom properties), all ui/ files
  Add Inter font. Define all CSS variables. Remove hardcoded colors.
  Do NOT redesign layouts yet — just establish the system.
  Duration: 3 hours

STEP 10 — Redesign HUD
  File: src/ui/HUD.ts
  Apply the new design system. Redesign health bar, ammo, crosshair, boss bar.
  Duration: 4 hours

STEP 11 — Redesign Start Screen
  File: index.html (start overlay) or extract to src/ui/StartScreen.ts
  Live Three.js background + centered title card.
  Duration: 3 hours

STEP 12 — Redesign Pause Menu and all overlays
  Files: src/ui/PauseMenu.ts, src/ui/GameOverScreen.ts, src/ui/VictoryScreen.ts
  Apply design system, frosted glass, Inter, consistent button style.
  Duration: 4 hours

STEP 13 — Implement camera shake
  File: src/effects/CameraShake.ts
  Wire to boss hits, nearby explosions.
  Duration: 2 hours

STEP 14 — Implement damage vignette + low health pulse
  File: src/ui/ScreenEffects.ts (new)
  CSS-only overlay; TypeScript controls opacity transitions.
  Duration: 2 hours

STEP 15 — Implement particle system
  File: src/effects/ParticleSystem.ts
  Enemy death particles, bullet impacts.
  Duration: 1 day

STEP 16 — Implement boss spawn shockwave
  File: src/effects/BossSpawnEffect.ts or inline in Boss.ts
  3D RingGeometry expansion + camera shake + audio.
  Duration: 2 hours

STEP 17 — Implement WaveManager
  File: src/core/WaveManager.ts
  Two waves, wave interstitial screen, health pickup on wave clear.
  Duration: 1 day

STEP 18 — Decompose Game.ts update loop
  File: src/core/Game.ts
  Extract subsystem updates into named private methods.
  Duration: 2 hours

STEP 19 — Add JSDoc to public surface APIs
  Files: Game.ts, PlayerController.ts, Gun.ts, EnemyAI.ts
  Duration: 1 hour

STEP 20 — Write unit tests (Vitest)
  Files: src/world/CollisionDetector.test.ts, src/utils/ScoreManager.test.ts
  Add `npm run test` to package.json.
  Duration: 3 hours

STEP 21 — Performance audit
  Profile with DevTools. Tighten shadow frustum. Confirm 60 FPS on integrated GPU.
  Duration: 2 hours

STEP 22 — Final QA pass
  Play through the full game 3 times. Check every state transition.
  Verify audio on Chrome, Firefox, Safari.
  Duration: 2 hours

STEP 23 — Update README and add og:image + favicon
  README should reflect the final feature set and controls.
  Add a 1200×630 og:image (screenshot of the start screen at minimum).
  Duration: 1 hour

STEP 24 — Tag v1.0.0 and push to main
  git tag v1.0.0
  GitHub Actions deploys automatically.
```

**What should NOT be overbuilt:**
- `WaveManager` — two waves is enough. Do not build a full campaign system.
- The particle system — keep it to a single pooled `THREE.Points` instance. Do not add a particle editor or config system.
- The audio system — Web Audio API procedural synthesis. No asset loading, no playlist, no spatial audio (nice-to-have, not required).
- The start screen — it should look great, not be a marketing page.

**Where polish happens:**
- Steps 9–16 are exclusively polish. Do not start them until Steps 1–8 (gameplay completion and architecture) are done. Polish on top of broken foundations is waste.

**Where deployment happens:**
- Step 1: CI/CD is set up immediately so every subsequent step ships.
- Step 24: `v1.0.0` tag marks the production release.

---

## 10. Definition of Done

### Gameplay Completeness

- [ ] Player can win the game (victory screen exists and triggers correctly)
- [ ] Player sees a score at the end of every run (kill points + time + accuracy)
- [ ] High score persists across sessions
- [ ] At least two waves before boss encounter
- [ ] All game states transition correctly: start → playing → paused → resumed → game over / victory → restart
- [ ] Game can be restarted without page refresh with clean state

### Visual Polish

- [ ] UI uses Inter font at all sizes, no Arial visible anywhere
- [ ] All UI colors come from the CSS custom property system
- [ ] HUD is minimal, readable, and uses the defined design system
- [ ] Start screen shows live game world in background
- [ ] Pause menu uses frosted glass style
- [ ] Game over and victory screens show score data and have styled layout
- [ ] Crosshair is a minimal precision style (not thick default)
- [ ] Boss health bar slides in on spawn
- [ ] Damage vignette replaces white flash
- [ ] Enemy death produces particle burst
- [ ] Boss spawn produces shockwave ring + camera shake

### Engineering Quality

- [ ] `CollisionDetector` uses spatial hash grid
- [ ] `Block` factory uses shared material cache
- [ ] `EventBus` decouples audio/particles from entities
- [ ] `Game.ts` `update()` method is ≤ 50 lines with named private method calls
- [ ] Audio system is fully implemented with Web Audio API
- [ ] Unit tests exist for `CollisionDetector` (spatial hash) and `ScoreManager`
- [ ] `npm run test` passes with no failures
- [ ] `npm run build` produces zero TypeScript errors
- [ ] JSDoc on all public-facing class methods in core modules
- [ ] No `console.log` statements in production build

### Deployment Readiness

- [ ] GitHub Actions workflow deploys `dist/` to GitHub Pages on push to `main`
- [ ] Game loads correctly at the public GitHub Pages URL
- [ ] `og:image` and `description` meta tags present in `index.html`
- [ ] Favicon present
- [ ] `npm run build` output is < 600KB total (Three.js split chunk)
- [ ] HTTPS confirmed working on the public URL

### Portfolio Readiness

- [ ] Game is completable from start to victory in under 10 minutes
- [ ] A non-developer can play the game without instructions (controls visible on start screen)
- [ ] README accurately describes the final state of the game
- [ ] README contains at least one screenshot of the final UI
- [ ] Source code is on GitHub and linked from the deployed URL (via `og:url` or visible link)
- [ ] A reviewer reading the code can identify: state machine, spatial hash, event bus, Web Audio synthesis, material sharing — within 10 minutes of code browsing

---

## 11. Risks and Anti-Patterns

### Risk 1: Polishing before completing
**Specific to this repo**: The temptation to redesign the HUD before implementing the victory screen is real — UI work feels more tangible than state machine wiring. Resist it. A beautifully designed UI over a game that has no ending is a portfolio liability, not an asset. Complete the game loop first.

### Risk 2: Audio scope creep
Web Audio API is a deep rabbit hole. The risk is spending three days on a spatially-aware 3D audio system with reverb and occlusion when what the game needs is a gunshot sound that fires in under 5ms. Constrain audio to: synthesized transients for weapons/impacts, synthesized tones for UI/victory, a simple noise-based ambient loop. Nothing more.

### Risk 3: Over-designing the UI at the expense of in-game feel
The plan places significant emphasis on UI redesign, and that emphasis is correct — but the in-game feel systems (camera shake, vignette, particles) must not be skipped to spend more time on menus. The menus are seen once per session. The in-game feel is experienced every second of play. Both matter; neither should crowd out the other.

### Risk 4: Making the art direction muddy
The current color palette mixes warm beach tones, sci-fi blue/orange enemy glow, and generic gray blocks. The recommended direction is to let this contrast be a feature. The risk is adding more colors during the polish pass — a green pickup here, a purple power-up there — and losing the palette coherence. Every new color added must be justified against the system.

### Risk 5: The WaveManager becoming a full campaign
Two waves and a boss. That is the scope. `WaveManager` should be a simple data structure, not a scripting engine. The moment this becomes a level editor or a campaign authoring system, it is out of scope.

### Risk 6: Using a UI framework unnecessarily
The current DOM-based UI is completely adequate for this game. Adding React, Vue, or Svelte to replace 600 lines of typed DOM manipulation would introduce a bundler complexity, a dependency with its own upgrade cycle, and a conceptual mismatch between the imperative game loop and a reactive component model. Do not do this. The DOM approach, cleaned up with the CSS custom property system and a small DOM helper utility, is the correct architecture for this use case.

### Risk 7: Three.js version churn
Three.js has breaking API changes between minor versions. Do not upgrade from 0.160.0 during this plan. Lock the version. The performance improvements in later versions are not worth the audit cost of catching API breaks.

### Risk 8: Building mobile support
A first-person shooter requires mouse precision. Touch controls for an FPS are universally poor. Any time spent on touch controls is time taken from making the desktop experience excellent. The game is desktop-native; own that.

### Risk 9: Skipping the QA pass
The single most common failure mode for shipped games is a game-breaking state transition bug that the developer never noticed because they only tested the happy path. The definition of done requires playing through the full game three times across different outcomes (die on wave 1, die on boss, win). Do not skip this.

### Risk 10: Weak start screen as first impression
The start screen is the first thing every person who plays this game will see. The current implementation is a semi-transparent div with white text. This is a critical first impression for a portfolio piece. The live-game-world-behind-the-title-card approach (Phase 4) is the single highest-ROI UX change in the entire plan. It demonstrates that the developer thinks about experience holistically, not just about feature completion.

---

## 12. Immediate Next Actions

These are the next eight actions, in order, that provide the highest leverage starting today:

- [ ] **Create `.github/workflows/deploy.yml`** — set up CI/CD so all future work deploys automatically to GitHub Pages; enable Pages in the repository settings
- [ ] **Create `src/ui/VictoryScreen.ts`** — mirror the `GameOverScreen` pattern; wire to `Game.ts` where boss death is handled
- [ ] **Create `src/utils/ScoreManager.ts`** — kills × value, time bonus, accuracy percent; display on both end screens; persist high score to `localStorage`
- [ ] **Enable Pages + push to verify deploy works** — confirm the CI/CD pipeline is green before writing more features
- [ ] **Create `src/audio/AudioManager.ts`** — Web Audio API `AudioContext` wrapper; implement `playTone()` and `playNoise()` primitives
- [ ] **Create `src/audio/SoundLibrary.ts`** — define all named sounds (gunshot, reload, hit, death, boss-roar, victory); wire into `Gun.ts` and `Enemy.ts` first
- [ ] **Define CSS custom properties in `index.html`** — add Inter font import; define the full color system as CSS variables; replace Arial with `var(--font-primary)` in all UI files
- [ ] **Redesign the start screen** — extract to `src/ui/StartScreen.ts`; Three.js scene visible in background; centered Inter title card with outline-style start button

These eight actions span approximately 3–4 focused days of work and will produce a game that is: completable, audible, and visually credible. Every subsequent phase builds on this foundation.

---

*Plan authored for BlockBlaster — TypeScript + Three.js + Vite — targeting GitHub Pages free deployment.*
*Architecture audit conducted: April 2026.*
