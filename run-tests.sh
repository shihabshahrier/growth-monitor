#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Function to kill process on a given port ---
kill_process_on_port() {
    PORT=$1
    echo "Checking for process on port $PORT..."
    # The command `lsof -t -i:$PORT` returns the PID of the process using the port.
    # The output is suppressed (>/dev/null) and we only care about the exit code.
    if lsof -t -i:$PORT > /dev/null; then
        PID=$(lsof -t -i:$PORT)
        echo "Process found on port $PORT (PID: $PID). Killing it..."
        kill -9 $PID
        sleep 1 # Give it a moment to die
    else
        echo "No process found on port $PORT."
    fi
}

# --- Cleanup function to ensure servers are stopped ---
cleanup() {
    echo ""
    echo "--- Cleaning up ---"
    if kill -0 $API_PID 2>/dev/null; then
        echo "Stopping API server (PID: $API_PID)..."
        kill $API_PID
    fi
    if kill -0 $AI_WORKER_PID 2>/dev/null; then
        echo "Stopping AI worker (PID: $AI_WORKER_PID)..."
        kill $AI_WORKER_PID
    fi
    echo "Cleanup complete."
}

# Register the cleanup function to be called on script exit.
trap cleanup EXIT

# --- Main script ---
echo "--- Preparing Environment ---"
kill_process_on_port 8080 # For API server
kill_process_on_port 8001 # For AI worker

echo ""
echo "--- Checking Services ---"
cd server/api
node scripts/checkServices.js
if [ $? -ne 0 ]; then
    echo "Service checks failed. Exiting."
    exit 1
fi
cd ../..

echo ""
echo "--- Preparing Database ---"
cd server
cd api
npm run prisma:generate
npm run prisma:migrate
echo "Clearing Redis cache for testing..."
node -e "import('ioredis').then(m => { const Redis = m.default; const redis = new Redis(process.env.REDIS_URL); redis.flushdb().then(() => { console.log('Redis cache cleared'); redis.quit(); }).catch(e => { console.log('Redis clear failed (may not be critical):', e.message); redis.quit(); }); });" 2>&1 | grep -E "(cleared|failed)"
cd ../..
cd server

# Start the API server in the background
echo "Starting API server..."
(cd api && npm start) &
API_PID=$!
echo "API server started with PID: $API_PID"

# Start the AI worker in the background
echo "Starting AI worker..."
AI_WORKER_DIR="ai_worker"
VENV_PATH_1="$AI_WORKER_DIR/venv"
VENV_PATH_2="$AI_WORKER_DIR/.venv"
AI_ENV_FILE="$AI_WORKER_DIR/.env"

# Correctly launch uvicorn from the parent 'server' directory
# so that it recognizes 'ai_worker' as a package.
if [ -f "$VENV_PATH_1/bin/activate" ]; then
    echo "Activating Python virtual environment from $VENV_PATH_1..."
    (source "$VENV_PATH_1/bin/activate" && uvicorn ai_worker.main:app --port 8001 --env-file "$AI_ENV_FILE") &
    AI_WORKER_PID=$!
elif [ -f "$VENV_PATH_2/bin/activate" ]; then
    echo "Activating Python virtual environment from $VENV_PATH_2..."
    (source "$VENV_PATH_2/bin/activate" && uvicorn ai_worker.main:app --port 8001 --env-file "$AI_ENV_FILE") &
    AI_WORKER_PID=$!
else
    echo "Warning: Python virtual environment not found."
    echo "Attempting to run 'uvicorn' from the system path."
    (uvicorn ai_worker.main:app --port 8001 --env-file "$AI_ENV_FILE") &
    AI_WORKER_PID=$!
fi
echo "AI worker started with PID: $AI_WORKER_PID"


# Wait for servers to be ready by polling health endpoints
echo "Waiting for servers to become healthy..."
cd api
npx wait-on http://localhost:8080/healthz http://localhost:8001/healthz -t 30000
cd ..

echo "Servers are healthy."
echo ""

# --- Running Tests ---
echo "--- Running End-to-End Tests ---"
TEST_LOG="test_run.log"
# Run the test script from the parent directory (which is now 'server')
API_BASE_URL=http://localhost:8080/api AI_RESULT_TIMEOUT_MS=120000 node api/scripts/testWorkflow.js > $TEST_LOG 2>&1
TEST_EXIT_CODE=$?

# --- Final Verdict ---
echo ""
echo "--- Test Results ---"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    SUCCESS_COUNT=$(grep -c "successful" $TEST_LOG)
    echo "✅ All tests passed!"
    echo "   $SUCCESS_COUNT test cases were successful."
    echo ""
    echo "--- Test Log ---"
    cat $TEST_LOG
else
    echo "❌ Tests failed."
    echo "   Please review the logs below for details."
    echo ""
    echo "--- Error Log ---"
    cat $TEST_LOG
fi

rm $TEST_LOG
exit $TEST_EXIT_CODE
