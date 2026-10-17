"""Independent expected times and fail-closed data cases; no external services."""

import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts" / "phase0"))
from probes import aware_time, known_bad_sample, quote_diagnostic, scheduled_samples


class CalendarTests(unittest.TestCase):
    def test_dst_windows_and_early_close(self):
        # Expected UTC instants are explicit, not calculated with the implementation.
        cases = [
            ("2026-03-09", "20:40", "20:15"),
            ("2026-03-27", "19:40", "20:15"),
            ("2026-10-13", "19:40", "20:15"),
            ("2026-10-26", "20:40", "20:15"),
            ("2026-11-02", "20:40", "21:15"),
            ("2026-11-27", "20:40", "18:15"),
            ("2026-12-24", "20:40", "18:15"),
            ("2027-01-04", "20:40", "21:15"),
        ]
        for day, daily, after in cases:
            with self.subTest(day=day):
                by_reason = {run["reason"]: run for run in scheduled_samples(day)}
                self.assertEqual(len(by_reason), 2)
                for reason, expected in (("JERUSALEM_2240", daily), ("AFTER_CLOSE", after)):
                    self.assertEqual(by_reason[reason]["due_utc"], f"{day}T{expected}:00+00:00")

    def test_holidays_create_no_runs(self):
        for day in ("2026-04-03", "2026-11-26", "2026-12-25", "2027-01-01"):
            self.assertEqual(scheduled_samples(day), [])

    def test_unknown_date_never_falls_back_to_weekdays(self):
        for day in ("2026-10-15", "2026-10-17", "2028-01-03"):
            with self.assertRaisesRegex(ValueError, "CALENDAR_GAP"):
                scheduled_samples(day)

    def test_distinct_reason_keys_and_chronological_order(self):
        early = scheduled_samples("2026-11-27")
        self.assertEqual(early[0]["reason"], "AFTER_CLOSE")
        regular = scheduled_samples("2026-10-13")
        self.assertEqual(regular[0]["reason"], "JERUSALEM_2240")
        self.assertEqual(len({run["run_key"] for run in early}), 2)


class PriceSafetyTests(unittest.TestCase):
    def setUp(self):
        self.sample = known_bad_sample()
        self.now = aware_time("2026-10-13T17:55:05+00:00")

    def check(self, sample):
        result = quote_diagnostic(sample, self.now)
        self.assertFalse(result["live_eligible"])
        return result["blockers"]

    def test_100x_conflict_blocked_without_mutation(self):
        original = copy.deepcopy(self.sample)
        self.assertIn("UNIT_SCALE_UNRESOLVED", self.check(self.sample))
        self.assertEqual(self.sample, original)

    def test_receipt_time_cannot_replace_missing_quote_timestamp(self):
        del self.sample["bid"]["observed_at"]
        self.sample["received_at"] = self.now.isoformat()
        self.assertIn("bid:OBSERVATION_TIME_MISSING_OR_INVALID", self.check(self.sample))

    def test_stale_future_naive_and_epoch_times(self):
        for timestamp, expected in (
            ("2026-10-13T17:53:00+00:00", "PRICE_STALE"),
            ("2026-10-13T17:56:00+00:00", "OBSERVATION_TIME_FUTURE"),
            ("2026-10-13T17:55:00", "OBSERVATION_TIME_MISSING_OR_INVALID"),
            (1791914100000, "OBSERVATION_TIME_MISSING_OR_INVALID"),
        ):
            with self.subTest(timestamp=timestamp):
                self.sample["last"]["observed_at"] = timestamp
                self.assertIn(f"last:{expected}", self.check(self.sample))

    def test_invalid_decimal_prices(self):
        for value in ("NaN", "Infinity", "-1", "0", "wrong", None, 343.0):
            with self.subTest(value=value):
                self.sample["last"]["value"] = value
                self.assertIn("last:PRICE_INVALID", self.check(self.sample))

    def test_crossed_quotes(self):
        self.sample["bid"]["value"] = "344"
        self.assertIn("QUOTE_CROSSED", self.check(self.sample))

    def test_live_quote_cannot_pass_daily_close_or_consolidated_rule(self):
        self.sample["rule_interval"] = "DAILY_CLOSE"
        self.sample["required_coverage"] = "CONSOLIDATED"
        result = self.check(self.sample)
        self.assertIn("INTERVAL_UNSUPPORTED", result)
        self.assertIn("COVERAGE_UNSUPPORTED", result)

    def test_consistent_sample_still_cannot_authorize_live_signal(self):
        self.sample["last"]["value"] = "343.00"
        result = quote_diagnostic(self.sample, self.now)
        self.assertEqual(result["blockers"], [])
        self.assertFalse(result["live_eligible"])
        self.assertEqual(result["production_ingress"], "NOT_IMPLEMENTED")


if __name__ == "__main__":
    unittest.main()
