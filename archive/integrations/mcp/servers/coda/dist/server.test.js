"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_testing_kit_1 = require("mcp-testing-kit");
const vitest_1 = require("vitest");
const helpers = __importStar(require("./client/helpers"));
const sdk = __importStar(require("./client/sdk.gen"));
const server_1 = require("./server");
vitest_1.vi.mock("./client/sdk.gen");
vitest_1.vi.mock("./client/helpers");
vitest_1.vi.mock("axios");
const expectJSONContent = (result, expected) => {
    (0, vitest_1.expect)(result.content).toHaveLength(1);
    const [item] = result.content;
    (0, vitest_1.expect)(item.type).toBe("text");
    (0, vitest_1.expect)(JSON.parse(item.text)).toEqual(expected);
};
const expectTextContent = (result, expected) => {
    (0, vitest_1.expect)(result.content).toEqual([{ type: "text", text: expected }]);
};
(0, vitest_1.describe)("MCP Server", () => {
    (0, vitest_1.afterEach)(async () => {
        await (0, mcp_testing_kit_1.close)(server_1.server.server);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)("should have all tools", async () => {
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.listTools();
        const toolNames = result.tools?.map((tool) => tool.name) || [];
        (0, vitest_1.expect)(toolNames).toEqual(vitest_1.expect.arrayContaining([
            "coda_list_documents",
            "coda_get_document",
            "coda_create_document",
            "coda_update_document",
            "coda_list_pages",
            "coda_create_page",
            "coda_delete_page",
            "coda_get_page_content",
            "coda_peek_page",
            "coda_replace_page_content",
            "coda_append_page_content",
            "coda_duplicate_page",
            "coda_rename_page",
        ]));
    });
});
(0, vitest_1.describe)("coda_list_documents", () => {
    (0, vitest_1.it)("should list documents without query", async () => {
        vitest_1.vi.mocked(sdk.listDocs).mockResolvedValue({
            data: {
                items: [
                    { id: "123", name: "Test Document" },
                    { id: "456", name: "Another Document" },
                ],
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_documents", { query: "" });
        expectJSONContent(result, {
            items: [
                { id: "123", name: "Test Document" },
                { id: "456", name: "Another Document" },
            ],
        });
    });
    (0, vitest_1.it)("should list documents with query", async () => {
        vitest_1.vi.mocked(sdk.listDocs).mockResolvedValue({
            data: {
                items: [{ id: "123", name: "Test Document" }],
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_documents", { query: "test" });
        expectJSONContent(result, {
            items: [{ id: "123", name: "Test Document" }],
        });
    });
    (0, vitest_1.it)("should show error if list documents throws", async () => {
        vitest_1.vi.mocked(sdk.listDocs).mockRejectedValue(new Error("foo"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_documents", { query: "test" });
        expectTextContent(result, "Failed to list documents : foo");
    });
});
(0, vitest_1.describe)("coda_list_pages", () => {
    (0, vitest_1.it)("should list pages successfully without limit or nextPageToken", async () => {
        vitest_1.vi.mocked(sdk.listPages).mockResolvedValue({
            data: {
                items: [
                    { id: "page-123", name: "Test Page 1" },
                    { id: "page-456", name: "Test Page 2" },
                ],
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_pages", { docId: "doc-123" });
        expectJSONContent(result, {
            items: [
                { id: "page-123", name: "Test Page 1" },
                { id: "page-456", name: "Test Page 2" },
            ],
        });
        (0, vitest_1.expect)(sdk.listPages).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            query: { limit: undefined, pageToken: undefined },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should list pages with limit", async () => {
        vitest_1.vi.mocked(sdk.listPages).mockResolvedValue({
            data: {
                items: [
                    { id: "page-123", name: "Test Page 1" },
                    { id: "page-456", name: "Test Page 2" },
                ],
                nextPageToken: "token-123",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_pages", { docId: "doc-123", limit: 10 });
        expectJSONContent(result, {
            items: [
                { id: "page-123", name: "Test Page 1" },
                { id: "page-456", name: "Test Page 2" },
            ],
            nextPageToken: "token-123",
        });
        (0, vitest_1.expect)(sdk.listPages).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            query: { limit: 10, pageToken: undefined },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should list pages with nextPageToken", async () => {
        vitest_1.vi.mocked(sdk.listPages).mockResolvedValue({
            data: {
                items: [
                    { id: "page-789", name: "Test Page 3" },
                    { id: "page-101", name: "Test Page 4" },
                ],
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_pages", {
            docId: "doc-123",
            nextPageToken: "token-123",
        });
        expectJSONContent(result, {
            items: [
                { id: "page-789", name: "Test Page 3" },
                { id: "page-101", name: "Test Page 4" },
            ],
        });
        (0, vitest_1.expect)(sdk.listPages).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            query: { limit: undefined, pageToken: "token-123" },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should prioritize nextPageToken over limit", async () => {
        vitest_1.vi.mocked(sdk.listPages).mockResolvedValue({
            data: {
                items: [{ id: "page-789", name: "Test Page 3" }],
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_pages", {
            docId: "doc-123",
            limit: 5,
            nextPageToken: "token-123",
        });
        expectJSONContent(result, {
            items: [{ id: "page-789", name: "Test Page 3" }],
        });
        // When nextPageToken is provided, limit should be undefined
        (0, vitest_1.expect)(sdk.listPages).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            query: { limit: undefined, pageToken: "token-123" },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should show error if list pages throws", async () => {
        vitest_1.vi.mocked(sdk.listPages).mockRejectedValue(new Error("Access denied"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_list_pages", { docId: "doc-123" });
        expectTextContent(result, "Failed to list pages : Access denied");
    });
});
(0, vitest_1.describe)("coda_create_page", () => {
    (0, vitest_1.it)("should create page with content", async () => {
        vitest_1.vi.mocked(sdk.createPage).mockResolvedValue({
            data: {
                id: "page-new",
                requestId: "req-123",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_create_page", {
            docId: "doc-123",
            name: "New Page",
            content: "# Hello World",
        });
        expectJSONContent(result, { id: "page-new", requestId: "req-123" });
        (0, vitest_1.expect)(sdk.createPage).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            body: {
                name: "New Page",
                pageContent: {
                    type: "canvas",
                    canvasContent: { format: "markdown", content: "# Hello World" },
                },
            },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should create page without content", async () => {
        vitest_1.vi.mocked(sdk.createPage).mockResolvedValue({
            data: {
                id: "page-new",
                requestId: "req-124",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        await client.callTool("coda_create_page", {
            docId: "doc-123",
            name: "Empty Page",
        });
        (0, vitest_1.expect)(sdk.createPage).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            body: {
                name: "Empty Page",
                pageContent: {
                    type: "canvas",
                    canvasContent: { format: "markdown", content: " " },
                },
            },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should create page with parent page id and content", async () => {
        vitest_1.vi.mocked(sdk.createPage).mockResolvedValue({
            data: {
                id: "page-sub",
                requestId: "req-125",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_create_page", {
            docId: "doc-123",
            name: "Subpage",
            parentPageId: "page-456",
            content: "## Subheading",
        });
        expectJSONContent(result, { id: "page-sub", requestId: "req-125" });
        (0, vitest_1.expect)(sdk.createPage).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            body: {
                name: "Subpage",
                parentPageId: "page-456",
                pageContent: {
                    type: "canvas",
                    canvasContent: { format: "markdown", content: "## Subheading" },
                },
            },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should show error if create page throws", async () => {
        vitest_1.vi.mocked(sdk.createPage).mockRejectedValue(new Error("Insufficient permissions"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_create_page", {
            docId: "doc-123",
            name: "New Page",
        });
        expectTextContent(result, "Failed to create page : Insufficient permissions");
    });
});
(0, vitest_1.describe)("coda_get_page_content", () => {
    (0, vitest_1.it)("should get page content successfully", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockResolvedValue("# Page Title\n\nThis is the content.");
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_get_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
        });
        (0, vitest_1.expect)(result.content).toEqual([
            {
                type: "text",
                text: "# Page Title\n\nThis is the content.",
            },
        ]);
        (0, vitest_1.expect)(helpers.getPageContent).toHaveBeenCalledWith("doc-123", "page-456");
    });
    (0, vitest_1.it)("should handle empty page content", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockResolvedValue("");
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_get_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
        });
        (0, vitest_1.expect)(result.content).toEqual([
            {
                type: "text",
                text: "",
            },
        ]);
    });
    (0, vitest_1.it)("should show error if getPageContent returns undefined", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockResolvedValue(undefined);
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_get_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
        });
        expectTextContent(result, "Failed to get page content : Unknown error has occurred");
    });
    (0, vitest_1.it)("should show error if getPageContent throws", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockRejectedValue(new Error("Export failed"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_get_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
        });
        expectTextContent(result, "Failed to get page content : Export failed");
    });
});
(0, vitest_1.describe)("coda_peek_page", () => {
    (0, vitest_1.it)("should peek page content successfully", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockResolvedValue("# Title\nLine 1\nLine 2\nLine 3");
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_peek_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            numLines: 2,
        });
        (0, vitest_1.expect)(result.content).toEqual([
            {
                type: "text",
                text: "# Title\nLine 1",
            },
        ]);
        (0, vitest_1.expect)(helpers.getPageContent).toHaveBeenCalledWith("doc-123", "page-456");
    });
    (0, vitest_1.it)("should show error if getPageContent returns undefined", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockResolvedValue(undefined);
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_peek_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            numLines: 1,
        });
        expectTextContent(result, "Failed to peek page : Unknown error has occurred");
    });
    (0, vitest_1.it)("should show error if getPageContent throws", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockRejectedValue(new Error("Export failed"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_peek_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            numLines: 3,
        });
        expectTextContent(result, "Failed to peek page : Export failed");
    });
});
(0, vitest_1.describe)("coda_replace_page_content", () => {
    (0, vitest_1.it)("should replace page content successfully", async () => {
        vitest_1.vi.mocked(sdk.updatePage).mockResolvedValue({
            data: {
                id: "page-456",
                requestId: "req-125",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_replace_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            content: "# New Content\n\nReplaced content.",
        });
        expectJSONContent(result, { id: "page-456", requestId: "req-125" });
        (0, vitest_1.expect)(sdk.updatePage).toHaveBeenCalledWith({
            path: { docId: "doc-123", pageIdOrName: "page-456" },
            body: {
                contentUpdate: {
                    insertionMode: "replace",
                    canvasContent: { format: "markdown", content: "# New Content\n\nReplaced content." },
                },
            },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should show error if replace page content throws", async () => {
        vitest_1.vi.mocked(sdk.updatePage).mockRejectedValue(new Error("Update failed"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_replace_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            content: "# New Content",
        });
        expectTextContent(result, "Failed to replace page content : Update failed");
    });
});
(0, vitest_1.describe)("coda_append_page_content", () => {
    (0, vitest_1.it)("should append page content successfully", async () => {
        vitest_1.vi.mocked(sdk.updatePage).mockResolvedValue({
            data: {
                id: "page-456",
                requestId: "req-126",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_append_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            content: "\n\n## Appended Section\n\nNew content.",
        });
        expectJSONContent(result, { id: "page-456", requestId: "req-126" });
        (0, vitest_1.expect)(sdk.updatePage).toHaveBeenCalledWith({
            path: { docId: "doc-123", pageIdOrName: "page-456" },
            body: {
                contentUpdate: {
                    insertionMode: "append",
                    canvasContent: { format: "markdown", content: "\n\n## Appended Section\n\nNew content." },
                },
            },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should show error if append page content throws", async () => {
        vitest_1.vi.mocked(sdk.updatePage).mockRejectedValue(new Error("Append failed"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_append_page_content", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            content: "Additional content",
        });
        expectTextContent(result, "Failed to append page content : Append failed");
    });
});
(0, vitest_1.describe)("coda_duplicate_page", () => {
    (0, vitest_1.it)("should duplicate page successfully", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockResolvedValue("# Original Page\n\nOriginal content.");
        vitest_1.vi.mocked(sdk.createPage).mockResolvedValue({
            data: {
                id: "page-duplicate",
                requestId: "req-127",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_duplicate_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            newName: "Duplicated Page",
        });
        expectJSONContent(result, { id: "page-duplicate", requestId: "req-127" });
        (0, vitest_1.expect)(helpers.getPageContent).toHaveBeenCalledWith("doc-123", "page-456");
        (0, vitest_1.expect)(sdk.createPage).toHaveBeenCalledWith({
            path: { docId: "doc-123" },
            body: {
                name: "Duplicated Page",
                pageContent: {
                    type: "canvas",
                    canvasContent: { format: "markdown", content: "# Original Page\n\nOriginal content." },
                },
            },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should show error if getPageContent fails during duplication", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockRejectedValue(new Error("Content fetch failed"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_duplicate_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            newName: "Duplicated Page",
        });
        expectTextContent(result, "Failed to duplicate page : Content fetch failed");
    });
    (0, vitest_1.it)("should show error if createPage fails during duplication", async () => {
        vitest_1.vi.mocked(helpers.getPageContent).mockResolvedValue("# Original Page");
        vitest_1.vi.mocked(sdk.createPage).mockRejectedValue(new Error("Create failed"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_duplicate_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            newName: "Duplicated Page",
        });
        expectTextContent(result, "Failed to duplicate page : Create failed");
    });
});
(0, vitest_1.describe)("coda_rename_page", () => {
    (0, vitest_1.it)("should rename page successfully", async () => {
        vitest_1.vi.mocked(sdk.updatePage).mockResolvedValue({
            data: {
                id: "page-456",
                requestId: "req-128",
            },
        });
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_rename_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            newName: "Renamed Page",
        });
        expectJSONContent(result, { id: "page-456", requestId: "req-128" });
        (0, vitest_1.expect)(sdk.updatePage).toHaveBeenCalledWith({
            path: { docId: "doc-123", pageIdOrName: "page-456" },
            body: {
                name: "Renamed Page",
            },
            throwOnError: true,
        });
    });
    (0, vitest_1.it)("should show error if rename page throws", async () => {
        vitest_1.vi.mocked(sdk.updatePage).mockRejectedValue(new Error("Rename failed"));
        const client = await (0, mcp_testing_kit_1.connect)(server_1.server.server);
        const result = await client.callTool("coda_rename_page", {
            docId: "doc-123",
            pageIdOrName: "page-456",
            newName: "Renamed Page",
        });
        expectTextContent(result, "Failed to rename page : Rename failed");
    });
});
