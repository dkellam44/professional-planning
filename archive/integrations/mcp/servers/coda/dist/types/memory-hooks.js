"use strict";
/**
 * Memory Hooks Interface
 *
 * Lifecycle callbacks for persistent memory integration
 * Enables cross-session learning and context management
 *
 * Pattern: These hooks are called at key lifecycle points
 * to allow higher-level systems to track and learn from usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMemoryHooks = exports.noopMemoryHooks = void 0;
/**
 * No-op memory hooks for development
 * Implements all hooks but does nothing
 */
exports.noopMemoryHooks = {
    onToolCall: async () => { },
    onResponse: async () => { },
    onSessionEnd: async () => { },
    onError: async () => { }
};
/**
 * Logging memory hooks for development
 * Logs all hooks to console for debugging
 */
exports.loggingMemoryHooks = {
    onToolCall: async (call) => {
        console.log(`[MEMORY] onToolCall: ${call.toolName} in session ${call.sessionId.substring(0, 8)}`);
    },
    onResponse: async (response) => {
        console.log(`[MEMORY] onResponse: ${response.toolName} ${response.success ? 'OK' : 'ERROR'} (${response.metadata?.duration || 0}ms)`);
    },
    onSessionEnd: async (context) => {
        console.log(`[MEMORY] onSessionEnd: ${context.totalRequests} requests, ${context.totalTokens} tokens over ${Math.round((context.endTime?.getTime() || 0 - context.startTime.getTime()) / 1000)}s`);
    },
    onError: async (error, context) => {
        console.error(`[MEMORY] onError in session ${context.sessionId?.substring(0, 8)}:`, error.message);
    }
};
