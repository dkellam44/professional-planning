#!/bin/bash

# Start server
node dist/http-server.js &
SERVER_PID=$!
sleep 3

echo "=== Testing /sse endpoint ==="
curl -i -H "Authorization: Bearer test-token" http://localhost:8080/sse 2>&1 | head -20

echo ""
echo "=== Testing /sse/stats endpoint ==="
curl -s http://localhost:8080/sse/stats 2>&1

echo ""
echo "Killing server..."
kill $SERVER_PID 2>/dev/null || true
