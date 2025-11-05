"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = __importDefault(require("zod"));
const package_json_1 = __importDefault(require("../package.json"));
const helpers_1 = require("./client/helpers");
const sdk_gen_1 = require("./client/sdk.gen");
exports.server = new mcp_js_1.McpServer({
    name: "coda-enhanced",
    version: package_json_1.default.version,
    capabilities: {
        resources: {},
        tools: {},
    },
});
// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================
exports.server.tool("coda_list_documents", "List or search available documents", {
    query: zod_1.default.string().optional().describe("The query to search for documents by - optional"),
    limit: zod_1.default.number().int().positive().optional().describe("Maximum number of results to return"),
    isOwner: zod_1.default.boolean().optional().describe("Show only docs owned by the user"),
    isPublished: zod_1.default.boolean().optional().describe("Show only published docs"),
}, async ({ query, limit, isOwner, isPublished }) => {
    try {
        const resp = await (0, sdk_gen_1.listDocs)({
            query: { query, limit, isOwner, isPublished },
            throwOnError: true
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to list documents : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_document", "Get detailed information about a specific document", {
    docId: zod_1.default.string().describe("The ID of the document to get information about"),
}, async ({ docId }) => {
    try {
        const resp = await (0, sdk_gen_1.getDoc)({ path: { docId }, throwOnError: true });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get document : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_create_document", "Create a new document", {
    title: zod_1.default.string().describe("Title of the new document"),
    sourceDoc: zod_1.default.string().optional().describe("Optional doc ID to copy from"),
    folderId: zod_1.default.string().optional().describe("Optional folder ID to create the doc in"),
}, async ({ title, sourceDoc, folderId }) => {
    try {
        const resp = await (0, sdk_gen_1.createDoc)({
            body: { title, sourceDoc, folderId },
            throwOnError: true
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to create document : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_update_document", "Update document properties like title", {
    docId: zod_1.default.string().describe("The ID of the document to update"),
    title: zod_1.default.string().optional().describe("New title for the document"),
    iconName: zod_1.default.string().optional().describe("New icon name for the document"),
}, async ({ docId, title, iconName }) => {
    try {
        const resp = await (0, sdk_gen_1.updateDoc)({
            path: { docId },
            body: { title, iconName },
            throwOnError: true
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to update document : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// PAGE OPERATIONS (Enhanced)
// ============================================================================
exports.server.tool("coda_list_pages", "List pages in the current document with pagination", {
    docId: zod_1.default.string().describe("The ID of the document to list pages from"),
    limit: zod_1.default.number().int().positive().optional().describe("The number of pages to return - optional, defaults to 25"),
    nextPageToken: zod_1.default
        .string()
        .optional()
        .describe("The token need to get the next page of results, returned from a previous call to this tool - optional"),
}, async ({ docId, limit, nextPageToken }) => {
    try {
        const listLimit = nextPageToken ? undefined : limit;
        const resp = await (0, sdk_gen_1.listPages)({
            path: { docId },
            query: { limit: listLimit, pageToken: nextPageToken ?? undefined },
            throwOnError: true,
        });
        return {
            content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Failed to list pages : ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
        };
    }
});
exports.server.tool("coda_create_page", "Create a page in the current document", {
    docId: zod_1.default.string().describe("The ID of the document to create the page in"),
    name: zod_1.default.string().describe("The name of the page to create"),
    content: zod_1.default.string().optional().describe("The markdown content of the page to create - optional"),
    parentPageId: zod_1.default.string().optional().describe("The ID of the parent page to create this page under - optional"),
    subtitle: zod_1.default.string().optional().describe("Optional subtitle for the page"),
    iconName: zod_1.default.string().optional().describe("Optional icon name for the page"),
}, async ({ docId, name, content, parentPageId, subtitle, iconName }) => {
    try {
        const resp = await (0, sdk_gen_1.createPage)({
            path: { docId },
            body: {
                name,
                subtitle,
                iconName,
                parentPageId: parentPageId ?? undefined,
                pageContent: {
                    type: "canvas",
                    canvasContent: { format: "markdown", content: content ?? " " },
                },
            },
            throwOnError: true,
        });
        return {
            content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }],
        };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to create page : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_delete_page", "Delete a page from the document", {
    docId: zod_1.default.string().describe("The ID of the document containing the page"),
    pageIdOrName: zod_1.default.string().describe("The ID or name of the page to delete"),
}, async ({ docId, pageIdOrName }) => {
    try {
        const resp = await (0, sdk_gen_1.deletePage)({
            path: { docId, pageIdOrName },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to delete page : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_page_content", "Get the content of a page as markdown", {
    docId: zod_1.default.string().describe("The ID of the document that contains the page to get the content of"),
    pageIdOrName: zod_1.default.string().describe("The ID or name of the page to get the content of"),
}, async ({ docId, pageIdOrName }) => {
    try {
        const content = await (0, helpers_1.getPageContent)(docId, pageIdOrName);
        if (content === undefined) {
            throw new Error("Unknown error has occurred");
        }
        return { content: [{ type: "text", text: content }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get page content : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_peek_page", "Peek into the beginning of a page and return a limited number of lines", {
    docId: zod_1.default.string().describe("The ID of the document that contains the page to peek into"),
    pageIdOrName: zod_1.default.string().describe("The ID or name of the page to peek into"),
    numLines: zod_1.default
        .number()
        .int()
        .positive()
        .describe("The number of lines to return from the start of the page - usually 30 lines is enough"),
}, async ({ docId, pageIdOrName, numLines }) => {
    try {
        const content = await (0, helpers_1.getPageContent)(docId, pageIdOrName);
        if (!content) {
            throw new Error("Unknown error has occurred");
        }
        const preview = content.split(/\r?\n/).slice(0, numLines).join("\n");
        return { content: [{ type: "text", text: preview }] };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Failed to peek page : ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
        };
    }
});
exports.server.tool("coda_replace_page_content", "Replace the content of a page with new markdown content", {
    docId: zod_1.default.string().describe("The ID of the document that contains the page to replace the content of"),
    pageIdOrName: zod_1.default.string().describe("The ID or name of the page to replace the content of"),
    content: zod_1.default.string().describe("The markdown content to replace the page with"),
}, async ({ docId, pageIdOrName, content }) => {
    try {
        const resp = await (0, sdk_gen_1.updatePage)({
            path: {
                docId,
                pageIdOrName,
            },
            body: {
                // @ts-expect-error auto-generated client types
                contentUpdate: {
                    insertionMode: "replace",
                    canvasContent: { format: "markdown", content },
                },
            },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to replace page content : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_append_page_content", "Append new markdown content to the end of a page", {
    docId: zod_1.default.string().describe("The ID of the document that contains the page to append the content to"),
    pageIdOrName: zod_1.default.string().describe("The ID or name of the page to append the content to"),
    content: zod_1.default.string().describe("The markdown content to append to the page"),
}, async ({ docId, pageIdOrName, content }) => {
    try {
        const resp = await (0, sdk_gen_1.updatePage)({
            path: {
                docId,
                pageIdOrName,
            },
            body: {
                // @ts-expect-error auto-generated client types
                contentUpdate: {
                    insertionMode: "append",
                    canvasContent: { format: "markdown", content },
                },
            },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to append page content : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_duplicate_page", "Duplicate a page in the current document", {
    docId: zod_1.default.string().describe("The ID of the document that contains the page to duplicate"),
    pageIdOrName: zod_1.default.string().describe("The ID or name of the page to duplicate"),
    newName: zod_1.default.string().describe("The name of the new page"),
}, async ({ docId, pageIdOrName, newName }) => {
    try {
        const pageContent = await (0, helpers_1.getPageContent)(docId, pageIdOrName);
        const createResp = await (0, sdk_gen_1.createPage)({
            path: { docId },
            body: {
                name: newName,
                pageContent: { type: "canvas", canvasContent: { format: "markdown", content: pageContent } },
            },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(createResp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to duplicate page : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_rename_page", "Rename a page in the current document", {
    docId: zod_1.default.string().describe("The ID of the document that contains the page to rename"),
    pageIdOrName: zod_1.default.string().describe("The ID or name of the page to rename"),
    newName: zod_1.default.string().describe("The new name of the page"),
    subtitle: zod_1.default.string().optional().describe("Optional new subtitle for the page"),
}, async ({ docId, pageIdOrName, newName, subtitle }) => {
    try {
        const resp = await (0, sdk_gen_1.updatePage)({
            path: { docId, pageIdOrName },
            body: {
                name: newName,
                subtitle,
            },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to rename page : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// TABLE OPERATIONS
// ============================================================================
exports.server.tool("coda_list_tables", "List all tables and views in a document", {
    docId: zod_1.default.string().describe("The ID of the document to list tables from"),
    tableTypes: zod_1.default.array(zod_1.default.enum(["table", "view"])).optional().describe("Filter by table types"),
    limit: zod_1.default.number().int().positive().optional().describe("Maximum number of results to return"),
}, async ({ docId, tableTypes, limit }) => {
    try {
        const resp = await (0, sdk_gen_1.listTables)({
            path: { docId },
            query: { tableTypes, limit },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to list tables : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_table", "Get detailed information about a specific table or view", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table to get information about"),
}, async ({ docId, tableIdOrName }) => {
    try {
        const resp = await (0, sdk_gen_1.getTable)({
            path: { docId, tableIdOrName },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get table : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_table_summary", "Get a detailed summary of a table including row count and column info", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table to summarize"),
}, async ({ docId, tableIdOrName }) => {
    try {
        // Get table info
        const tableResp = await (0, sdk_gen_1.getTable)({ path: { docId, tableIdOrName }, throwOnError: true });
        // Get columns
        const columnsResp = await (0, sdk_gen_1.listColumns)({ path: { docId, tableIdOrName }, throwOnError: true });
        // Get a sample of rows to understand data types
        const rowsResp = await (0, sdk_gen_1.listRows)({
            path: { docId, tableIdOrName },
            query: { limit: 5 },
            throwOnError: true
        });
        const summary = {
            table: {
                id: tableResp.data.id,
                name: tableResp.data.name,
                type: tableResp.data.tableType,
                rowCount: tableResp.data.rowCount,
                createdAt: tableResp.data.createdAt,
                updatedAt: tableResp.data.updatedAt,
            },
            columns: columnsResp.data.items.map(col => ({
                name: col.name,
                id: col.id,
                type: col.format.type,
                calculated: col.calculated || false,
                display: col.display || false,
            })),
            sampleData: rowsResp.data.items.slice(0, 3), // First 3 rows as sample
            stats: {
                totalColumns: columnsResp.data.items.length,
                calculatedColumns: columnsResp.data.items.filter(c => c.calculated).length,
                displayColumn: columnsResp.data.items.find(c => c.display)?.name || 'Unknown',
            }
        };
        return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get table summary : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// COLUMN OPERATIONS
// ============================================================================
exports.server.tool("coda_list_columns", "List all columns in a table", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table to list columns from"),
    limit: zod_1.default.number().int().positive().optional().describe("Maximum number of results to return"),
    visibleOnly: zod_1.default.boolean().optional().describe("If true, returns only visible columns"),
}, async ({ docId, tableIdOrName, limit, visibleOnly }) => {
    try {
        const resp = await (0, sdk_gen_1.listColumns)({
            path: { docId, tableIdOrName },
            query: { limit, visibleOnly },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to list columns : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_column", "Get detailed information about a specific column", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table containing the column"),
    columnIdOrName: zod_1.default.string().describe("The ID or name of the column to get information about"),
}, async ({ docId, tableIdOrName, columnIdOrName }) => {
    try {
        const resp = await (0, sdk_gen_1.getColumn)({
            path: { docId, tableIdOrName, columnIdOrName },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get column : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// ROW OPERATIONS
// ============================================================================
exports.server.tool("coda_list_rows", "List rows in a table with optional filtering and pagination", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table to list rows from"),
    query: zod_1.default.string().optional().describe("Query to filter rows (format: column_name:value)"),
    limit: zod_1.default.number().int().positive().optional().describe("Maximum number of results to return"),
    sortBy: zod_1.default.enum(["createdAt", "natural", "updatedAt"]).optional().describe("How to sort the results"),
    useColumnNames: zod_1.default.boolean().optional().describe("Use column names instead of IDs in output"),
    visibleOnly: zod_1.default.boolean().optional().describe("Return only visible rows and columns"),
}, async ({ docId, tableIdOrName, query, limit, sortBy, useColumnNames, visibleOnly }) => {
    try {
        const resp = await (0, sdk_gen_1.listRows)({
            path: { docId, tableIdOrName },
            query: { query, limit, sortBy, useColumnNames, visibleOnly },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to list rows : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_row", "Get detailed information about a specific row", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table containing the row"),
    rowIdOrName: zod_1.default.string().describe("The ID or name of the row to get information about"),
    useColumnNames: zod_1.default.boolean().optional().describe("Use column names instead of IDs in output"),
}, async ({ docId, tableIdOrName, rowIdOrName, useColumnNames }) => {
    try {
        const resp = await (0, sdk_gen_1.getRow)({
            path: { docId, tableIdOrName, rowIdOrName },
            query: { useColumnNames },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get row : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_create_rows", "Create or update multiple rows in a table", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table to add rows to"),
    rows: zod_1.default.array(zod_1.default.record(zod_1.default.any())).describe("Array of row objects with column names/IDs as keys"),
    keyColumns: zod_1.default.array(zod_1.default.string()).optional().describe("Column IDs/names to use as upsert keys"),
}, async ({ docId, tableIdOrName, rows, keyColumns }) => {
    try {
        const formattedRows = rows.map(row => ({
            cells: Object.entries(row).map(([column, value]) => ({
                column,
                value,
            })),
        }));
        const resp = await (0, sdk_gen_1.upsertRows)({
            path: { docId, tableIdOrName },
            body: {
                rows: formattedRows,
                keyColumns,
            },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to create rows : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_update_row", "Update a specific row in a table", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table containing the row"),
    rowIdOrName: zod_1.default.string().describe("The ID or name of the row to update"),
    values: zod_1.default.record(zod_1.default.any()).describe("Object with column names/IDs as keys and new values"),
}, async ({ docId, tableIdOrName, rowIdOrName, values }) => {
    try {
        const cells = Object.entries(values).map(([column, value]) => ({
            column,
            value,
        }));
        const resp = await (0, sdk_gen_1.updateRow)({
            path: { docId, tableIdOrName, rowIdOrName },
            body: {
                row: { cells },
            },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to update row : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_delete_row", "Delete a specific row from a table", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table containing the row"),
    rowIdOrName: zod_1.default.string().describe("The ID or name of the row to delete"),
}, async ({ docId, tableIdOrName, rowIdOrName }) => {
    try {
        const resp = await (0, sdk_gen_1.deleteRow)({
            path: { docId, tableIdOrName, rowIdOrName },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to delete row : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_delete_rows", "Delete multiple rows from a table", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table to delete rows from"),
    rowIds: zod_1.default.array(zod_1.default.string()).describe("Array of row IDs to delete"),
}, async ({ docId, tableIdOrName, rowIds }) => {
    try {
        const resp = await (0, sdk_gen_1.deleteRows)({
            path: { docId, tableIdOrName },
            body: { rowIds },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to delete rows : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// FORMULA OPERATIONS
// ============================================================================
exports.server.tool("coda_list_formulas", "List all named formulas in a document", {
    docId: zod_1.default.string().describe("The ID of the document to list formulas from"),
    limit: zod_1.default.number().int().positive().optional().describe("Maximum number of results to return"),
    sortBy: zod_1.default.enum(["name"]).optional().describe("How to sort the results"),
}, async ({ docId, limit, sortBy }) => {
    try {
        const resp = await (0, sdk_gen_1.listFormulas)({
            path: { docId },
            query: { limit, sortBy },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to list formulas : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_formula", "Get detailed information about a specific formula", {
    docId: zod_1.default.string().describe("The ID of the document containing the formula"),
    formulaIdOrName: zod_1.default.string().describe("The ID or name of the formula to get information about"),
}, async ({ docId, formulaIdOrName }) => {
    try {
        const resp = await (0, sdk_gen_1.getFormula)({
            path: { docId, formulaIdOrName },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get formula : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// CONTROL OPERATIONS
// ============================================================================
exports.server.tool("coda_list_controls", "List all controls (buttons, sliders, etc.) in a document", {
    docId: zod_1.default.string().describe("The ID of the document to list controls from"),
    limit: zod_1.default.number().int().positive().optional().describe("Maximum number of results to return"),
    sortBy: zod_1.default.enum(["name"]).optional().describe("How to sort the results"),
}, async ({ docId, limit, sortBy }) => {
    try {
        const resp = await (0, sdk_gen_1.listControls)({
            path: { docId },
            query: { limit, sortBy },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to list controls : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_get_control", "Get detailed information about a specific control", {
    docId: zod_1.default.string().describe("The ID of the document containing the control"),
    controlIdOrName: zod_1.default.string().describe("The ID or name of the control to get information about"),
}, async ({ docId, controlIdOrName }) => {
    try {
        const resp = await (0, sdk_gen_1.getControl)({
            path: { docId, controlIdOrName },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get control : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_push_button", "Push a button control in a table row", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table containing the button"),
    rowIdOrName: zod_1.default.string().describe("The ID or name of the row containing the button"),
    columnIdOrName: zod_1.default.string().describe("The ID or name of the column containing the button"),
}, async ({ docId, tableIdOrName, rowIdOrName, columnIdOrName }) => {
    try {
        const resp = await (0, sdk_gen_1.pushButton)({
            path: { docId, tableIdOrName, rowIdOrName, columnIdOrName },
            throwOnError: true,
        });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to push button : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// USER AND ACCOUNT OPERATIONS
// ============================================================================
exports.server.tool("coda_whoami", "Get information about the current user", {}, async () => {
    try {
        const resp = await (0, sdk_gen_1.whoami)({ throwOnError: true });
        return { content: [{ type: "text", text: JSON.stringify(resp.data, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get user info : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// SEARCH AND QUERY OPERATIONS
// ============================================================================
exports.server.tool("coda_search_tables", "Search for tables across documents by name or content", {
    docId: zod_1.default.string().describe("The ID of the document to search in"),
    query: zod_1.default.string().describe("Search query to find tables"),
    tableTypes: zod_1.default.array(zod_1.default.enum(["table", "view"])).optional().describe("Filter by table types"),
}, async ({ docId, query, tableTypes }) => {
    try {
        // First get all tables
        const tablesResp = await (0, sdk_gen_1.listTables)({
            path: { docId },
            query: { tableTypes },
            throwOnError: true,
        });
        // Filter tables by name matching the query
        const filteredTables = tablesResp.data.items.filter(table => table.name.toLowerCase().includes(query.toLowerCase()));
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        items: filteredTables,
                        searchQuery: query,
                        totalFound: filteredTables.length
                    }, null, 2)
                }]
        };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to search tables : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
exports.server.tool("coda_search_pages", "Search for pages by name or content within a document", {
    docId: zod_1.default.string().describe("The ID of the document to search in"),
    query: zod_1.default.string().describe("Search query to find pages"),
    includeContent: zod_1.default.boolean().optional().describe("Whether to also search page content (slower)"),
}, async ({ docId, query, includeContent = false }) => {
    try {
        // Get all pages
        const pagesResp = await (0, sdk_gen_1.listPages)({
            path: { docId },
            throwOnError: true,
        });
        let filteredPages = pagesResp.data.items.filter(page => page.name.toLowerCase().includes(query.toLowerCase()));
        // If includeContent is true, also search page content
        if (includeContent) {
            const contentMatches = [];
            for (const page of pagesResp.data.items) {
                try {
                    const content = await (0, helpers_1.getPageContent)(docId, page.id);
                    if (content && content.toLowerCase().includes(query.toLowerCase())) {
                        // Only add if not already in name matches
                        if (!filteredPages.some(p => p.id === page.id)) {
                            contentMatches.push({ ...page, matchedInContent: true });
                        }
                    }
                }
                catch (error) {
                    // Skip pages where content can't be retrieved
                    console.error(`Failed to get content for page ${page.id}:`, error);
                }
            }
            filteredPages = [...filteredPages, ...contentMatches];
        }
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        items: filteredPages,
                        searchQuery: query,
                        searchedContent: includeContent,
                        totalFound: filteredPages.length
                    }, null, 2)
                }]
        };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to search pages : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// BATCH OPERATIONS
// ============================================================================
exports.server.tool("coda_bulk_update_rows", "Update multiple rows in a table with different values", {
    docId: zod_1.default.string().describe("The ID of the document containing the table"),
    tableIdOrName: zod_1.default.string().describe("The ID or name of the table containing the rows"),
    updates: zod_1.default.array(zod_1.default.object({
        rowIdOrName: zod_1.default.string().describe("The ID or name of the row to update"),
        values: zod_1.default.record(zod_1.default.any()).describe("Object with column names/IDs as keys and new values")
    })).describe("Array of row updates"),
}, async ({ docId, tableIdOrName, updates }) => {
    try {
        const results = [];
        for (const update of updates) {
            try {
                const cells = Object.entries(update.values).map(([column, value]) => ({
                    column,
                    value,
                }));
                const resp = await (0, sdk_gen_1.updateRow)({
                    path: { docId, tableIdOrName, rowIdOrName: update.rowIdOrName },
                    body: { row: { cells } },
                    throwOnError: true,
                });
                results.push({
                    rowId: update.rowIdOrName,
                    success: true,
                    data: resp.data
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                results.push({
                    rowId: update.rowIdOrName,
                    success: false,
                    error: errorMessage
                });
            }
        }
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        results,
                        totalUpdates: updates.length,
                        successful: results.filter(r => r.success).length,
                        failed: results.filter(r => !r.success).length
                    }, null, 2)
                }]
        };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to bulk update rows : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
// ============================================================================
// ANALYTICS AND INSIGHTS
// ============================================================================
exports.server.tool("coda_get_document_stats", "Get statistics and insights about a document", {
    docId: zod_1.default.string().describe("The ID of the document to analyze"),
}, async ({ docId }) => {
    try {
        // Get document info
        const docResp = await (0, sdk_gen_1.getDoc)({ path: { docId }, throwOnError: true });
        // Get pages count
        const pagesResp = await (0, sdk_gen_1.listPages)({ path: { docId }, throwOnError: true });
        // Get tables count
        const tablesResp = await (0, sdk_gen_1.listTables)({ path: { docId }, throwOnError: true });
        // Get formulas count
        const formulasResp = await (0, sdk_gen_1.listFormulas)({ path: { docId }, throwOnError: true });
        // Get controls count
        const controlsResp = await (0, sdk_gen_1.listControls)({ path: { docId }, throwOnError: true });
        const stats = {
            document: {
                id: docResp.data.id,
                name: docResp.data.name,
                owner: docResp.data.owner,
                createdAt: docResp.data.createdAt,
                updatedAt: docResp.data.updatedAt,
                docSize: docResp.data.docSize,
            },
            counts: {
                pages: pagesResp.data.items.length,
                tables: tablesResp.data.items.filter(t => t.tableType === 'table').length,
                views: tablesResp.data.items.filter(t => t.tableType === 'view').length,
                formulas: formulasResp.data.items.length,
                controls: controlsResp.data.items.length,
            },
            breakdown: {
                tableNames: tablesResp.data.items.map(t => ({ name: t.name, type: t.tableType })),
                pageNames: pagesResp.data.items.slice(0, 10).map(p => p.name), // First 10 pages
                formulaNames: formulasResp.data.items.slice(0, 10).map(f => f.name), // First 10 formulas
            }
        };
        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
    }
    catch (error) {
        return { content: [{ type: "text", text: `Failed to get document stats : ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
});
