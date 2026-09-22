import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatEmailDate, formatFullDateTime } from './dates.js';

describe('Frontend Date Formatters', () => {
  it('should format today dates with time string', () => {
    const today = new Date().toISOString();
    const formatted = formatEmailDate(today);
    assert.ok(formatted.length > 0);
  });

  it('should format past dates with month and day', () => {
    const past = new Date('2025-01-15T12:00:00Z').toISOString();
    const formatted = formatEmailDate(past);
    assert.ok(formatted.includes('Jan') || formatted.includes('15') || formatted.includes('2025'));
  });

  it('should format full date and time properly', () => {
    const iso = '2026-03-10T14:30:00Z';
    const formatted = formatFullDateTime(iso);
    assert.ok(formatted.includes('2026'));
    assert.ok(formatted.includes('Mar'));
  });

  it('should handle null or invalid dates gracefully', () => {
    assert.equal(formatEmailDate(null), '');
    assert.equal(formatEmailDate('invalid-date'), 'invalid-date');
    assert.equal(formatFullDateTime(null), '');
  });
});
