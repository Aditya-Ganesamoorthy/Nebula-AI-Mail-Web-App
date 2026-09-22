import pytest
import time
from app.core.security import generate_csrf_state, verify_csrf_state
from app.core.config import settings

def test_generate_and_verify_csrf_state():
    state = generate_csrf_state()
    assert state is not None
    assert len(state.split(".")) == 3
    # Valid state should verify successfully
    assert verify_csrf_state(state) is True

def test_tampered_csrf_state_fails():
    state = generate_csrf_state()
    parts = state.split(".")
    # Tamper with the random part
    tampered = f"tampered_{parts[0]}.{parts[1]}.{parts[2]}"
    assert verify_csrf_state(tampered) is False

def test_expired_csrf_state_fails():
    state = generate_csrf_state()
    # verify with max_age of -10 seconds
    assert verify_csrf_state(state, max_age_seconds=-10) is False

def test_invalid_format_csrf_state_fails():
    assert verify_csrf_state("invalid") is False
    assert verify_csrf_state("invalid.state") is False
    assert verify_csrf_state("") is False
