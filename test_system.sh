#!/bin/bash

# Comprehensive System Test Script for GrowthMonitor
# Tests: Database, Redis, Gemini API, Backend API, Frontend, AI Worker

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Test 1: Check Prerequisites
print_header "1. CHECKING PREREQUISITES"

print_test "Checking Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found"
fi

print_test "Checking Python..."
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python installed: $PYTHON_VERSION"
else
    print_error "Python not found"
fi

print_test "Checking PostgreSQL..."
if command_exists psql; then
    PSQL_VERSION=$(psql --version)
    print_success "PostgreSQL installed: $PSQL_VERSION"
else
    print_error "PostgreSQL not found"
fi

print_test "Checking Redis..."
if command_exists redis-cli; then
    REDIS_VERSION=$(redis-cli --version)
    print_success "Redis installed: $REDIS_VERSION"
else
    print_error "Redis not found"
fi

# Test 2: Check Environment Files
print_header "2. CHECKING ENVIRONMENT FILES"

print_test "Checking server/api/.env..."
if [ -f "server/api/.env" ]; then
    print_success "API .env exists"
else
    print_error "API .env not found"
fi

print_test "Checking server/ai_worker/.env..."
if [ -f "server/ai_worker/.env" ]; then
    print_success "AI Worker .env exists"
else
    print_error "AI Worker .env not found"
fi

print_test "Checking frontend/.env..."
if [ -f "frontend/.env" ]; then
    print_success "Frontend .env exists"
else
    print_info "Frontend .env not found (optional)"
fi

# Test 3: Check Database Connection
print_header "3. TESTING DATABASE CONNECTION"

print_test "Checking PostgreSQL service..."
if pg_isready -q; then
    print_success "PostgreSQL is running"
    
    print_test "Testing database connection..."
    if psql -U postgres -d growthmonitor -c "SELECT 1;" >/dev/null 2>&1; then
        print_success "Database 'growthmonitor' is accessible"
    else
        print_error "Cannot connect to database 'growthmonitor'"
    fi
else
    print_error "PostgreSQL is not running"
fi

# Test 4: Check Redis Connection
print_header "4. TESTING REDIS CONNECTION"

print_test "Checking Redis service..."
if redis-cli ping >/dev/null 2>&1; then
    print_success "Redis is running"
    
    print_test "Testing Redis operations..."
    redis-cli SET test_key "test_value" >/dev/null 2>&1
    REDIS_VALUE=$(redis-cli GET test_key 2>/dev/null)
    redis-cli DEL test_key >/dev/null 2>&1
    
    if [ "$REDIS_VALUE" = "test_value" ]; then
        print_success "Redis read/write operations work"
    else
        print_error "Redis operations failed"
    fi
else
    print_error "Redis is not running"
fi

# Test 5: Check Gemini API
print_header "5. TESTING GEMINI API"

print_test "Running Gemini API test..."
python3 test_gemini_api.py > /tmp/gemini_test.log 2>&1

if grep -q "All tests passed" /tmp/gemini_test.log; then
    print_success "Gemini API is working"
else
    print_error "Gemini API test failed"
    print_info "Check /tmp/gemini_test.log for details"
fi

# Test 6: Check API Server
print_header "6. TESTING API SERVER"

print_test "Checking if API server is running on port 8080..."
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_success "API server is running on port 8080"
    
    print_test "Testing API health endpoint..."
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/healthz)
    if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
    fi
    
    print_test "Testing API CORS headers..."
    CORS_HEADER=$(curl -s -I http://localhost:8080/api/healthz | grep -i "access-control-allow-origin")
    if [ -n "$CORS_HEADER" ]; then
        print_success "CORS headers present"
    else
        print_error "CORS headers missing"
    fi
else
    print_error "API server is not running on port 8080"
fi

# Test 7: Check AI Worker
print_header "7. TESTING AI WORKER"

print_test "Checking if AI worker is running on port 8000..."
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_success "AI worker is running on port 8000"
    
    print_test "Testing AI worker health endpoint..."
    AI_HEALTH=$(curl -s http://localhost:8000/healthz)
    if echo "$AI_HEALTH" | grep -q "ok"; then
        print_success "AI worker health check passed"
    else
        print_error "AI worker health check failed"
    fi
else
    print_error "AI worker is not running on port 8000"
fi

# Test 8: Check Frontend
print_header "8. TESTING FRONTEND"

print_test "Checking if frontend is running on port 5173..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_success "Frontend is running on port 5173"
    
    print_test "Testing frontend accessibility..."
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend returned status $FRONTEND_RESPONSE"
    fi
else
    print_error "Frontend is not running on port 5173"
fi

# Test 9: Check Dependencies
print_header "9. CHECKING DEPENDENCIES"

print_test "Checking API server dependencies..."
if [ -d "server/api/node_modules" ]; then
    print_success "API node_modules exists"
else
    print_error "API node_modules not found - run 'npm install' in server/api"
fi

print_test "Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    print_success "Frontend node_modules exists"
else
    print_error "Frontend node_modules not found - run 'npm install' in frontend"
fi

print_test "Checking AI worker virtual environment..."
if [ -d "server/ai_worker/.venv" ]; then
    print_success "AI worker .venv exists"
else
    print_error "AI worker .venv not found - run 'python3 -m venv .venv' in server/ai_worker"
fi

# Test 10: Integration Tests
print_header "10. RUNNING INTEGRATION TESTS"

print_test "Testing authentication flow..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@growthmonitor.ai","password":"password123"}')

if echo "$AUTH_RESPONSE" | grep -q "accessToken"; then
    print_success "Authentication works"
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    print_test "Testing authenticated API call..."
    SALES_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:8080/api/sales/summary)
    
    if echo "$SALES_RESPONSE" | grep -q "success"; then
        print_success "Authenticated API calls work"
    else
        print_error "Authenticated API call failed"
    fi
    
    print_test "Testing AI query endpoint..."
    AI_QUERY_RESPONSE=$(curl -s -X POST http://localhost:8080/api/ai/query \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"query":"test","context":{}}')
    
    if echo "$AI_QUERY_RESPONSE" | grep -q "jobId"; then
        print_success "AI query endpoint works"
    else
        print_error "AI query endpoint failed"
    fi
    
    print_test "Testing conversations endpoint..."
    CONV_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:8080/api/conversations)
    
    if echo "$CONV_RESPONSE" | grep -q "success"; then
        print_success "Conversations endpoint works"
    else
        print_error "Conversations endpoint failed"
    fi
else
    print_error "Authentication failed - cannot run integration tests"
fi

# Test 11: Check Logs
print_header "11. CHECKING LOG FILES"

print_test "Checking API server logs..."
if [ -f "logs/api_server.log" ]; then
    ERRORS=$(grep -c "ERROR" logs/api_server.log 2>/dev/null || echo "0")
    if [ "$ERRORS" -eq 0 ]; then
        print_success "No errors in API server logs"
    else
        print_error "Found $ERRORS errors in API server logs"
    fi
else
    print_info "API server log not found"
fi

print_test "Checking AI worker logs..."
if [ -f "logs/ai_worker.log" ]; then
    ERRORS=$(grep -c "ERROR" logs/ai_worker.log 2>/dev/null || echo "0")
    if [ "$ERRORS" -eq 0 ]; then
        print_success "No errors in AI worker logs"
    else
        print_error "Found $ERRORS errors in AI worker logs"
    fi
else
    print_info "AI worker log not found"
fi

# Test 12: Performance Check
print_header "12. PERFORMANCE CHECKS"

print_test "Testing API response time..."
START_TIME=$(date +%s%N)
curl -s http://localhost:8080/api/healthz >/dev/null 2>&1
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ "$RESPONSE_TIME" -lt 100 ]; then
    print_success "API response time: ${RESPONSE_TIME}ms (excellent)"
elif [ "$RESPONSE_TIME" -lt 500 ]; then
    print_success "API response time: ${RESPONSE_TIME}ms (good)"
else
    print_error "API response time: ${RESPONSE_TIME}ms (slow)"
fi

print_test "Checking database connection pool..."
DB_CONNECTIONS=$(psql -U postgres -d growthmonitor -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='growthmonitor';" 2>/dev/null || echo "0")
print_info "Active database connections: $DB_CONNECTIONS"

print_test "Checking Redis memory usage..."
REDIS_MEMORY=$(redis-cli INFO memory | grep "used_memory_human" | cut -d':' -f2 | tr -d '\r')
print_info "Redis memory usage: $REDIS_MEMORY"

# Final Summary
print_header "TEST SUMMARY"

echo ""
echo -e "${BLUE}Total Tests: $TESTS_TOTAL${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is ready.${NC}"
    echo ""
    echo "You can now:"
    echo "  • Open frontend: http://localhost:5173"
    echo "  • Login: demo@growthmonitor.ai / password123"
    echo "  • Test AI chat functionality"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED!${NC}"
    echo ""
    echo "Please check:"
    echo "  • All services are running (./start.sh)"
    echo "  • Environment files are configured"
    echo "  • Database and Redis are accessible"
    echo ""
    echo "Check logs for details:"
    echo "  • tail -f logs/api_server.log"
    echo "  • tail -f logs/ai_worker.log"
    exit 1
fi
