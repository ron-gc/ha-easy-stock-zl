// ---------------------------------------------------------------------------
// Price formatting (pure, no DOM — unit-testable)
// ---------------------------------------------------------------------------

/** Zwitserleven publishes every fund price in euro. */
export const CURRENCY = "EUR";

/** Prices are kept to 4 decimals; shown with at least 2. */
export const PRICE_DECIMALS = 4;

/** Format a euro price in the user's locale, e.g. "€ 225,87". */
export function formatPrice(price: number, locale?: string): string {
  if (isNaN(price)) return "–";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: PRICE_DECIMALS,
  }).format(price);
}

/** Local Date for a "YYYY-MM-DD" day, or null if it doesn't parse. */
function parseDay(day: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  // Built from parts, not new Date(day): that reads the string as UTC midnight,
  // which is the previous day anywhere west of Greenwich.
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Short label for the date a price was published for, e.g. "9 Oct" or
 * "9 okt"; the year is added when it is not the current one. Empty when the
 * date is missing or malformed.
 */
export function formatPriceDate(day: string | undefined, locale?: string, now = new Date()): string {
  const date = day ? parseDay(day) : null;
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  }).format(date);
}

/** Full form of the same date for a tooltip, e.g. "9 October 2026". */
export function formatPriceDateLong(day: string | undefined, locale?: string): string {
  const date = day ? parseDay(day) : null;
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}
