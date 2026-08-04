import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export const CHAR_MS = 24; // between characters
export const WORD_PAUSE_MS = 55; // small breath after the last character of a word

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveals `text` one character at a time, resting a little longer on the last
 * letter of each word. Driven off the frame clock rather than chained timers,
 * so the cadence stays even and can't drift or bunch up under load.
 *
 * Returns how many characters are showing, whether it's still going, and a
 * complete() to jump to the end.
 */
export default function useTypewriter(text = '', { enabled = true, restartKey } = {}) {
  const [revealed, setRevealed] = useState(0);
  const raf = useRef(null);

  const stop = useCallback(() => {
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  }, []);

  // the time each character is due, worked out once
  const schedule = useMemo(() => {
    const due = new Array(text.length);
    let t = 0;
    for (let i = 0; i < text.length; i += 1) {
      t += CHAR_MS;
      due[i] = t;
      const finishedWord = /\s/.test(text[i + 1] ?? '') && !/\s/.test(text[i]);
      if (finishedWord) t += WORD_PAUSE_MS;
    }
    return due;
  }, [text]);

  useEffect(() => {
    stop();
    if (!text) {
      setRevealed(0);
      return undefined;
    }
    if (!enabled || reducedMotion()) {
      setRevealed(text.length);
      return undefined;
    }
    setRevealed(0);

    const start = performance.now();
    let n = 0;
    const tick = (now) => {
      const elapsed = now - start;
      while (n < schedule.length && schedule[n] <= elapsed) n += 1;
      setRevealed(n);
      raf.current = n < text.length ? requestAnimationFrame(tick) : null;
    };
    raf.current = requestAnimationFrame(tick);

    return stop;
  }, [text, schedule, enabled, restartKey, stop]);

  const complete = useCallback(() => {
    stop();
    setRevealed(text.length);
  }, [stop, text.length]);

  return { revealed, typing: revealed < text.length, complete };
}
