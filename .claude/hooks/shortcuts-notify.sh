#!/bin/bash
set -euo pipefail

# Simple hook that triggers macOS Shortcuts
# Usage: shortcuts-notify.sh [shortcut-name]

SHORTCUT_NAME="${1:-Codex Done}"

# Check if shortcuts command is available
if ! command -v /usr/bin/shortcuts >/dev/null 2>&1; then
  echo "shortcuts command not found" >&2
  exit 0
fi

# Run the shortcut
/usr/bin/shortcuts run "$SHORTCUT_NAME" 2>/dev/null || true

exit 0
