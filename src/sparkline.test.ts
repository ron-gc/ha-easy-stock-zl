import { describe, it, expect } from "vitest";
import { sparklinePoints, SPARKLINE_HEIGHT, SPARKLINE_PAD, SPARKLINE_WIDTH } from "./sparkline";

const TOP = SPARKLINE_PAD;
const BOTTOM = SPARKLINE_HEIGHT - SPARKLINE_PAD;
const LEFT = SPARKLINE_PAD;
const RIGHT = SPARKLINE_WIDTH - SPARKLINE_PAD;
const MIDDLE = (TOP + BOTTOM) / 2;

/** A day of samples at `hour`-spaced local timestamps. */
function series(day: Date, prices: number[]): [string, number][] {
  return prices.map((p, i) => {
    const t = new Date(day);
    t.setHours(i, 0, 0, 0);
    return [t.toISOString(), p] as [string, number];
  });
}

const SATURDAY = new Date(2026, 7, 29, 20, 0, 0);

describe("sparklinePoints", () => {
  it("draws rounding noise as a flat line instead of stretching it to full height", () => {
    // A price alternating between 14,399.77 and 14,399.80 moves by 2 ppm;
    // autoscaling on min/max turned it into a full-height sawtooth.
    const points = sparklinePoints(
      series(SATURDAY, [14399.77, 14399.8, 14399.77, 14399.8, 14399.77]));

    const ys = points.map((p) => p.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.5);
  });

  it("centres a series that never moves", () => {
    const points = sparklinePoints(series(SATURDAY, [100, 100, 100]));

    for (const p of points) expect(p.y).toBeCloseTo(MIDDLE, 5);
  });

  it("uses the full height once the movement is real", () => {
    // 1 % across the day — well above the noise floor, so nothing is damped.
    const points = sparklinePoints(series(SATURDAY, [100, 100.5, 101]));

    const ys = points.map((p) => p.y);
    expect(Math.min(...ys)).toBeCloseTo(TOP, 5);
    expect(Math.max(...ys)).toBeCloseTo(BOTTOM, 5);
  });

  it("scales a small but genuine move proportionally, not to full height", () => {
    // 0.05 % is half the 0.1 % floor, so it should fill half the band, not all of it.
    const points = sparklinePoints(series(SATURDAY, [100, 100.05]));

    // Approximate: the floor is relative to the mid price, so "half the floor" is
    // half of 0.1 % of 100.025, not of 100 — a hundredth of a pixel out.
    const ys = points.map((p) => p.y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo((BOTTOM - TOP) / 2, 1);
  });

  it("spaces prices evenly across the full width", () => {
    const points = sparklinePoints([["2026-08-27", 100], ["2026-08-28", 101], ["2026-08-29", 102]]);

    expect(points.map((p) => p.x)).toEqual([LEFT, (LEFT + RIGHT) / 2, RIGHT]);
  });

  it("draws a single price as a flat line across the full width", () => {
    const points = sparklinePoints([["2026-10-09", 100]]);

    expect(points.map((p) => p.x)).toEqual([LEFT, RIGHT]);
    expect(points[0].y).toBeCloseTo(points[1].y, 5);
  });
});
