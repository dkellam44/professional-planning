"use strict";
/**
 * @bestviable/mcp-auth-middleware
 * Reusable authentication middleware for MCP servers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthCheckHandler = exports.generateEncryptionKey = exports.getConnectionPool = exports.createConnectionPool = exports.TokenStore = exports.decrypt = exports.encrypt = exports.validateBearerToken = exports.validateCloudflareAccessJWT = exports.createAuthMiddleware = void 0;
var create_auth_middleware_1 = require("./middleware/create-auth-middleware");
Object.defineProperty(exports, "createAuthMiddleware", { enumerable: true, get: function () { return create_auth_middleware_1.createAuthMiddleware; } });
var cloudflare_access_1 = require("./validators/cloudflare-access");
Object.defineProperty(exports, "validateCloudflareAccessJWT", { enumerable: true, get: function () { return cloudflare_access_1.validateCloudflareAccessJWT; } });
var bearer_token_1 = require("./validators/bearer-token");
Object.defineProperty(exports, "validateBearerToken", { enumerable: true, get: function () { return bearer_token_1.validateBearerToken; } });
var encryption_1 = require("./encryption");
Object.defineProperty(exports, "encrypt", { enumerable: true, get: function () { return encryption_1.encrypt; } });
Object.defineProperty(exports, "decrypt", { enumerable: true, get: function () { return encryption_1.decrypt; } });
var token_store_1 = require("./postgres/token-store");
Object.defineProperty(exports, "TokenStore", { enumerable: true, get: function () { return token_store_1.TokenStore; } });
var connection_1 = require("./postgres/connection");
Object.defineProperty(exports, "createConnectionPool", { enumerable: true, get: function () { return connection_1.createConnectionPool; } });
Object.defineProperty(exports, "getConnectionPool", { enumerable: true, get: function () { return connection_1.getConnectionPool; } });
// Utilities
var key_generation_1 = require("./utils/key-generation");
Object.defineProperty(exports, "generateEncryptionKey", { enumerable: true, get: function () { return key_generation_1.generateEncryptionKey; } });
var health_check_1 = require("./utils/health-check");
Object.defineProperty(exports, "createHealthCheckHandler", { enumerable: true, get: function () { return health_check_1.createHealthCheckHandler; } });
//# sourceMappingURL=index.js.map