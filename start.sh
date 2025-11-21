#!/bin/bash

# GrowthMonitor - Comprehensive Startup Script
# This script starts all services: Frontend, API Server, and AI Worker

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Log functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           🚀 GrowthMonitor Startup Script            ║
║                                                       ║
║   Starting: Frontend + API Server + AI Worker        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    log_warning ".env file not found in root directory"
    log_info "Checking individual service .env files..."
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        log_warning "Killing existing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Check and setup Python virtual environment for AI Worker
setup_ai_worker_venv() {
    log_info "Setting up AI Worker Python environment..."
    
    cd "$PROJECT_ROOT/server/ai_worker"
    
    # Check if venv exists
    if [ -d ".venv" ]; then
        log_success "Virtual environment already exists"
    else
        log_info "Creating new virtual environment..."
        python3 -m venv .venv
        log_success "Virtual environment created"
    fi
    
    # Activate venv and install dependencies
    source .venv/bin/activate
    
    log_info "Installing/updating Python dependencies..."
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    
    log_success "AI Worker environment ready"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        log_warning "AI Worker .env file not found"
        if [ -f ".env.example" ]; then
            log_info "Copying .env.example to .env"
            cp .env.example .env
            log_warning "Please update .env with your credentials (especially GEMINI_API_KEY)"
        fi
    fi
    
    deactivate
    cd "$PROJECT_ROOT"
}

# Setup API Server
setup_api_server() {
    log_info "Setting up API Server..."
    
    cd "$PROJECT_ROOT/server/api"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        log_warning "API Server .env file not found"
        if [ -f ".env.example" ]; then
            log_info "Copying .env.example to .env"
            cp .env.example .env
            log_warning "Please update .env with your credentials"
        fi
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_info "Installing API Server dependencies..."
        npm install
        log_success "API Server dependencies installed"
    else
        log_success "API Server dependencies already installed"
    fi
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    npx prisma generate
    
    log_success "API Server setup complete"
    cd "$PROJECT_ROOT"
}

# Setup Frontend
setup_frontend() {
    log_info "Setting up Frontend..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        log_warning "Frontend .env file not found"
        if [ -f ".env.example" ]; then
            log_info "Creating .env file"
            echo "VITE_API_URL=http://localhost:8080/api" > .env
            log_success "Frontend .env created"
        fi
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log_info "Installing Frontend dependencies..."
        npm install
        log_success "Frontend dependencies installed"
    else
        log_success "Frontend dependencies already installed"
    fi
    
    cd "$PROJECT_ROOT"
}

# Start AI Worker
start_ai_worker() {
    log_info "Starting AI Worker on port 8000..."
    
    cd "$PROJECT_ROOT/server/ai_worker"
    
    # Check if port is in use
    if check_port 8000; then
        log_warning "Port 8000 is already in use"
        read -p "Kill existing process? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port 8000
        else
            log_error "Cannot start AI Worker - port 8000 is in use"
            return 1
        fi
    fi
    
    source .venv/bin/activate
    
    log_info "AI Worker starting..."
    python main.py > "$PROJECT_ROOT/logs/ai_worker.log" 2>&1 &
    AI_WORKER_PID=$!
    echo $AI_WORKER_PID > "$PROJECT_ROOT/logs/ai_worker.pid"
    
    deactivate
    
    sleep 2
    
    # Check if process is running
    if ps -p $AI_WORKER_PID > /dev/null; then
        log_success "AI Worker started (PID: $AI_WORKER_PID)"
        log_info "AI Worker logs: $PROJECT_ROOT/logs/ai_worker.log"
    else
        log_error "AI Worker failed to start"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Start API Server
start_api_server() {
    log_info "Starting API Server on port 8080..."
    
    cd "$PROJECT_ROOT/server/api"
    
    # Check if port is in use
    if check_port 8080; then
        log_warning "Port 8080 is already in use"
        read -p "Kill existing process? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port 8080
        else
            log_error "Cannot start API Server - port 8080 is in use"
            return 1
        fi
    fi
    
    log_info "API Server starting..."
    npm run dev > "$PROJECT_ROOT/logs/api_server.log" 2>&1 &
    API_SERVER_PID=$!
    echo $API_SERVER_PID > "$PROJECT_ROOT/logs/api_server.pid"
    
    sleep 3
    
    # Check if process is running
    if ps -p $API_SERVER_PID > /dev/null; then
        log_success "API Server started (PID: $API_SERVER_PID)"
        log_info "API Server logs: $PROJECT_ROOT/logs/api_server.log"
    else
        log_error "API Server failed to start"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Start Frontend
start_frontend() {
    log_info "Starting Frontend on port 5173..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Check if port is in use
    if check_port 5173; then
        log_warning "Port 5173 is already in use"
        read -p "Kill existing process? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill_port 5173
        else
            log_error "Cannot start Frontend - port 5173 is in use"
            return 1
        fi
    fi
    
    log_info "Frontend starting..."
    npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"
    
    sleep 2
    
    # Check if process is running
    if ps -p $FRONTEND_PID > /dev/null; then
        log_success "Frontend started (PID: $FRONTEND_PID)"
        log_info "Frontend logs: $PROJECT_ROOT/logs/frontend.log"
    else
        log_error "Frontend failed to start"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Health check function
health_check() {
    log_info "Performing health checks..."
    
    sleep 3
    
    # Check AI Worker
    if curl -s http://localhost:8000/healthz > /dev/null 2>&1; then
        log_success "✓ AI Worker is healthy"
    else
        log_warning "✗ AI Worker health check failed"
    fi
    
    # Check API Server
    if curl -s http://localhost:8080/healthz > /dev/null 2>&1; then
        log_success "✓ API Server is healthy"
    else
        log_warning "✗ API Server health check failed"
    fi
    
    # Check Frontend
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        log_success "✓ Frontend is healthy"
    else
        log_warning "✗ Frontend health check failed"
    fi
}

# Main execution
main() {
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    log_info "Starting setup phase..."
    
    # Setup all services
    setup_ai_worker_venv
    setup_api_server
    setup_frontend
    
    log_success "Setup phase complete"
    echo ""
    log_info "Starting services..."
    echo ""
    
    # Start all services
    start_ai_worker
    start_api_server
    start_frontend
    
    echo ""
    log_success "All services started successfully!"
    echo ""
    
    # Perform health checks
    health_check
    
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}║              🎉 GrowthMonitor is Running!            ║${NC}"
    echo -e "${GREEN}║                                                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Services:${NC}"
    echo -e "  • Frontend:   ${GREEN}http://localhost:5173${NC}"
    echo -e "  • API Server: ${GREEN}http://localhost:8080${NC}"
    echo -e "  • AI Worker:  ${GREEN}http://localhost:8000${NC}"
    echo ""
    echo -e "${BLUE}Logs:${NC}"
    echo -e "  • Frontend:   ${YELLOW}$PROJECT_ROOT/logs/frontend.log${NC}"
    echo -e "  • API Server: ${YELLOW}$PROJECT_ROOT/logs/api_server.log${NC}"
    echo -e "  • AI Worker:  ${YELLOW}$PROJECT_ROOT/logs/ai_worker.log${NC}"
    echo ""
    echo -e "${BLUE}To stop all services:${NC}"
    echo -e "  ${YELLOW}./stop.sh${NC}"
    echo ""
    echo -e "${BLUE}To view logs:${NC}"
    echo -e "  ${YELLOW}tail -f logs/frontend.log${NC}"
    echo -e "  ${YELLOW}tail -f logs/api_server.log${NC}"
    echo -e "  ${YELLOW}tail -f logs/ai_worker.log${NC}"
    echo ""
}

# Run main function
main
