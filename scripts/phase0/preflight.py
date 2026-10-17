"""Read-only host inventory. Does not install, contact providers or send notices."""

import argparse
import json
import platform
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def tool_version(command: str) -> dict:
    path = shutil.which(command)
    if not path:
        return {"available": False}
    try:
        # Fixed executable/argument list; never execute arbitrary supplied shell text.
        result = subprocess.run([path, "--version"], capture_output=True,
                                text=True, timeout=5, check=False)
        lines = result.stdout.splitlines()
        version = lines[0][:160] if lines else None
        return {"available": True, "version": version, "exit_code": result.returncode}
    except (OSError, subprocess.TimeoutExpired):
        return {"available": True, "version": None, "probe": "FAILED"}


def inventory(environment: str) -> dict:
    tools = {name: tool_version(name) for name in ("node", "npm", "psql", "pg_dump", "codex")}
    zones = {}
    for name in ("Asia/Jerusalem", "America/New_York"):
        try:
            ZoneInfo(name)
            zones[name] = "AVAILABLE"
        except ZoneInfoNotFoundError:
            zones[name] = "MISSING"
    free = shutil.disk_usage(Path.cwd()).free // (1024 ** 3)
    return {
        "schema_version": 1,
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "environment_declared_by_operator": environment,
        "target_desktop_verified": False,
        "host": {"os": platform.system(), "architecture": platform.machine(),
                 "python": platform.python_version(), "workspace_free_gib": free},
        "tools": tools,
        "timezones": zones,
        "notification_sender_available": {
            name: shutil.which(name) is not None for name in ("notify-send", "osascript", "powershell", "pwsh")
        },
        "desktop_display": "UNRUN_REQUIRES_ACTUAL_OS_RECEIPT",
        "backup_restore": "UNRUN_REQUIRES_SEPARATE_MEDIUM",
        "subscription": {"tier": "PLUS_USER_REPORTED", "remaining_allowance": "UNKNOWN",
                         "credit_spending_disabled": "UNVERIFIED"},
        "native_bridge": "UNRUN", "unattended_dispatch": "UNRUN",
        "overall": "INCOMPLETE_NOT_A_RELEASE_GATE_PASS",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--environment", required=True, choices=["cloud", "desktop"])
    args = parser.parse_args()
    print(json.dumps(inventory(args.environment), indent=2))
