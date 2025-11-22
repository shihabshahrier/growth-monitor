#!/usr/bin/env python3
"""
Test script to verify Gemini API configuration and functionality
"""

import os
import sys
from dotenv import load_dotenv

# Load environment from ai_worker directory
env_path = os.path.join(os.path.dirname(__file__), 'server', 'ai_worker', '.env')
load_dotenv(env_path)

def test_configuration():
    """Test if environment variables are properly configured"""
    print("=" * 60)
    print("🔍 TESTING GEMINI API CONFIGURATION")
    print("=" * 60)
    
    api_key = os.getenv('GEMINI_API_KEY')
    model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
    
    print(f"\n1. Configuration Check:")
    if not api_key:
        print("   ❌ GEMINI_API_KEY not found")
        return False
    elif api_key == 'your-gemini-api-key-here':
        print("   ❌ GEMINI_API_KEY is still placeholder")
        return False
    else:
        print(f"   ✅ GEMINI_API_KEY: {api_key[:15]}...")
    
    print(f"   ✅ GEMINI_MODEL: {model}")
    return True, api_key, model


def test_api_connection(api_key, model):
    """Test actual API connection"""
    print(f"\n2. API Connection Test:")
    
    try:
        import requests
    except ImportError:
        print("   ❌ requests library not installed")
        print("   Run: pip install requests")
        return False
    
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
    headers = {'Content-Type': 'application/json'}
    data = {
        'contents': [{
            'parts': [{
                'text': 'Respond with just "OK" if you can read this'
            }]
        }]
    }
    
    try:
        print(f"   Testing model: {model}")
        response = requests.post(url, headers=headers, json=data, timeout=15)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                text = result['candidates'][0]['content']['parts'][0]['text']
                print(f"   ✅ API Response: {text.strip()}")
                return True
            else:
                print(f"   ⚠️  Unexpected response format")
                return False
                
        elif response.status_code == 429:
            print(f"   ❌ 429 Quota Exceeded")
            print(f"\n   Reasons:")
            print(f"   - Free tier daily limit reached (1,500 requests/day)")
            print(f"   - Rate limit exceeded (15 requests/minute)")
            print(f"\n   Solutions:")
            print(f"   - Wait for quota reset (resets daily at midnight PT)")
            print(f"   - Check quota: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas")
            print(f"   - Try different model: gemini-1.5-flash or gemini-pro")
            print(f"   - Upgrade to paid tier")
            return False
            
        elif response.status_code == 404:
            print(f"   ❌ Model '{model}' not found")
            print(f"\n   Available models:")
            print(f"   - gemini-1.5-flash (recommended)")
            print(f"   - gemini-1.5-pro")
            print(f"   - gemini-pro")
            return False
            
        elif response.status_code == 401:
            print(f"   ❌ Authentication failed - Invalid API key")
            print(f"\n   Get a valid key: https://makersuite.google.com/app/apikey")
            return False
            
        else:
            print(f"   ❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Connection Error: {str(e)}")
        return False


def test_langchain_integration(api_key, model):
    """Test LangChain integration"""
    print(f"\n3. LangChain Integration Test:")
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError:
        print("   ❌ langchain-google-genai not installed")
        print("   Run: pip install langchain-google-genai")
        return False
    
    try:
        llm = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=0.2,
            max_output_tokens=100
        )
        
        response = llm.invoke("Say 'LangChain works' if you can read this")
        print(f"   ✅ LangChain Response: {response.content}")
        return True
        
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            print(f"   ❌ Quota exceeded (same as direct API test)")
        elif "401" in error_str:
            print(f"   ❌ Authentication failed")
        else:
            print(f"   ❌ Error: {error_str}")
        return False


def test_ai_worker_service():
    """Test if AI worker service is running"""
    print(f"\n4. AI Worker Service Test:")
    
    try:
        import requests
        response = requests.get('http://localhost:8000/healthz', timeout=5)
        if response.status_code == 200:
            print(f"   ✅ AI Worker is running on port 8000")
            return True
        else:
            print(f"   ⚠️  AI Worker responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ AI Worker not responding: {str(e)}")
        print(f"   Start it with: ./start.sh")
        return False


def main():
    """Run all tests"""
    
    # Test 1: Configuration
    result = test_configuration()
    if not result:
        print("\n❌ Configuration test failed!")
        print("\nSetup instructions:")
        print("1. Get API key: https://makersuite.google.com/app/apikey")
        print("2. Add to server/ai_worker/.env:")
        print("   GEMINI_API_KEY=your-key-here")
        print("   GEMINI_MODEL=gemini-1.5-flash")
        sys.exit(1)
    
    _, api_key, model = result
    
    # Test 2: API Connection
    api_works = test_api_connection(api_key, model)
    
    # Test 3: LangChain (only if API works)
    if api_works:
        langchain_works = test_langchain_integration(api_key, model)
    else:
        print(f"\n3. LangChain Integration Test:")
        print(f"   ⏭️  Skipped (API test failed)")
        langchain_works = False
    
    # Test 4: AI Worker Service
    service_works = test_ai_worker_service()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"✅ Configuration: PASS" if result else "❌ Configuration: FAIL")
    print(f"✅ API Connection: PASS" if api_works else "❌ API Connection: FAIL")
    print(f"✅ LangChain: PASS" if langchain_works else "❌ LangChain: FAIL")
    print(f"✅ AI Worker: RUNNING" if service_works else "❌ AI Worker: NOT RUNNING")
    print("=" * 60)
    
    if api_works and langchain_works and service_works:
        print("\n🎉 All tests passed! Gemini API is fully functional.")
        print("\nYou can now use AI chat in the frontend:")
        print("1. Open http://localhost:5173")
        print("2. Login: demo@growthmonitor.ai / password123")
        print("3. Try: 'Show me top 5 selling products'")
    elif api_works and not langchain_works:
        print("\n⚠️  API works but quota may be exhausted for LangChain calls")
        print("Wait for quota reset or try a different model")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
    
    print()


if __name__ == "__main__":
    main()
