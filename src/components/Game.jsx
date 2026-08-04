import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AssetImage from './AssetImage';
import CalendarMontage, { CALENDAR_FRAMES } from './CalendarMontage';
import ChoiceBox from './ChoiceBox';
import DialogueBox from './DialogueBox';
import GiftOpen, { primeGift } from './GiftOpen';
import GiftReveal from './GiftReveal';
import Jumpscare, { primeJumpscare } from './Jumpscare';
import SceneFrame from './SceneFrame';
import TimeSkip from './TimeSkip';
import useOneShot from '../hooks/useOneShot';
import useSceneMusic from '../hooks/useSceneMusic';
import { setUiMuted } from '../lib/uiSound';
import { art, audio } from '../data/art';
import { normalizeLine, scenes } from '../data/scenes';
import '../styles/Game.css';

/**
 * Scene manager. Owns which scene is playing and which line it's on, so a scene
 * can mix dialogue with non-dialogue beats — a montage, a time skip, a choice —
 * each of which takes over and hands back when it's done.
 * Scenes are data: see src/data/scenes.js.
 */
export default function Game({ onFinish }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [picks, setPicks] = useState({});
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(false);
  // the "gift" on the end card: null -> scare -> reveal -> open
  const [gift, setGift] = useState(null);

  const scene = scenes[sceneIndex];

  const driving = scene.motion === 'driving';

  // A picked option replaces the choice line in place rather than being pushed
  // in after it, so her reply lands in the same chat run as the message she's
  // answering — and every later index stays where it was. Keyed by line index,
  // so a scene can hold more than one choice without the earlier pick reverting.
  const lines = useMemo(() => {
    const chosen = Object.keys(picks);
    if (!chosen.length) return scene.lines;
    return scene.lines.map((l, i) => picks[i] ?? l);
  }, [scene.lines, picks]);

  const line = normalizeLine(lines[lineIndex] ?? '');

  // A line can swap the background with bg(); it sticks until the next one, so
  // the current background is the most recent bg() at or before this line.
  const background = useMemo(() => {
    for (let i = lineIndex; i >= 0; i -= 1) {
      const swap = normalizeLine(lines[i] ?? '').bg;
      if (swap) return swap;
    }
    return scene.background;
  }, [lines, lineIndex, scene.background]);

  // song() resolves the same way, so a track can be timed to a line rather than
  // a whole scene. Nothing before the first song() plays.
  const named = useMemo(() => {
    for (let i = lineIndex; i >= 0; i -= 1) {
      const swap = normalizeLine(lines[i] ?? '').music;
      if (swap) return swap;
    }
    return scene.music;
  }, [lines, lineIndex, scene.music]);

  // A scene normally ends its music with it. `keepMusic: true` inherits
  // whatever is playing instead — how the school holds on to the song she
  // picked in the car. It has to resolve during render, not in an effect: a
  // single frame of "no track" would tear the element down and fade a fresh one
  // back in. Unchanged, the URL never changes, so the song doesn't even blink
  // at the scene break.
  const playingRef = useRef(undefined);
  const music = named ?? (scene.keepMusic ? playingRef.current : undefined);
  playingRef.current = music;

  const track = audio(music);
  useSceneMusic(track, { muted });

  // ♪ OFF silences the button clicks too. Reset on the way out so the title
  // screen isn't left mute — it has no toggle to turn it back on.
  useEffect(() => {
    setUiMuted(muted);
    return () => setUiMuted(false);
  }, [muted]);

  useOneShot(line.sfx, {
    fireKey: `${sceneIndex}-${lineIndex}`,
    sceneKey: sceneIndex,
    muted,
  });

  // The toggle is up for the whole scene if that scene has any sound at all —
  // it would be no use appearing at the moment the song it mutes starts. A
  // track already rolling counts too, or a keepMusic scene would inherit the
  // song and lose the only way to turn it off.
  const sceneNamesAudio = useMemo(
    () =>
      Boolean(audio(scene.music)) ||
      scene.lines.some((l) => {
        const { music: m, sfx: s, options } = normalizeLine(l);
        // a choice reply can carry the song too — the car's whole soundtrack is
        // behind a pick — so the toggle has to count those as sound
        return Boolean(
          audio(m) ||
            audio(s?.file) ||
            options?.some(
              (o) => audio(o.reply?.music) || audio(o.reply?.sfx?.file)
            )
        );
      }),
    [scene]
  );

  const hasAudio = sceneNamesAudio || Boolean(track);

  const nextScene = useCallback(() => {
    if (sceneIndex < scenes.length - 1) {
      setSceneIndex(sceneIndex + 1);
      setLineIndex(0);
      setPicks({});
    } else {
      setFinished(true);
    }
  }, [sceneIndex]);

  // Jump straight to a scene from the end card, so a favourite bit doesn't cost
  // a whole replay. Same reset as arriving there normally — picks cleared, back
  // to line 0 — so a scene replays exactly as it did the first time.
  const replayScene = useCallback((i) => {
    setSceneIndex(i);
    setLineIndex(0);
    setPicks({});
    setFinished(false);
  }, []);

  const nextLine = useCallback(() => {
    if (lineIndex < lines.length - 1) setLineIndex(lineIndex + 1);
    else nextScene();
  }, [lineIndex, lines.length, nextScene]);

  const pick = useCallback(
    (option) => {
      if (option.reply) {
        setPicks((prev) => ({ ...prev, [lineIndex]: option.reply }));
      } else {
        nextLine();
      }
    },
    [lineIndex, nextLine]
  );

  // A scene can cut back and forth between two backgrounds mid-conversation and
  // they're ~1MB each, so warm every one it can show — the scene's own, any
  // bg() line, and any bg() a choice reply carries — as soon as the scene
  // starts. Without this the first cut to an uncached image flashes empty.
  const sceneImages = useMemo(() => {
    const names = new Set([scene.background]);
    scene.lines.forEach((l) => {
      const { bg, options } = normalizeLine(l);
      if (bg) names.add(bg);
      options?.forEach((o) => {
        if (o.reply?.bg) names.add(o.reply.bg);
      });
    });
    // and the next scene's opening shot, so the cut into it lands on a picture
    // that's already there — a scene break is a cut like any other
    const next = scenes[sceneIndex + 1];
    if (next?.background) names.add(next.background);
    return [...names];
  }, [scene, sceneIndex]);

  useEffect(() => {
    sceneImages.forEach((name) => {
      const src = art(name);
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [sceneImages]);

  // The whole gift sequence sits on the card after the last scene, so warm all
  // of it as that scene starts — it has the whole scene to load, and a scare or
  // a reveal that has to fetch first lands late.
  const lastScene = sceneIndex === scenes.length - 1;
  useEffect(() => {
    if (!lastScene) return;
    primeJumpscare();
    primeGift();
  }, [lastScene]);

  // The calendar frames are large; warm them as soon as a scene that uses them
  // starts, so the montage doesn't stutter on its first flip.
  const hasCalendar = scene.lines.some(
    (l) => normalizeLine(l).type === 'calendar'
  );
  useEffect(() => {
    if (!hasCalendar) return;
    CALENDAR_FRAMES.forEach((file) => {
      const src = art(file);
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [hasCalendar]);

  // one beat key per line, so re-entering a beat replays it from the start
  const beatKey = `${scene.id}-${lineIndex}`;

  let content;
  if (finished) {
    content = (
      <div className="end-card">
        <p className="end-card__title">TO BE CONTINUED IN REAL LIFE</p>
        <button
          type="button"
          className="end-card__btn"
          onClick={() => setGift('scare')}
        >
          get your giftttt
        </button>

        <div className="end-card__replay">
          <p className="end-card__replay-title">this is all the sceens ppookiee</p>
          <div
            className="end-card__scenes"
            role="group"
            aria-label="Play a scene again"
          >
            {scenes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="end-card__scene"
                onClick={() => replayScene(i)}
              >
                <span className="end-card__scene-no">{i + 1}</span>
                <span className="end-card__scene-name">{s.title ?? s.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (line.type === 'calendar') {
    content = (
      <CalendarMontage
        key={beatKey}
        from={line.from}
        to={line.to}
        ms={line.ms}
        onDone={nextLine}
      />
    );
  } else if (line.type === 'clock') {
    content = (
      <TimeSkip
        key={beatKey}
        hours={line.hours}
        from={line.from}
        label={line.label}
        ms={line.ms}
        onDone={nextLine}
      />
    );
  } else if (line.type === 'choice') {
    content = (
      <>
        {/* the message she's answering stays up, inert, while she decides */}
        <DialogueBox
          lines={lines}
          index={Math.max(0, lineIndex - 1)}
          speakers={scene.speakers}
          frozen
        />
        <ChoiceBox key={beatKey} options={line.options} onPick={pick} />
      </>
    );
  } else {
    content = (
      <DialogueBox
        lines={lines}
        index={lineIndex}
        onIndexChange={setLineIndex}
        onComplete={nextScene}
        speakers={scene.speakers}
      />
    );
  }

  return (
    <SceneFrame>
      <AssetImage
        className={`scene-bg${driving ? ' scene-bg--driving' : ''}`}
        src={art(background)}
        label={background}
      />
      {driving ? <div className="drive-fx" aria-hidden="true" /> : null}

      {hasAudio ? (
        <button
          type="button"
          className="music-toggle"
          onClick={() => setMuted((m) => !m)}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute music' : 'Mute music'}
        >
          {muted ? '♪ OFF' : '♪ ON'}
        </button>
      ) : null}

      {content}

      {/* the gift, over everything: the scare, the apology, then the real one */}
      {gift === 'scare' ? <Jumpscare onDone={() => setGift('reveal')} /> : null}
      {gift === 'reveal' ? (
        <GiftReveal onOpen={() => setGift('open')} />
      ) : null}
      {gift === 'open' ? <GiftOpen onDone={onFinish} /> : null}
    </SceneFrame>
  );
}
