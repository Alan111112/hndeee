import { useEffect, useRef } from 'react';
import { audio } from '../data/art';

export const SFX_FADE_MS = 600;

/**
 * Plays a one-shot sound whenever `fireKey` changes to a line that carries one.
 *
 * `spec` is `{ file, ms }` from sfx() — `ms` cuts a long recording down to the
 * part that matters, holding it for that long and then fading it out. The fade
 * runs off the frame clock and is deliberately detached: advancing to the next
 * line must not cut an engine off mid-rev, so the loop keeps going against an
 * element React no longer knows about.
 *
 * A one-shot arriving while another is still ringing **holds** it rather than
 * ending it: the slap has to land clean, and the engine underneath comes back
 * from the same spot instead of restarting halfway through the ride.
 *
 * `sceneKey` bounds all of it — leaving the scene stops whatever is still
 * ringing, held sounds included, so a long clip can't follow her into the next
 * one.
 */
export default function useOneShot(
  spec,
  { fireKey, sceneKey, muted = false, volume = 0.75 } = {}
) {
  const elRef = useRef(null);
  const heldRef = useRef(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const file = spec?.file;
  const ms = spec?.ms;

  useEffect(() => {
    const src = audio(file);
    if (!src || mutedRef.current) return;

    // Park whatever is still going. Pausing keeps its position, so releasing it
    // picks the engine up mid-rev rather than starting it over.
    const playing = elRef.current;
    heldRef.current =
      playing && !playing.paused && !playing.ended ? playing : null;
    heldRef.current?.pause();

    const el = new Audio(src);
    el.volume = volume;
    elRef.current = el;
    el.play().catch(() => {});

    const release = () => {
      const held = heldRef.current;
      heldRef.current = null;
      if (!held || mutedRef.current) return;
      // it's the thing ringing now, so leaving the scene still stops it
      elRef.current = held;
      held.play().catch(() => {});
    };

    // pause() fires no 'ended', so the capped path below can't double-release
    el.addEventListener('ended', release, { once: true });

    if (!ms) return; // no cap — let the file ring out on its own

    const t0 = performance.now();
    const tick = (now) => {
      const over = now - t0 - ms;
      if (over <= 0) {
        requestAnimationFrame(tick);
        return;
      }
      const k = Math.min(1, over / SFX_FADE_MS);
      el.volume = volume * (1 - k);
      if (k < 1) requestAnimationFrame(tick);
      else {
        el.pause();
        release();
      }
    };
    requestAnimationFrame(tick);
  }, [file, ms, volume, fireKey]);

  // stop on leaving the scene, and on the way out of the game
  useEffect(
    () => () => {
      elRef.current?.pause();
      heldRef.current?.pause();
      elRef.current = null;
      heldRef.current = null;
    },
    [sceneKey]
  );

  useEffect(() => {
    if (muted) {
      elRef.current?.pause();
      heldRef.current?.pause();
    }
  }, [muted]);
}
