"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openapi_ts_1 = require("@hey-api/openapi-ts");
exports.default = (0, openapi_ts_1.defineConfig)({
    input: "https://coda.io/apis/v1/openapi.yaml",
    output: {
        format: "prettier",
        path: "src/client",
    },
    plugins: ["@hey-api/client-axios"],
});
