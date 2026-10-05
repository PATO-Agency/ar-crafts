export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function branchProgress(top: number, height: number, viewport: number) {
  // Start at the lower edge and finish while the branch is still on screen.
  // Current position makes the same stroke/leaf choreography reversible.
  return clamp((viewport * 0.95 - top) / Math.max(1, height + viewport * 0.83));
}
export function sceneState(top: number, travel: number, count: number) {
  return Math.min(
    count - 1,
    Math.floor(clamp(-top / Math.max(1, travel)) * count),
  );
}
