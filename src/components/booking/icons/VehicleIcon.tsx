import type { VehicleId } from "@/site.config";

/** Line-art side silhouettes, one consistent 1.5px stroke. viewBox 64×30, ground at y=22. */
const arches = (r: number, a: number, b: number) =>
  `L${b + r + 1} 22 A${r + 1} ${r + 1} 0 0 0 ${b - r - 1} 22 L${a + r + 1} 22 A${r + 1} ${r + 1} 0 0 0 ${a - r - 1} 22 Z`;

const SHAPES: Record<VehicleId, { body: string; glass: string[]; wheels: [number, number]; r: number; extra?: string }> = {
  coupe: {
    body: "M5 22 L5 19.2 Q5.6 16.4 11 15.8 L20 14.6 Q26 9.2 34 9.2 Q42 9.2 47.2 14 L56 15.6 Q60 16.6 60 19.2 L60 22 " + arches(4, 16, 48),
    glass: ["M22.5 14.4 Q27.3 10.8 32.6 10.7 L32.6 14.4 Z", "M34.8 10.8 Q40.8 11 44.4 14.2 L34.8 14.4 Z"],
    wheels: [16, 48],
    r: 4,
  },
  sedan: {
    body: "M4 22 L4 18.6 Q4.6 16.4 9 16 L18 15 L24 9.6 Q25.8 8.6 30 8.6 L40 8.6 Q43 8.6 45 10.2 L50.2 15 L57 15.6 Q60 16.2 60 18.6 L60 22 " + arches(4, 16, 48),
    glass: ["M20.6 15 L25.8 10.4 L31 10.4 L31 15 Z", "M33 10.4 L40 10.4 Q42 10.4 43.4 11.6 L47 15 L33 15 Z"],
    wheels: [16, 48],
    r: 4,
  },
  suv: {
    body: "M4 22 L4 16.2 Q4 14 7 13.6 L14 12.6 L19 6.8 Q20 5.8 22 5.8 L55 5.8 Q58 5.8 58.6 8.2 L60 14 L60 22 " + arches(4.6, 16, 48),
    glass: ["M17.4 12.6 L21.4 7.8 L31 7.8 L31 12.6 Z", "M33 7.8 L44 7.8 L44 12.6 L33 12.6 Z", "M46 7.8 L55 7.8 L56.4 12.6 L46 12.6 Z"],
    wheels: [16, 48],
    r: 4.6,
  },
  truck: {
    body: "M3 22 L3 15.6 Q3 13.6 6 13.2 L14 12.2 L18 6.4 Q19 5.4 21 5.4 L32 5.4 Q34 5.4 34 7.4 L34 13 L61 13 L61 22 " + arches(4.6, 14, 49),
    glass: ["M16.4 12.2 L20 7.4 L26.4 7.4 L26.4 12.2 Z", "M28.4 7.4 L32 7.4 L32 12.2 L28.4 12.2 Z"],
    wheels: [14, 49],
    r: 4.6,
    extra: "M34 16 L61 16",
  },
};

export function VehicleIcon({ type, className = "" }: { type: VehicleId; className?: string }) {
  const s = SHAPES[type];
  return (
    <svg viewBox="0 0 64 30" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d={s.body} />
      {s.glass.map((g) => (
        <path key={g} d={g} strokeWidth="1.2" opacity=".75" />
      ))}
      {s.extra && <path d={s.extra} strokeWidth="1.2" opacity=".6" />}
      {s.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy={22} r={s.r} />
          <circle cx={x} cy={22} r={s.r * 0.38} strokeWidth="1.2" opacity=".7" />
        </g>
      ))}
      <path d="M2 26.5 L62 26.5" strokeWidth="1" opacity=".22" />
    </svg>
  );
}
