// src/utils/sound.js
// ─── Notification sounds using Web Audio API ──────────────────────────────────
// No external audio files needed — generates sound programmatically

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ── Generic tone player ───────────────────────────────────────────────────────
function playTone({ frequency = 440, duration = 0.15, volume = 0.3, type = "sine", delay = 0 }) {
  try {
    const ctx       = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode   = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type      = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration + 0.05);
  } catch (e) {
    // Sound not supported — fail silently
  }
}

// ── NOTIFICATION — soft double chime (ding ding) ─────────────────────────────
// Play this when a new in-app notification arrives
export function playNotificationSound() {
  playTone({ frequency: 880, duration: 0.18, volume: 0.25, delay: 0 });
  playTone({ frequency: 1100, duration: 0.18, volume: 0.2, delay: 0.2 });
}

// ── ORDER STATUS — upbeat chime (new order / status update) ──────────────────
// Play this on the rider page when a new order is assigned
export function playOrderSound() {
  playTone({ frequency: 660, duration: 0.12, volume: 0.3, delay: 0 });
  playTone({ frequency: 880, duration: 0.12, volume: 0.3, delay: 0.13 });
  playTone({ frequency: 1100, duration: 0.2, volume: 0.25, delay: 0.26 });
}

// ── SUCCESS — positive ascending chime ───────────────────────────────────────
// Play this when order is delivered / payment confirmed
export function playSuccessSound() {
  playTone({ frequency: 523, duration: 0.12, volume: 0.25, delay: 0 });
  playTone({ frequency: 659, duration: 0.12, volume: 0.25, delay: 0.12 });
  playTone({ frequency: 784, duration: 0.12, volume: 0.25, delay: 0.24 });
  playTone({ frequency: 1047, duration: 0.25, volume: 0.2, delay: 0.36 });
}

// ── ERROR — low thud ──────────────────────────────────────────────────────────
export function playErrorSound() {
  playTone({ frequency: 200, duration: 0.25, volume: 0.2, type: "sawtooth", delay: 0 });
  playTone({ frequency: 150, duration: 0.25, volume: 0.15, type: "sawtooth", delay: 0.1 });
}

// ── PROMO — fun jingle ────────────────────────────────────────────────────────
// Play this when a promotional notification arrives
export function playPromoSound() {
  [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
    playTone({ frequency: [523, 659, 784, 1047][i], duration: 0.12, volume: 0.2, delay });
  });
}
