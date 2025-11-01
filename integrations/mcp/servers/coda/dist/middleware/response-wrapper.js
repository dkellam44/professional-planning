"use strict";
/**
 * Response Wrapper Middleware
 *
 * Wraps all MCP tool responses with metadata envelope
 * Enables context budgeting, progressive disclosure, and memory hooks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapResponse = wrapResponse;
exports.wrapResponseAuto = wrapResponseAuto;
exports.wrapError = wrapError;
exports.wrapJsonRpcResponse = wrapJsonRpcResponse;
exports.wrapMultipleResponses = wrapMultipleResponses;
exports.createStreamingMetadata = createStreamingMetadata;
exports.logResponseMetadata = logResponseMetadata;
const token_counter_js_1 = require("../utils/token-counter.js");
/**
 * Wrap a successful tool response with metadata
 * @param data - Tool response data
 * @param resourceId - Resource identifier (docId, pageId, etc.)
 * @param summary - Custom summary (auto-generated if not provided)
 * @returns Wrapped response with metadata
 */
function wrapResponse(data, resourceId = 'unknown', summary) {
    const tokenEstimate = (0, token_counter_js_1.estimateObjectTokens)(data);
    const autoSummary = summary || (0, token_counter_js_1.createObjectSummary)(data, 150);
    return {
        success: true,
        data,
        metadata: {
            timestamp: new Date().toISOString(),
            resourceId,
            source: 'coda',
            tokenEstimate,
            summary: autoSummary,
            formattedTokens: (0, token_counter_js_1.formatTokens)(tokenEstimate)
        },
        fullContentPath: `/api/coda/resource/${resourceId}`
    };
}
/**
 * Wrap a successful response, auto-detecting resource ID
 * @param data - Tool response data
 * @param summary - Custom summary (auto-generated if not provided)
 * @returns Wrapped response with auto-detected resource ID
 */
function wrapResponseAuto(data, summary) {
    const resourceId = (0, token_counter_js_1.extractResourceId)(data);
    return wrapResponse(data, resourceId, summary);
}
/**
 * Wrap an error response
 * @param error - Error object or message
 * @param recoverable - Whether the error is recoverable
 * @returns Wrapped error response
 */
function wrapError(error, recoverable = true) {
    const message = error instanceof Error ? error.message : error;
    const code = error instanceof Error ? error.constructor.name : 'CODA_ERROR';
    return {
        success: false,
        error: {
            code,
            message,
            recoverable
        },
        metadata: {
            timestamp: new Date().toISOString(),
            resourceId: 'error',
            source: 'coda',
            tokenEstimate: (0, token_counter_js_1.estimateObjectTokens)({ error: message }),
            summary: `Error: ${message.substring(0, 100)}`,
            formattedTokens: '50 tokens' // Errors are small
        }
    };
}
/**
 * Wrap a response from MCP JSON-RPC call
 * Handles both successful and error responses
 * @param jsonRpcResponse - MCP JSON-RPC response object
 * @param toolName - Name of the tool (for logging)
 * @returns Wrapped response
 */
function wrapJsonRpcResponse(jsonRpcResponse, toolName = 'unknown') {
    if (jsonRpcResponse?.error) {
        return wrapError(jsonRpcResponse.error.message || 'Unknown error', true);
    }
    if (jsonRpcResponse?.result) {
        return wrapResponseAuto(jsonRpcResponse.result, `Result from ${toolName}`);
    }
    return wrapError('Invalid MCP response format', false);
}
/**
 * Batch wrap multiple responses
 * @param responses - Array of responses to wrap
 * @returns Array of wrapped responses
 */
function wrapMultipleResponses(responses, resourceId = 'batch') {
    return wrapResponse(responses, resourceId, `Batch of ${responses.length} items`);
}
/**
 * Create a streaming response metadata (for large data)
 * @param totalEstimate - Total token estimate for full data
 * @param initialChunkSize - Size of initial chunk being sent
 * @param resourceId - Resource identifier
 * @returns Response metadata for streaming scenario
 */
function createStreamingMetadata(totalEstimate, initialChunkSize, resourceId = 'stream') {
    return {
        timestamp: new Date().toISOString(),
        resourceId,
        source: 'coda',
        tokenEstimate: initialChunkSize,
        totalTokenEstimate: totalEstimate,
        summary: `Streaming response (${(0, token_counter_js_1.formatTokens)(initialChunkSize)} of ${(0, token_counter_js_1.formatTokens)(totalEstimate)})`,
        formattedTokens: (0, token_counter_js_1.formatTokens)(initialChunkSize),
        streamUrl: `/api/coda/stream/${resourceId}` // Where to fetch rest
    };
}
/**
 * Log response metadata for debugging
 * @param response - Wrapped response
 * @param toolName - Tool name (for logging)
 */
function logResponseMetadata(response, toolName = 'unknown') {
    const { metadata, success } = response;
    console.log(`[MCP-${success ? 'OK' : 'ERR'}] ${toolName}`, {
        resourceId: metadata.resourceId,
        tokens: metadata.formattedTokens,
        summary: metadata.summary.substring(0, 50) + '...',
        timestamp: metadata.timestamp
    });
}
