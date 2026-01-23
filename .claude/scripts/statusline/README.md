# Statusline Script

Displays your Claude Code session status in a clean, minimal format.

## Output Format

```
Claude 3.5 Sonnet | 🔀main | 📊35% | 📈 5h: 28% in 4h | 7d: 52% in 3d
```

- **Model**: Current Claude model
- **🔀Branch**: Git branch name (only shown if in a repo)
- **📊Context**: Current context window usage percentage
- **📈 5h**: 5-hour rolling window usage % + hours until reset
- **7d**: 7-day window usage % + days until reset

## How It Works

✨ **Zero setup required!** The script automatically reads your OAuth token from:
- **macOS**: Keychain (`security find-generic-password`)
- **Linux**: `~/.claude/.credentials.json`

It:
1. Checks for cached usage data (refreshed every 60 seconds)
2. Retrieves your OAuth token from platform-specific storage
3. Fetches current usage from Anthropic API (2-second timeout)
4. Caches results to avoid API spam

## Troubleshooting

**If you see `?` for usage percentages:**

**macOS:**
```bash
# Verify token is in Keychain
security find-generic-password -s "Claude Code-credentials"
```

**Linux:**
```bash
# Check credentials file exists
ls ~/.claude/.credentials.json

# Verify token is there
jq '.claudeAiOauth.accessToken' ~/.claude/.credentials.json
```

**Test API manually** (both platforms):
```bash
# macOS
TOKEN=$(security find-generic-password -s "Claude Code-credentials" -w)

# Linux
TOKEN=$(jq -r '.claudeAiOauth.accessToken' ~/.claude/.credentials.json)

# Then test
curl -s "https://api.anthropic.com/api/oauth/usage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "anthropic-beta: oauth-2025-04-20" | jq .
```

**Cache location:** `~/.cache/cc-usage-statusline.txt` (delete to force refresh)
