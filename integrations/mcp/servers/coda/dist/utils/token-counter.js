"use strict";
/**
 * Token Counter Utility
 *
 * Estimates token usage for context budgeting
 * Conservative estimates (round up) for safety
 *
 * Token estimation formula:
 * - 1 token ≈ 4 characters (industry standard)
 * - Always round up to nearest 50 for safety margin
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokens = estimateTokens;
exports.estimateObjectTokens = estimateObjectTokens;
exports.createSummary = createSummary;
exports.createObjectSummary = createObjectSummary;
exports.extractResourceId = extractResourceId;
exports.estimateToolResponseTokens = estimateToolResponseTokens;
exports.formatTokens = formatTokens;
exports.calculateTokenRatio = calculateTokenRatio;
/**
 * Estimate tokens from raw text content
 * 1 token ≈ 4 characters (conservative)
 * @param content - Text content to estimate
 * @returns Estimated token count (rounded to nearest 50)
 */
function estimateTokens(content) {
    if (!content)
        return 0;
    const charCount = content.length;
    const baseTokens = Math.ceil(charCount / 4);
    // Round up to nearest 50 for safety margin
    return Math.ceil(baseTokens / 50) * 50;
}
/**
 * Estimate tokens in a JavaScript object (JSON serialized)
 * @param obj - Object to estimate
 * @returns Estimated token count
 */
function estimateObjectTokens(obj) {
    try {
        const json = JSON.stringify(obj);
        return estimateTokens(json);
    }
    catch (error) {
        // If serialization fails, estimate based on toString
        return estimateTokens(String(obj));
    }
}
/**
 * Create a summary from content (first N characters + ellipsis if truncated)
 * @param content - Content to summarize
 * @param maxLength - Maximum length of summary (default 200)
 * @returns Truncated summary
 */
function createSummary(content, maxLength = 200) {
    if (!content)
        return '';
    if (content.length <= maxLength) {
        return content;
    }
    return content.substring(0, maxLength) + '...';
}
/**
 * Create a summary from an object
 * @param obj - Object to summarize
 * @param maxLength - Maximum length of summary
 * @returns Truncated summary
 */
function createObjectSummary(obj, maxLength = 200) {
    try {
        const json = JSON.stringify(obj);
        return createSummary(json, maxLength);
    }
    catch (error) {
        const str = String(obj);
        return createSummary(str, maxLength);
    }
}
/**
 * Get a resource identifier from an object
 * Looks for common ID fields: id, docId, pageId, rowId, etc.
 * @param obj - Object to extract ID from
 * @returns Resource ID or 'unknown'
 */
function extractResourceId(obj) {
    if (!obj || typeof obj !== 'object') {
        return 'unknown';
    }
    // Check for common ID field names
    const idFields = ['id', 'docId', 'doc_id', 'pageId', 'page_id', 'rowId', 'row_id', 'tableId', 'table_id'];
    for (const field of idFields) {
        if (obj[field]) {
            return String(obj[field]);
        }
    }
    return 'unknown';
}
/**
 * Estimate tokens in an MCP tool response
 * @param toolName - Name of the tool called
 * @param response - Tool response data
 * @returns Token estimate
 */
function estimateToolResponseTokens(toolName, response) {
    const responseTokens = estimateObjectTokens(response);
    const toolNameTokens = estimateTokens(toolName);
    // Add metadata overhead (approximately 10 tokens for wrapper)
    const overhead = 50;
    return responseTokens + toolNameTokens + overhead;
}
/**
 * Format tokens for display
 * @param tokens - Token count
 * @returns Formatted string (e.g., "450 tokens")
 */
function formatTokens(tokens) {
    if (tokens < 1000) {
        return `${tokens} tokens`;
    }
    const thousands = (tokens / 1000).toFixed(1);
    return `${thousands}K tokens`;
}
/**
 * Calculate token ratio (tokens used / budget)
 * @param tokensUsed - Tokens used
 * @param tokenBudget - Total token budget
 * @returns Percentage of budget used (0-100)
 */
function calculateTokenRatio(tokensUsed, tokenBudget) {
    if (tokenBudget <= 0)
        return 0;
    return Math.min(100, (tokensUsed / tokenBudget) * 100);
}
