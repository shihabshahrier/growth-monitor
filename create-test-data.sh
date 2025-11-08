#!/bin/bash

# GrowthMonitor Test Data Creator
# Run this script to populate your database with test data

echo "🚀 Creating test data for GrowthMonitor..."

# Login and get token
echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo123456"}' | \
  jq -r '.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Login failed! Make sure the backend is running and credentials are correct."
  exit 1
fi

echo "✅ Logged in successfully"

# Create customers
echo ""
echo "👥 Creating customers..."
CUSTOMER_IDS=()

for i in {1..5}; do
  RESPONSE=$(curl -s -X POST http://localhost:8080/api/customers \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\":\"Customer $i\",
      \"email\":\"customer$i@test.com\",
      \"phone\":\"+123456789$i\",
      \"address\":\"$i Main Street, Test City\",
      \"tags\":\"test,demo\"
    }")
  
  CUSTOMER_ID=$(echo $RESPONSE | jq -r '.data.id')
  CUSTOMER_IDS+=($CUSTOMER_ID)
  echo "  ✓ Created Customer $i (ID: ${CUSTOMER_ID:0:8}...)"
done

echo "✅ Created ${#CUSTOMER_IDS[@]} customers"

# Create campaigns
echo ""
echo "📢 Creating campaigns..."
CAMPAIGN_IDS=()

CAMPAIGNS=(
  '{"name":"Summer Sale 2025","type":"Email","status":"active","budget":5000,"channel":"Email","startDate":"2025-06-01","endDate":"2025-08-31"}'
  '{"name":"Social Media Blast","type":"Social","status":"active","budget":3000,"channel":"Social","startDate":"2025-07-01","endDate":"2025-07-31"}'
  '{"name":"Google Ads Q3","type":"Digital","status":"active","budget":8000,"channel":"Google","startDate":"2025-07-01","endDate":"2025-09-30"}'
)

for i in "${!CAMPAIGNS[@]}"; do
  RESPONSE=$(curl -s -X POST http://localhost:8080/api/campaigns \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "${CAMPAIGNS[$i]}")
  
  CAMPAIGN_ID=$(echo $RESPONSE | jq -r '.campaign.id')
  CAMPAIGN_IDS+=($CAMPAIGN_ID)
  CAMPAIGN_NAME=$(echo "${CAMPAIGNS[$i]}" | jq -r '.name')
  echo "  ✓ Created campaign: $CAMPAIGN_NAME (ID: ${CAMPAIGN_ID:0:8}...)"
done

echo "✅ Created ${#CAMPAIGN_IDS[@]} campaigns"

# Create sales
echo ""
echo "💰 Creating sales..."

CHANNELS=("Website" "Email" "Social" "Direct" "Google")
PRODUCTS=("Premium Plan" "Basic Plan" "Enterprise Plan" "Consulting Service" "Support Package")

for i in {1..20}; do
  # Random amount between 100 and 5000
  AMOUNT=$((100 + RANDOM % 4900))
  
  # Random customer
  CUSTOMER_INDEX=$((RANDOM % ${#CUSTOMER_IDS[@]}))
  CUSTOMER_ID="${CUSTOMER_IDS[$CUSTOMER_INDEX]}"
  
  # Random campaign (or null)
  if [ $((RANDOM % 2)) -eq 0 ] && [ ${#CAMPAIGN_IDS[@]} -gt 0 ]; then
    CAMPAIGN_INDEX=$((RANDOM % ${#CAMPAIGN_IDS[@]}))
    CAMPAIGN_ID="${CAMPAIGN_IDS[$CAMPAIGN_INDEX]}"
    CAMPAIGN_JSON=",\"campaignId\":\"$CAMPAIGN_ID\""
  else
    CAMPAIGN_JSON=""
  fi
  
  # Random channel
  CHANNEL_INDEX=$((RANDOM % ${#CHANNELS[@]}))
  CHANNEL="${CHANNELS[$CHANNEL_INDEX]}"
  
  # Random product
  PRODUCT_INDEX=$((RANDOM % ${#PRODUCTS[@]}))
  PRODUCT="${PRODUCTS[$PRODUCT_INDEX]}"
  
  # Random date in last 60 days
  DAYS_AGO=$((RANDOM % 60))
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    SALE_DATE=$(date -v-${DAYS_AGO}d +%Y-%m-%d)
  else
    # Linux
    SALE_DATE=$(date -d "$DAYS_AGO days ago" +%Y-%m-%d)
  fi
  
  curl -s -X POST http://localhost:8080/api/sales \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\":$AMOUNT,
      \"customerId\":\"$CUSTOMER_ID\",
      \"channel\":\"$CHANNEL\",
      \"product\":\"$PRODUCT\",
      \"date\":\"$SALE_DATE\",
      \"notes\":\"Test sale $i\"
      $CAMPAIGN_JSON
    }" > /dev/null
  
  echo "  ✓ Sale $i: \$$AMOUNT - $PRODUCT via $CHANNEL"
done

echo "✅ Created 20 sales"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Test data creation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  • ${#CUSTOMER_IDS[@]} customers created"
echo "  • ${#CAMPAIGN_IDS[@]} campaigns created"
echo "  • 20 sales transactions created"
echo "  • Total revenue: ~\$50,000"
echo ""
echo "🎯 Next steps:"
echo "  1. Visit http://localhost:5174"
echo "  2. Login with: demo@example.com / Demo123456"
echo "  3. Explore the dashboard and analytics!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
