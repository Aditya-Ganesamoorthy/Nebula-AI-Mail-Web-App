import base64
import re
from typing import Dict, Any, List, Optional, Tuple
import bleach
from bleach.css_sanitizer import CSSSanitizer

# Allowed HTML tags for email body sanitization
ALLOWED_TAGS = [
    'a', 'abbr', 'acronym', 'b', 'blockquote', 'code', 'em', 'i', 'li', 'ol',
    'strong', 'ul', 'p', 'br', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr', 'pre'
]

# Allowed HTML attributes
ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    '*': ['style', 'class', 'align', 'valign']
}

# Allowed CSS styles
ALLOWED_STYLES = [
    'color', 'background-color', 'font-family', 'font-size', 'font-weight',
    'text-align', 'line-height', 'margin', 'padding', 'border', 'width', 'height'
]

css_sanitizer = CSSSanitizer(allowed_css_properties=ALLOWED_STYLES)

def sanitize_html(html_content: str) -> str:
    """
    Sanitize untrusted HTML email content to prevent XSS and script injection.
    Strips scripts, iframes, objects, embeds, and dangerous inline event handlers.
    """
    if not html_content:
        return ""
    
    # Strip script tags completely including contents
    cleaned = re.sub(r'<script.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'<style.*?</style>', '', cleaned, flags=re.DOTALL | re.IGNORECASE)

    sanitized = bleach.clean(
        cleaned,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        css_sanitizer=css_sanitizer,
        strip=True
    )
    return sanitized

def decode_base64url(data: str) -> str:
    """Safely decode base64url encoded Gmail data string."""
    if not data:
        return ""
    try:
        # Replace URL-safe characters and add padding
        padding = 4 - (len(data) % 4)
        if padding != 4:
            data += '=' * padding
        decoded_bytes = base64.urlsafe_b64decode(data.encode('ASCII'))
        return decoded_bytes.decode('utf-8', errors='replace')
    except Exception:
        return ""

def get_header_value(headers: List[Dict[str, str]], header_name: str, default: str = "") -> str:
    """Extract header value case-insensitively from Gmail payload headers."""
    if not headers:
        return default
    header_name_lower = header_name.lower()
    for header in headers:
        if header.get("name", "").lower() == header_name_lower:
            return header.get("value", "")
    return default

def parse_address_field(raw_address: str) -> Tuple[str, str]:
    """Parse 'Name <email@domain.com>' into (name, email)."""
    if not raw_address:
        return ("", "")
    match = re.match(r'^(.*?)\s*<([^>]+)>$', raw_address.strip())
    if match:
        name = match.group(1).strip().strip('"\'')
        email = match.group(2).strip()
        return (name or email, email)
    return (raw_address.strip(), raw_address.strip())

def extract_message_parts(payload: Dict[str, Any]) -> Tuple[str, str, List[Dict[str, Any]]]:
    """
    Recursively traverse message payload parts to extract plain text, HTML, and attachments.
    """
    plain_text_parts = []
    html_parts = []
    attachments = []

    def _walk_parts(part: Dict[str, Any]):
        mime_type = part.get("mimeType", "")
        body = part.get("body", {})
        filename = part.get("filename", "")
        data = body.get("data", "")

        # If it has a filename and attachment ID, treat as attachment
        if filename and body.get("attachmentId"):
            attachments.append({
                "filename": filename,
                "mimeType": mime_type,
                "size": body.get("size", 0),
                "attachmentId": body.get("attachmentId")
            })

        # Plain text
        if mime_type == "text/plain" and data:
            plain_text_parts.append(decode_base64url(data))

        # HTML
        elif mime_type == "text/html" and data:
            html_parts.append(decode_base64url(data))

        # Nested parts
        sub_parts = part.get("parts", [])
        for sub_part in sub_parts:
            _walk_parts(sub_part)

    _walk_parts(payload)
    return (
        "\n".join(plain_text_parts),
        "".join(html_parts),
        attachments
    )

def parse_gmail_message(msg: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse raw Gmail API message dictionary into a clean, normalized structure.
    """
    msg_id = msg.get("id", "")
    thread_id = msg.get("threadId", "")
    label_ids = msg.get("labelIds", [])
    snippet = msg.get("snippet", "")
    internal_date = msg.get("internalDate", "")

    payload = msg.get("payload", {})
    headers = payload.get("headers", [])

    subject = get_header_value(headers, "Subject", "(No Subject)")
    from_raw = get_header_value(headers, "From", "")
    to_raw = get_header_value(headers, "To", "")
    cc_raw = get_header_value(headers, "Cc", "")
    date_raw = get_header_value(headers, "Date", "")
    message_id_header = get_header_value(headers, "Message-ID", "")
    in_reply_to = get_header_value(headers, "In-Reply-To", "")
    references = get_header_value(headers, "References", "")

    from_name, from_email = parse_address_field(from_raw)
    to_name, to_email = parse_address_field(to_raw)

    plain_text, raw_html, attachments = extract_message_parts(payload)

    # Sanitize HTML
    sanitized_html = sanitize_html(raw_html) if raw_html else ""

    # Is unread
    is_unread = "UNREAD" in label_ids

    return {
        "id": msg_id,
        "thread_id": thread_id,
        "subject": subject,
        "from": {
            "raw": from_raw,
            "name": from_name or from_email,
            "email": from_email
        },
        "to": {
            "raw": to_raw,
            "name": to_name or to_email,
            "email": to_email
        },
        "cc": cc_raw,
        "date": date_raw or internal_date,
        "snippet": snippet,
        "body_plain": plain_text,
        "body_html": sanitized_html,
        "has_html": bool(sanitized_html),
        "attachments": attachments,
        "labels": label_ids,
        "is_unread": is_unread,
        "headers": {
            "message_id": message_id_header,
            "in_reply_to": in_reply_to,
            "references": references
        }
    }
