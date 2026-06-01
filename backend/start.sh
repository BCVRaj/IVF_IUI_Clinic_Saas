#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# start.sh — Start the Embryo Grading API server
# ─────────────────────────────────────────────────────────────────
set -e

PORT="${PORT:-8081}"
WORKERS="${WEB_CONCURRENCY:-2}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=========================================="
echo "  Embryo Grading API"
echo "  VGG16 Blastocyst Grader (MMSP2019)"
echo "  Port: $PORT | Workers: $WORKERS"
echo "=========================================="

# Activate venv if present
if [ -d "$SCRIPT_DIR/venv" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
    echo "[start] Using venv: $SCRIPT_DIR/venv"
elif [ -d "$SCRIPT_DIR/../embryo-venv" ]; then
    source "$SCRIPT_DIR/../embryo-venv/bin/activate"
    echo "[start] Using venv: $SCRIPT_DIR/../embryo-venv"
fi

# Check for trained weights
WEIGHTS="$SCRIPT_DIR/models/blastocyst_grader.pt"
if [ ! -f "$WEIGHTS" ]; then
    echo ""
    echo "⚠️  WARNING: No trained weights found at $WEIGHTS"
    echo "   The server will start in MOCK mode (returns demo predictions)."
    echo "   To enable real inference, run:"
    echo "     python scripts/train.py"
    echo ""
fi

# Environment
export PYTHONPATH="$SCRIPT_DIR/src:$PYTHONPATH"
export PORT="$PORT"
export USERS_DICT='{"admin": "embryo2024", "test": "test123"}'
export FEMI_INTERNAL_KEY="femi-internal-2024"

# Use uvicorn directly (single process) — gunicorn's fork() breaks MPS on Apple Silicon
cd "$SCRIPT_DIR/src"
if [ "$1" = "--dev" ]; then
    echo "[start] Development mode (auto-reload)…"
    exec uvicorn app:app --host 0.0.0.0 --port "$PORT" --reload
else
    echo "[start] Production mode (uvicorn, single process)…"
    exec uvicorn app:app --host 0.0.0.0 --port "$PORT" --workers 1
fi
