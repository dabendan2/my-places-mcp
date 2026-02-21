import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleMapsWrapper } from "./browser-wrapper.js";

const server = new Server(
  {
    name: "my-places-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const wrapper = new GoogleMapsWrapper();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_all_collections",
        description: "List all saved collections/lists from Google Maps",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_places_from_collection",
        description: "Get places within a specific collection by collection ID",
        inputSchema: {
          type: "object",
          properties: {
            collection_id: {
              type: "string",
              description: "The unique ID of the collection (retrieved from list_all_collections)",
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

  try {
    if (name === "list_all_collections") {
      await wrapper.init();
      const collections = await wrapper.listCollections();
      return {
        content: [{ type: "text", text: JSON.stringify(collections, null, 2) }],
      };
    }

    if (name === "get_places_from_collection") {
      await wrapper.init();
      const places = await wrapper.getPlaces(args?.collection_id as string);
      return {
        content: [{ type: "text", text: JSON.stringify(places, null, 2) }],
      };
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
