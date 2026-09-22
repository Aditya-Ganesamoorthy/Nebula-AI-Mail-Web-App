from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import re

class SearchService:
    @staticmethod
    def calculate_preset_dates(preset: str) -> Dict[str, Optional[str]]:
        """
        Calculate date_from and date_to (YYYY/MM/DD) based on date presets using UTC.
        """
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        preset_lower = (preset or "").lower().replace(" ", "_").replace("-", "_")

        if preset_lower == "today":
            date_from = today_start.strftime("%Y/%m/%d")
            return {"date_from": date_from, "date_to": None}

        elif preset_lower == "yesterday":
            yesterday_start = today_start - timedelta(days=1)
            date_from = yesterday_start.strftime("%Y/%m/%d")
            date_to = today_start.strftime("%Y/%m/%d")
            return {"date_from": date_from, "date_to": date_to}

        elif preset_lower in ("last_7_days", "7_days", "7d"):
            date_from = (today_start - timedelta(days=7)).strftime("%Y/%m/%d")
            return {"date_from": date_from, "date_to": None}

        elif preset_lower in ("last_10_days", "10_days", "10d"):
            date_from = (today_start - timedelta(days=10)).strftime("%Y/%m/%d")
            return {"date_from": date_from, "date_to": None}

        elif preset_lower in ("this_week", "week"):
            # Monday of current week
            start_of_week = today_start - timedelta(days=today_start.weekday())
            date_from = start_of_week.strftime("%Y/%m/%d")
            return {"date_from": date_from, "date_to": None}

        elif preset_lower in ("last_30_days", "30_days", "30d", "last_month"):
            date_from = (today_start - timedelta(days=30)).strftime("%Y/%m/%d")
            return {"date_from": date_from, "date_to": None}

        return {"date_from": None, "date_to": None}

    @staticmethod
    def escape_query_value(value: str) -> str:
        """Sanitize query string value, escaping dangerous operator syntax."""
        if not value:
            return ""
        # Remove semicolons, newlines, and raw control characters
        cleaned = re.sub(r'[\r\n;]', ' ', value).strip()
        return cleaned

    def build_gmail_query(
        self,
        sender: Optional[str] = None,
        keyword: Optional[str] = None,
        date_preset: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        unread: Optional[bool] = None,
        read: Optional[bool] = None
    ) -> str:
        """
        Construct safe Gmail search query string from structured parameters.
        """
        query_parts = []

        # Read / Unread status
        if unread is True:
            query_parts.append("is:unread")
        elif read is True:
            query_parts.append("is:read")

        # Sender
        if sender:
            clean_sender = self.escape_query_value(sender)
            if " " in clean_sender and not clean_sender.startswith('"'):
                query_parts.append(f'from:"{clean_sender}"')
            else:
                query_parts.append(f'from:{clean_sender}')

        # Keyword
        if keyword:
            clean_keyword = self.escape_query_value(keyword)
            # If multiple words and not quoted, quote them for phrase search
            if " " in clean_keyword and not (clean_keyword.startswith('"') and clean_keyword.endswith('"')):
                query_parts.append(f'"{clean_keyword}"')
            else:
                query_parts.append(clean_keyword)

        # Date preset takes precedence if date_from is not explicit
        calc_from = date_from
        calc_to = date_to

        if date_preset:
            dates = self.calculate_preset_dates(date_preset)
            calc_from = calc_from or dates["date_from"]
            calc_to = calc_to or dates["date_to"]

        if calc_from:
            query_parts.append(f"after:{calc_from}")
        if calc_to:
            query_parts.append(f"before:{calc_to}")

        return " ".join(query_parts).strip()

search_service = SearchService()
