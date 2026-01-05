#!/bin/bash
# Test script for notification hooks

echo "======================================"
echo "🧪 Testing Claude Code Notification Hooks"
echo "======================================"
echo ""

# Test 1: Current notification hook (non-blocking)
echo "Test 1: Non-blocking notification (notify.sh)"
echo "--------------------------------------"
echo '{
  "notification": {
    "title": "Test Notification",
    "subtitle": "Testing",
    "message": "This is a non-blocking notification test"
  }
}' | ./.claude/hooks/notify.sh notification

echo "✅ Non-blocking notification sent (should appear in macOS notification center)"
echo ""
sleep 2

# Test 2: Stop event notification
echo "Test 2: Stop event notification"
echo "--------------------------------------"
echo '{
  "message": "Testing stop notification"
}' | ./.claude/hooks/notify.sh stop

echo "✅ Stop notification sent"
echo ""
sleep 2

# Test 3: Interactive prompt (blocking)
echo "Test 3: Interactive YES/NO prompt (BLOCKING)"
echo "--------------------------------------"
echo "⚠️  This will show a dialog and WAIT for your response..."
echo ""

response_code=0
echo '{
  "notification": {
    "title": "Interactive Test",
    "message": "Do you want to proceed with this test?"
  },
  "notification_type": "permission_prompt"
}' | ./.claude/hooks/interactive-prompt.sh || response_code=$?

if [ $response_code -eq 0 ]; then
  echo "✅ User clicked Allow/Yes (exit code 0)"
elif [ $response_code -eq 2 ]; then
  echo "❌ User clicked Deny/No (exit code 2)"
else
  echo "⚠️  Hook error (exit code $response_code)"
fi

echo ""
echo "======================================"
echo "✅ All hook tests complete!"
echo "======================================"
