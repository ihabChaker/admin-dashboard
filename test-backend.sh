#!/bin/bash

# Test script for HistoRando Backend API
# This script tests various endpoints of the deployed backend

API_URL="https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1"

echo "🚀 Testing HistoRando Backend API"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health Check: OK${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}✗ Health Check: FAILED (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 2: Users Endpoint (should be unauthorized)
echo "2. Testing Protected Endpoint (Users)..."
USERS_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/users")
HTTP_CODE=$(echo "$USERS_RESPONSE" | tail -n 1)
BODY=$(echo "$USERS_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Protected Route: OK (Correctly requires auth)${NC}"
    echo "   Response: $BODY"
else
    echo -e "${YELLOW}⚠ Protected Route: Unexpected status (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 3: Login Endpoint
echo "3. Testing Login Endpoint..."
echo "   Attempting login with: admin@historando.com"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@historando.com","password":"Admin123!"}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Login: SUCCESS${NC}"
    echo "   Response: $BODY"
    
    # Extract token if present
    TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✓ Token received: ${TOKEN:0:20}...${NC}"
        
        # Test 4: Authenticated Request
        echo ""
        echo "4. Testing Authenticated Request..."
        AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/users" \
          -H "Authorization: Bearer $TOKEN")
        HTTP_CODE=$(echo "$AUTH_RESPONSE" | tail -n 1)
        BODY=$(echo "$AUTH_RESPONSE" | head -n -1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓ Authenticated Request: SUCCESS${NC}"
            echo "   Response: $BODY"
        else
            echo -e "${RED}✗ Authenticated Request: FAILED (HTTP $HTTP_CODE)${NC}"
            echo "   Response: $BODY"
        fi
    fi
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠ Login: Invalid credentials${NC}"
    echo "   Response: $BODY"
    echo -e "${YELLOW}   → Admin user may not exist in database${NC}"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}✗ Login: Server Error${NC}"
    echo "   Response: $BODY"
    echo -e "${RED}   → Check backend logs for details${NC}"
else
    echo -e "${RED}✗ Login: FAILED (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 5: Registration Endpoint
echo "5. Testing Registration Endpoint..."
RANDOM_EMAIL="testuser$(date +%s)@test.com"
REG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${RANDOM_EMAIL}\",\"password\":\"Test123!\",\"username\":\"testuser$(date +%s)\"}")
HTTP_CODE=$(echo "$REG_RESPONSE" | tail -n 1)
BODY=$(echo "$REG_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Registration: SUCCESS${NC}"
    echo "   Response: $BODY"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}✗ Registration: Server Error${NC}"
    echo "   Response: $BODY"
    echo -e "${RED}   → Database or validation issue${NC}"
else
    echo -e "${YELLOW}⚠ Registration: FAILED (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo -e "${YELLOW}Backend URL:${NC} $API_URL"
echo ""
echo "Next Steps:"
echo "1. If login failed with 500 error, check backend logs"
echo "2. If login failed with 401, create admin user in database"
echo "3. Use credentials from ADMIN_CREDENTIALS.md file"
echo "4. Once login works, test the admin dashboard"
echo ""
