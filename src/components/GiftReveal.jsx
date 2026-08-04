import '../styles/GiftReveal.css';

/**
 * The apology after the jumpscare. Lands where the scare was, so it reads as
 * the same screen calming down rather than a new one arriving.
 */
export default function GiftReveal({ onOpen }) {
  return (
    <div className="gift-reveal">
      <p className="gift-reveal__text">just kidddinnnng 😭😭 here is the gifte</p>

      <button type="button" className="gift-reveal__btn" onClick={onOpen}>
        click meee dont bitee
      </button>
    </div>
  );
}
