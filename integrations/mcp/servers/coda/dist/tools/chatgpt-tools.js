"use strict";
/**
 * ChatGPT-Specific MCP Tools
 *
 * These are simplified wrappers around Coda API operations
 * optimized for ChatGPT's search/fetch paradigm
 *
 * ChatGPT requires exactly 2 tools:
 * 1. search(query) - find documents
 * 2. fetch(id) - get full content
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatgptToolDefinitions = void 0;
exports.searchDocuments = searchDocuments;
exports.fetchDocument = fetchDocument;
exports.executeChatGPTTool = executeChatGPTTool;
const client_gen_js_1 = require("../client/client.gen.js");
const sse_transport_js_1 = require("../transports/sse-transport.js");
/**
 * Search tool - Find documents in Coda
 *
 * ChatGPT Request Format:
 * {
 *   "name": "search",
 *   "arguments": {
 *     "query": "user query"
 *   }
 * }
 *
 * Expected Response Format:
 * {
 *   "results": [
 *     { "id": "doc_123", "title": "Document Title", "url": "https://..." },
 *     ...
 *   ]
 * }
 */
async function searchDocuments(query, token) {
    try {
        console.log(`[SEARCH] Query: "${query}"`);
        // Configure client with token
        client_gen_js_1.client.setConfig({
            baseURL: 'https://coda.io/apis/v1',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        // Call Coda API to list documents
        // The search is done client-side by filtering results
        const resp = await client_gen_js_1.client.listDocs({
            query: {
                query: query,
                limit: 10,
            },
        }, { throwOnError: true });
        const documents = resp.data?.items || [];
        console.log(`[SEARCH] Found ${documents.length} documents`);
        // Format for ChatGPT
        return (0, sse_transport_js_1.formatSearchResult)(documents);
    }
    catch (error) {
        console.error('[SEARCH] Error:', error);
        return {
            results: [],
            error: error instanceof Error ? error.message : 'Search failed',
        };
    }
}
/**
 * Fetch tool - Get full document content
 *
 * ChatGPT Request Format:
 * {
 *   "name": "fetch",
 *   "arguments": {
 *     "id": "doc_123"
 *   }
 * }
 *
 * Expected Response Format:
 * {
 *   "id": "doc_123",
 *   "title": "Document Title",
 *   "text": "Full document content",
 *   "url": "https://...",
 *   "metadata": {...}
 * }
 */
async function fetchDocument(docId, token) {
    try {
        console.log(`[FETCH] Doc ID: ${docId}`);
        // Configure client with token
        client_gen_js_1.client.setConfig({
            baseURL: 'https://coda.io/apis/v1',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        // Get document metadata
        const docResp = await client_gen_js_1.client.getDoc({ path: { docId } }, { throwOnError: true });
        const doc = docResp.data;
        // Get document pages for content
        let content = '';
        try {
            const pagesResp = await client_gen_js_1.client.listPages({
                path: { docId },
                query: { limit: 100 },
            }, { throwOnError: true });
            const pages = pagesResp.data?.items || [];
            console.log(`[FETCH] Found ${pages.length} pages`);
            // Build content from pages
            const contentParts = [];
            for (const page of pages) {
                contentParts.push(`# ${page.name}\n`);
                // Get page content
                try {
                    const pageContentResp = await client_gen_js_1.client.getPageContent({ path: { docId, pageIdOrName: page.id } }, { throwOnError: true });
                    if (pageContentResp.data?.markdown) {
                        contentParts.push(pageContentResp.data.markdown);
                    }
                }
                catch (pageError) {
                    console.warn(`[FETCH] Failed to get page ${page.id}:`, pageError);
                    contentParts.push(`[Content unavailable]\n`);
                }
                contentParts.push('\n---\n\n');
            }
            content = contentParts.join('');
        }
        catch (pagesError) {
            console.warn('[FETCH] Failed to get pages, using document title only:', pagesError);
            content = `# ${doc.name}\n\nDocument content retrieval in progress.`;
        }
        console.log(`[FETCH] Content size: ${content.length} bytes`);
        // Format for ChatGPT
        return (0, sse_transport_js_1.formatFetchResult)(doc, content);
    }
    catch (error) {
        console.error('[FETCH] Error:', error);
        return {
            id: docId,
            error: error instanceof Error ? error.message : 'Fetch failed',
        };
    }
}
/**
 * Tool definitions for SSE registration
 *
 * These match ChatGPT's expected tool schema
 */
exports.chatgptToolDefinitions = [
    {
        name: 'search',
        description: 'Search for documents in Coda by query. Returns a list of matching documents with IDs, titles, and URLs.',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query to find documents (supports natural language)',
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'fetch',
        description: 'Fetch the full content of a document by ID. Returns the complete document with all pages and content.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Document ID (from search results)',
                },
            },
            required: ['id'],
        },
    },
];
/**
 * Execute a ChatGPT tool call
 *
 * Routes tool execution based on tool name
 */
async function executeChatGPTTool(toolName, arguments_, token) {
    console.log(`[TOOL] Executing: ${toolName}`, arguments_);
    switch (toolName) {
        case 'search':
            return searchDocuments(arguments_.query, token);
        case 'fetch':
            return fetchDocument(arguments_.id, token);
        default:
            console.error(`[TOOL] Unknown tool: ${toolName}`);
            return {
                error: `Unknown tool: ${toolName}`,
                availableTools: ['search', 'fetch'],
            };
    }
}
