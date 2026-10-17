"""Cumulative source delta supporting known delivered v0.2 and v0.3 predecessors."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parents[1]
sha = lambda data: hashlib.sha256(data).hexdigest()
versions = []
for archive_name, prefix, version in [
    ("swingpilot-manual-journal-update.zip", "swingpilot-manual-journal-update/", "0.2.0"),
    ("swingpilot-phase3-diagnostics-update.zip", "swingpilot-phase3-diagnostics-update/", "0.3.0"),
]:
    path = root / "reports" / archive_name
    with ZipFile(path) as archive:
        manifest = json.loads(archive.read(prefix + "UPDATE_MANIFEST.json"))
        assert manifest["version"] == version
        files = {name.removeprefix(prefix): archive.read(name)
                 for name in archive.namelist() if name.startswith(prefix)}
    versions.append(files)

base, prior_delta = versions
previous = {**base, **prior_delta}
for path, contents in base.items():
    if path.startswith("local/migrations/"):
        assert (root / path).read_bytes() == contents, "Never rewrite delivered migrations"
for name in ["dependencies", "devDependencies"]:
    assert json.loads(base["package.json"])[name] == json.loads((root / "package.json").read_text())[name]

paths = [root / name for name in ["package.json", "package-lock.json"]]
for directory in ["src", "local/migrations", "scripts/local", "scripts/database", "scripts/testing", "scripts/windows",
                  "tests/foundation", "tests/security", "tests/trading", "tests/market", "tests/ai", "tests/database", "tests/http"]:
    paths.extend(path for path in (root / directory).rglob("*") if path.is_file() and "__pycache__" not in path.parts)
paths.extend(root / name for name in ["docs/PHASE3_DELIVERY.md", "docs/PHASE3_WINDOWS.md",
    "docs/reviews/WINDOWS_ACCEPTANCE_REPORTED.md", "docs/PHASE4_DELIVERY.md", "docs/PHASE4_WINDOWS.md"])
changed = sorted({path for path in paths if base.get(path.relative_to(root).as_posix()) != path.read_bytes()})
entries = []
for path in changed:
    name = path.relative_to(root).as_posix()
    entries.append({"path": name, "sha256": sha(path.read_bytes()), "bytes": path.stat().st_size,
        "acceptedPreviousSha256": sorted({sha(v[name]) for v in [base, previous] if name in v}),
        "mayCreateIfAbsent": name not in base,
        "instruction": "Review any local collision; a null/absent predecessor never authorizes blindly replacing a file."})
manifest = {"version": "0.4.0", "kind": "CUMULATIVE_SOURCE_DELTA", "supportedApplicationPredecessors": ["0.2.0", "0.3.0"],
    "scope": "Manual Codex reviews plus prior diagnostics; no model/provider calls or new dependency versions",
    "incomingFiles": entries, "deletedFiles": [],
    "forwardMigration": "0004_manual_codex_reviews.sql", "unchangedMigrations": ["0001_foundation.sql", "0002_auth_and_files.sql", "0003_manual_journal.sql"],
    "preserve": [".git/**", ".codex/**", "native MCP bridge", "scripts/phase0/**", "tests/phase0/**",
                 "all private configuration/data", "docs/WINDOWS_ACCEPTANCE.md", "docs/TASKS.md", "docs/VALIDATION_STATUS.md", "newer local evidence/unrelated changes"],
    "instructions": "Extract separately, review predecessor hashes/collisions in existing local Codex project. "
                    "Follow docs/PHASE4_WINDOWS.md; migrate the existing separate test config, not a recreated owner. "
                    "Manual source0.2 already required. No actual native/market requests, monitoring, public exposure or deferred backup work."}
output = root / "reports/swingpilot-phase4-reviews-update.zip"
prefix = "swingpilot-phase4-reviews-update/"
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for path in changed:
        archive.write(path, prefix + path.relative_to(root).as_posix())
    archive.writestr(prefix + "UPDATE_MANIFEST.json", json.dumps(manifest, indent=2) + "\n")
    archive.writestr(prefix + "README_UPDATE.md", "# SwingPilot v0.4 manual reviews\n\n"
        "Start with docs/PHASE4_WINDOWS.md and UPDATE_MANIFEST.json.\n"
        "Cumulative delta over manual0.2 or diagnostic0.3; Phase3 source included.\n"
        "Review file collisions, preserve native bridge/status/private setup.\n"
        "New forward migration0004; never change0001–0003. No extra dependencies/services.\n")
with ZipFile(output) as archive:
    assert archive.testzip() is None
    for entry in entries:
        assert sha(archive.read(prefix + entry["path"])) == entry["sha256"]
    for name in archive.namelist():
        assert not any(part in name for part in ["/.git/", "/.codex/", "/node_modules/", "/.next/", "/settings.json", "/.env", "/scripts/phase0/", "/tests/phase0/"])
print(f"Verified v0.4 cumulative delta: {len(entries)} source files plus manifest/readme, {output.stat().st_size} bytes.")
