# Claude Code Hook Configuration Examples

## Current Setup

Your project has the following hooks configured:

### 1. Non-Blocking Notifications

- **Event**: `Notification` and `Stop`
- **Script**: `notify.sh`
- **Behavior**: Shows macOS notification center alerts (doesn't wait)
- **Use Case**: Background notifications when you're multitasking

### 2. Interactive Prompts (NEW)

- **Script**: `interactive-prompt.sh`
- **Behavior**: Shows modal dialog and WAITS for user response
- **Use Case**: Critical decisions requiring explicit approval

## Configuration Options

### Option A: Keep Current (Non-blocking only)

Current `.claude/settings.json` - notifications don't interrupt you:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh notification"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh stop"
          }
        ]
      }
    ]
  }
}
```

### Option B: Interactive for Permissions (Recommended)

Use interactive dialogs for permission requests, notifications for everything else:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/interactive-prompt.sh"
          }
        ]
      },
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/interactive-prompt.sh"
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh notification"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh stop"
          }
        ]
      }
    ]
  }
}
```

### Option C: Interactive for Everything

All notifications require explicit acknowledgment:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/interactive-prompt.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/interactive-prompt.sh"
          }
        ]
      }
    ]
  }
}
```

### Option D: Interactive + Sound (Maximum attention)

Combine interactive dialogs with system sounds:

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/Sounds/Glass.aiff"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/interactive-prompt.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay /System/Library/Sounds/Hero.aiff"
          },
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/notify.sh stop"
          }
        ]
      }
    ]
  }
}
```

## Notification Types

The hooks receive different `notification_type` values:

| Type                 | When it happens                         | Button labels       |
| -------------------- | --------------------------------------- | ------------------- |
| `permission_prompt`  | Claude needs permission for a tool      | "Deny" / "Allow"    |
| `idle_prompt`        | Claude waiting 60+ seconds for response | "Stop" / "Continue" |
| `auth_success`       | Authentication completed                | "No" / "Yes"        |
| `elicitation_dialog` | MCP tool needs input                    | "No" / "Yes"        |

## Testing Your Configuration

### Manual Test

```bash
cd /Users/chouyasushi/htdocs/all-weather-protocol/frontend
./.claude/hooks/test-hooks.sh
```

### View Registered Hooks

In Claude Code:

```
/hooks
```

### Debug Mode

Enable verbose hook logging:

```bash
claude --debug
```

## Exit Codes

Your hooks return these codes:

| Code  | Meaning            | Effect                   |
| ----- | ------------------ | ------------------------ |
| `0`   | Success / Allow    | Action proceeds          |
| `2`   | Block / Deny       | Action is blocked        |
| Other | Non-blocking error | Logged but doesn't block |

## Advanced: Custom Hook for Specific Tools

Block specific tools with a custom hook:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash.*rm -rf",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/dangerous-command-prompt.sh"
          }
        ]
      }
    ]
  }
}
```

## Available System Sounds (macOS)

For audio notifications, use any of these:

- `/System/Library/Sounds/Basso.aiff` - Error sound
- `/System/Library/Sounds/Glass.aiff` - Attention
- `/System/Library/Sounds/Hero.aiff` - Success
- `/System/Library/Sounds/Ping.aiff` - Notification
- `/System/Library/Sounds/Submarine.aiff` - Alert

## Recommended Setup

For development work, I recommend **Option B** (Interactive for Permissions):

- Get interactive dialogs for important decisions (permissions, idle timeout)
- Get non-blocking notifications for progress updates
- Get notification when Claude finishes (Stop event)

This balances attention with productivity.

## Next Steps

1. Choose a configuration option above
2. Update `.claude/settings.json`
3. Run `claude` to test in a real session
4. Adjust based on your workflow preferences

## Troubleshooting

**Dialog doesn't appear?**

- Check that you're on macOS
- Verify `osascript` is available: `which osascript`
- Test manually: `./.claude/hooks/interactive-prompt.sh < test-input.json`

**Hook times out?**

- Default timeout is 60 seconds
- Dialogs block until user responds - this is expected!

**Want to cancel a dialog?**

- Press Escape key or click "Deny"/"No"/"Stop"
- Hook returns exit code 2 (blocks action)
