#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const client_gen_1 = require("./client/client.gen");
const config_1 = require("./config");
const server_1 = require("./server");
async function main() {
    // Initialize Axios Client
    client_gen_1.client.setConfig({
        baseURL: "https://coda.io/apis/v1",
        headers: {
            Authorization: `Bearer ${config_1.config.apiKey}`,
        },
    });
    // Initialize MCP Server
    const transport = new stdio_js_1.StdioServerTransport();
    await server_1.server.connect(transport);
    console.error("Coda MCP server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
