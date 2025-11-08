#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Cleanup function to ensure all servers are stopped ---
cleanup() {
    echo ""
    echo "--- Shutting down all servers ---"
    # Use kill 0 to check if the process exists before trying to kill it
    if kill -0 $API_PID 2>/dev/null; then
        echo "Stopping API server (PID: $API_PID)..."
        kill $API_PID
    fi
    if kill -0 $AI_WORKER_PID 2>/dev/null; then
        echo "Stopping AI worker (PID: $AI_WORKER_PID)..."
        kill $AI_WORKER_PID
    fi
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping Frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    echo "Cleanup complete."
}

# Register the cleanup function to be called on script exit (e.g., Ctrl+C)
trap cleanup EXIT

# --- Main script ---
echo "--- Starting All Servers ---"

# 1. Start the API server in the background
echo "➡️  Starting API server on port 8080..."
(cd server/api && npm run dev) &
API_PID=$!
echo "   ✅ API server started with PID: $API_PID"

# 2. Start the AI worker in the background
echo "➡️  Starting AI worker on port 8001..."
AI_WORKER_DIR="server/ai_worker"
VENV_PATH="$AI_WORKER_DIR/.venv"
AI_ENV_FILE="$(pwd)/server/ai_worker/.env"

if [ -f "$VENV_PATH/bin/activate" ]; then
    (source "$VENV_PATH/bin/activate" && cd server && uvicorn ai_worker.main:app --port 8001 --env-file "$AI_ENV_FILE") &
    AI_WORKER_PID=$!
    echo "   ✅ AI worker started with PID: $AI_WORKER_PID"
else
    echo "   ❌ Error: Python virtual environment not found at $VENV_PATH"
    exit 1
fi

# 3. Start the Frontend server in the background
echo "➡️  Starting Frontend server..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!
echo "   ✅ Frontend server started with PID: $FRONTEND_PID"

echo ""
echo "🚀 All servers are running in the background."
echo "   - API Server: http://localhost:8080"
echo "   - AI Worker:  http://localhost:8001"
echo "   - Frontend:   (Check terminal output for URL, likely http://localhost:5173)"
echo ""
echo "Press Ctrl+C to stop all servers."

# Wait indefinitely until the script is terminated
wait
