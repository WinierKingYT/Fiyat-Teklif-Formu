const ENTITY_MAP: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

export function escapeHtml(str: unknown): unknown {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'/]/g, (ch: string) => ENTITY_MAP[ch]);
}

export function sanitizeHtml(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=[^>]*>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '')
    .replace(/javascript\s*:/gi, '');
}

export function sanitizeUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const cleaned = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|data:image\/)/i.test(cleaned)) return cleaned;
  if (cleaned.startsWith('/') || cleaned.startsWith('#')) return cleaned;
  if (/^[a-zA-Z0-9_\-./:]+$/.test(cleaned)) return cleaned;
  return '';
}

export function sanitizeObject<T>(obj: T): T {
  if (typeof obj === 'string') return sanitizeHtml(escapeHtml(obj)) as T;
  if (Array.isArray(obj)) return obj.map(sanitizeObject) as T;
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result as T;
  }
  return obj;
}

export function sanitizeDisplay(str: unknown): unknown {
  if (typeof str !== 'string') return str;
  return escapeHtml(sanitizeHtml(str));
}

export function sanitizeInput(str: unknown): unknown {
  if (typeof str !== 'string') return str;
  return escapeHtml(sanitizeHtml(str));
}