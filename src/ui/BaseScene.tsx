import { persona } from "../persona.config";

/** Sam's floating workshop — the visual heart of the base. */
export function BaseScene({ badgeCount }: { badgeCount: number }) {
  return (
    <div className="base-scene">
      <svg viewBox="0 0 800 380" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id="sky" cx="50%" cy="0%" r="120%">
            <stop offset="0%" stopColor="#1b3a78" />
            <stop offset="55%" stopColor="#0b1b3a" />
            <stop offset="100%" stopColor="#060f24" />
          </radialGradient>
          <linearGradient id="dome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b5694" />
            <stop offset="100%" stopColor="#22356b" />
          </linearGradient>
          <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a3f70" />
            <stop offset="100%" stopColor="#121f42" />
          </linearGradient>
          <radialGradient id="winGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffd9a0" />
            <stop offset="100%" stopColor="#b87324" />
          </radialGradient>
        </defs>

        <rect width="800" height="380" rx="18" fill="url(#sky)" />
        {/* stars */}
        {[
          [60, 50, 2], [140, 90, 1.5], [230, 40, 2.5], [330, 70, 1.5], [430, 35, 2],
          [540, 80, 1.5], [640, 45, 2.5], [730, 95, 1.5], [90, 150, 1.5], [710, 170, 2],
          [760, 60, 1.5], [40, 110, 1.5], [380, 110, 1.5], [500, 130, 2],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#eaf0ff" opacity={0.7} className="tw" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
        {/* distant planet + moon */}
        <circle cx="700" cy="80" r="34" fill="#7c5cff" opacity="0.55" />
        <ellipse cx="700" cy="80" rx="52" ry="10" fill="none" stroke="#22d3ee" strokeWidth="2.5" opacity="0.5" transform="rotate(-18 700 80)" />
        <circle cx="92" cy="64" r="16" fill="#ffd9a0" opacity="0.8" />
        <circle cx="86" cy="58" r="5" fill="#e8b97e" opacity="0.8" />

        {/* floating rock island */}
        <path d="M150 290 Q180 250 260 252 L560 252 Q660 248 660 292 Q640 350 540 356 L260 356 Q170 348 150 290 Z" fill="url(#rock)" />
        <path d="M250 356 L235 378 M420 358 L415 380 M560 352 L575 374" stroke="#121f42" strokeWidth="9" strokeLinecap="round" opacity="0.8" />

        {/* workshop dome */}
        <path d="M250 252 A150 118 0 0 1 550 252 Z" fill="url(#dome)" stroke="#24407a" strokeWidth="3" />
        {/* warm windows */}
        <circle cx="335" cy="195" r="22" fill="url(#winGlow)" stroke="#0b1b3a" strokeWidth="4" />
        <circle cx="465" cy="195" r="22" fill="url(#winGlow)" stroke="#0b1b3a" strokeWidth="4" />
        {/* door */}
        <rect x="372" y="196" width="56" height="58" rx="14" fill="#0b1b3a" stroke="#ffb454" strokeWidth="3" />
        <circle cx="414" cy="226" r="4" fill="#ffb454" />
        {/* antenna with cyan beacon */}
        <line x1="400" y1="134" x2="400" y2="88" stroke="#24407a" strokeWidth="5" />
        <circle cx="400" cy="82" r="7" fill="#22d3ee" className="beacon" />
        {/* name sign */}
        <rect x="312" y="142" width="176" height="32" rx="10" fill="#0b1b3a" stroke="#ffb454" strokeWidth="2.5" />
        <text x="400" y="164" textAnchor="middle" fontSize="19" fontWeight="900" fill="#ffb454" style={{ letterSpacing: 2 }}>
          {persona.name.toUpperCase()}'S BASE
        </text>

        {/* trophy flags grow with badges */}
        {Array.from({ length: Math.min(badgeCount, 5) }).map((_, i) => (
          <g key={i} transform={`translate(${585 + i * 22} 252)`}>
            <line x1="0" y1="0" x2="0" y2="-34" stroke="#9fb0d8" strokeWidth="3" />
            <path d="M0 -34 L20 -27 L0 -20 Z" fill="#22d3ee" />
          </g>
        ))}
      </svg>
    </div>
  );
}
