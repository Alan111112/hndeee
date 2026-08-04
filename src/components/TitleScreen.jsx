import AssetImage from './AssetImage';
import PixelHeart from './PixelHeart';
import SceneFrame from './SceneFrame';
import { art } from '../data/art';
import '../styles/TitleScreen.css';

const HEART_COUNT = 12;
const hearts = Array.from({ length: HEART_COUNT }, (_, i) => i);

export default function TitleScreen({ onPlay }) {
  return (
    <SceneFrame>
      <div className="ts-bg" />

      {/* pure-CSS drift: positions, sizes, durations and delays all come
          from :nth-child rules in TitleScreen.css */}
      <div className="ts-hearts" aria-hidden="true">
        {hearts.map((i) => (
          <span className="ts-heart" key={i}>
            <PixelHeart />
          </span>
        ))}
      </div>

      <AssetImage
        className="ts-kitty"
        src={art('hellokitty.png')}
        label="hellokitty.png"
      />

      <div className="ts-content">
        <header className="ts-titles">
          <h1 className="ts-title">365 DAYS</h1>
          <p className="ts-subtitle">with alan</p>
        </header>

        <AssetImage
          className="ts-couple"
          src={art('couple.png')}
          alt="A pixel-art couple holding hands"
          label="couple.png"
        />

        <button type="button" className="ts-play" onClick={onPlay}>
          <PixelHeart className="ts-play__heart" />
          PLAY
          <PixelHeart className="ts-play__heart" />
        </button>
      </div>
    </SceneFrame>
  );
}
