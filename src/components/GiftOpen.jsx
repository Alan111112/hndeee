import { useEffect } from 'react';
import AssetImage from './AssetImage';
import PixelHeart from './PixelHeart';
import { art } from '../data/art';
import { playUiSound, primeUiSound } from '../lib/uiSound';
import '../styles/GiftOpen.css';

export const GIFT_IMAGE = 'gift.png';
const SOUND = 'wowSoundEffect.mp3';
const BURST = 20;

/**
 * The burst, worked out once at module load rather than per render: an even
 * spray of angles nudged off a perfect wheel, stretched 250x520 so hearts reach
 * the sides and the top of the 400x900 stage at roughly the same moment. `dx`
 * and `dy` are unitless — the CSS multiplies them by --u, so the burst scales
 * with the frame like everything else.
 */
const hearts = Array.from({ length: BURST }, (_, i) => {
  const angle = (360 / BURST) * i + (i % 2 ? 8 : -8);
  const rad = (angle * Math.PI) / 180;
  const reach = 1 + (i % 4) * 0.12;
  return {
    dx: Math.round(Math.cos(rad) * 250 * reach),
    dy: Math.round(Math.sin(rad) * 520 * reach),
    spin: (i % 2 ? 1 : -1) * (90 + (i % 3) * 60),
    scale: 0.8 + (i % 3) * 0.35,
    delay: (i % 5) * 90,
  };
});

/** warm the picture and the sound before she can press for them */
export function primeGift() {
  const src = art(GIFT_IMAGE);
  if (src) {
    const img = new Image();
    img.src = src;
  }
  primeUiSound(SOUND);
}

/** The actual gift: the picture, hearts thrown out to every side, and a wow. */
export default function GiftOpen({ onDone }) {
  useEffect(() => {
    playUiSound(SOUND, 0.9);
  }, []);

  return (
    <div className="gift-open">
      <AssetImage
        className="gift-open__img"
        src={art(GIFT_IMAGE)}
        label={GIFT_IMAGE}
        alt=""
      />

      <div className="gift-open__burst" aria-hidden="true">
        {hearts.map((h, i) => (
          <span
            key={i}
            className="gift-open__heart"
            style={{
              '--dx': h.dx,
              '--dy': h.dy,
              '--spin': `${h.spin}deg`,
              '--scale': h.scale,
              animationDelay: `${h.delay}ms`,
            }}
          >
            <PixelHeart />
          </span>
        ))}
      </div>

      <button type="button" className="gift-open__back" onClick={onDone}>
        back to title
      </button>
    </div>
  );
}
