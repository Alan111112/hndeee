import { useEffect, useRef } from 'react';

export const FADE_MS = 900;

/**
 * Plays a scene's track for as long as that scene is on screen: it fades up
 * when the scene starts and fades back down when the story moves on, so music
 * never cuts off mid-bar.
 *
 * `src` is a resolved URL (see audio() in data/art.js) or undefined — a scene
 * whose track hasn't been dropped into src/assets yet just plays nothing.
 *
 * Browsers refuse to start audio before the player has interacted with the
 * page. Reaching a scene means they pressed PLAY, so it normally starts fine;
 * if it's still blocked, the next tap anywhere starts it.
 */
export default function useSceneMusic(src, { muted = false, volume = 0.55 } = {}) {
  const elRef = useRef(null);
  // read inside the effect so changing either doesn't restart the track
  const targetRef = useRef(volume);
  targetRef.current = volume;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    if (!src) return undefined;

    const el = new Audio(src);
    el.loop = true;
    el.volume = 0;
    // a track that starts while already muted has to come in muted, or muting
    // early and then reaching the song would be ignored
    el.muted = mutedRef.current;
    elRef.current = el;

    let raf = null;
    let stopRetry = null;

    // fade up off the frame clock, like every other timed thing in here
    const t0 = performance.now();
    const fadeIn = (now) => {
      const k = Math.min(1, (now - t0) / FADE_MS);
      el.volume = k * targetRef.current;
      raf = k < 1 ? requestAnimationFrame(fadeIn) : null;
    };
    raf = requestAnimationFrame(fadeIn);

    const played = el.play();
    if (played?.catch) {
      played.catch(() => {
        const retry = () => {
          el.play().catch(() => {});
        };
        window.addEventListener('pointerdown', retry, { once: true });
        stopRetry = () => window.removeEventListener('pointerdown', retry);
      });
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      stopRetry?.();
      elRef.current = null;

      // Fade out on the way past. This outlives the effect on purpose — the
      // element is already detached from React, so the loop just walks its
      // volume down and stops it.
      const from = el.volume;
      const out0 = performance.now();
      const fadeOut = (now) => {
        const k = Math.min(1, (now - out0) / FADE_MS);
        el.volume = from * (1 - k);
        if (k < 1) requestAnimationFrame(fadeOut);
        else {
          el.pause();
          el.removeAttribute('src');
        }
      };
      requestAnimationFrame(fadeOut);
    };
  }, [src]);

  // muting keeps the track rolling underneath, so unmuting drops back in where
  // the song actually is rather than restarting it
  useEffect(() => {
    if (elRef.current) elRef.current.muted = muted;
  }, [muted]);
}
