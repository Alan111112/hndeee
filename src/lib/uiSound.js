import { audio } from '../data/art';

const CLICK = 'buttonClickSoundEffect.mp3';
const CLICK_VOLUME = 0.5; // it fires on every press, so it sits under the music

// One element per file, reused. The first press pays for the fetch; every press
// after it just rewinds an element the browser has already decoded, so the sound
// lands on the tap instead of a beat later — and pressing fast restarts the clip
// rather than stacking a new one on top of it.
const cache = new Map();

let muted = false;

/**
 * The ♪ toggle silences the interface too — a mute button that still clicks
 * isn't a mute button. Game keeps this in step with its own `muted` state.
 */
export function setUiMuted(next) {
  muted = next;
}

/**
 * Fire a short interface sound by filename. Resolves through audio(), so naming
 * a file that isn't in src/assets is silent rather than a crash — same deal as
 * art and music.
 */
export function playUiSound(name, volume = CLICK_VOLUME) {
  const src = audio(name);
  if (!src || muted) return;

  let el = cache.get(name);
  if (!el) {
    el = new Audio(src);
    cache.set(name, el);
  }

  el.volume = volume;
  el.currentTime = 0;
  // blocked until the player has interacted with the page — but the first
  // button they press is PLAY, which is itself the gesture that unblocks it
  el.play().catch(() => {});
}

/**
 * Build and cache an element ahead of time without playing it, so the first
 * play is instant. For a punchline whose whole job is timing.
 */
export function primeUiSound(name) {
  const src = audio(name);
  if (!src || cache.has(name)) return;
  const el = new Audio(src);
  el.preload = 'auto';
  cache.set(name, el);
}

/** The sound every button makes. Wired once, in App. */
export const playClick = () => playUiSound(CLICK);
