import { Hono } from 'hono';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Durable Object for storing knowledge graph
export class KnowledgeGraph {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET' && url.pathname === '/entities') {
      const entities = await this.state.storage.get('entities') || {};
      return new Response(JSON.stringify(entities), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && url.pathname === '/entity') {
      const body = await request.json() as any;
      const entities = await this.state.storage.get('entities') || {};
      const entity = {
        id: body.id || crypto.randomUUID(),
        name: body.name,
        type: body.type,
        observations: body.observations || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      entities[entity.id] = entity;
      await this.state.storage.put('entities', entities);
      
      return new Response(JSON.stringify(entity), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && url.pathname === '/relation') {
      const body = await request.json() as any;
      const relations = await this.state.storage.get('relations') || {};
      const relation = {
        id: body.id || crypto.randomUUID(),
        from: body.from,
        to: body.to,
        relationType: body.relationType,
        createdAt: new Date().toISOString(),
      };
      
      relations[relation.id] = relation;
      await this.state.storage.put('relations', relations);
      
      return new Response(JSON.stringify(relation), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && url.pathname === '/search') {
      const body = await request.json() as any;
      const entities = await this.state.storage.get('entities') || {};
      const relations = await this.state.storage.get('relations') || {};
      
      const query = body.query?.toLowerCase() || '';
      const type = body.type;
      
      const filteredEntities = Object.values(entities).filter((entity: any) => {
        const matchesQuery = !query || 
          entity.name.toLowerCase().includes(query) ||
          entity.observations.some((obs: string) => obs.toLowerCase().includes(query));
        const matchesType = !type || entity.type === type;
        return matchesQuery && matchesType;
      });
      
      return new Response(JSON.stringify({
        entities: filteredEntities,
        relations: Object.values(relations),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }
}

type Bindings = {
  KNOWLEDGE_GRAPH: DurableObjectNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// MCP Server Setup
const server = new McpServer(
  {
    name: 'memory-mcp-worker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'memory-mcp-worker',
  });
});

// MCP endpoint
app.post('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport();
  
  // Create entity tool
  server.tool(
    'create_entity',
    {
      name: z.string().describe('Name of the entity'),
      type: z.string().describe('Type/category of the entity'),
      observations: z.array(z.string()).optional().describe('Initial observations about the entity'),
    },
    async ({ name, type, observations }) => {
      const durableObjectId = c.env.KNOWLEDGE_GRAPH.idFromName('default');
      const durableObject = c.env.KNOWLEDGE_GRAPH.get(durableObjectId);
      
      const response = await durableObject.fetch('http://internal/entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, observations }),
      });
      
      const entity = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `Created entity: ${entity.name} (${entity.type})\nID: ${entity.id}\nObservations: ${entity.observations.join(', ')}`,
          },
        ],
      };
    }
  );

  // Create relation tool
  server.tool(
    'create_relation',
    {
      from: z.string().describe('ID of the source entity'),
      to: z.string().describe('ID of the target entity'),
      relationType: z.string().describe('Type of relationship (e.g., "works with", "depends on", "similar to")'),
    },
    async ({ from, to, relationType }) => {
      const durableObjectId = c.env.KNOWLEDGE_GRAPH.idFromName('default');
      const durableObject = c.env.KNOWLEDGE_GRAPH.get(durableObjectId);
      
      const response = await durableObject.fetch('http://internal/relation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, relationType }),
      });
      
      const relation = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: `Created relation: ${relation.relationType}\nFrom: ${relation.from}\nTo: ${relation.to}\nID: ${relation.id}`,
          },
        ],
      };
    }
  );

  // Add observation tool
  server.tool(
    'add_observation',
    {
      entityId: z.string().describe('ID of the entity'),
      observation: z.string().describe('New observation to add'),
    },
    async ({ entityId, observation }) => {
      const durableObjectId = c.env.KNOWLEDGE_GRAPH.idFromName('default');
      const durableObject = c.env.KNOWLEDGE_GRAPH.get(durableObjectId);
      
      // Get current entity
      const entitiesResponse = await durableObject.fetch('http://internal/entities');
      const entities = await entitiesResponse.json() as any;
      
      if (!entities[entityId]) {
        throw new Error(`Entity with ID ${entityId} not found`);
      }
      
      const entity = entities[entityId];
      entity.observations.push(observation);
      entity.updatedAt = new Date().toISOString();
      
      // Update entity
      await durableObject.fetch('http://internal/entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity),
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Added observation to ${entity.name}: ${observation}`,
          },
        ],
      };
    }
  );

  // Search knowledge graph tool
  server.tool(
    'search_knowledge_graph',
    {
      query: z.string().optional().describe('Search query for entities'),
      type: z.string().optional().describe('Filter by entity type'),
    },
    async ({ query, type }) => {
      const durableObjectId = c.env.KNOWLEDGE_GRAPH.idFromName('default');
      const durableObject = c.env.KNOWLEDGE_GRAPH.get(durableObjectId);
      
      const response = await durableObject.fetch('http://internal/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type }),
      });
      
      const results = await response.json() as any;
      
      let text = `Found ${results.entities.length} entities`;
      if (type) text += ` of type "${type}"`;
      if (query) text += ` matching "${query}"`;
      text += ':\n\n';
      
      text += results.entities.map((entity: any) => 
        `- ${entity.name} (${entity.type}): ${entity.observations.join('; ')}`
      ).join('\n');
      
      if (results.relations.length > 0) {
        text += '\n\nRelations:\n';
        text += results.relations.map((relation: any) => 
          `- ${relation.from} ${relation.relationType} ${relation.to}`
        ).join('\n');
      }
      
      return {
        content: [
          {
            type: 'text',
            text,
          },
        ],
      };
    }
  );

  // Delete entity tool
  server.tool(
    'delete_entity',
    {
      entityId: z.string().describe('ID of the entity to delete'),
    },
    async ({ entityId }) => {
      const durableObjectId = c.env.KNOWLEDGE_GRAPH.idFromName('default');
      const durableObject = c.env.KNOWLEDGE_GRAPH.get(durableObjectId);
      
      const entitiesResponse = await durableObject.fetch('http://internal/entities');
      const entities = await entitiesResponse.json() as any;
      
      if (!entities[entityId]) {
        throw new Error(`Entity with ID ${entityId} not found`);
      }
      
      const entityName = entities[entityId].name;
      delete entities[entityId];
      
      // Update storage
      await durableObject.fetch('http://internal/entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entityId, name: '', type: '' }), // This will overwrite
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Deleted entity: ${entityName} (${entityId})`,
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

// Handle GET requests to /mcp for MCP discovery
app.get('/mcp', (c) => {
  return c.json({
    name: 'memory-mcp-worker',
    version: '1.0.0',
    description: 'Memory MCP server for persistent knowledge graph storage',
    endpoints: {
      mcp: '/mcp',
      health: '/health',
    },
  });
});

export default app;
export { KnowledgeGraph };