#!/bin/bash

# Script to update CHANGELOG.md during version bump
# Converts [Unreleased] to the new version and adds a new [Unreleased] section

set -e

if [ $# -ne 1 ]; then
    echo "Usage: $0 <new_version>"
    exit 1
fi

NEW_VERSION="$1"
CURRENT_DATE=$(date '+%Y-%m-%d')
CHANGELOG_FILE="CHANGELOG.md"

# Check if CHANGELOG.md exists
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "Error: CHANGELOG.md not found"
    exit 1
fi

# Check if [Unreleased] section exists
if ! grep -q "## \[Unreleased\]" "$CHANGELOG_FILE"; then
    echo "Error: [Unreleased] section not found in CHANGELOG.md"
    exit 1
fi

# Create a temporary file for the updated changelog
TEMP_FILE=$(mktemp)

# Process the changelog
{
    # Add the new [Unreleased] section at the top
    echo "# Changelog"
    echo ""
    echo "## [Unreleased]"
    echo ""

    # Read the original file and replace [Unreleased] with the version
    tail -n +3 "$CHANGELOG_FILE" | sed "s/## \[Unreleased\]/## [$NEW_VERSION] - $CURRENT_DATE/"
} > "$TEMP_FILE"

# Replace the original file
mv "$TEMP_FILE" "$CHANGELOG_FILE"

echo "Successfully updated CHANGELOG.md: [Unreleased] -> [$NEW_VERSION] - $CURRENT_DATE"
