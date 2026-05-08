#!/bin/bash

# Fix "too many open files" error on macOS
# This script must be run to permanently fix the issue

echo "🔧 Fixing macOS file limit issue..."
echo ""
echo "This will require your password (sudo access)"
echo ""

# Move the plist file to the system LaunchDaemons folder
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
sudo cp "$SCRIPT_DIR/limit.maxfiles.plist" /Library/LaunchDaemons/limit.maxfiles.plist

# Set correct permissions
sudo chown root:wheel /Library/LaunchDaemons/limit.maxfiles.plist
sudo chmod 644 /Library/LaunchDaemons/limit.maxfiles.plist

# Load the new limits
sudo launchctl load /Library/LaunchDaemons/limit.maxfiles.plist

echo ""
echo "✅ Done! The fix has been applied."
echo ""
echo "⚠️  You MUST restart your terminal (close and reopen) for this to take effect."
echo ""
echo "After restarting your terminal, you can verify with:"
echo "  launchctl limit maxfiles"
echo ""
echo "You should see: maxfiles    65536          200000"
