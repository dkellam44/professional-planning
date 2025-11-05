#!/bin/bash
set -e

echo "Starting server..."
node dist/http-server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 2

echo "=== Health Check ==="
curl -s http://localhost:8080/health | jq .

echo ""
echo "=== Test OAuth Register ==="
curl -s -X POST http://localhost:8080/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Claude"}' | jq .

echo ""
echo "=== Test /sse endpoint ==="
timeout 2 curl -s -H "Authorization: Bearer test-token" http://localhost:8080/sse 2>&1 || echo "[Stream closed or timeout]"

echo ""
echo "=== Test /sse/stats ==="
curl -s http://localhost:8080/sse/stats | jq .

echo ""
echo "Killing server..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "✓ All endpoint tests completed"
