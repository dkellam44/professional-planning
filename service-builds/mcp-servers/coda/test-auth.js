const http = require('http');

// Test configuration
const host = 'localhost';
const port = 8080;

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Coda MCP Authentication\n');

  try {
    // Test 1: Health endpoint without authentication (should work for health)
    console.log('Test 1: Health endpoint without auth');
    const healthNoAuth = await makeRequest('/health');
    console.log(`Status: ${healthNoAuth.statusCode}`);
    console.log(`Response: ${healthNoAuth.body}\n`);

    // Test 2: Status endpoint without authentication (should work)
    console.log('Test 2: Status endpoint without auth');
    const statusNoAuth = await makeRequest('/status');
    console.log(`Status: ${statusNoAuth.statusCode}`);
    console.log(`Response: ${statusNoAuth.body}\n`);

    // Test 3: MCP endpoint without authentication (should fail with 401)
    console.log('Test 3: MCP endpoint without auth (should fail)');
    const mcpNoAuth = await makeRequest('/mcp');
    console.log(`Status: ${mcpNoAuth.statusCode}`);
    console.log(`Response: ${mcpNoAuth.body}\n`);

    // Test 4: MCP endpoint with Bearer token (should work)
    console.log('Test 4: MCP endpoint with Bearer token');
    const mcpWithBearer = await makeRequest('/mcp', {
      'Authorization': 'Bearer test_bearer_token_456',
      'Content-Type': 'application/json'
    });
    console.log(`Status: ${mcpWithBearer.statusCode}`);
    console.log(`Response: ${mcpWithBearer.body}\n`);

    console.log('✅ All tests completed!');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running. Please start the server first with: npm run dev');
    } else {
      console.error('❌ Test error:', error.message);
    }
  }
}

// Run tests
runTests();