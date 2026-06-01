#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# setup.sh — One-time environment setup
# ─────────────────────────────────────────────────────────────────
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[setup] Creating Python virtual environment…"
python3 -m venv "$SCRIPT_DIR/venv"
source "$SCRIPT_DIR/venv/bin/activate"

echo "[setup] Installing dependencies…"
pip install --upgrade pip
pip install -r "$SCRIPT_DIR/requirements.txt"

echo ""
echo "✅  Setup complete."
echo ""
echo "Next steps:"
echo "  1. Train the model (downloads dataset automatically):"
echo "     python scripts/train.py"
echo ""
echo "  2. Start the server:"
echo "     ./start.sh"
echo ""
echo "  3. Test it:"
echo "     curl http://localhost:8081/api/healthcheck"
