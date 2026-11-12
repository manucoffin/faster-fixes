#!/bin/sh
# Runs the web dev server in the background: `start` returns once it answers,
# `stop` ends it, `status` reports it.
#
# Cloud mode is forced on: a checkout without apps/web/.env, such as a
# Sandcastle worktree, would otherwise redirect the marketing routes (/,
# /pricing, /docs, /blog) to /login, as a self-hosted instance does.
#
# Next allows one dev server per app and records its PID and URL in
# .next/dev/lock, so the PID comes from there. Matching the command line, as
# `pkill -f "next dev"` does, also matches the shell that runs the command.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
WEB="$ROOT/apps/web"
LOCK="$WEB/.next/dev/lock"
OUT="${TMPDIR:-/tmp}/faster-fixes-dev-server.log"
NEXT_LOG="$WEB/.next/dev/logs/next-development.log"

lock_field() {
  [ -s "$LOCK" ] || return 1
  node -e 'const v = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))[process.argv[2]]; if (v === undefined) process.exit(1); console.log(v)' "$LOCK" "$1" 2>/dev/null
}

running_pid() {
  pid=$(lock_field pid) || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  echo "$pid"
}

http_code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time "${2:-5}" "$1" || true
}

report() {
  echo "Dev server running at $(lock_field appUrl) (PID $1)."
  echo "Server log: $NEXT_LOG"
}

start() {
  if pid=$(running_pid); then
    report "$pid"
    return
  fi

  cd "$WEB"
  NEXT_PUBLIC_IS_CLOUD=true nohup pnpm dev >"$OUT" 2>&1 &
  launcher=$!

  # The first run builds the Recording player bundle before Next starts.
  i=0
  while [ $i -lt 180 ]; do
    if pid=$(running_pid); then
      url=$(lock_field appUrl)
      if [ "$(http_code "$url/login")" != 000 ]; then
        report "$pid"
        return
      fi
    elif ! kill -0 "$launcher" 2>/dev/null; then
      echo "The dev server exited during startup. Output, from $OUT:" >&2
      tail -n 40 "$OUT" >&2
      exit 1
    fi
    sleep 1
    i=$((i + 1))
  done
  echo "The dev server did not answer within 3 minutes. Output: $OUT" >&2
  exit 1
}

stop() {
  if ! pid=$(running_pid); then
    echo "No dev server is running."
    return
  fi
  kill "$pid"
  i=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ $i -ge 20 ]; then
      kill -9 "$pid" 2>/dev/null || true
      break
    fi
    sleep 0.5
    i=$((i + 1))
  done
  echo "Dev server stopped (PID $pid)."
}

status() {
  if pid=$(running_pid); then
    report "$pid"
  else
    echo "No dev server is running."
  fi
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  *)
    echo "Usage: pnpm dev:server start|stop|status" >&2
    exit 2
    ;;
esac
