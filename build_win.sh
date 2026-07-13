#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v pwsh >/dev/null 2>&1; then
  exec pwsh -NoProfile -ExecutionPolicy Bypass -File "$ROOT_DIR/build_win.ps1" "$@"
fi

if command -v powershell.exe >/dev/null 2>&1; then
  exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$ROOT_DIR/build_win.ps1" "$@"
fi

echo "PowerShell is required. Run build_win.cmd from CMD or build_win.ps1 from PowerShell." >&2
exit 1
