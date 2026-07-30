const CAIRO_TIME_ZONE = 'Africa/Cairo';

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CAIRO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function partsAt(date: Date): DateParts {
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return values as DateParts;
}

function localDateKey(date: Date): number {
  const parts = partsAt(date);
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

function firstInstantOfCairoDay(year: number, month: number, day: number) {
  const targetDateKey = Date.UTC(year, month - 1, day);
  const targetUtc = targetDateKey;
  let low = targetUtc - 36 * 60 * 60 * 1000;
  let high = targetUtc + 36 * 60 * 60 * 1000;

  // Local dates are monotonic even across offset changes. Binary search also
  // handles Cairo's DST-start day, where local 00:00 does not exist.
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (localDateKey(new Date(middle)) < targetDateKey) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return new Date(low);
}

export function getCairoDayRange(reference = new Date(), dayOffset = 0) {
  const local = partsAt(reference);
  const shifted = new Date(
    Date.UTC(local.year, local.month - 1, local.day + dayOffset),
  );
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth() + 1;
  const day = shifted.getUTCDate();
  const start = firstInstantOfCairoDay(year, month, day);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const nextStart = firstInstantOfCairoDay(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
  );
  return { start, end: new Date(nextStart.getTime() - 1) };
}

export function getCairoWeekRange(reference = new Date()) {
  return { start: getCairoDayRange(reference, -6).start, end: reference };
}
