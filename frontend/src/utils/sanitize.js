import DOMPurify from 'dompurify';

export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return '';

  if (typeof DOMPurify?.sanitize === 'function') {
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: [
        'a', 'b', 'blockquote', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'tbody',
        'td', 'th', 'thead', 'tr', 'ul'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel', 'width', 'height'],
      ADD_ATTR: ['target', 'rel'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  }

  // Fallback for non-browser environments (e.g. Node.js unit tests)
  let clean = dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
  
  if (clean.includes('<a ') && !clean.includes('target="_blank"')) {
    clean = clean.replace(/<a /gi, '<a target="_blank" rel="noopener noreferrer" ');
  }
  return clean;
}
