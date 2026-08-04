import { useEffect, useRef, useState } from 'react';
import '../styles/TimeSkip.css';

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// spins fast, then coasts to a stop on the final time
const easeOut = (t) => 1 - (1 - t) ** 3;

/**
 * "N hours later" card: the hands sweep forward `hours` on a pixel clock face,
 * settle, hold, then hand back to the scene. Tapping skips to the end.
 * Triggered once, by a { type: 'clock' } line.
 */
export default function TimeSkip({
  hours = 3,
  from = '15:00',
  label = '3 HOURS LATER',
  ms = 2200,
  hold = 700,
  onDone,
}) {
  const [startH, startM] = from.split(':').map(Number);
  const spanMin = hours * 60;

  const [mins, setMins] = useState(0);
  const [settled, setSettled] = useState(false);

  // onDone identity changes every parent render; keep the latest without
  // restarting the sweep, and make sure it only ever fires once
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
      setMins(spanMin);
      setSettled(true);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      setMins(spanMin * easeOut(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setMins(spanMin);
        setSettled(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spanMin, ms]);

  useEffect(() => {
    if (!settled) return undefined;
    const t = setTimeout(finish, hold);
    return () => clearTimeout(t);
  }, [settled, hold]);

  const skip = () => {
    setMins(spanMin);
    setSettled(true);
    finish();
  };

  // 6 degrees per minute, 30 per hour — the hour hand creeps as the minutes run
  const nowMin = startH * 60 + startM + mins;
  const minuteAngle = (nowMin % 60) * 6;
  const hourAngle = ((nowMin / 60) % 12) * 30;

  return (
    <div
      className={`skip ${settled ? 'is-settled' : 'is-ticking'}`}
      role="button"
      tabIndex={0}
      aria-label={`${label}. Tap to skip.`}
      onClick={skip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skip();
        }
      }}
    >
      {/* crispEdges keeps the circle hard-edged, so it reads as pixel art */}
      <svg
        className="skip__clock"
        viewBox="0 0 32 32"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="var(--cream)"
          stroke="var(--plum)"
          strokeWidth="2.5"
        />
        <g fill="var(--plum)">
          <rect x="15" y="4" width="2" height="3" />
          <rect x="25" y="15" width="3" height="2" />
          <rect x="15" y="25" width="2" height="3" />
          <rect x="4" y="15" width="3" height="2" />
        </g>

        <g transform={`rotate(${hourAngle} 16 16)`}>
          <rect x="15" y="9" width="2" height="7" fill="var(--plum)" />
        </g>
        <g transform={`rotate(${minuteAngle} 16 16)`}>
          <rect x="15.25" y="5" width="1.5" height="11" fill="var(--pink)" />
        </g>

        <rect x="14.5" y="14.5" width="3" height="3" fill="var(--plum)" />
      </svg>

      <p className="skip__label">{label}</p>
    </div>
  );
}
