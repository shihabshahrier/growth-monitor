const UNIT_TO_MS = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses duration strings like "15m", "7d", or numeric milliseconds.
 * Returns a fallback value if parsing fails.
 */
export const parseDurationToMs = (value, fallbackMs) => {
  if (!value) {
    return fallbackMs;
  }

  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (/^\\d+$/.test(value)) {
    return Number(value);
  }

  const match = /^([\\d.]+)(ms|s|m|h|d)$/i.exec(value);
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const unitMs = UNIT_TO_MS[unit];
  if (!unitMs) {
    return fallbackMs;
  }

  return amount * unitMs;
};
