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

/** 吉 — omamori charm. */
function Omamori() {
  return (
    <>
      <path d="M52 30 C44 10 76 10 68 30" fill="none" {...S} />
      <path d="M36 42 Q36 30 48 30 H72 Q84 30 84 42 V100 Q84 108 76 108 H44 Q36 108 36 100 Z" fill="#e9525c" {...S} />
      <path d="M36 44 Q60 52 84 44" fill="none" {...S} strokeWidth={3} />
      <rect x="47" y="54" width="26" height="44" rx="3" fill="#fff" {...S} strokeWidth={3} />
      <text x="60" y="84" textAnchor="middle" fontSize="20" fontWeight="800" fill={INK} fontFamily="Shippori Mincho B1, serif">守</text>
      <Spark x={100} y={26} r={8} fill="#f5cb32" />
    </>
  );
}

/** 小吉 — plum blossoms on a branch. */
function Ume() {
  const flower = (cx: number, cy: number, r: number) => {
    const petals = Array.from({ length: 5 }, (_, k) => {
      const a = ((-90 + 72 * k) * Math.PI) / 180;
      return <circle key={k} cx={cx + Math.cos(a) * r * 1.15} cy={cy + Math.sin(a) * r * 1.15} r={r} fill="#fff" {...S} strokeWidth={3} />;
    });
    return (
      <g>
        {petals}
        <circle cx={cx} cy={cy} r={r * 0.6} fill="#f5cb32" stroke={INK} strokeWidth={2.5} />
      </g>
    );
  };
  return (
    <>
      <path d="M8 108 Q34 92 50 66 Q62 48 92 34" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      {flower(56, 62, 13)}
      {flower(94, 30, 9)}
      <circle cx="24" cy="98" r="6" fill="#de1f78" stroke={INK} strokeWidth={2.5} />
    </>
  );
}

/** 末吉 — a seedling: luck that grows later. */
function Sprout() {
  return (
    <>
      <path d="M60 72 V44" {...S} strokeWidth={4} />
      <path d="M60 52 C44 52 32 42 32 28 C48 28 58 38 60 52 Z" fill="#0bbf5c" {...S} strokeWidth={3} />
      <path d="M60 46 C76 46 88 34 88 20 C72 20 62 30 60 46 Z" fill="#0bbf5c" {...S} strokeWidth={3} />
      <path d="M40 80 H80 L74 108 H46 Z" fill="#f08a1c" {...S} />
      <rect x="34" y="70" width="52" height="13" rx="3" fill="#f08a1c" {...S} />
      <Spark x={98} y={60} r={8} fill="#f5cb32" />
      <Spark x={20} y={64} r={6} fill="#fff" />
    </>
  );
}

const ART: Record<string, { el: () => React.ReactElement; label: string }> = {
  大大吉: { el: Fuji, label: "富士山と朝日" },
  大吉: { el: Daruma, label: "だるま" },
  中吉: { el: Koban, label: "小判" },
  吉: { el: Omamori, label: "お守り" },
  小吉: { el: Ume, label: "梅の花" },
  末吉: { el: Sprout, label: "芽ばえ" },
};

export function FortuneArt({ fortune, className }: { fortune: string; className?: string }) {
  const art = ART[fortune] ?? ART["吉"];
  const El = art.el;
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label={art.label}>
      <El />
    </svg>
  );
}
