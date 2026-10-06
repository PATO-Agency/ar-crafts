export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function branchProgress(top: number, height: number, viewport: number) {
  // Start at the lower edge and finish while the branch is still on screen.
  // Current position makes the same stroke/leaf choreography reversible.
  return clamp((viewport * 0.95 - top) / Math.max(1, height + viewport * 0.83));
}
const SCENE_WIPES = [
  { start: 0.12, span: 0.28 },
  { start: 0.58, span: 0.28 },
] as const;

export function sceneTimeline(top: number, travel: number) {
  const progress = clamp(-top / Math.max(1, travel));
  const reveals = [
    1,
    ...SCENE_WIPES.map(({ start, span }) => clamp((progress - start) / span)),
  ];
  // Non-overlapping wipes cross visual dominance halfway through each reveal.
  // The incoming image wins ties, independently of scroll direction.
  const index = SCENE_WIPES.reduce(
    (active, { start, span }, i) =>
      progress >= start + span / 2 ? i + 1 : active,
    0,
  );
  const scales = reveals.map(
    (reveal, i) =>
      1 +
      (1 - reveal) * 0.16 +
      Math.min(1 / 3, Math.max(0, progress - i / 3)) * 0.2,
  );
  return { progress, reveals, scales, index };
}
