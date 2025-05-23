#!/bin/bash

echo "🔍 Checking subdomain health..."

# Check auth subdomain
echo "Checking https://auth.korczewski.de..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://auth.korczewski.de)
if [ "$AUTH_STATUS" = "200" ]; then
    echo "✅ Auth server is healthy"
else
    echo "❌ Auth server returned status: $AUTH_STATUS"
fi

# Check game subdomain
echo "Checking https://game.korczewski.de..."
GAME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://game.korczewski.de)
if [ "$GAME_STATUS" = "200" ]; then
    echo "✅ Game server is healthy"
else
    echo "❌ Game server returned status: $GAME_STATUS"
fi

# Check SSL certificates
echo "Checking SSL certificates..."
echo | openssl s_client -servername auth.korczewski.de -connect auth.korczewski.de:443 2>/dev/null | openssl x509 -noout -dates
echo | openssl s_client -servername game.korczewski.de -connect game.korczewski.de:443 2>/dev/null | openssl x509 -noout -dates