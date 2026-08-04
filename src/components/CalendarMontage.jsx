import { useEffect, useRef, useState } from 'react';
import { art } from '../data/art';
import '../styles/CalendarMontage.css';

/** page-flip cycle, in order: flat -> lifting -> curled right over */
export const CALENDAR_FRAMES = [
  'callenderNotMoved.png',
  'callenderHalfMovedUp.png',
  'callenderMovedAlltheWay.png',
];

const FRAME_MS = 70; // how fast the pages rip past

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// fast at first, coasting into the final number so it reads as "settling"
const easeOut = (t) => 1 - (1 - t) ** 3;

/**
 * One-shot "a year went by" flourish: the pages rip while the day number climbs
 * from `from` to `to` in `ms`, then it lands flat on the final number, holds,
 * and calls onDone. Tapping skips straight to the end.
 */
export default function CalendarMontage({
  from = 1,
  to = 365,
  ms = 2100,
  hold = 650,
  onDone,
}) {
  const [n, setN] = useState(from);
  const [frame, setFrame] = useState(0);
  const [settled, setSettled] = useState(false);

  // onDone identity changes every parent render; keep the latest without
  // restarting the animation, and make sure it only ever fires once
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const fired = useRef(false);

  const finish = () => {
    if (fired.current) return;
    fired.current = true;
    doneRef.current?.();
  };

  useEffect(() => {
    if (reducedMotion()) {
      setN(to);
      setFrame(0);
      setSettled(true);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / ms);
      setN(Math.round(from + (to - from) * easeOut(t)));
      setFrame(Math.floor(elapsed / FRAME_MS) % CALENDAR_FRAMES.length);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setN(to);
        setFrame(0); // lands flat
        setSettled(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, ms]);

  // hold on the final number, then hand back to the dialogue
  useEffect(() => {
    if (!settled) return undefined;
    const t = setTimeout(finish, hold);
    return () => clearTimeout(t);
  }, [settled, hold]);

  const skip = () => {
    setN(to);
    setFrame(0);
    setSettled(true);
    finish();
  };

  const frames = CALENDAR_FRAMES.map(art);
  const hasArt = frames.every(Boolean);

  return (
    <div
      className="montage"
      role="button"
      tabIndex={0}
      aria-label="Time passing. Tap to skip."
      onClick={skip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skip();
        }
      }}
    >
      <div
        className={`montage__cal ${settled ? 'is-settled' : 'is-ripping'} ${
          hasArt ? 'has-art' : ''
        }`}
      >
        {hasArt ? (
          /* all frames stay mounted so swapping between them never reloads */
          frames.map((src, i) => (
            <img
              key={CALENDAR_FRAMES[i]}
              className={`montage__art ${i === frame ? 'is-on' : ''}`}
              src={src}
              alt=""
              draggable="false"
            />
          ))
        ) : (
          <div className="montage__face">
            <div className="montage__top">
              <span className="montage__ring" />
              <span className="montage__ring" />
            </div>
          </div>
        )}

        <span className={`montage__day ${hasArt ? 'on-art' : ''}`}>{n}</span>
      </div>
    </div>
  );
}
