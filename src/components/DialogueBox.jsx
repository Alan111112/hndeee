import { useCallback, useMemo } from 'react';
import useTypewriter from '../hooks/useTypewriter';
import { normalizeLine } from '../data/scenes';
import '../styles/DialogueBox.css';

const MAX_BUBBLES = 5; // older bubbles scroll off the top of the box

const DEFAULT_SPEAKERS = { me: 'Me', them: 'Them' };

/** message lines form chat bubbles; anything else breaks the run */
const isMessage = (type) => type === 'me' || type === 'them';

/**
 * The dialogue box every scene shares.
 *
 * Tap the box: reveals the rest of the current line if it's still typing,
 * otherwise moves to the next one. After the last line it calls onComplete.
 * The line index is owned by the caller so scenes can interleave non-dialogue
 * beats (montages, sprite changes) between lines.
 *
 * Lines are narration or me/her text messages; a run of consecutive messages
 * renders as a stack of chat bubbles so texting reads as a conversation.
 */
export default function DialogueBox({
  lines,
  index,
  onIndexChange,
  onComplete,
  speakers = DEFAULT_SPEAKERS,
  frozen = false,
}) {
  const items = useMemo(() => lines.map(normalizeLine), [lines]);

  const line = items[index] ?? { type: 'narration', text: '' };
  const full = line.text ?? '';

  // frozen = shown as-is behind a choice, already said
  const { revealed, typing, complete } = useTypewriter(full, {
    enabled: !frozen,
    restartKey: index,
  });

  const advance = useCallback(() => {
    if (typing) {
      complete();
      return;
    }
    if (index < items.length - 1) onIndexChange?.(index + 1);
    else onComplete?.();
  }, [typing, complete, index, items.length, onIndexChange, onComplete]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      advance();
    }
  };

  // the run of consecutive message lines ending at the current one
  const bubbles = useMemo(() => {
    if (!isMessage(line.type)) return [];
    const run = [];
    for (let i = index; i >= 0 && isMessage(items[i]?.type); i -= 1) {
      run.unshift({ ...items[i], i });
    }
    return run.slice(-MAX_BUBBLES);
  }, [items, index, line.type]);

  const isChat = bubbles.length > 0;

  return (
    <div
      className={`dlg${frozen ? ' dlg--frozen' : ''}`}
      role={frozen ? undefined : 'button'}
      tabIndex={frozen ? undefined : 0}
      aria-label={frozen ? undefined : 'Dialogue. Tap to continue.'}
      onClick={frozen ? undefined : advance}
      onKeyDown={frozen ? undefined : onKeyDown}
      style={frozen ? { cursor: 'default' } : undefined}
    >
      <div className={`dlg__body dlg__body--${isChat ? 'chat' : 'narration'}`}>
        {isChat ? (
          bubbles.map((b) => (
            <div key={b.i} className={`bubble bubble--${b.type}`}>
              <span className="bubble__who">{speakers[b.type] ?? b.type}</span>
              <span className="bubble__text">
                <Typed
                  full={b.text}
                  chars={b.i === index ? revealed : b.text.length}
                />
              </span>
            </div>
          ))
        ) : (
          <p className="dlg__narration">
            <Typed full={full} chars={revealed} />
          </p>
        )}
      </div>

      {!typing && !frozen && <span className="dlg__next" aria-hidden="true" />}
    </div>
  );
}

/**
 * Reserves the full text's box up front and paints the revealed slice over it,
 * so a line that wraps mid-reveal never reflows the box. The ghost carries a
 * caret too, so the real one can never overflow the reserved box.
 */
function Typed({ full, chars }) {
  return (
    <span className="typed">
      <span className="typed__ghost" aria-hidden="true">
        {full}
        <i className="typed__caret" />
      </span>
      <span className="typed__shown">
        {full.slice(0, chars)}
        <i className="typed__caret" />
      </span>
    </span>
  );
}
