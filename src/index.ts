import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PlaceService } from "./core/place-service.js";

const server = new Server(
  {
    name: "my-places-mcp",
    version: "0.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const service = new PlaceService();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_all_collections",
        description: "List all saved collections/lists from Google Maps. Requires an attached browser tab on Google Maps.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_places_from_collection",
        description: "Get places within a specific collection. Requires an attached browser tab on the collection detail page.",
        inputSchema: {
          type: "object",
          properties: {
            collection_id: {
              type: "string",
              description: "The unique ID or Name of the collection",
            },
          },
          required: ["collection_id"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "list_all_collections") {
    return service.listAllCollections();
  }

  if (name === "get_places_from_collection") {
    const id = args?.collection_id as string;
    return service.getPlacesFromCollection(id);
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
