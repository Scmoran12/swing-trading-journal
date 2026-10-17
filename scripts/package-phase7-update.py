"""Cumulative source-only v0.7 handoff, preserving known delivered predecessors."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parents[1]
sha = lambda data: hashlib.sha256(data).hexdigest()
snapshots = []
current = {}
for archive_name, prefix, version in [
    ("swingpilot-manual-journal-update.zip", "swingpilot-manual-journal-update/", "0.2.0"),
    ("swingpilot-phase3-diagnostics-update.zip", "swingpilot-phase3-diagnostics-update/", "0.3.0"),
    ("swingpilot-phase4-reviews-update.zip", "swingpilot-phase4-reviews-update/", "0.4.0"),
    ("swingpilot-phase5-monitoring-update.zip", "swingpilot-phase5-monitoring-update/", "0.5.0"),
    ("swingpilot-phase6-desktop-update.zip", "swingpilot-phase6-desktop-update/", "0.6.0"),
]:
    with ZipFile(root / "reports" / archive_name) as archive:
        manifest = json.loads(archive.read(prefix + "UPDATE_MANIFEST.json"))
        assert manifest["version"] == version
        incoming = {name.removeprefix(prefix): archive.read(name)
                    for name in archive.namelist() if name.startswith(prefix)}
    current = {**current, **incoming}
    assert json.loads(current["package.json"])["version"] == version
    snapshots.append(current)
base = snapshots[0]
for path, data in snapshots[-1].items():
    if path.startswith("local/migrations/"):
        assert (root / path).read_bytes() == data, "Never rewrite delivered migrations"
for key in ["dependencies", "devDependencies"]:
    assert json.loads(base["package.json"])[key] == json.loads((root / "package.json").read_text())[key]

paths = [root / name for name in ["package.json", "package-lock.json"]]
for folder in ["src", "local/migrations", "scripts/local", "scripts/database", "scripts/testing", "scripts/windows",
               "tests/foundation", "tests/security", "tests/trading", "tests/market", "tests/ai", "tests/monitoring", "tests/notifications", "tests/analytics", "tests/database", "tests/http"]:
    paths.extend(path for path in (root / folder).rglob("*") if path.is_file() and "__pycache__" not in path.parts)
paths.extend(root / name for name in ["docs/PHASE3_DELIVERY.md", "docs/PHASE3_WINDOWS.md", "docs/PHASE4_DELIVERY.md",
    "docs/PHASE4_WINDOWS.md", "docs/PHASE5_DELIVERY.md", "docs/PHASE5_WINDOWS.md", "docs/PHASE6_DELIVERY.md", "docs/PHASE6_WINDOWS.md", "docs/PHASE7_DELIVERY.md", "docs/PHASE7_WINDOWS.md", "docs/reviews/WINDOWS_ACCEPTANCE_REPORTED.md"])
changed = sorted({path for path in paths if base.get(path.relative_to(root).as_posix()) != path.read_bytes()})
entries = [{"path": path.relative_to(root).as_posix(), "sha256": sha(path.read_bytes()), "bytes": path.stat().st_size,
    "acceptedPreviousSha256": sorted({sha(s[path.relative_to(root).as_posix()]) for s in snapshots if path.relative_to(root).as_posix() in s}),
    "mayCreateIfAbsent": path.relative_to(root).as_posix() not in base,
    "instruction": "Review any locally modified file or existing new path; never overwrite blindly."} for path in changed]
manifest = {"version": "0.7.0", "kind": "CUMULATIVE_SOURCE_DELTA", "supportedApplicationPredecessors": ["0.2.0", "0.3.0", "0.4.0", "0.5.0", "0.6.0"],
    "scope": "Journal analytics and durable manual weekly reviews plus prior manual features; no actual trading alerts/tasks/provider/model calls",
    "incomingFiles": entries, "deletedFiles": [], "newForwardMigration": "0007_journal_analytics.sql",
    "unchangedMigrations": ["0001_foundation.sql", "0002_auth_and_files.sql", "0003_manual_journal.sql", "0004_manual_codex_reviews.sql", "0005_monitoring_rehearsals.sql", "0006_desktop_delivery_tests.sql"],
    "preserve": [".git/**", ".codex/**", "native MCP bridge", "scripts/phase0/**", "tests/phase0/**", "all private configuration/data",
        "docs/WINDOWS_ACCEPTANCE.md", "docs/TASKS.md", "docs/VALIDATION_STATUS.md", "newer local evidence and unrelated changes"],
    "instructions": "Extract separately and merge known predecessor hashes; review collisions. Read docs/PHASE7_WINDOWS.md. "
       "Existing manual0.2 app/test setup required. Migrate forward using the separate test config; do not recreate owners. "
       "Weekly review packets are manually copied only after owner consent; no automatic model request. No monitoring/task/broker/AI requests, paid service, public exposure or deferred backup work."}
output = root / "reports/swingpilot-phase7-analytics-update.zip"
prefix = "swingpilot-phase7-analytics-update/"
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for path in changed:
        archive.write(path, prefix + path.relative_to(root).as_posix())
    archive.writestr(prefix + "UPDATE_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
    archive.writestr(prefix + "README_UPDATE.md", "# SwingPilot v0.7 analytics/manual weekly reviews\n\n"
        "Start with docs/PHASE7_WINDOWS.md and UPDATE_MANIFEST.json.\n"
        "Cumulative source delta over known0.2/0.3/0.4/0.5/0.6; earlier manual features included.\n"
        "Preserve native bridge/tests/agents/evidence/private setup; review collisions.\n"
        "Forward migration0007; delivered0001–0006 unchanged. No actual native/model/market/device acceptance claimed.\n")
with ZipFile(output) as archive:
    assert archive.testzip() is None
    for row in entries:
        assert sha(archive.read(prefix + row["path"])) == row["sha256"]
    for name in archive.namelist():
        assert not any(part in name for part in ["/.git/", "/.codex/", "/node_modules/", "/.next/", "/settings.json", "/.env", "/scripts/phase0/", "/tests/phase0/"])
print(f"Verified v0.7 cumulative delta: {len(entries)} source files plus manifest/readme, {output.stat().st_size} bytes.")
