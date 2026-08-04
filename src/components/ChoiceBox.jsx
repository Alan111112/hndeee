import { useState } from 'react';
import useTypewriter from '../hooks/useTypewriter';
import { playUiSound } from '../lib/uiSound';
import '../styles/ChoiceBox.css';

const MAX_GROW = 1.9; // keeps the growing button inside the frame
const GROW_STEP = 0.18;
const SHRINK_STEP = 0.14;
const MIN_SHRINK = 0.2;

// Refusing meows instead of clicking, cycling through the three cats so mashing
// NO gets a different one each press.
const MEOWS = ['meaw1.mp3', 'meaw2.mp3', 'meaw3.MP3'];
const MEOW_VOLUME = 0.85;

/** the taunt that types in at the top of the screen when she refuses */
function Taunt({ text }) {
  const { revealed } = useTypewriter(text, { restartKey: text });

  return (
    <div className="taunt" role="status">
      <span className="taunt__inner">
        <span className="taunt__ghost" aria-hidden="true">
          {text}
        </span>
        <span className="taunt__shown">{text.slice(0, revealed)}</span>
      </span>
    </div>
  );
}

/**
 * Reply options for a { type: 'choice' } line. Sits above the dialogue box so
 * the message being answered stays on screen while she decides.
 *
 * An option can carry `sub` for a smaller second line — the artist under a song
 * title — which keeps a two-part label breaking where it means to instead of
 * wherever the line happens to run out.
 *
 * An option carrying `taunts` is the refusal: it never advances. Each press
 * types the next taunt up top, grows the other button and shrinks itself, and
 * once the taunts run out it stops being clickable at all.
 */
export default function ChoiceBox({ options = [], onPick }) {
  const [refusals, setRefusals] = useState(0);

  const refuseAt = options.findIndex((o) => o.taunts?.length);
  const taunts = refuseAt >= 0 ? options[refuseAt].taunts : [];
  const spent = refusals >= taunts.length;
  const taunt = refusals > 0 ? taunts[refusals - 1] : null;

  const grow = Math.min(MAX_GROW, 1 + refusals * GROW_STEP);
  const shrink = Math.max(MIN_SHRINK, 1 - refusals * SHRINK_STEP);

  const press = (opt, i) => {
    if (i === refuseAt) {
      playUiSound(MEOWS[refusals % MEOWS.length], MEOW_VOLUME);
      setRefusals((n) => Math.min(n + 1, taunts.length));
      return;
    }
    onPick(opt, i);
  };

  return (
    <>
      {taunt && <Taunt key={refusals} text={taunt} />}

      <div
        className={`choice${options.length > 3 ? ' choice--many' : ''}`}
        role="group"
        aria-label="Choose your reply"
      >
        {options.map((opt, i) => {
          const refusing = i === refuseAt;
          return (
            <button
              key={opt.label}
              type="button"
              className={`choice__btn ${
                refusing ? 'choice__btn--refuse' : 'choice__btn--main'
              }`}
              style={
                refusing
                  ? { '--shrink': shrink }
                  : { '--grow': grow, animationDelay: `${i * 90}ms` }
              }
              disabled={refusing && spent}
              // the refusal meows instead of clicking, so it opts out of the
              // app-wide button click in App.jsx
              data-ui-sound={refusing ? 'off' : undefined}
              onClick={() => press(opt, i)}
            >
              {opt.sub ? (
                <>
                  <span className="choice__label">{opt.label}</span>
                  <span className="choice__sub">{opt.sub}</span>
                </>
              ) : (
                opt.label
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
