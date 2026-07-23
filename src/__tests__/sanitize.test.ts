import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeDisplay, sanitizeHtml, sanitizeUrl, sanitizeObject, escapeHtml } from '../utils/sanitize';

describe('sanitize', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });
    it('returns non-string values as-is', () => {
      expect(escapeHtml(123)).toBe(123);
      expect(escapeHtml(null)).toBe(null);
      expect(escapeHtml(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeHtml', () => {
    it('removes script tags', () => {
      expect(sanitizeHtml('hello <script>alert(1)</script> world')).toBe('hello  world');
    });
    it('removes event handlers', () => {
      expect(sanitizeHtml('<div onclick="alert(1)">click</div>')).toBe('click</div>');
    });
    it('removes iframe tags', () => {
      expect(sanitizeHtml('<iframe src="http://evil.com"></iframe>text')).toBe('text');
    });
    it('removes javascript: protocol', () => {
      expect(sanitizeHtml('javascript:alert(1)')).toBe('alert(1)');
    });
  });

  describe('sanitizeUrl', () => {
    it('allows https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });
    it('allows relative URLs', () => {
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
    });
    it('allows mailto: URLs', () => {
      expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    });
    it('allows data:image URLs', () => {
      expect(sanitizeUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    });
    it('returns empty string for invalid URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('strips XSS from input', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
    });
    it('returns non-strings as-is', () => {
      expect(sanitizeInput(42)).toBe(42);
    });
  });

  describe('sanitizeObject', () => {
    it('sanitizes strings in an object', () => {
      const obj = { name: '<script>alert(1)</script>', age: 25 };
      const result = sanitizeObject(obj);
      expect(result.name).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
      expect(result.age).toBe(25);
    });
    it('sanitizes nested objects', () => {
      const obj = { data: { title: '<script>xss</script>' } };
      const result = sanitizeObject(obj);
      expect(result.data.title).toBe('&lt;script&gt;xss&lt;&#x2F;script&gt;');
    });
    it('sanitizes arrays', () => {
      const arr = ['<script>alert(1)</script>', 'safe'];
      const result = sanitizeObject(arr);
      expect(result[0]).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
      expect(result[1]).toBe('safe');
    });
  });
});
