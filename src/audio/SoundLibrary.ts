export enum SoundEffect {
  Gunshot = 'gunshot',
  ReloadClick = 'reload-click',
  EmptyClick = 'empty-click',
  EnemyHit = 'enemy-hit',
  EnemyDeath = 'enemy-death',
  BossRoar = 'boss-roar',
  VictoryJingle = 'victory-jingle',
  GameOver = 'game-over'
}

type SoundPlayer = (context: AudioContext, destination: AudioNode) => void;

function createNoiseBuffer(context: AudioContext, duration: number): AudioBuffer {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
  }

  return buffer;
}

function playEnvelope(
  context: AudioContext,
  destination: AudioNode,
  type: OscillatorType,
  frequency: number,
  duration: number,
  volume: number,
  endFrequency?: number
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(0.001, endFrequency), now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

const SOUND_BUILDERS: Record<SoundEffect, SoundPlayer> = {
  [SoundEffect.Gunshot]: (context, destination) => {
    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(context, 0.08);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    gain.gain.value = 0.2;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    noise.stop(context.currentTime + 0.08);
    playEnvelope(context, destination, 'square', 120, 0.08, 0.05, 60);
  },
  [SoundEffect.ReloadClick]: (context, destination) => {
    playEnvelope(context, destination, 'triangle', 1000, 0.05, 0.04, 420);
  },
  [SoundEffect.EmptyClick]: (context, destination) => {
    playEnvelope(context, destination, 'square', 340, 0.04, 0.03, 220);
  },
  [SoundEffect.EnemyHit]: (context, destination) => {
    playEnvelope(context, destination, 'sawtooth', 240, 0.06, 0.03, 150);
  },
  [SoundEffect.EnemyDeath]: (context, destination) => {
    playEnvelope(context, destination, 'triangle', 220, 0.22, 0.05, 70);
  },
  [SoundEffect.BossRoar]: (context, destination) => {
    playEnvelope(context, destination, 'sawtooth', 70, 0.7, 0.08, 38);
    playEnvelope(context, destination, 'triangle', 110, 0.5, 0.04, 55);
  },
  [SoundEffect.VictoryJingle]: (context, destination) => {
    const now = context.currentTime;
    [440, 554, 659].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.06, now + index * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.18);
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.2);
    });
  },
  [SoundEffect.GameOver]: (context, destination) => {
    playEnvelope(context, destination, 'sine', 210, 0.35, 0.06, 90);
  }
};

export function playSoundEffect(
  context: AudioContext,
  destination: AudioNode,
  sound: SoundEffect
): void {
  SOUND_BUILDERS[sound](context, destination);
}
