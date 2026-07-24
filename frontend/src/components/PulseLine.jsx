// Signature element: an animated EKG heartbeat line.
// Used as a divider/motif throughout the app — ties directly to the
// "blood / life" subject matter rather than a generic decorative rule.
export default function PulseLine({ color = '#C41E3A' }) {
  return (
    <div className="pulse-line" aria-hidden="true">
      <svg viewBox="0 0 400 24" preserveAspectRatio="none">
        <path
          d="M0,12 L60,12 L75,12 L85,2 L95,22 L105,12 L120,12 L400,12
             L460,12 L475,12 L485,2 L495,22 L505,12 L520,12 L800,12"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
