import { useEffect, useState } from 'react';
import Game from './components/Game';
import TitleScreen from './components/TitleScreen';
import { playClick } from './lib/uiSound';

export default function App() {
  const [started, setStarted] = useState(false);

  // Every <button> in the game clicks, wired once here instead of in each
  // handler — a button added later gets the sound for free, and none can be
  // forgotten. Opt one out with data-ui-sound="off" (the NO button, which meows
  // instead). The dialogue box is a div, not a <button>, so tapping through
  // lines stays silent — a click on every line of the story would be a lot.
  useEffect(() => {
    const onClick = (e) => {
      const btn = e.target?.closest?.('button');
      if (btn && btn.dataset.uiSound !== 'off') playClick();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return started ? (
    <Game onFinish={() => setStarted(false)} />
  ) : (
    <TitleScreen onPlay={() => setStarted(true)} />
  );
}
