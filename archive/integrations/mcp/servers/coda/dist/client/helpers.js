"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPageContent = getPageContent;
const axios_1 = __importDefault(require("axios"));
const sdk_gen_1 = require("./sdk.gen");
async function getPageContent(docId, pageIdOrName) {
    let requestId;
    try {
        // Begin page export
        const beginExportResp = await (0, sdk_gen_1.beginPageContentExport)({
            path: {
                docId,
                pageIdOrName,
            },
            body: {
                outputFormat: "markdown",
            },
            throwOnError: true,
        });
        if (!beginExportResp.data) {
            throw new Error("Failed to begin page content export");
        }
        requestId = beginExportResp.data.id;
    }
    catch (error) {
        throw new Error(`Failed to get page content : ${error instanceof Error ? error.message : String(error)}`);
    }
    // Poll for export status
    let retries = 0;
    const maxRetries = 5;
    let downloadLink;
    while (retries < maxRetries) {
        // Wait for 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 5000));
        try {
            const exportStatusResp = await (0, sdk_gen_1.getPageContentExportStatus)({
                path: {
                    docId,
                    pageIdOrName,
                    requestId,
                },
                throwOnError: true,
            });
            if (exportStatusResp.data?.status === "complete") {
                downloadLink = exportStatusResp.data.downloadLink;
                break;
            }
        }
        catch (error) {
            throw new Error(`Failed to get page content export status : ${error instanceof Error ? error.message : String(error)}`);
        }
        retries++;
        if (retries >= maxRetries) {
            throw new Error(`Page content export did not complete after ${maxRetries} retries.`);
        }
    }
    if (!downloadLink) {
        throw new Error("Failed to get page content export status");
    }
    try {
        const downloadResponse = await axios_1.default.get(downloadLink, {
            responseType: "text",
        });
        const markdownContent = downloadResponse.data;
        return markdownContent;
    }
    catch {
        throw new Error(`Failed to download exported page content from ${downloadLink}. `);
    }
}
