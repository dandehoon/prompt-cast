#!/bin/bash

# Script to generate commit log for releases
# Gets commit messages since the last tag for release notes

set -e

DELIM="__COMMIT_LOG_EOF_$(uuidgen)__"

# Get commit messages since last tag
if git tag | grep -q .; then
    PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
    if [ -n "$PREV_TAG" ]; then
        commit_log=$(git log --pretty=format:'- %s (%h)' "$PREV_TAG"..HEAD | grep -v "^- Merge pull request" | head -20)
    else
        commit_log=$(git log --pretty=format:'- %s (%h)' --max-count=20 | grep -v "^- Merge pull request")
    fi
else
    commit_log=$(git log --pretty=format:'- %s (%h)' --max-count=20 | grep -v "^- Merge pull request")
fi

# If no commits, use a default message
if [ -z "$commit_log" ]; then
    commit_log="- Initial release"
fi

# Output for GitHub Actions
{
    echo "commits<<$DELIM"
    echo "$commit_log"
    printf '\n%s\n' "$DELIM"
} >> "$GITHUB_OUTPUT"

echo "Generated commit log with $(echo "$commit_log" | wc -l) entries"
