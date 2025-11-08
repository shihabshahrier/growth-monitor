#!/bin/bash

#############################################
# GrowthMonitor - Master Test Runner
# This script handles everything:
# 1. Port cleanup
# 2. Server startup
# 3. Backend tests
# 4. Frontend tests
# 5. Cleanup
#############################################

# Don't use set -e because our kill_port function returns error codes for logic

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ports
BACKEND_PORT=8080
FRONTEND_PORT=5173
FRONTEND_ALT_PORT=5174
AI_WORKER_PORT=8000

# Directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/server/api"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Log files
BACKEND_LOG="$SCRIPT_DIR/backend.log"
FRONTEND_LOG="$SCRIPT_DIR/frontend.log"
TEST_REPORT="$SCRIPT_DIR/test-report.txt"

# PIDs
BACKEND_PID=""
FRONTEND_PID=""

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   GrowthMonitor - Master Test Runner              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

#############################################
# Function: Kill process on port
#############################################
kill_port() {
    local port=$1
    local process=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$process" ]; then
        echo -e "${YELLOW}⚠${NC}  Killing process on port $port (PID: $process)"
        kill -9 $process 2>/dev/null || true
        sleep 1
        return 0
    else
        echo -e "${GREEN}✓${NC} Port $port is free"
        return 1
    fi
}

#############################################
# Function: Cleanup on exit
#############################################
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        echo "  Stopping backend (PID: $BACKEND_PID)"
        kill -9 $BACKEND_PID 2>/dev/null || true
    fi
    kill_port $BACKEND_PORT
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "  Stopping frontend (PID: $FRONTEND_PID)"
        kill -9 $FRONTEND_PID 2>/dev/null || true
    fi
    kill_port $FRONTEND_PORT
    kill_port $FRONTEND_ALT_PORT
    
    echo -e "${GREEN}✓${NC} Cleanup complete"
}

# Register cleanup on exit
trap cleanup EXIT INT TERM

#############################################
# Step 1: Port Cleanup
#############################################
echo -e "${BLUE}📋 Step 1: Cleaning up ports...${NC}"
echo "----------------------------------------"

kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
kill_port $FRONTEND_ALT_PORT
kill_port $AI_WORKER_PORT

sleep 2
echo ""

#############################################
# Step 2: Start Backend
#############################################
echo -e "${BLUE}🚀 Step 2: Starting Backend API...${NC}"
echo "----------------------------------------"

cd "$BACKEND_DIR"

# Check if dependencies installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Installing backend dependencies..."
    npm install > /dev/null 2>&1
fi

# Generate Prisma client
echo "  Generating Prisma client..."
npm run prisma:generate > /dev/null 2>&1

# Start backend in background
echo "  Starting backend server..."
npm run start > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "  Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend is ready (PID: $BACKEND_PID)"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC} Backend failed to start"
        echo "  Check logs: $BACKEND_LOG"
        exit 1
    fi
    
    sleep 1
    echo -n "."
done

echo ""

#############################################
# Step 3: Seed Database
#############################################
echo -e "${BLUE}🌱 Step 3: Seeding Database...${NC}"
echo "----------------------------------------"

cd "$BACKEND_DIR"
npm run prisma:seed

echo ""

#############################################
# Step 4: Start Frontend
#############################################
echo -e "${BLUE}🎨 Step 4: Starting Frontend...${NC}"
echo "----------------------------------------"

cd "$FRONTEND_DIR"

# Check if dependencies installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi

# Start frontend in background
echo "  Starting frontend server..."
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready (check both possible ports)
echo "  Waiting for frontend to be ready..."
FRONTEND_READY=false
for i in {1..30}; do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        FRONTEND_URL="http://localhost:$FRONTEND_PORT"
        FRONTEND_READY=true
        echo -e "${GREEN}✓${NC} Frontend is ready on port $FRONTEND_PORT (PID: $FRONTEND_PID)"
        break
    elif curl -s http://localhost:$FRONTEND_ALT_PORT > /dev/null 2>&1; then
        FRONTEND_URL="http://localhost:$FRONTEND_ALT_PORT"
        FRONTEND_READY=true
        echo -e "${GREEN}✓${NC} Frontend is ready on port $FRONTEND_ALT_PORT (PID: $FRONTEND_PID)"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC} Frontend failed to start"
        echo "  Check logs: $FRONTEND_LOG"
        exit 1
    fi
    
    sleep 1
    echo -n "."
done

echo ""

#############################################
# Step 5: Run Backend Tests
#############################################
echo -e "${BLUE}🧪 Step 5: Running Backend Integration Tests...${NC}"
echo "=========================================="

cd "$BACKEND_DIR"

if npm test; then
    BACKEND_TEST_RESULT="${GREEN}✓ PASSED${NC}"
    BACKEND_TEST_STATUS=0
else
    BACKEND_TEST_RESULT="${RED}✗ FAILED${NC}"
    BACKEND_TEST_STATUS=1
fi

echo ""

#############################################
# Step 6: Run Frontend Tests
#############################################
echo -e "${BLUE}🤖 Step 6: Running Frontend Automation Tests...${NC}"
echo "=========================================="

cd "$SCRIPT_DIR"

# Check if Python and Selenium are available
if command -v python3 &> /dev/null; then
    # Check if selenium is installed
    if python3 -c "import selenium" 2>/dev/null; then
        echo "  Running Python automation tests..."
        
        if python3 test-frontend-automation.py "$FRONTEND_URL"; then
            FRONTEND_TEST_RESULT="${GREEN}✓ PASSED${NC}"
            FRONTEND_TEST_STATUS=0
        else
            FRONTEND_TEST_RESULT="${RED}✗ FAILED${NC}"
            FRONTEND_TEST_STATUS=1
        fi
    else
        echo -e "${YELLOW}⚠${NC}  Selenium not installed. Skipping frontend automation tests."
        echo "  Install with: pip3 install selenium webdriver-manager"
        FRONTEND_TEST_RESULT="${YELLOW}⊘ SKIPPED${NC}"
        FRONTEND_TEST_STATUS=2
    fi
else
    echo -e "${YELLOW}⚠${NC}  Python3 not found. Skipping frontend automation tests."
    FRONTEND_TEST_RESULT="${YELLOW}⊘ SKIPPED${NC}"
    FRONTEND_TEST_STATUS=2
fi

echo ""

#############################################
# Step 7: Generate Report
#############################################
echo -e "${BLUE}📊 Step 7: Generating Test Report...${NC}"
echo "=========================================="

{
    echo "╔════════════════════════════════════════════════════╗"
    echo "║   GrowthMonitor - Test Report                      ║"
    echo "║   $(date)                       ║"
    echo "╚════════════════════════════════════════════════════╝"
    echo ""
    echo "Services Status:"
    echo "  Backend API:    http://localhost:$BACKEND_PORT  ✓ Running"
    echo "  Frontend:       $FRONTEND_URL  ✓ Running"
    echo ""
    echo "Test Results:"
    echo "  Backend Tests:  $BACKEND_TEST_RESULT"
    echo "  Frontend Tests: $FRONTEND_TEST_RESULT"
    echo ""
    echo "Logs:"
    echo "  Backend:  $BACKEND_LOG"
    echo "  Frontend: $FRONTEND_LOG"
    echo ""
} | tee "$TEST_REPORT"

#############################################
# Final Summary
#############################################
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test Summary                                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Backend Tests:  $BACKEND_TEST_RESULT"
echo -e "  Frontend Tests: $FRONTEND_TEST_RESULT"
echo ""

if [ $BACKEND_TEST_STATUS -eq 0 ] && [ $FRONTEND_TEST_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🚀 Services are still running:"
    echo "   Backend:  http://localhost:$BACKEND_PORT"
    echo "   Frontend: $FRONTEND_URL"
    echo ""
    echo "To stop services, press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
    echo ""
    
    # Keep services running
    echo -e "${YELLOW}Press Ctrl+C to stop all services...${NC}"
    wait
    
    exit 0
elif [ $FRONTEND_TEST_STATUS -eq 2 ]; then
    echo -e "${YELLOW}⚠ Backend tests completed, frontend tests skipped${NC}"
    echo ""
    echo "Services are still running. Press Ctrl+C to stop."
    wait
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the logs above.${NC}"
    echo ""
    echo "Report saved to: $TEST_REPORT"
    exit 1
fi
