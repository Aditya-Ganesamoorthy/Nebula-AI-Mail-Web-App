import pytest
from datetime import datetime, timezone
from app.services.search_service import search_service

def test_preset_dates_today():
    dates = search_service.calculate_preset_dates("today")
    today_str = datetime.now(timezone.utc).strftime("%Y/%m/%d")
    assert dates["date_from"] == today_str
    assert dates["date_to"] is None

def test_preset_dates_last_10_days():
    dates = search_service.calculate_preset_dates("last_10_days")
    assert dates["date_from"] is not None
    assert dates["date_to"] is None

def test_preset_dates_this_week():
    dates = search_service.calculate_preset_dates("this_week")
    assert dates["date_from"] is not None

def test_build_query_unread_and_sender():
    query = search_service.build_gmail_query(
        sender="sarah@example.com",
        unread=True
    )
    assert "is:unread" in query
    assert "from:sarah@example.com" in query

def test_build_query_keyword_phrase():
    query = search_service.build_gmail_query(
        keyword="project update"
    )
    assert '"project update"' in query

def test_build_query_last_10_days_combined():
    query = search_service.build_gmail_query(
        sender="david",
        date_preset="last_10_days"
    )
    assert "from:david" in query
    assert "after:" in query

def test_build_query_unread_and_this_week():
    query = search_service.build_gmail_query(
        unread=True,
        date_preset="this_week"
    )
    assert "is:unread" in query
    assert "after:" in query

def test_escape_dangerous_characters():
    clean = search_service.escape_query_value("malicious;\r\noperator")
    assert ";" not in clean
    assert "\n" not in clean
