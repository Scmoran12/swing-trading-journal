"""Offline Phase 0 experiments. No jobs, network, notifications or trading actions."""

import argparse
import json
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from zoneinfo import ZoneInfo


SAMPLES = Path(__file__).with_name("calendar_samples.json")


def scheduled_samples(session_date: str) -> list[dict]:
    """Fail closed outside the explicitly reviewed sample dates; never infer weekdays."""
    day = date.fromisoformat(session_date)
    sessions = json.loads(SAMPLES.read_text(encoding="utf-8"))["sessions"]
    session = sessions.get(session_date)
    if session is None:
        raise ValueError("CALENDAR_GAP: no reviewed sample for this date")
    if session["status"] == "CLOSED":
        return []
    if session["status"] != "OPEN":
        raise ValueError("CALENDAR_INVALID")
    jerusalem = ZoneInfo("Asia/Jerusalem")
    close = datetime.combine(day, time.fromisoformat(session["close"]),
                             ZoneInfo("America/New_York"))
    requested = [
        ("JERUSALEM_2240", datetime.combine(day, time(22, 40), jerusalem)),
        ("AFTER_CLOSE", close + timedelta(minutes=15)),
    ]
    return sorted([
        {
            "run_key": f"{session_date}:{reason}",
            "reason": reason,
            "due_utc": due.astimezone(timezone.utc).isoformat(),
            "due_jerusalem": due.astimezone(jerusalem).isoformat(),
            "scope": "OFFLINE_SAMPLE_NOT_A_SCHEDULED_JOB",
        }
        for reason, due in requested
    ], key=lambda run: run["due_utc"])


def aware_time(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("timezone required")
    return parsed


def quote_diagnostic(quote: dict, now: datetime) -> dict:
    """Detect hazards in synthetic normalized inputs; cannot authenticate provider data.

    The result ALWAYS denies live eligibility, including for a consistent sample.
    This prototype neither transforms prices nor emits alerts.
    """
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("timezone required for now")
    blockers = []
    prices = {}
    source_times = []
    for name in ("last", "bid", "ask"):
        field = quote.get(name)
        if not isinstance(field, dict):
            field = {}
        try:
            # Decimal strings avoid accepting an already rounded binary float.
            if not isinstance(field.get("value"), str):
                raise ValueError("decimal string required")
            value = Decimal(field["value"])
            if not value.is_finite() or value <= 0:
                raise ValueError("positive finite price required")
            prices[name] = value
        except (InvalidOperation, ValueError):
            blockers.append(f"{name}:PRICE_INVALID")
        if field.get("unit") != "USD_PER_SHARE":
            blockers.append(f"{name}:UNIT_SCALE_UNRESOLVED")
        try:
            observed = aware_time(field["observed_at"])
            age = (now - observed).total_seconds()
            source_times.append(observed)
            if age < -5:
                blockers.append(f"{name}:OBSERVATION_TIME_FUTURE")
            elif age > 60:
                blockers.append(f"{name}:PRICE_STALE")
        except (KeyError, TypeError, ValueError, OverflowError):
            blockers.append(f"{name}:OBSERVATION_TIME_MISSING_OR_INVALID")
    if len(source_times) == 3 and (max(source_times) - min(source_times)).total_seconds() > 10:
        blockers.append("FIELD_TIME_SEPARATION")
    if "bid" in prices and "ask" in prices:
        bid, ask = prices["bid"], prices["ask"]
        if bid > ask:
            blockers.append("QUOTE_CROSSED")
        else:
            midpoint = (bid + ask) / 2
            if (ask - bid) / midpoint > Decimal("0.05"):
                blockers.append("SPREAD_REVIEW_REQUIRED")
            if "last" in prices:
                ratio = prices["last"] / midpoint
                if ratio <= Decimal("0.02") or ratio >= Decimal("50"):
                    blockers.append("UNIT_SCALE_UNRESOLVED")
                elif abs(ratio - 1) > Decimal("0.05"):
                    blockers.append("QUOTE_CONFLICT")
    if quote.get("feed_status") != "REALTIME":
        blockers.append("FEED_NOT_REALTIME")
    if quote.get("coverage") != "NON_CONSOLIDATED":
        blockers.append("COVERAGE_UNVERIFIED")
    if quote.get("required_coverage") != "NON_CONSOLIDATED":
        blockers.append("COVERAGE_UNSUPPORTED")
    if quote.get("session") != "REGULAR_OPEN":
        blockers.append("SESSION_INCOMPATIBLE")
    if quote.get("rule_interval") != "LIVE_PRICE":
        blockers.append("INTERVAL_UNSUPPORTED")
    return {
        "scope": "OFFLINE_DIAGNOSTIC_NOT_PROVIDER_VALIDATION",
        "live_eligible": False,
        "production_ingress": "NOT_IMPLEMENTED",
        "blockers": blockers,
        "sample_result": "HAZARDS_FOUND" if blockers else "NO_HAZARDS_IN_SAMPLE",
    }


def known_bad_sample() -> dict:
    """Synthetic regression based on the prior discrepancy; NOT a new market quote."""
    return {
        name: {"value": value, "unit": "USD_PER_SHARE",
               "observed_at": "2026-10-13T17:55:00+00:00"}
        for name, value in (("last", "3.43"), ("bid", "342.98"), ("ask", "343.01"))
    } | {
        "feed_status": "REALTIME", "coverage": "NON_CONSOLIDATED",
        "required_coverage": "NON_CONSOLIDATED", "session": "REGULAR_OPEN",
        "rule_interval": "LIVE_PRICE",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("probe", choices=["schedule", "bad-price"])
    parser.add_argument("--date", help="Explicit reviewed sample session, YYYY-MM-DD")
    args = parser.parse_args()
    if args.probe == "schedule":
        if not args.date:
            parser.error("schedule requires --date")
        try:
            result = {"runs": scheduled_samples(args.date), "creates_jobs": False}
        except ValueError as error:
            parser.error(str(error))
    else:
        result = quote_diagnostic(known_bad_sample(), aware_time("2026-10-13T17:55:05+00:00"))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
