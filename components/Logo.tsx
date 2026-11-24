import { useId } from "react";

/** AIおみくじ mark: an omikuji tube with a glowing stick, in the fire gradient. */
export function LogoMark({ size = 40 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logomark">
      <defs>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd76a" />
          <stop offset=".4" stopColor="#ff9f43" />
          <stop offset=".7" stopColor="#ff5e62" />
          <stop offset="1" stopColor="#c56cf0" />
        </linearGradient>
      </defs>
      <rect x="27.5" y="5" width="9" height="27" rx="2.5" fill={`url(#lg${id})`} />
      <path d="M50 4.5c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5 3.6-.5 5-1.9 5.5-5.5Z" fill="#ffd76a" />
      <path d="M14 28 V54 Q32 62 50 54 V28" fill="none" stroke={`url(#lg${id})`} strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="32" cy="28" rx="18" ry="6" fill="none" stroke={`url(#lg${id})`} strokeWidth="4" />
      <text x="32" y="50" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="D-DIN, sans-serif" fill={`url(#lg${id})`} letterSpacing="1">
        AI
      </text>
    </svg>
  );
}

/** Mark + wordmark. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="brand">
      <LogoMark size={size} />
      <span className="brandword">
        <b>AI</b>おみくじ
      </span>
    </span>
  );
}

/** The artwork logo (glowing omikuji box + AIおみくじ). Black background blends away on dark screens. */
export function LogoImage({ height = 56, className = "" }: { height?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/media/logo.png" alt="AIおみくじ" height={height} style={{ height, width: "auto" }} className={`logoimg ${className}`} />;
}
