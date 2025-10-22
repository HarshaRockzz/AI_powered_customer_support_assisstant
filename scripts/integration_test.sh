#!/bin/bash

echo "🧪 Running Integration Tests for AI Support Assistant"
echo "======================================================"

# Configuration
BACKEND_URL=${BACKEND_URL:-"http://localhost:8080"}
RAG_SERVICE_URL=${RAG_SERVICE_URL:-"http://localhost:8000"}
DASHBOARD_URL=${DASHBOARD_URL:-"http://localhost:3000"}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $response)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $response)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test Backend Health
echo ""
echo "1. Backend Service Tests"
echo "------------------------"
test_endpoint "Backend Health Check" "$BACKEND_URL/api/health" 200
test_endpoint "Backend Metrics" "$BACKEND_URL/metrics" 200

# Test RAG Service
echo ""
echo "2. RAG Service Tests"
echo "--------------------"
test_endpoint "RAG Service Health Check" "$RAG_SERVICE_URL/health" 200
test_endpoint "RAG Service Stats" "$RAG_SERVICE_URL/rag/stats" 200

# Test Dashboard
echo ""
echo "3. Dashboard Tests"
echo "------------------"
test_endpoint "Dashboard Home Page" "$DASHBOARD_URL" 200

# Test Query Flow
echo ""
echo "4. Query Flow Test"
echo "------------------"

SESSION_ID="test-session-$(date +%s)"

echo -n "Testing Query Submission... "
query_response=$(curl -s -X POST "$BACKEND_URL/api/query" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"What are your business hours?\", \"session_id\": \"$SESSION_ID\"}")

if echo "$query_response" | grep -q "query_id"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
    
    # Extract query_id for feedback test
    query_id=$(echo "$query_response" | grep -o '"query_id":[0-9]*' | cut -d':' -f2)
    
    # Test Feedback Submission
    echo -n "Testing Feedback Submission... "
    feedback_response=$(curl -s -X POST "$BACKEND_URL/api/feedback" \
      -H "Content-Type: application/json" \
      -d "{\"query_id\": $query_id, \"session_id\": \"$SESSION_ID\", \"score\": 1}")
    
    if echo "$feedback_response" | grep -q "success"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test Analytics
echo ""
echo "5. Analytics Tests"
echo "------------------"
test_endpoint "Analytics Endpoint" "$BACKEND_URL/api/analytics" 200

# Print Summary
echo ""
echo "======================================================"
echo "Test Summary"
echo "======================================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total:  $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi

