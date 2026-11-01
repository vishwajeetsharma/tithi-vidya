import { litPath } from "@/lib/moon";

/** A small moon showing a phase. The WebGL moon on the home page is the big one. */
export function MoonPhase({ elongation, size = 28, className }: { elongation: number; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="-52 -52 104 104" aria-hidden="true">
      <circle r="50" fill="#3a2fb0" />
      <path d={litPath(elongation)} fill="#f4f1ff" />
      <circle r="50" fill="none" stroke="#7a6cf0" strokeWidth="2" />
    </svg>
  );
}
