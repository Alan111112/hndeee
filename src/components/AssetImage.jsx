import { useState } from 'react';
import '../styles/AssetImage.css';

/**
 * An <img> that degrades to a clearly-labeled placeholder box at the same size
 * and position when the file isn't in src/assets yet (or fails to decode), so
 * scenes can be built and played before the art exists.
 */
export default function AssetImage({
  src,
  alt = '',
  className = '',
  label,
  hint = 'goes here',
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`${className} asset-slot`} role="img" aria-label={label}>
        <span className="asset-slot__label">{label}</span>
        {hint ? <span className="asset-slot__hint">{hint}</span> : null}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      draggable="false"
    />
  );
}
