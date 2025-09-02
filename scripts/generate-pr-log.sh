#!/bin/bash

# Script to generate PR-based log for releases
# Gets merged PRs since the last tag for release notes

set -e

DELIM="__COMMIT_LOG_EOF_$(uuidgen)__"

# Function to extract PR info from merge commit message
extract_pr_info() {
    local commit_message="$1"
    local commit_hash="$2"

    # Extract PR number from message like "Merge pull request #123 from user/branch"
    pr_number=$(echo "$commit_message" | grep -o "#[0-9]\+" | head -1 | sed 's/#//')

    if [ -n "$pr_number" ]; then
        # Get PR title from the merge commit (it's usually the second line after the merge line)
        pr_title=$(git log --format="%B" -n 1 "$commit_hash" | sed -n '3p' | sed 's/^[[:space:]]*//')

        # If pr_title is empty, try to get it from commit body
        if [ -z "$pr_title" ] || [ "$pr_title" = "" ]; then
            pr_title=$(git log --format="%B" -n 1 "$commit_hash" | tail -n +2 | head -1 | sed 's/^[[:space:]]*//')
        fi

        # Get author from the merge commit
        author=$(git log --format="%an" -n 1 "$commit_hash")

        # Format: - PR Title (#123) by @author
        if [ -n "$pr_title" ] && [ "$pr_title" != "" ]; then
            echo "- $pr_title (#$pr_number) by @$author"
        else
            echo "- Merge pull request #$pr_number by @$author"
        fi
    fi
}

# Get merge commits since last tag
if git tag | grep -q .; then
    PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
    if [ -n "$PREV_TAG" ]; then
        merge_commits=$(git log --pretty=format:'%H|%s' "$PREV_TAG"..HEAD --merges | head -20)
    else
        merge_commits=$(git log --pretty=format:'%H|%s' --merges --max-count=20)
    fi
else
    merge_commits=$(git log --pretty=format:'%H|%s' --merges --max-count=20)
fi

# Process merge commits to extract PR information
pr_log=""
while IFS='|' read -r commit_hash commit_message; do
    if [ -n "$commit_hash" ] && [[ "$commit_message" == *"Merge pull request"* ]]; then
        pr_info=$(extract_pr_info "$commit_message" "$commit_hash")
        if [ -n "$pr_info" ]; then
            if [ -z "$pr_log" ]; then
                pr_log="$pr_info"
            else
                pr_log="$pr_log
$pr_info"
            fi
        fi
    fi
done <<< "$merge_commits"

# If no PRs found, use a default message
if [ -z "$pr_log" ]; then
    pr_log="- Initial release"
fi

# Output for GitHub Actions
{
    echo "commits<<$DELIM"
    echo "$pr_log"
    printf '\n%s\n' "$DELIM"
} >> "$GITHUB_OUTPUT"

echo "Generated PR log with $(echo "$pr_log" | wc -l) entries"
