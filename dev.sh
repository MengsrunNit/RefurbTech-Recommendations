#!/usr/bin/env bash
set -euo pipefail

# Move to the directory of this script
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting backend and frontend..."

# Start backend
(
  cd "$ROOT_DIR/server"
  echo "🟢 Starting backend..."
  npm start
) &

BACK_PID=$!

# Start frontend
(
  cd "$ROOT_DIR/web"
  echo "🔵 Starting frontend..."
  npm run dev
) &

FRONT_PID=$!

echo "✅ Both servers are running."
echo "   Backend PID: $BACK_PID"
echo "   Frontend PID: $FRONT_PID"
echo "   Press Ctrl+C to stop both."

cleanup() {
  echo -e "\n🛑 Stopping servers..."
  kill $BACK_PID $FRONT_PID 2>/dev/null || true
  wait $BACK_PID $FRONT_PID 2>/dev/null || true
  echo "✅ All stopped."
}
trap cleanup SIGINT SIGTERM EXIT

wait
