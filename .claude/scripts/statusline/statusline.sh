#!/bin/bash

# Color theme: gray, orange, blue, teal, green, lavender, rose, gold, slate, cyan
COLOR="blue"

# Color codes
C_RESET='\033[0m'
C_GRAY='\033[38;5;245m'
C_BAR_EMPTY='\033[38;5;238m'
case "$COLOR" in
    orange)   C_ACCENT='\033[38;5;173m' ;;
    blue)     C_ACCENT='\033[38;5;74m' ;;
    teal)     C_ACCENT='\033[38;5;66m' ;;
    green)    C_ACCENT='\033[38;5;71m' ;;
    lavender) C_ACCENT='\033[38;5;139m' ;;
    rose)     C_ACCENT='\033[38;5;132m' ;;
    gold)     C_ACCENT='\033[38;5;136m' ;;
    slate)    C_ACCENT='\033[38;5;60m' ;;
    cyan)     C_ACCENT='\033[38;5;37m' ;;
    *)        C_ACCENT="$C_GRAY" ;;
esac

input=$(cat)

# Extract model and working directory
model=$(echo "$input" | jq -r '.model.display_name // .model.id // "?"')
cwd=$(echo "$input" | jq -r '.cwd // empty')

# Get git branch
branch=""
if [[ -n "$cwd" && -d "$cwd" ]]; then
    branch=$(git -C "$cwd" branch --show-current 2>/dev/null)
fi

# Calculate context usage from transcript
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')
max_context=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
context_pct="~10%"

if [[ -n "$transcript_path" && -f "$transcript_path" ]]; then
    context_length=$(jq -s '
        map(select(.message.usage and .isSidechain != true and .isApiErrorMessage != true)) |
        last |
        if . then
            (.message.usage.input_tokens // 0) +
            (.message.usage.cache_read_input_tokens // 0) +
            (.message.usage.cache_creation_input_tokens // 0)
        else 0 end
    ' < "$transcript_path" 2>/dev/null)

    if [[ -n "$context_length" && "$context_length" -gt 0 ]]; then
        pct=$((context_length * 100 / max_context))
        [[ $pct -gt 100 ]] && pct=100
        context_pct="${pct}%"
    fi
fi

# Fetch usage stats from OAuth API (with caching)
CACHE="$HOME/.cache/cc-usage-statusline.txt"
TTL=60

session_usage="?"
session_reset="?"
weekly_usage="?"
weekly_reset="?"

# Try to get cached value first
if [[ -f "$CACHE" ]]; then
    age=$(($(date +%s) - $(stat -f '%m' "$CACHE" 2>/dev/null || stat -c '%Y' "$CACHE" 2>/dev/null || echo 0)))
    if [[ $age -lt $TTL ]]; then
        cached=$(cat "$CACHE")
        session_usage=$(echo "$cached" | cut -d'|' -f1)
        session_reset=$(echo "$cached" | cut -d'|' -f2)
        weekly_usage=$(echo "$cached" | cut -d'|' -f3)
        weekly_reset=$(echo "$cached" | cut -d'|' -f4)
    fi
fi

# If cache is stale or missing, try to fetch fresh data
if [[ "$session_usage" == "?" ]]; then
    # cSpell:disable
    # Try to get token from macOS Keychain first (stores as JSON)
    keychain_creds=$(security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null || true)
    token=""

    if [[ -n "$keychain_creds" ]]; then
        # Extract token from Keychain JSON
        token=$(echo "$keychain_creds" | jq -r '.claudeAiOauth.accessToken // empty' 2>/dev/null)
    fi

    # If not on macOS or Keychain empty, try Linux credentials file
    if [[ -z "$token" ]]; then
        creds_file="${HOME}/.claude/.credentials.json"
        if [[ -f "$creds_file" ]]; then
            token=$(jq -r '.claudeAiOauth.accessToken // empty' "$creds_file" 2>/dev/null)
        fi
    fi
    # cSpell:enable

    if [[ -n "$token" ]]; then
        usage_response=$(curl -s --max-time 2 \
            "https://api.anthropic.com/api/oauth/usage" \
            -H "Authorization: Bearer $token" \
            -H "anthropic-beta: oauth-2025-04-20" 2>/dev/null) || true

        if [[ -n "$usage_response" ]]; then
            # Extract 5-hour window
            five_hour_util=$(echo "$usage_response" | jq -r '.five_hour.utilization // empty' 2>/dev/null)
            five_hour_reset=$(echo "$usage_response" | jq -r '.five_hour.resets_at // empty' 2>/dev/null)

            # Extract 7-day window
            seven_day_util=$(echo "$usage_response" | jq -r '.seven_day.utilization // empty' 2>/dev/null)
            seven_day_reset=$(echo "$usage_response" | jq -r '.seven_day.resets_at // empty' 2>/dev/null)

            if [[ -n "$five_hour_util" ]]; then
                session_usage="${five_hour_util}%"
            fi

            if [[ -n "$seven_day_util" ]]; then
                weekly_usage="${seven_day_util}%"
            fi

            # Format reset times
            if [[ -n "$five_hour_reset" ]]; then
                reset_epoch=$(date -f "%Y-%m-%dT%H:%M:%S" -d "${five_hour_reset:0:19}" "+%s" 2>/dev/null || \
                             date -j -f "%Y-%m-%dT%H:%M:%S" "${five_hour_reset:0:19}" "+%s" 2>/dev/null)
                now=$(date +%s)
                if [[ -n "$reset_epoch" ]] && [[ "$reset_epoch" =~ ^[0-9]+$ ]]; then
                    diff=$((reset_epoch - now))
                    if [[ $diff -gt 0 ]]; then
                        hours=$((diff / 3600))
                        minutes=$(((diff % 3600) / 60))
                        session_reset="in ${hours}h"
                    fi
                fi
            fi

            if [[ -n "$seven_day_reset" ]]; then
                reset_epoch=$(date -f "%Y-%m-%dT%H:%M:%S" -d "${seven_day_reset:0:19}" "+%s" 2>/dev/null || \
                             date -j -f "%Y-%m-%dT%H:%M:%S" "${seven_day_reset:0:19}" "+%s" 2>/dev/null)
                now=$(date +%s)
                if [[ -n "$reset_epoch" ]] && [[ "$reset_epoch" =~ ^[0-9]+$ ]]; then
                    diff=$((reset_epoch - now))
                    if [[ $diff -gt 0 ]]; then
                        days=$((diff / 86400))
                        weekly_reset="in ${days}d"
                    fi
                fi
            fi

            # Cache the result
            mkdir -p "$HOME/.cache"
            echo "${session_usage}|${session_reset}|${weekly_usage}|${weekly_reset}" > "$CACHE"
        fi
    fi
fi

# Build output
output="${C_ACCENT}${model}${C_GRAY}"
[[ -n "$branch" ]] && output+=" | ${branch}"
output+=" | 📊 ${context_pct}"
output+=" | ${session_usage} reset ${session_reset} | ${weekly_usage} reset ${weekly_reset}${C_RESET}"

printf '%b\n' "$output"
