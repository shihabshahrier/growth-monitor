#!/bin/bash

echo "🧹 Cleaning up GrowthMonitor codebase..."

# Create docs directory if it doesn't exist
mkdir -p docs/archive

# Move all test-related markdown files to docs/archive
echo "📦 Archiving test documentation..."
mv -f CHAT_SYSTEM_ANALYSIS.md docs/archive/ 2>/dev/null
mv -f CHAT_FIXES_APPLIED.md docs/archive/ 2>/dev/null
mv -f STREAMING_FIX_APPLIED.md docs/archive/ 2>/dev/null
mv -f STREAMING_DEBUG_GUIDE.md docs/archive/ 2>/dev/null
mv -f STREAM_ABORT_FIX.md docs/archive/ 2>/dev/null
mv -f CRITICAL_ISSUES_FOUND.md docs/archive/ 2>/dev/null
mv -f RETENTION_ERROR_FIX.md docs/archive/ 2>/dev/null
mv -f FIXES_NEEDED_AND_APPLIED.md docs/archive/ 2>/dev/null
mv -f FIXES_SUMMARY.md docs/archive/ 2>/dev/null
mv -f SESSION_COMPLETE.md docs/archive/ 2>/dev/null
mv -f CONVERSATION_CONTEXT_ANALYSIS.md docs/archive/ 2>/dev/null
mv -f REAL_CONVERSATION_TEST_RESULTS.md docs/archive/ 2>/dev/null
mv -f COMPREHENSIVE_TEST_RESULTS.md docs/archive/ 2>/dev/null
mv -f AI_FIXES_SUMMARY.md docs/archive/ 2>/dev/null
mv -f AI_CHAT_ISSUES.md docs/archive/ 2>/dev/null
mv -f CODEBASE_ANALYSIS.md docs/archive/ 2>/dev/null
mv -f CHANGES.md docs/archive/ 2>/dev/null
mv -f GEMINI_API_STATUS.md docs/archive/ 2>/dev/null

# Keep essential docs in root
echo "📄 Keeping essential documentation in root..."
# README.md - Main documentation
# DEPLOYMENT.md - Deployment guide
# DOCKER.md - Docker setup
# QUICK_START.md - Quick start guide
# AI_SETUP_GUIDE.md - AI setup
# RUN_TESTS.md - Test guide
# TEST_REPORT.md - Latest test report
# AVAILABLE_TOOLS_AND_CAPABILITIES.md - AI capabilities reference

# Remove test scripts (keep only essential ones)
echo "🗑️  Removing temporary test scripts..."
rm -f test_conversation_output.log 2>/dev/null
rm -f test_comprehensive_output.log 2>/dev/null
rm -f check_demo_user.py 2>/dev/null
rm -f test_retention_query.py 2>/dev/null
rm -f test_real_conversation.py 2>/dev/null
rm -f test_comprehensive_scenarios.py 2>/dev/null

# Keep essential test scripts
# test_integration.py - Main integration test
# test_gemini_api.py - Gemini API test
# test_system.sh - System health check

# Clean up log files (keep the logs directory)
echo "🧹 Cleaning old log files..."
# Don't delete logs directory, just old/temp files
find logs -name "*.log.*" -delete 2>/dev/null

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📁 Directory structure:"
echo "  Root:"
echo "    ├── README.md (main docs)"
echo "    ├── DEPLOYMENT.md"
echo "    ├── DOCKER.md"
echo "    ├── QUICK_START.md"
echo "    ├── AI_SETUP_GUIDE.md"
echo "    ├── RUN_TESTS.md"
echo "    ├── TEST_REPORT.md"
echo "    ├── AVAILABLE_TOOLS_AND_CAPABILITIES.md"
echo "    ├── test_integration.py"
echo "    ├── test_gemini_api.py"
echo "    └── test_system.sh"
echo ""
echo "  docs/archive/ (archived documentation)"
echo ""
echo "  logs/ (runtime logs)"
echo ""
