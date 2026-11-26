/* One flat, ink-outlined illustration per fortune, drawn on a 120×120 grid. */

const INK = "#111827";
const S = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Spark({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const d = `M${x} ${y - r}C${x + r * 0.12} ${y - r * 0.3} ${x + r * 0.3} ${y - r * 0.12} ${x + r} ${y}C${x + r * 0.3} ${y + r * 0.12} ${x + r * 0.12} ${y + r * 0.3} ${x} ${y + r}C${x - r * 0.12} ${y + r * 0.3} ${x - r * 0.3} ${y + r * 0.12} ${x - r} ${y}C${x - r * 0.3} ${y - r * 0.12} ${x - r * 0.12} ${y - r * 0.3} ${x} ${y - r}Z`;
  return <path d={d} fill={fill} stroke={INK} strokeWidth={2} strokeLinejoin="round" />;
}

/** 大大吉 — Mt. Fuji with the rising sun. */
function Fuji() {
  return (
    <>
      <circle cx="60" cy="44" r="22" fill="#e9525c" {...S} />
      <path d="M8 104 L46 50 Q60 40 74 50 L112 104 Z" fill="#1d86cf" {...S} />
      <path d="M46 50 Q60 40 74 50 L82.5 62 L72 57 L64 66 L56 57 L46 64 L37.5 62 Z" fill="#fff" {...S} strokeWidth={3} />
      <path d="M4 104 H116" {...S} />
      <Spark x={18} y={24} r={9} fill="#f5cb32" />
      <Spark x={102} y={20} r={7} fill="#fff" />
    </>
  );
}

/** 大吉 — daruma. */
function Daruma() {
  return (
    <>
      <ellipse cx="60" cy="110" rx="34" ry="5" fill="#00000022" />
      <path d="M60 16 C88 16 104 40 102 68 C100 94 84 108 60 108 C36 108 20 94 18 68 C16 40 32 16 60 16 Z" fill="#e9525c" {...S} />
      <ellipse cx="60" cy="56" rx="26" ry="22" fill="#fff" {...S} />
      <circle cx="49" cy="54" r="6" fill={INK} />
      <circle cx="71" cy="54" r="6" fill="#fff" stroke={INK} strokeWidth={2.5} />
      <path d="M40 44 Q47 38 55 43 M65 43 Q73 38 80 44" fill="none" {...S} strokeWidth={3} />
      <path d="M48 68 Q54 64 60 68 Q66 64 72 68" fill="none" {...S} strokeWidth={3} />
      <text x="60" y="98" textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff" fontFamily="Shippori Mincho B1, serif">福</text>
    </>
  );
}

/** 中吉 — gold 小判 coins. */
function Koban() {
  const coin = (cx: number, cy: number, rot: number) => (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse cx={cx} cy={cy} rx="25" ry="38" fill="#f5cb32" {...S} />
      <ellipse cx={cx} cy={cy} rx="17" ry="29" fill="none" stroke={INK} strokeWidth={2} />
      <path d={`M${cx - 9} ${cy - 12} H${cx + 9} M${cx - 11} ${cy} H${cx + 11} M${cx - 9} ${cy + 12} H${cx + 9}`} stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
  return (
    <>
      <ellipse cx="62" cy="108" rx="40" ry="5" fill="#00000022" />
      {coin(46, 64, -14)}
      {coin(76, 58, 12)}
      <Spark x={100} y={22} r={8} fill="#fff" />
      <Spark x={18} y={30} r={6} fill="#fff" />
    </>
  );
}

const ART: Record<string, { el: () => React.ReactElement; label: string }> = {
  大大吉: { el: Fuji, label: "富士山と朝日" },
  大吉: { el: Daruma, label: "だるま" },
  中吉: { el: Koban, label: "小判" },
};

/** 3D fiery icon per fortune (public/media/art/<slug>.jpg). */
const PHOTO: Record<string, string> = { 大大吉: "daidaikichi", 大吉: "daikichi", 中吉: "chukichi" };

export function FortuneArt({ fortune, className }: { fortune: string; className?: string }) {
  const art = ART[fortune] ?? ART["中吉"];
  const slug = PHOTO[fortune] ?? "chukichi";
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`${className ?? ""} artimg`} src={`/media/art/${slug}.jpg`} alt={art.label} width={280} height={280} decoding="async" />;
}

/** The original flat drawings, kept for places that need a vector (none at the moment). */
export function FortuneArtFlat({ fortune, className }: { fortune: string; className?: string }) {
  const art = ART[fortune] ?? ART["中吉"];
  const El = art.el;
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label={art.label}>
      <El />
    </svg>
  );
}
