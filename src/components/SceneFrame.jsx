import '../styles/SceneFrame.css';

/**
 * The portrait 400x900 stage every scene plays inside: centered on any viewport,
 * never distorted, and a size container so scenes can lay out against the frame
 * (cqw) instead of the viewport.
 */
export default function SceneFrame({ children }) {
  return (
    <div className="scene-root">
      <div className="scene-frame">{children}</div>
    </div>
  );
}
