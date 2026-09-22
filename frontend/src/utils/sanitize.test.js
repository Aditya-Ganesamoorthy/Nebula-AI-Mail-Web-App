import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml } from './sanitize.js';

describe('Frontend HTML Sanitizer', () => {
  it('should remove dangerous script tags', () => {
    const malicious = '<div>Hello <script>alert("xss")</script>world</div>';
    const clean = sanitizeHtml(malicious);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('alert'));
    assert.ok(clean.includes('Hello'));
    assert.ok(clean.includes('world'));
  });

  it('should strip dangerous inline event handlers', () => {
    const malicious = '<img src="x" onerror="alert(1)" /><b onmouseover="alert(2)">Test</b>';
    const clean = sanitizeHtml(malicious);
    assert.ok(!clean.includes('onerror'));
    assert.ok(!clean.includes('onmouseover'));
  });

  it('should preserve safe markup like bold, links, and paragraphs', () => {
    const safe = '<p>This is <strong>important</strong>. Visit <a href="https://example.com">link</a>.</p>';
    const clean = sanitizeHtml(safe);
    assert.ok(clean.includes('<strong>important</strong>'));
    assert.ok(clean.includes('href="https://example.com"'));
  });

  it('should add target="_blank" and rel="noopener noreferrer" to external links', () => {
    const input = '<a href="https://google.com">Google</a>';
    const clean = sanitizeHtml(input);
    assert.ok(clean.includes('target="_blank"'));
    assert.ok(clean.includes('rel="noopener noreferrer"'));
  });

  it('should handle empty or null input gracefully', () => {
    assert.equal(sanitizeHtml(''), '');
    assert.equal(sanitizeHtml(null), '');
    assert.equal(sanitizeHtml(undefined), '');
  });
});
