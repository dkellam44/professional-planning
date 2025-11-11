# @bestviable/mcp-auth-middleware

Reusable authentication middleware for MCP servers with Cloudflare Access JWT validation and PostgreSQL token storage.

## Features

- **Cloudflare Access JWT Validation**: Validates JWT tokens from Cloudflare Access
- **Bearer Token Fallback**: Supports bearer token authentication for development
- **AES-256-GCM Encryption**: Secure token encryption with authenticated encryption
- **PostgreSQL Token Storage**: Persistent, encrypted token storage with connection pooling
- **Express Middleware**: Easy-to-use Express.js middleware factory
- **Comprehensive Testing**: 100% test coverage for core modules
- **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install @bestviable/mcp-auth-middleware
```

## Quick Start

```typescript
import express from 'express';
import { createAuthMiddleware } from '@bestviable/mcp-auth-middleware';

const app = express();

// Configure authentication
const authMiddleware = createAuthMiddleware({
  mode: 'both', // 'cloudflare', 'bearer', or 'both'
  tokenStore: 'postgres',
  serviceName: 'my-service',
  encryptionKey: process.env.MCP_AUTH_ENCRYPTION_KEY,
  cloudflareAccessTeamDomain: 'myteam.cloudflareaccess.com',
  cloudflareAccessAud: 'my-audience-uuid',
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'mcp_auth',
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD
  }
});

// Apply middleware
app.use(authMiddleware);

// Your routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', authenticated: !!req.user });
});
```

## Configuration

### Auth Modes

- **`cloudflare`**: Only Cloudflare Access JWT validation
- **`bearer`**: Only bearer token validation
- **`both`**: Try Cloudflare Access first, fallback to bearer token

### Token Storage

- **`env`**: Use environment variables (legacy)
- **`postgres`**: Use PostgreSQL with encryption

### Environment Variables

```bash
# Required for PostgreSQL token storage
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=mcp_auth
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password

# Required for encryption
MCP_AUTH_ENCRYPTION_KEY=your-32-byte-encryption-key

# Optional - for Cloudflare Access
CLOUDFARE_ACCESS_TEAM_DOMAIN=myteam.cloudflareaccess.com
CLOUDFARE_ACCESS_AUD=your-audience-uuid

# Optional - for bearer token fallback
BEARER_TOKEN=your-bearer-token
```

## API Reference

### `createAuthMiddleware(config, options?)`

Creates Express authentication middleware.

**Parameters:**
- `config`: Authentication configuration object
- `options`: Optional middleware options

**Returns:** Express middleware function

### `TokenStore`

PostgreSQL token storage with encryption.

```typescript
import { TokenStore, createConnectionPool } from '@bestviable/mcp-auth-middleware';

const pool = createConnectionPool({ /* postgres config */ });
const tokenStore = new TokenStore(pool, encryptionKey);

// Store a token
await tokenStore.setToken('my-service', 'api_token', 'secret-token');

// Retrieve a token
const token = await tokenStore.getToken('my-service', 'api_token');

// Delete a token
await tokenStore.deleteToken('my-service', 'api_token');
```

### Migration Script

Migrate environment variables to PostgreSQL:

```bash
npx @bestviable/mcp-auth-migrate --service coda --env-var CODA_API_TOKEN --dry-run
```

## Database Schema

The package automatically creates the required PostgreSQL schema:

```sql
-- Services table
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tokens table (encrypted)
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv VARCHAR(32) NOT NULL,
  tag VARCHAR(32) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, key)
);

-- Audit log
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  user_email VARCHAR(255),
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Security

- **AES-256-GCM**: Industry-standard authenticated encryption
- **Key Derivation**: Uses scrypt for secure key derivation
- **Connection Pooling**: Secure PostgreSQL connection management
- **Audit Logging**: All token operations are logged
- **Input Validation**: Comprehensive input validation and sanitization

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please open an issue on the GitHub repository.