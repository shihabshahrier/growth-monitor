#!/bin/bash

# GrowthMonitor - Stop All Services Script

set -e

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
echo -e "${YELLOW}"
cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           🛑 GrowthMonitor Stop Script               ║
║                                                       ║
║   Stopping: Frontend + API Server + AI Worker        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            log_info "Stopping $service_name (PID: $pid)..."
            kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
            sleep 1
            
            if ps -p $pid > /dev/null 2>&1; then
                log_warning "$service_name still running, force killing..."
                kill -9 $pid 2>/dev/null || true
            fi
            
            log_success "$service_name stopped"
        else
            log_warning "$service_name is not running (PID: $pid)"
        fi
        rm -f "$pid_file"
    else
        log_warning "$service_name PID file not found"
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pids" ]; then
        log_info "Killing processes on port $port ($service_name)..."
        echo $pids | xargs kill -9 2>/dev/null || true
        log_success "Port $port cleared"
    fi
}

# Main execution
main() {
    log_info "Stopping all GrowthMonitor services..."
    echo ""
    
    # Stop services by PID files
    stop_service "Frontend" "$PROJECT_ROOT/logs/frontend.pid"
    stop_service "API Server" "$PROJECT_ROOT/logs/api_server.pid"
    stop_service "AI Worker" "$PROJECT_ROOT/logs/ai_worker.pid"
    
    echo ""
    log_info "Ensuring all ports are cleared..."
    
    # Kill any remaining processes on the ports
    kill_port 5173 "Frontend"
    kill_port 8080 "API Server"
    kill_port 8000 "AI Worker"
    
    echo ""
    log_success "All services stopped successfully!"
    echo ""
    
    # Check if any processes are still running
    local still_running=false
    
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port 5173 (Frontend) is still in use"
        still_running=true
    fi
    
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port 8080 (API Server) is still in use"
        still_running=true
    fi
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port 8000 (AI Worker) is still in use"
        still_running=true
    fi
    
    if [ "$still_running" = false ]; then
        echo -e "${GREEN}✓ All ports are clear${NC}"
    fi
    
    echo ""
    log_info "To start services again, run: ${GREEN}./start.sh${NC}"
    echo ""
}

# Run main function
main
