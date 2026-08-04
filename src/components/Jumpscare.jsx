import { useEffect, useRef } from 'react';
import AssetImage from './AssetImage';
import { art } from '../data/art';
import { playUiSound, primeUiSound } from '../lib/uiSound';
import '../styles/Jumpscare.css';

export const JUMPSCARE_IMAGE = 'jumpscare.webp';

const SOUND = 'jumpscaresoundeffect.MP3';
const HOLD_MS = 2600; // the clip is ~3s, so the tail rings out over the title

/**
 * Warm both halves of it before she can press the button — a scare that has to
 * fetch a 1MB picture and decode an mp3 first isn't a scare. Called by Game as
 * the last scene starts.
 */
export function primeJumpscare() {
  const src = art(JUMPSCARE_IMAGE);
  if (src) {
    const img = new Image();
    img.src = src;
  }
  primeUiSound(SOUND);
}

/**
 * The "gift". Takes over the whole frame, shakes like an earthquake, screams,
 * then hands back.
 *
 * Same contract as the story beats: the timer runs off the frame clock rather
 * than a setTimeout, and `onDone` fires exactly once however the parent
 * re-renders.
 */
export default function Jumpscare({ onDone }) {
  const firedRef = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    // full volume — it's the punchline. Still routed through playUiSound, so
    // ♪ OFF silences it like everything else.
    playUiSound(SOUND, 1);

    const t0 = performance.now();
    let raf = requestAnimationFrame(function tick(now) {
      if (now - t0 < HOLD_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (firedRef.current) return;
      firedRef.current = true;
      doneRef.current?.();
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="jumpscare">
      <AssetImage
        className="jumpscare__img"
        src={art(JUMPSCARE_IMAGE)}
        label={JUMPSCARE_IMAGE}
        alt=""
      />
    </div>
  );
}
