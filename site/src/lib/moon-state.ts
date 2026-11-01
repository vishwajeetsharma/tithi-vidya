/** Shared between the scroll animations (which write it) and the moon renderer (which reads it). */
export const moonState = {
  /** Sun-moon gap in degrees. */
  elongation: 40,
  /** Skip drawing while the moon is off screen. */
  hidden: false,
  /** Called once today's real moon is known. */
  onToday: null as null | ((elongation: number) => void),
};
