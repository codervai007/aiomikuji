/** Four-point sparkle, as used around the hero card. */
export function Sparkle({ className, color }: { className: string; color: string }) {
  return (
    <svg className={`sp ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1C13 8.5 15.5 11 23 12C15.5 13 13 15.5 12 23C11 15.5 8.5 13 1 12C8.5 11 11 8.5 12 1Z" fill={color} stroke="#111827" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** Flat ink-outlined omikuji tube (おみくじ筒) with a numbered stick poking out. */
export function OmikujiTube() {
  return (
    <svg className="tube" viewBox="0 0 240 300" role="img" aria-label="おみくじ筒">
      <ellipse cx="128" cy="282" rx="78" ry="12" fill="#e7dcc8" />
      <g transform="rotate(-12 120 160)" stroke="#111827" strokeWidth="4" strokeLinejoin="round">
        <rect x="111" y="14" width="18" height="78" rx="4" fill="#fff" />
        <text x="120" y="38" fill="#111827" stroke="none" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="Shippori Mincho B1, serif">三</text>
        <text x="120" y="53" fill="#111827" stroke="none" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="Shippori Mincho B1, serif">十</text>
        <text x="120" y="68" fill="#111827" stroke="none" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="Shippori Mincho B1, serif">二</text>
        <path d="M62 86 V252 Q120 276 178 252 V86 Z" fill="#e9525c" />
        <path d="M140 92 V266 Q162 262 178 252 V86 Z" fill="#c43c46" stroke="none" />
        <path d="M62 86 V252 Q120 276 178 252 V86" fill="none" />
        <path d="M62 120 Q120 136 178 120 M62 222 Q120 238 178 222" fill="none" strokeWidth="3" />
        <ellipse cx="120" cy="86" rx="58" ry="16" fill="#fef3dc" />
        <ellipse cx="120" cy="86" rx="12" ry="4" fill="#111827" />
        <g fill="#fff" stroke="none" fontSize="27" fontWeight="800" textAnchor="middle" fontFamily="Shippori Mincho B1, serif">
          <text x="101" y="164">御</text>
          <text x="101" y="194">神</text>
          <text x="101" y="224">籤</text>
        </g>
      </g>
    </svg>
  );
}
