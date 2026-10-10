export const SPARKLINE_WIDTH = 200;
export const SPARKLINE_HEIGHT = 48;
export const SPARKLINE_PAD = 2;

/**
 * Smallest price span the y-axis is ever scaled to, relative to the mid price.
 *
 * Plain min/max autoscaling gives every series the full chart height, however
 * little it actually moved: a price that wobbles by a rounding digit, 2 ppm,
 * was being drawn as a violent sawtooth.
 * Anything below this floor is damped in proportion, so noise reads as flat and
 * a genuinely quiet day reads as quiet.
 */
export const MIN_RELATIVE_SPAN = 0.001; // 0.1 %

export interface SparklinePoint {
  x: number;
  y: number;
}

/**
 * Chart coordinates for a price series, one evenly spaced step per price.
 * A single price is drawn as a flat line across the full width.
 */
export function sparklinePoints(history: [string, number][]): SparklinePoint[] {
  if (history.length === 1) history = [history[0], history[0]];
  const prices = history.map(([, p]) => p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const mid = (min + max) / 2;
  const span = Math.max(max - min, Math.abs(mid) * MIN_RELATIVE_SPAN) || 1;
  // Centre the data in the band, so a series that never moves sits mid-height
  // rather than being pinned to the bottom edge.
  const low = mid - span / 2;

  const innerW = SPARKLINE_WIDTH - SPARKLINE_PAD * 2;
  const innerH = SPARKLINE_HEIGHT - SPARKLINE_PAD * 2;

  return history.map(([, p], i) => {
    const xFrac = i / (history.length - 1);
    return {
      x: SPARKLINE_PAD + xFrac * innerW,
      y: SPARKLINE_PAD + (1 - (p - low) / span) * innerH,
    };
  });
}
