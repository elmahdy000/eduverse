import { getCairoDayRange } from './cairo-time';

describe('getCairoDayRange', () => {
  it('uses the 23-hour Cairo day when daylight saving time starts', () => {
    const range = getCairoDayRange(new Date('2026-04-24T12:00:00.000Z'));

    expect(range.start.toISOString()).toBe('2026-04-23T22:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-04-24T20:59:59.999Z');
  });

  it('uses the 25-hour Cairo day when daylight saving time ends', () => {
    const range = getCairoDayRange(new Date('2026-10-29T12:00:00.000Z'));

    expect(range.start.toISOString()).toBe('2026-10-28T21:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-10-29T21:59:59.999Z');
  });
});
