#!/bin/bash

#############################################
# GrowthMonitor - Run All Servers
# Start backend API, frontend, and AI worker
#############################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Ports
BACKEND_PORT=8080
FRONTEND_PORT=5173
AI_WORKER_PORT=8000

# Directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/server/api"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
AI_WORKER_DIR="$SCRIPT_DIR/server/ai_worker"

# PIDs
BACKEND_PID=""
FRONTEND_PID=""
AI_WORKER_PID=""

echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   GrowthMonitor - Server Manager                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

#############################################
# Function: Check if port is in use
#############################################
check_port() {
    local port=$1
    local process=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$process" ]; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

#############################################
# Function: Kill process on port
#############################################
kill_port() {
    local port=$1
    local process=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$process" ]; then
        echo -e "  ${YELLOW}⚠${NC}  Killing existing process on port $port (PID: $process)"
        kill -9 $process 2>/dev/null || true
        sleep 1
    fi
}

#############################################
# Function: Check service health
#############################################
check_service_health() {
    local name=$1
    local url=$2
    local max_attempts=30
    
    echo -e "  ${BLUE}→${NC} Checking if $name is ready..."
    
    for i in $(seq 1 $max_attempts); do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name is ready!"
            return 0
        fi
        
        if [ $i -eq $max_attempts ]; then
            echo -e "  ${RED}✗${NC} $name failed to start (timeout)"
            return 1
        fi
        
        sleep 1
        echo -n "."
    done
}

#############################################
# Function: Cleanup on exit
#############################################
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Shutting down all services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "  Stopping backend (PID: $BACKEND_PID)"
        kill -TERM $BACKEND_PID 2>/dev/null || true
    fi
    kill_port $BACKEND_PORT
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "  Stopping frontend (PID: $FRONTEND_PID)"
        kill -TERM $FRONTEND_PID 2>/dev/null || true
    fi
    kill_port $FRONTEND_PORT
    
    if [ ! -z "$AI_WORKER_PID" ]; then
        echo "  Stopping AI worker (PID: $AI_WORKER_PID)"
        kill -TERM $AI_WORKER_PID 2>/dev/null || true
    fi
    kill_port $AI_WORKER_PORT
    
    echo -e "${GREEN}✓${NC} All services stopped"
    exit 0
}

# Register cleanup on exit
trap cleanup EXIT INT TERM

#############################################
# Step 1: Check Service Status
#############################################
echo -e "${BLUE}📊 Step 1: Checking service status...${NC}"
echo "----------------------------------------"

BACKEND_RUNNING=false
FRONTEND_RUNNING=false
AI_WORKER_RUNNING=false

if check_port $BACKEND_PORT; then
    if curl -s http://localhost:$BACKEND_PORT/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend API is already running on port $BACKEND_PORT"
        BACKEND_RUNNING=true
    else
        echo -e "${YELLOW}⚠${NC}  Port $BACKEND_PORT is in use but service not responding"
        kill_port $BACKEND_PORT
    fi
else
    echo -e "${YELLOW}○${NC} Backend API is not running"
fi

if check_port $FRONTEND_PORT; then
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend is already running on port $FRONTEND_PORT"
        FRONTEND_RUNNING=true
    else
        echo -e "${YELLOW}⚠${NC}  Port $FRONTEND_PORT is in use but service not responding"
        kill_port $FRONTEND_PORT
    fi
else
    echo -e "${YELLOW}○${NC} Frontend is not running"
fi

if check_port $AI_WORKER_PORT; then
    if curl -s http://localhost:$AI_WORKER_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} AI Worker is already running on port $AI_WORKER_PORT"
        AI_WORKER_RUNNING=true
    else
        echo -e "${YELLOW}⚠${NC}  Port $AI_WORKER_PORT is in use but service not responding"
        kill_port $AI_WORKER_PORT
    fi
else
    echo -e "${YELLOW}○${NC} AI Worker is not running"
fi

echo ""

#############################################
# Step 2: Start Backend API
#############################################
if [ "$BACKEND_RUNNING" = false ]; then
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
    npm run dev > "$SCRIPT_DIR/backend-dev.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait for health check
    if check_service_health "Backend API" "http://localhost:$BACKEND_PORT/healthz"; then
        echo -e "  ${CYAN}→${NC} Backend running at: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
        echo -e "  ${CYAN}→${NC} Logs: $SCRIPT_DIR/backend-dev.log"
    else
        echo -e "  ${RED}✗${NC} Failed to start backend"
        echo -e "  ${CYAN}→${NC} Check logs: $SCRIPT_DIR/backend-dev.log"
        exit 1
    fi
    
    echo ""
else
    echo -e "${GREEN}✓${NC} Backend API already running"
    echo ""
fi

#############################################
# Step 3: Start Frontend
#############################################
if [ "$FRONTEND_RUNNING" = false ]; then
    echo -e "${BLUE}🎨 Step 3: Starting Frontend...${NC}"
    echo "----------------------------------------"
    
    cd "$FRONTEND_DIR"
    
    # Check if dependencies installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠${NC}  Installing frontend dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    # Start frontend in background
    echo "  Starting frontend server..."
    npm run dev > "$SCRIPT_DIR/frontend-dev.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for health check (check both possible ports)
    sleep 3
    
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Frontend is ready!"
        echo -e "  ${CYAN}→${NC} Frontend running at: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
        echo -e "  ${CYAN}→${NC} Logs: $SCRIPT_DIR/frontend-dev.log"
    elif curl -s http://localhost:5174 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Frontend is ready!"
        echo -e "  ${CYAN}→${NC} Frontend running at: ${GREEN}http://localhost:5174${NC}"
        echo -e "  ${CYAN}→${NC} Logs: $SCRIPT_DIR/frontend-dev.log"
    else
        echo -e "  ${YELLOW}⚠${NC}  Frontend might be starting up..."
        echo -e "  ${CYAN}→${NC} Check logs: $SCRIPT_DIR/frontend-dev.log"
    fi
    
    echo ""
else
    echo -e "${GREEN}✓${NC} Frontend already running"
    echo ""
fi

#############################################
# Step 4: Start AI Worker (Optional)
#############################################
if [ "$AI_WORKER_RUNNING" = false ]; then
    if [ -d "$AI_WORKER_DIR" ]; then
        echo -e "${BLUE}🤖 Step 4: Starting AI Worker...${NC}"
        echo "----------------------------------------"
        
        # Check if Redis URL is configured (supports both local and cloud Redis like Upstash)
        if [ -f "$AI_WORKER_DIR/.env" ] && grep -q "REDIS_URL=" "$AI_WORKER_DIR/.env" 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Redis configured (local or cloud)"
        else
            echo -e "  ${YELLOW}⚠${NC}  REDIS_URL not found in .env. AI Worker requires Redis."
            echo -e "  ${CYAN}→${NC} Add REDIS_URL to server/ai_worker/.env"
            echo ""
        fi
        
        cd "$AI_WORKER_DIR"
        
        # Check if Python virtual environment exists
        VENV_PATH=""
        if [ -d ".venv" ]; then
            VENV_PATH=".venv"
        elif [ -d "venv" ]; then
            VENV_PATH="venv"
        fi
        
        if [ ! -z "$VENV_PATH" ]; then
            echo "  Activating Python virtual environment ($VENV_PATH)..."
            source "$VENV_PATH/bin/activate"
            
            # Check if dependencies installed
            if ! python -c "import fastapi" 2>/dev/null; then
                echo -e "  ${YELLOW}⚠${NC}  Installing Python dependencies..."
                pip install -r requirements.txt > /dev/null 2>&1
            fi
            
            # Start AI worker in background
            echo "  Starting AI worker..."
            python main.py > "$SCRIPT_DIR/ai-worker-dev.log" 2>&1 &
            AI_WORKER_PID=$!
            
            # Wait for AI worker to start
            echo "  Waiting for AI worker to be ready..."
            for i in {1..15}; do
                if check_port $AI_WORKER_PORT; then
                    echo -e "  ${GREEN}✓${NC} AI Worker started!"
                    echo -e "  ${CYAN}→${NC} AI Worker running at: ${GREEN}http://localhost:$AI_WORKER_PORT${NC}"
                    echo -e "  ${CYAN}→${NC} Logs: $SCRIPT_DIR/ai-worker-dev.log"
                    break
                fi
                if [ $i -eq 15 ]; then
                    echo -e "  ${YELLOW}⚠${NC}  AI Worker might be starting up..."
                    echo -e "  ${CYAN}→${NC} Check logs: $SCRIPT_DIR/ai-worker-dev.log"
                fi
                sleep 1
                echo -n "."
            done
            echo ""
        else
            echo -e "  ${YELLOW}⚠${NC}  Python virtual environment not found. Skipping AI Worker."
            echo -e "  ${CYAN}→${NC} To setup: cd $AI_WORKER_DIR && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
        fi
        
        echo ""
    else
        echo -e "${YELLOW}⚠${NC}  AI Worker directory not found. Skipping."
        echo ""
    fi
else
    echo -e "${GREEN}✓${NC} AI Worker already running"
    echo ""
fi

#############################################
# Summary
#############################################
echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   All Services Running                             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Services Status:${NC}"
echo ""

# Backend
if check_port $BACKEND_PORT; then
    echo -e "  ${GREEN}●${NC} Backend API:  http://localhost:$BACKEND_PORT"
else
    echo -e "  ${RED}●${NC} Backend API:  ${RED}Not running${NC}"
fi

# Frontend
if check_port $FRONTEND_PORT; then
    echo -e "  ${GREEN}●${NC} Frontend:     http://localhost:$FRONTEND_PORT"
elif check_port 5174; then
    echo -e "  ${GREEN}●${NC} Frontend:     http://localhost:5174"
else
    echo -e "  ${RED}●${NC} Frontend:     ${RED}Not running${NC}"
fi

# AI Worker
if check_port $AI_WORKER_PORT; then
    echo -e "  ${GREEN}●${NC} AI Worker:    http://localhost:$AI_WORKER_PORT"
else
    echo -e "  ${YELLOW}●${NC} AI Worker:    ${YELLOW}Not running${NC}"
fi

echo ""
echo -e "${CYAN}📝 Logs:${NC}"
echo "  Backend:  tail -f $SCRIPT_DIR/backend-dev.log"
echo "  Frontend: tail -f $SCRIPT_DIR/frontend-dev.log"
if [ ! -z "$AI_WORKER_PID" ]; then
    echo "  AI Worker: tail -f $SCRIPT_DIR/ai-worker-dev.log"
fi

echo ""
echo -e "${CYAN}🔑 Test Credentials:${NC}"
echo "  Email:    demo@growthmonitor.ai"
echo "  Password: password123"

echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services...${NC}"
echo ""

# Keep script running
wait
