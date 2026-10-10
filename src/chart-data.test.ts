import { describe, it, expect } from "vitest";
import { buildChartData } from "./chart-data";

/** One price per weekday between two dates, ascending by 1 from `start`. */
function weekdays(from: string, to: string, start = 100): [string, number][] {
  const out: [string, number][] = [];
  const [y, m, d] = from.split("-").map(Number);
  let price = start;
  for (let day = new Date(y, m - 1, d); ; day.setDate(day.getDate() + 1)) {
    const s = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    if (s > to) break;
    if (day.getDay() !== 0 && day.getDay() !== 6) out.push([s, price++]);
  }
  return out;
}

const dates = (series: [string, number][]) => series.map(([d]) => d);

describe("buildChartData — dated by price date", () => {
  const history = weekdays("2026-09-01", "2026-10-09"); // Tue 1 Sep – Fri 9 Oct
  const latest = history[history.length - 1];

  it("never dates a point by today; the latest price stays under its own date", () => {
    for (const range of ["1T", "1W", "1M", "YTD", "1J"] as const) {
      const data = buildChartData({ dailyHistory: history, range, livePrice: latest[1], priceDate: latest[0] });
      expect(data[data.length - 1]).toEqual(latest);
    }
  });

  it("1T is the latest price against the one before it", () => {
    const data = buildChartData({ dailyHistory: history, range: "1T", livePrice: latest[1], priceDate: latest[0] });
    expect(data).toEqual(history.slice(-2));
  });

  it("1W counts back seven days from the latest price date, not from today", () => {
    const data = buildChartData({ dailyHistory: history, range: "1W", livePrice: latest[1], priceDate: latest[0] });
    expect(dates(data)).toEqual(["2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"]);
  });

  it("1M covers the last 30 days of prices", () => {
    const data = buildChartData({ dailyHistory: history, range: "1M", livePrice: latest[1], priceDate: latest[0] });
    expect(data[0][0]).toBe("2026-09-09");
  });

  it("YTD starts from the previous year's last price", () => {
    const dailyHistory = weekdays("2025-12-29", "2026-01-09");
    const last = dailyHistory[dailyHistory.length - 1];
    const data = buildChartData({ dailyHistory, range: "YTD", livePrice: last[1], priceDate: last[0] });
    expect(data[0][0]).toBe("2025-12-31");
  });

  it("1J limits the range to the last year of prices", () => {
    const dailyHistory = weekdays("2025-09-01", "2026-10-09");
    const last = dailyHistory[dailyHistory.length - 1];
    const data = buildChartData({ dailyHistory, range: "1J", livePrice: last[1], priceDate: last[0] });
    expect(data[0][0]).toBe("2025-10-09");
  });

  it("falls back to the last two prices when a range holds fewer", () => {
    const dailyHistory: [string, number][] = [["2026-08-01", 90], ["2026-10-09", 100]];
    const data = buildChartData({ dailyHistory, range: "1W", livePrice: 100, priceDate: "2026-10-09" });
    expect(data).toEqual(dailyHistory);
  });
});

describe("buildChartData — merging the sensor's price", () => {
  const dailyHistory: [string, number][] = [["2026-10-07", 98], ["2026-10-08", 99]];

  it("appends a newer price under its price date", () => {
    const data = buildChartData({ dailyHistory, range: "1W", livePrice: 101, priceDate: "2026-10-09" });
    expect(data[data.length - 1]).toEqual(["2026-10-09", 101]);
  });

  it("replaces a corrected price for the same date", () => {
    const data = buildChartData({ dailyHistory, range: "1W", livePrice: 99.5, priceDate: "2026-10-08" });
    expect(data).toEqual([["2026-10-07", 98], ["2026-10-08", 99.5]]);
  });

  it("ignores a price older than the history", () => {
    const data = buildChartData({ dailyHistory, range: "1W", livePrice: 50, priceDate: "2026-10-01" });
    expect(data).toEqual(dailyHistory);
  });

  it("returns the single stored price on the first day", () => {
    const data = buildChartData({ dailyHistory: [], range: "1M", livePrice: 228.27, priceDate: "2026-10-09" });
    expect(data).toEqual([["2026-10-09", 228.27]]);
  });
});
