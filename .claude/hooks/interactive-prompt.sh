#!/bin/bash
set -euo pipefail

# Read hook input from stdin
HOOK_INPUT=""
if ! HOOK_INPUT=$(cat 2>/dev/null); then
  HOOK_INPUT=""
fi

# Only run on macOS with osascript available
if [[ "$(uname -s)" != "Darwin" ]]; then
  exit 0
fi

if ! command -v osascript >/dev/null 2>&1; then
  exit 0
fi

# Extract values from JSON input
notification_title="Claude Code"
notification_message="Proceed with this action?"
notification_type="unknown"

if command -v jq >/dev/null 2>&1 && [[ -n "$HOOK_INPUT" ]]; then
  notification_title=$(printf '%s' "$HOOK_INPUT" | jq -r '.notification.title // .title // "Claude Code"' 2>/dev/null || echo "Claude Code")
  notification_message=$(printf '%s' "$HOOK_INPUT" | jq -r '.notification.message // .message // "Proceed with this action?"' 2>/dev/null || echo "Proceed with this action?")
  notification_type=$(printf '%s' "$HOOK_INPUT" | jq -r '.notification_type // "unknown"' 2>/dev/null || echo "unknown")
fi

# Get project name for context
project_name=""
if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
  project_name=$(basename "$CLAUDE_PROJECT_DIR")
fi

# Escape strings for AppleScript
escape_osa() {
  printf '%s' "$1" | tr '\n' ' ' | sed 's/\\/\\\\/g; s/"/\\"/g'
}

osa_title=$(escape_osa "$notification_title")
osa_message=$(escape_osa "$notification_message")
osa_subtitle=""

if [[ -n "$project_name" ]]; then
  osa_subtitle=$(escape_osa "$project_name")
fi

# Build the AppleScript dialog command
dialog_cmd="display dialog \"$osa_message\" with title \"$osa_title\""

if [[ -n "$osa_subtitle" ]]; then
  # AppleScript doesn't have subtitle for dialogs, so add it to the message
  osa_message_with_subtitle="[$osa_subtitle]\n\n$osa_message"
  osa_message_with_subtitle=$(escape_osa "$osa_message_with_subtitle")
  dialog_cmd="display dialog \"$osa_message_with_subtitle\" with title \"$osa_title\""
fi

# Add buttons based on notification type
case "$notification_type" in
  permission_prompt)
    dialog_cmd="$dialog_cmd buttons {\"Deny\", \"Allow\"} default button \"Allow\""
    ;;
  idle_prompt)
    dialog_cmd="$dialog_cmd buttons {\"Stop\", \"Continue\"} default button \"Continue\""
    ;;
  *)
    dialog_cmd="$dialog_cmd buttons {\"No\", \"Yes\"} default button \"Yes\""
    ;;
esac

# Display dialog and capture response - THIS BLOCKS until user responds
response=$(osascript -e "$dialog_cmd" 2>/dev/null || echo "button returned:No")

# Check user response
if [[ "$response" == *"Allow"* ]] || [[ "$response" == *"Continue"* ]] || [[ "$response" == *"Yes"* ]]; then
  # User approved - exit with code 0 to allow action
  exit 0
else
  # User denied - exit with code 2 to block action
  echo "User denied the action" >&2
  exit 2
fi
