#!/bin/bash
set -euo pipefail

EVENT_LABEL="${1:-notification}"

HOOK_INPUT=""
if ! HOOK_INPUT=$(cat 2>/dev/null); then
  HOOK_INPUT=""
fi

# Only notify on macOS with osascript available
if [[ "$(uname -s)" != "Darwin" ]]; then
  exit 0
fi

if ! command -v osascript >/dev/null 2>&1; then
  exit 0
fi

notification_title=""
notification_subtitle=""
notification_message=""

if command -v jq >/dev/null 2>&1 && [[ -n "$HOOK_INPUT" ]]; then
  notification_title=$(printf '%s' "$HOOK_INPUT" | jq -r '.notification.title // .title // empty' 2>/dev/null || true)
  notification_subtitle=$(printf '%s' "$HOOK_INPUT" | jq -r '.notification.subtitle // empty' 2>/dev/null || true)
  notification_message=$(printf '%s' "$HOOK_INPUT" | jq -r '.notification.message // .message // empty' 2>/dev/null || true)
fi

project_name=""
if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
  project_name=$(basename "$CLAUDE_PROJECT_DIR")
fi

case "$EVENT_LABEL" in
  stop)
    notification_message=${notification_message:-"All tasks complete."}
    notification_subtitle=${notification_subtitle:-"${project_name}"}
    if [[ -n "$notification_subtitle" ]]; then
      notification_subtitle+=" · Done"
    else
      notification_subtitle="Done"
    fi
    ;;
  plan-approval)
    notification_message=${notification_message:-"Plan ready. Please approve to continue."}
    notification_subtitle=${notification_subtitle:-"${project_name}"}
    if [[ -n "$notification_subtitle" ]]; then
      notification_subtitle+=" · Plan approval"
    else
      notification_subtitle="Plan approval"
    fi
    ;;
  notification)
    notification_message=${notification_message:-"Claude Code needs your input."}
    notification_subtitle=${notification_subtitle:-"${project_name}"}
    ;;
  *)
    notification_message=${notification_message:-"Claude Code needs your input."}
    notification_subtitle=${notification_subtitle:-"${project_name}"}
    ;;
 esac

notification_title=${notification_title:-"Claude Code"}

escape_osa() {
  printf '%s' "$1" | tr '\n' ' ' | sed 's/\\/\\\\/g; s/"/\\"/g'
}

osa_title=$(escape_osa "$notification_title")
osa_message=$(escape_osa "$notification_message")
osa_subtitle=""

if [[ -n "$notification_subtitle" ]]; then
  osa_subtitle=$(escape_osa "$notification_subtitle")
  osascript -e "display notification \"$osa_message\" with title \"$osa_title\" subtitle \"$osa_subtitle\"" >/dev/null 2>&1 || true
else
  osascript -e "display notification \"$osa_message\" with title \"$osa_title\"" >/dev/null 2>&1 || true
fi

exit 0
