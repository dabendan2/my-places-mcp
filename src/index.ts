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
    version: "0.2.0",
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
    return {
      content: [
        { 
          type: "text", 
          text: `請使用 browser:act 工具執行以下腳本以獲取清單：\n\nURL: ${wrapper.navigationUrl}\n\nScript:\n${wrapper.listCollectionsScript}` 
        }
      ],
    };
  }

  if (name === "get_places_from_collection") {
    const id = args?.collection_id as string;
    return {
      content: [
        { 
          type: "text", 
          text: `請在該清單頁面使用 browser:act 工具執行以下腳本：\n\nScript:\n${wrapper.getPlacesScript(id)}` 
        }
      ],
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
