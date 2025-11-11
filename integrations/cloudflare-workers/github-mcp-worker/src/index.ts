import { Hono } from 'hono';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

type Bindings = {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  OAUTH_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// MCP Server Setup
const server = new McpServer(
  {
    name: 'github-mcp-worker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// GitHub OAuth Configuration
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'github-mcp-worker',
  });
});

// OAuth callback endpoint
app.get('/oauth/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  
  if (!code || !state) {
    return c.text('Missing code or state parameter', 400);
  }

  try {
    // Verify state from KV
    const storedState = await c.env.OAUTH_KV.get(`oauth_state:${state}`);
    if (!storedState) {
      return c.text('Invalid or expired state', 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return c.text('Failed to obtain access token', 400);
    }

    // Store access token (in production, associate with user session)
    await c.env.OAUTH_KV.put(`github_token:${state}`, tokenData.access_token, {
      expirationTtl: 3600, // 1 hour
    });

    return c.text('GitHub authentication successful! You can close this window.');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.text('Authentication failed', 500);
  }
});

// MCP endpoint
app.post('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport();
  
  // Define GitHub tools
  server.tool(
    'search_repositories',
    {
      query: z.string().describe('Search query for repositories'),
      sort: z.enum(['stars', 'forks', 'updated']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
      per_page: z.number().min(1).max(100).optional().default(30),
    },
    async ({ query, sort, order, per_page }) => {
      const token = await getGitHubToken(c);
      if (!token) {
        throw new Error('GitHub authentication required');
      }

      const url = new URL('/search/repositories', GITHUB_API_URL);
      url.searchParams.set('q', query);
      if (sort) url.searchParams.set('sort', sort);
      if (order) url.searchParams.set('order', order);
      url.searchParams.set('per_page', per_page.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'github-mcp-worker',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${data.total_count} repositories:\n\n${data.items.map((repo: any) => 
              `- ${repo.full_name}: ${repo.description || 'No description'} (${repo.stargazers_count} ⭐)`
            ).join('\n')}`,
          },
        ],
      };
    }
  );

  server.tool(
    'create_issue',
    {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      title: z.string().describe('Issue title'),
      body: z.string().optional().describe('Issue body'),
      labels: z.array(z.string()).optional().describe('Issue labels'),
    },
    async ({ owner, repo, title, body, labels }) => {
      const token = await getGitHubToken(c);
      if (!token) {
        throw new Error('GitHub authentication required');
      }

      const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'github-mcp-worker',
        },
        body: JSON.stringify({
          title,
          body,
          labels,
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const issue = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `Created issue #${issue.number}: ${issue.title}\nURL: ${issue.html_url}`,
          },
        ],
      };
    }
  );

  server.tool(
    'read_file',
    {
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      path: z.string().describe('File path'),
      ref: z.string().optional().describe('Branch or commit SHA'),
    },
    async ({ owner, repo, path, ref }) => {
      const token = await getGitHubToken(c);
      if (!token) {
        throw new Error('GitHub authentication required');
      }

      let url = `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`;
      if (ref) {
        url += `?ref=${ref}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'github-mcp-worker',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const content = await response.text();
      
      return {
        content: [
          {
            type: 'text',
            text: `File: ${path}\n\n${content}`,
          },
        ],
      };
    }
  );

  // Connect the transport
  await server.connect(transport);
  
  // Handle the request
  return transport.handlePost(c.req.raw);
});

// Helper function to get GitHub token
async function getGitHubToken(c: any): Promise<string | null> {
  // In a real implementation, this would get the token from user session
  // For now, we'll use a placeholder - this should be implemented based on your auth strategy
  return null;
}

// Handle GET requests to /mcp for MCP discovery
app.get('/mcp', (c) => {
  return c.json({
    name: 'github-mcp-worker',
    version: '1.0.0',
    description: 'GitHub MCP server for repository management and code operations',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
      oauth: '/oauth/callback',
    },
  });
});

export default app;