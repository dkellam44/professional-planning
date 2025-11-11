import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

// Context7 API configuration
const CONTEXT7_API_BASE = 'https://api.context7.com/v1';
const CONTEXT7_TIMEOUT = 30000;

// Initialize MCP server
const server = new McpServer({
  name: 'context7-mcp-server',
  version: '1.0.0',
  description: 'Context7 MCP server for retrieving up-to-date library documentation and code examples',
});

// Tool definitions
server.tool(
  'get_library_docs',
  {
    libraryName: z.string().describe('Name of the library to get documentation for'),
    version: z.string().optional().describe('Specific version of the library (defaults to latest)'),
    topic: z.string().optional().describe('Specific topic or method to focus on'),
  },
  async ({ libraryName, version, topic }) => {
    try {
      const url = new URL(`${CONTEXT7_API_BASE}/libraries/${libraryName}`);
      if (version) url.searchParams.set('version', version);
      if (topic) url.searchParams.set('topic', topic);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'context7-mcp-server/1.0.0',
        },
        signal: AbortSignal.timeout(CONTEXT7_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `## ${data.name} ${data.version || ''}
${data.description || 'No description available'}

### Documentation
${data.documentation || 'No documentation available'}

### Examples
${data.examples?.map((example: any) => `\`\`\`${example.language || 'javascript'}\n${example.code}\n\`\`\``).join('\n\n') || 'No examples available'}

### API Reference
${data.apiReference || 'No API reference available'}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving documentation for ${libraryName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  'search_libraries',
  {
    query: z.string().describe('Search query for libraries'),
    limit: z.number().optional().default(10).describe('Maximum number of results to return'),
  },
  async ({ query, limit }) => {
    try {
      const url = new URL(`${CONTEXT7_API_BASE}/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'context7-mcp-server/1.0.0',
        },
        signal: AbortSignal.timeout(CONTEXT7_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `## Search Results for "${query}"

${data.results?.map((lib: any) => `### ${lib.name} v${lib.version}
- **Description**: ${lib.description || 'No description'}
- **Latest Version**: ${lib.latestVersion || 'Unknown'}
- **Repository**: ${lib.repository || 'Not specified'}
- **Documentation**: ${lib.documentationUrl || 'Not available'}`).join('\n\n') || 'No libraries found'}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error searching libraries: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  'get_code_examples',
  {
    libraryName: z.string().describe('Name of the library'),
    method: z.string().optional().describe('Specific method or function to get examples for'),
    language: z.string().optional().default('javascript').describe('Programming language for examples'),
  },
  async ({ libraryName, method, language }) => {
    try {
      const url = new URL(`${CONTEXT7_API_BASE}/libraries/${libraryName}/examples`);
      if (method) url.searchParams.set('method', method);
      if (language) url.searchParams.set('language', language);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'context7-mcp-server/1.0.0',
        },
        signal: AbortSignal.timeout(CONTEXT7_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Context7 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `## Code Examples for ${libraryName}${method ? ` - ${method}` : ''}

${data.examples?.map((example: any) => `### ${example.title || 'Example'}
\`\`\`${example.language || language || 'javascript'}\n${example.code}\n\`\`\`
${example.description ? `\n${example.description}` : ''}`).join('\n\n') || 'No examples found'}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error retrieving code examples: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        ],
        isError: true,
      };
    }
  }
);

// Hono app setup
const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'context7-mcp-server', timestamp: new Date().toISOString() });
});

// MCP endpoint
app.post('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });

  await server.connect(transport);
  
  const response = await transport.handleRequest({
    url: c.req.url,
    method: c.req.method,
    headers: Object.fromEntries(c.req.headers.entries()),
    body: await c.req.text(),
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
});

// GET endpoint for MCP (for health checks and discovery)
app.get('/mcp', (c) => {
  return c.json({
    name: 'context7-mcp-server',
    version: '1.0.0',
    description: 'Context7 MCP server for retrieving up-to-date library documentation and code examples',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
    tools: [
      {
        name: 'get_library_docs',
        description: 'Get comprehensive documentation for a specific library',
        parameters: {
          libraryName: 'string (required)',
          version: 'string (optional)',
          topic: 'string (optional)',
        },
      },
      {
        name: 'search_libraries',
        description: 'Search for libraries matching a query',
        parameters: {
          query: 'string (required)',
          limit: 'number (optional, default: 10)',
        },
      },
      {
        name: 'get_code_examples',
        description: 'Get code examples for a library or specific method',
        parameters: {
          libraryName: 'string (required)',
          method: 'string (optional)',
          language: 'string (optional, default: javascript)',
        },
      },
    ],
  });
});

// Handle OPTIONS for CORS preflight
app.options('*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
});

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;

// Environment interface
interface Env {
  // Add any environment variables here
}