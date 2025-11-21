#!/usr/bin/env python3
"""
Comprehensive Integration Test Suite for GrowthMonitor
Tests the complete flow: Frontend → API → Redis → AI Worker → Gemini API
"""

import os
import sys
import time
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080")
API_URL = f"{API_BASE_URL}/api"
AI_WORKER_URL = os.getenv("AI_WORKER_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Test credentials
TEST_EMAIL = "demo@growthmonitor.ai"
TEST_PASSWORD = "password123"

# Test results
tests_passed = 0
tests_failed = 0
test_results = []


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str):
    print(f"\n{Colors.BLUE}{'=' * 60}{Colors.END}")
    print(f"{Colors.BLUE}{text}{Colors.END}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.END}")


def print_test(text: str):
    print(f"{Colors.YELLOW}▶ {text}{Colors.END}")


def print_success(text: str):
    global tests_passed
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")
    tests_passed += 1
    test_results.append({"test": text, "status": "PASS"})


def print_error(text: str, error: Optional[str] = None):
    global tests_failed
    print(f"{Colors.RED}❌ {text}{Colors.END}")
    if error:
        print(f"{Colors.RED}   Error: {error}{Colors.END}")
    tests_failed += 1
    test_results.append({"test": text, "status": "FAIL", "error": error})


def print_info(text: str):
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")


def test_database_connection():
    """Test PostgreSQL database connection"""
    print_header("1. DATABASE CONNECTION TEST")
    
    try:
        import psycopg2
        from dotenv import load_dotenv
        
        # Load environment from API server
        env_path = os.path.join(os.path.dirname(__file__), 'server', 'api', '.env')
        load_dotenv(env_path)
        
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            print_error("DATABASE_URL not found in environment")
            return False
        
        print_test("Connecting to PostgreSQL...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        
        print_test("Testing database query...")
        cursor.execute("SELECT COUNT(*) FROM \"User\"")
        user_count = cursor.fetchone()[0]
        print_success(f"Database connected - Found {user_count} users")
        
        print_test("Checking tables...")
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [row[0] for row in cursor.fetchall()]
        expected_tables = ['User', 'Company', 'Sale', 'Campaign', 'Customer', 'Conversation', 'Message']
        
        missing_tables = [t for t in expected_tables if t not in tables]
        if missing_tables:
            print_error(f"Missing tables: {', '.join(missing_tables)}")
        else:
            print_success(f"All required tables exist ({len(tables)} total)")
        
        cursor.close()
        conn.close()
        return True
        
    except ImportError:
        print_error("psycopg2 not installed", "Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print_error("Database connection failed", str(e))
        return False


def test_redis_connection():
    """Test Redis connection and operations"""
    print_header("2. REDIS CONNECTION TEST")
    
    try:
        import redis
        from dotenv import load_dotenv
        
        env_path = os.path.join(os.path.dirname(__file__), 'server', 'api', '.env')
        load_dotenv(env_path)
        
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        
        print_test("Connecting to Redis...")
        r = redis.from_url(redis_url, decode_responses=True)
        
        print_test("Testing Redis PING...")
        if r.ping():
            print_success("Redis PING successful")
        
        print_test("Testing Redis SET/GET...")
        test_key = f"test_{int(time.time())}"
        r.set(test_key, "test_value", ex=10)
        value = r.get(test_key)
        r.delete(test_key)
        
        if value == "test_value":
            print_success("Redis SET/GET operations work")
        else:
            print_error("Redis operations failed")
        
        print_test("Checking AI job queue...")
        queue_length = r.llen('ai_jobs')
        print_info(f"AI jobs queue length: {queue_length}")
        
        print_test("Checking Redis keys...")
        ai_keys = r.keys('ai_*')
        print_info(f"Found {len(ai_keys)} AI-related keys")
        
        return True
        
    except ImportError:
        print_error("redis not installed", "Run: pip install redis")
        return False
    except Exception as e:
        print_error("Redis connection failed", str(e))
        return False


def test_api_server():
    """Test API server endpoints"""
    print_header("3. API SERVER TEST")
    
    try:
        print_test("Testing health endpoint...")
        response = requests.get(f"{API_BASE_URL}/healthz", timeout=5)
        if response.status_code == 200:
            print_success("API health check passed")
        else:
            print_error(f"Health check failed with status {response.status_code}")
            return None
        
        print_test("Testing authentication...")
        auth_response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=10
        )
        
        if auth_response.status_code == 200:
            data = auth_response.json()
            if 'accessToken' in data:
                access_token = data['accessToken']
                print_success("Authentication successful")
                return access_token
            else:
                print_error("No access token in response")
                return None
        else:
            print_error(f"Authentication failed with status {auth_response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        print_error("API server connection failed", str(e))
        return None


def test_authenticated_endpoints(access_token: str):
    """Test authenticated API endpoints"""
    print_header("4. AUTHENTICATED ENDPOINTS TEST")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        print_test("Testing analytics overview endpoint...")
        response = requests.get(f"{API_URL}/analytics/overview", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Analytics overview retrieved")
            print_info(f"Response keys: {list(data.keys())}")
        else:
            print_error(f"Analytics overview failed with status {response.status_code}")
        
        print_test("Testing campaigns endpoint...")
        response = requests.get(f"{API_URL}/campaigns", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            campaigns = data.get('data', [])
            print_success(f"Campaigns retrieved ({len(campaigns)} campaigns)")
        else:
            print_error(f"Campaigns failed with status {response.status_code}")
        
        print_test("Testing customers endpoint...")
        response = requests.get(f"{API_URL}/customers", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            customers = data.get('data', [])
            print_success(f"Customers retrieved ({len(customers)} customers)")
        else:
            print_error(f"Customers failed with status {response.status_code}")
        
        print_test("Testing conversations endpoint...")
        response = requests.get(f"{API_URL}/conversations", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            conversations = data.get('data', [])
            print_success(f"Conversations retrieved ({len(conversations)} conversations)")
        else:
            print_error(f"Conversations failed with status {response.status_code}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_error("Authenticated endpoint test failed", str(e))
        return False


def test_ai_worker():
    """Test AI worker service"""
    print_header("5. AI WORKER TEST")
    
    try:
        print_test("Testing AI worker health endpoint...")
        response = requests.get(f"{AI_WORKER_URL}/healthz", timeout=5)
        if response.status_code == 200:
            print_success("AI worker health check passed")
        else:
            print_error(f"AI worker health check failed with status {response.status_code}")
            return False
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_error("AI worker connection failed", str(e))
        return False


def test_ai_query_flow(access_token: str):
    """Test complete AI query flow"""
    print_header("6. AI QUERY FLOW TEST")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        print_test("Submitting AI query...")
        query_data = {
            "query": "What is the total revenue?",
            "context": {"source": "integration_test"}
        }
        
        response = requests.post(
            f"{API_URL}/ai/query",
            headers=headers,
            json=query_data,
            timeout=10
        )
        
        if response.status_code == 202:
            data = response.json()
            job_id = data.get('jobId')
            if job_id:
                print_success(f"AI query submitted (Job ID: {job_id[:8]}...)")
                
                print_test("Waiting for AI response (max 30 seconds)...")
                start_time = time.time()
                max_wait = 30
                
                while time.time() - start_time < max_wait:
                    try:
                        result_response = requests.get(
                            f"{API_URL}/ai/result/{job_id}",
                            headers=headers,
                            timeout=5
                        )
                        
                        if result_response.status_code == 200:
                            result_data = result_response.json()
                            content = result_data.get('content', '')
                            if content:
                                print_success(f"AI response received ({len(content)} chars)")
                                print_info(f"Preview: {content[:100]}...")
                                return True
                        
                        time.sleep(2)
                    except:
                        time.sleep(2)
                
                print_error("AI response timeout after 30 seconds")
                return False
            else:
                print_error("No job ID in response")
                return False
        else:
            print_error(f"AI query failed with status {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error("AI query flow test failed", str(e))
        return False


def test_conversation_crud(access_token: str):
    """Test conversation CRUD operations"""
    print_header("7. CONVERSATION CRUD TEST")
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    conversation_id = None
    
    try:
        # Create conversation
        print_test("Creating new conversation...")
        response = requests.post(
            f"{API_URL}/conversations",
            headers=headers,
            json={"title": f"Test Conversation {int(time.time())}"},
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            conversation_id = data.get('data', {}).get('id')
            print_success(f"Conversation created (ID: {conversation_id[:8]}...)")
        else:
            print_error(f"Create conversation failed with status {response.status_code}")
            return False
        
        # Add message
        print_test("Adding message to conversation...")
        response = requests.post(
            f"{API_URL}/conversations/{conversation_id}/messages",
            headers=headers,
            json={"role": "user", "content": "Test message"},
            timeout=10
        )
        
        if response.status_code == 201:
            print_success("Message added successfully")
        else:
            print_error(f"Add message failed with status {response.status_code}")
        
        # Get conversation
        print_test("Retrieving conversation...")
        response = requests.get(
            f"{API_URL}/conversations/{conversation_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            messages = data.get('data', {}).get('messages', [])
            print_success(f"Conversation retrieved ({len(messages)} messages)")
        else:
            print_error(f"Get conversation failed with status {response.status_code}")
        
        # Update conversation
        print_test("Updating conversation title...")
        response = requests.put(
            f"{API_URL}/conversations/{conversation_id}",
            headers=headers,
            json={"title": "Updated Test Conversation"},
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Conversation updated successfully")
        else:
            print_error(f"Update conversation failed with status {response.status_code}")
        
        # Delete conversation
        print_test("Deleting conversation...")
        response = requests.delete(
            f"{API_URL}/conversations/{conversation_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Conversation deleted successfully")
        else:
            print_error(f"Delete conversation failed with status {response.status_code}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_error("Conversation CRUD test failed", str(e))
        return False


def test_frontend():
    """Test frontend accessibility"""
    print_header("8. FRONTEND TEST")
    
    try:
        print_test("Testing frontend accessibility...")
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print_success("Frontend is accessible")
            
            print_test("Checking frontend content...")
            if 'GrowthMonitor' in response.text or 'root' in response.text:
                print_success("Frontend HTML contains expected content")
            else:
                print_error("Frontend HTML doesn't contain expected content")
        else:
            print_error(f"Frontend returned status {response.status_code}")
            return False
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_error("Frontend connection failed", str(e))
        return False


def print_summary():
    """Print test summary"""
    print_header("TEST SUMMARY")
    
    total_tests = tests_passed + tests_failed
    
    print(f"\n{Colors.BLUE}Total Tests: {total_tests}{Colors.END}")
    print(f"{Colors.GREEN}Passed: {tests_passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {tests_failed}{Colors.END}")
    
    if tests_failed > 0:
        print(f"\n{Colors.RED}Failed Tests:{Colors.END}")
        for result in test_results:
            if result['status'] == 'FAIL':
                print(f"  • {result['test']}")
                if 'error' in result and result['error']:
                    print(f"    {result['error']}")
    
    print()
    
    if tests_failed == 0:
        print(f"{Colors.GREEN}🎉 ALL INTEGRATION TESTS PASSED!{Colors.END}")
        print("\nYour system is fully functional:")
        print(f"  • Frontend: {FRONTEND_URL}")
        print(f"  • API: {API_URL}")
        print(f"  • AI Worker: {AI_WORKER_URL}")
        print(f"\nLogin credentials:")
        print(f"  • Email: {TEST_EMAIL}")
        print(f"  • Password: {TEST_PASSWORD}")
        return 0
    else:
        print(f"{Colors.RED}⚠️  SOME TESTS FAILED!{Colors.END}")
        print("\nPlease check:")
        print("  • All services are running")
        print("  • Environment files are configured")
        print("  • Database has seed data")
        return 1


def main():
    """Run all tests"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("=" * 60)
    print("  GROWTHMONITOR INTEGRATION TEST SUITE")
    print("=" * 60)
    print(f"{Colors.END}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run tests
    test_database_connection()
    test_redis_connection()
    
    access_token = test_api_server()
    
    if access_token:
        test_authenticated_endpoints(access_token)
        test_ai_worker()
        test_ai_query_flow(access_token)
        test_conversation_crud(access_token)
    
    test_frontend()
    
    # Print summary
    exit_code = print_summary()
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
