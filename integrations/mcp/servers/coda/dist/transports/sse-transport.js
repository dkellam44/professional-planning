"use strict";
/**
 * SSE Transport Implementation for ChatGPT Compatibility
 *
 * Server-Sent Events (SSE) transport for MCP protocol
 * Provides streaming JSON-RPC responses over HTTP
 *
 * Compliant with:
 * - OpenAI MCP Specification (https://platform.openai.com/docs/mcp)
 * - ChatGPT connector requirements
 * - RFC 8414 OAuth metadata
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSETransportManager = void 0;
exports.formatSSEResponse = formatSSEResponse;
exports.formatSearchResult = formatSearchResult;
exports.formatFetchResult = formatFetchResult;
exports.extractBearerToken = extractBearerToken;
const crypto_1 = require("crypto");
/**
 * Manages SSE connections and message routing
 */
class SSETransportManager {
    connections = new Map();
    messageQueues = new Map();
    /**
     * Create and register a new SSE connection
     */
    createConnection(req, res, sessionId) {
        const id = sessionId || (0, crypto_1.randomUUID)();
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        // Send initial ping to confirm connection
        res.write(':connected\n\n');
        const connection = {
            sessionId: id,
            res,
            startTime: new Date(),
            requestCount: 0,
            lastActivity: new Date(),
        };
        this.connections.set(id, connection);
        this.messageQueues.set(id, []);
        console.log(`[SSE] New connection: ${id}`);
        // Handle client disconnect
        res.on('close', () => {
            this.closeConnection(id);
        });
        res.on('error', (err) => {
            console.error(`[SSE] Connection error (${id}):`, err);
            this.closeConnection(id);
        });
        return id;
    }
    /**
     * Send a message to a specific connection
     */
    sendMessage(sessionId, message) {
        const connection = this.connections.get(sessionId);
        if (!connection) {
            console.warn(`[SSE] Connection not found: ${sessionId}`);
            return false;
        }
        try {
            const data = JSON.stringify(message);
            connection.res.write(`data: ${data}\n\n`);
            connection.lastActivity = new Date();
            return true;
        }
        catch (error) {
            console.error(`[SSE] Failed to send message (${sessionId}):`, error);
            this.closeConnection(sessionId);
            return false;
        }
    }
    /**
     * Queue a message if connection not ready
     */
    queueMessage(sessionId, message) {
        const queue = this.messageQueues.get(sessionId) || [];
        queue.push(message);
        this.messageQueues.set(sessionId, queue);
    }
    /**
     * Get and clear queued messages
     */
    getQueuedMessages(sessionId) {
        const messages = this.messageQueues.get(sessionId) || [];
        this.messageQueues.set(sessionId, []);
        return messages;
    }
    /**
     * Close a connection
     */
    closeConnection(sessionId) {
        const connection = this.connections.get(sessionId);
        if (connection) {
            try {
                connection.res.end();
            }
            catch (error) {
                console.warn(`[SSE] Error closing connection (${sessionId}):`, error);
            }
            this.connections.delete(sessionId);
            this.messageQueues.delete(sessionId);
            const duration = new Date().getTime() - connection.startTime.getTime();
            console.log(`[SSE] Connection closed: ${sessionId} (${connection.requestCount} requests, ${duration}ms)`);
        }
    }
    /**
     * Check if connection exists
     */
    hasConnection(sessionId) {
        return this.connections.has(sessionId);
    }
    /**
     * Get connection info
     */
    getConnection(sessionId) {
        return this.connections.get(sessionId);
    }
    /**
     * Clean up idle connections (> 5 minutes)
     */
    cleanupIdleConnections() {
        const now = new Date();
        const idleThreshold = 5 * 60 * 1000; // 5 minutes
        for (const [sessionId, connection] of this.connections.entries()) {
            const idleTime = now.getTime() - connection.lastActivity.getTime();
            if (idleTime > idleThreshold) {
                console.log(`[SSE] Closing idle connection: ${sessionId} (${idleTime}ms idle)`);
                this.closeConnection(sessionId);
            }
        }
    }
    /**
     * Get statistics
     */
    getStats() {
        let totalRequests = 0;
        const connections = [];
        for (const [_, connection] of this.connections.entries()) {
            const uptime = new Date().getTime() - connection.startTime.getTime();
            const idle = new Date().getTime() - connection.lastActivity.getTime();
            totalRequests += connection.requestCount;
            connections.push({
                sessionId: connection.sessionId.substring(0, 8) + '...',
                requests: connection.requestCount,
                uptime,
                idle,
            });
        }
        return {
            activeConnections: this.connections.size,
            totalRequests,
            connections,
        };
    }
}
exports.SSETransportManager = SSETransportManager;
/**
 * Format an MCP response for SSE transmission
 *
 * ChatGPT expects responses in MCP content array format:
 * {
 *   "content": [
 *     {
 *       "type": "text",
 *       "text": "JSON-encoded result"
 *     }
 *   ]
 * }
 */
function formatSSEResponse(result, toolName) {
    return {
        content: [
            {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result),
            },
        ],
        ...(toolName && { tool: toolName }),
    };
}
/**
 * Format a search result for ChatGPT
 *
 * ChatGPT search tool expects:
 * {
 *   "results": [
 *     { "id": "...", "title": "...", "url": "..." },
 *     ...
 *   ]
 * }
 */
function formatSearchResult(documents) {
    const results = documents.map((doc) => ({
        id: doc.id || doc.docId,
        title: doc.name || doc.title || 'Untitled',
        url: `https://coda.io/d/${doc.id || doc.docId}`,
    }));
    return {
        results,
    };
}
/**
 * Format a fetch result for ChatGPT
 *
 * ChatGPT fetch tool expects:
 * {
 *   "id": "...",
 *   "title": "...",
 *   "text": "full content",
 *   "url": "...",
 *   "metadata": {...}
 * }
 */
function formatFetchResult(doc, content) {
    return {
        id: doc.id || doc.docId,
        title: doc.name || doc.title || 'Untitled',
        text: content || doc.content || 'No content available',
        url: `https://coda.io/d/${doc.id || doc.docId}`,
        metadata: {
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            owner: doc.owner?.displayName || 'Unknown',
            isPublished: doc.public,
        },
    };
}
/**
 * Extract Bearer token from request
 */
function extractBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7).trim();
}
