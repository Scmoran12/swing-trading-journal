"""Build a source-only delta against the exact previously delivered v0.2 bundle."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parents[1]
base_path = root / "reports/swingpilot-manual-journal-update.zip"
base_prefix = "swingpilot-manual-journal-update/"
prefix = "swingpilot-phase3-diagnostics-update/"
sha = lambda value: hashlib.sha256(value).hexdigest()

with ZipFile(base_path) as base:
    manifest = json.loads(base.read(base_prefix + "UPDATE_MANIFEST.json"))
    assert manifest["version"] == "0.2.0", "Keep the exact delivered v0.2 predecessor archive"
    old = {name.removeprefix(base_prefix): base.read(name)
           for name in base.namelist() if name.startswith(base_prefix)}

for path, data in old.items():
    if path.startswith("local/migrations/"):
        assert (root / path).read_bytes() == data, "Delivered migrations must remain unchanged"

paths = [root / "package.json", root / "package-lock.json"]
for directory in ["src", "tests/foundation", "tests/security", "tests/trading", "tests/market", "tests/http"]:
    paths.extend(path for path in (root / directory).rglob("*") if path.is_file() and "__pycache__" not in path.parts)
paths.extend(root / path for path in [
    "docs/PHASE3_DELIVERY.md", "docs/PHASE3_WINDOWS.md", "docs/reviews/WINDOWS_ACCEPTANCE_REPORTED.md",
])
changed = sorted({path for path in paths if old.get(path.relative_to(root).as_posix()) != path.read_bytes()})
entries = [{"path": path.relative_to(root).as_posix(), "sha256": sha(path.read_bytes()),
            "bytes": path.stat().st_size,
            "expectedPreviousSha256": sha(old[path.relative_to(root).as_posix()])
            if path.relative_to(root).as_posix() in old else None} for path in changed]
update = {
    "version": "0.3.0", "requiresApplicationVersion": "0.2.0", "kind": "INCREMENTAL_SOURCE_UPDATE",
    "baseArchiveSha256": sha(base_path.read_bytes()),
    "scope": "Transient owner-only quote diagnostics; no provider calls, migration or new dependency versions",
    "incomingFiles": entries, "deletedFiles": [],
    "preserve": [".git/**", ".codex/**", "scripts/phase0/**", "tests/phase0/**", "native MCP bridge",
                 "all private configuration/data", "docs/WINDOWS_ACCEPTANCE.md", "docs/TASKS.md",
                 "docs/VALIDATION_STATUS.md", "existing local evidence and unrelated changes"],
    "instructions": "Extract separately. Replace an existing file only after comparing expectedPreviousSha256. "
                    "Review modified collisions and new paths that already exist; never overwrite blindly. "
                    "Read docs/PHASE3_WINDOWS.md. Existing test setup works; do not repeat recovery/setup. "
                    "No broker request, monitoring activation, public exposure or deferred backup work.",
}
output = root / "reports/swingpilot-phase3-diagnostics-update.zip"
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for path in changed:
        archive.write(path, prefix + path.relative_to(root).as_posix())
    archive.writestr(prefix + "UPDATE_MANIFEST.json", json.dumps(update, indent=2) + "\n")
    archive.writestr(prefix + "README_UPDATE.md", "# SwingPilot v0.3 diagnostics delta\n\n"
                     "For the v0.2 manual app already installed. Start with docs/PHASE3_WINDOWS.md.\n"
                     "Compare predecessor hashes; preserve newer Windows bridge/tests/evidence and private setup.\n"
                     "No new migration/dependency versions, paid data, live signals or automation.\n")
with ZipFile(output) as archive:
    assert archive.testzip() is None
    for entry in entries:
        assert sha(archive.read(prefix + entry["path"])) == entry["sha256"]
    for name in archive.namelist():
        assert not any(part in name for part in ["/.git/", "/.codex/", "/node_modules/", "/.next/",
                   "/settings.json", "/.env", "/scripts/phase0/", "/tests/phase0/", "/local/migrations/"])
print(f"Verified Phase 3 delta: {len(entries)} files plus manifest/readme; {output.stat().st_size} bytes.")
