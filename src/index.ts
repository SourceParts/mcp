#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { config } from "dotenv";
import { z } from "zod";

// Load environment variables
config();

// API Configuration
const API_BASE_URL = process.env.SOURCE_PARTS_API_URL || "https://source.parts/api";
const API_KEY = process.env.SOURCE_PARTS_API_KEY || "";

// Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tool Definitions
const TOOLS: Tool[] = [
  {
    name: "search_products",
    description: "Search for electronic components and products in the Source Parts marketplace. Supports keyword search, category filtering, and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (keywords, part numbers, descriptions)",
        },
        category: {
          type: "string",
          description: "Optional category filter (e.g., 'resistors', 'capacitors', 'ics')",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 20, max: 100)",
          default: 20,
        },
        offset: {
          type: "number",
          description: "Pagination offset (default: 0)",
          default: 0,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product_details",
    description: "Get detailed information about a specific product by its ID, including specifications, pricing, availability, and datasheets.",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The unique product ID",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "check_stock",
    description: "Check real-time stock availability for one or more products across multiple suppliers.",
    inputSchema: {
      type: "object",
      properties: {
        productIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of product IDs to check",
        },
      },
      required: ["productIds"],
    },
  },
  {
    name: "get_pricing",
    description: "Get detailed pricing information including quantity breaks and volume discounts.",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The product ID",
        },
        quantity: {
          type: "number",
          description: "Desired quantity",
          default: 1,
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "search_by_specs",
    description: "Search for components by technical specifications (parametric search). Useful for finding alternatives or specific components.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Component category (required for spec search)",
        },
        specs: {
          type: "object",
          description: "Key-value pairs of specifications (e.g., {\"resistance\": \"10k\", \"tolerance\": \"1%\"})",
          additionalProperties: true,
        },
        limit: {
          type: "number",
          description: "Maximum results (default: 20)",
          default: 20,
        },
      },
      required: ["category", "specs"],
    },
  },
  {
    name: "get_datasheets",
    description: "Get datasheet URLs and documentation for a product.",
    inputSchema: {
      type: "object",
      properties: {
        productId: {
          type: "string",
          description: "The product ID",
        },
      },
      required: ["productId"],
    },
  },
  {
    name: "compare_products",
    description: "Compare specifications and pricing across multiple products.",
    inputSchema: {
      type: "object",
      properties: {
        productIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of product IDs to compare (2-5 products)",
          minItems: 2,
          maxItems: 5,
        },
      },
      required: ["productIds"],
    },
  },
  {
    name: "get_categories",
    description: "Get the list of available product categories and their hierarchical structure.",
    inputSchema: {
      type: "object",
      properties: {
        parentCategory: {
          type: "string",
          description: "Optional parent category to get subcategories",
        },
      },
    },
  },
];

// API Client Functions
async function makeApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(API_KEY && { "X-API-Key": API_KEY }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Tool Handlers
async function handleSearchProducts(args: any): Promise<string> {
  const { query, category, limit = 20, offset = 0 } = args;

  const params = new URLSearchParams({
    q: query,
    ...(category && { category }),
    limit: String(limit),
    offset: String(offset),
  });

  const result = await makeApiRequest(`/products/search?${params}`);

  if (!result.success) {
    return `Error searching products: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

async function handleGetProductDetails(args: any): Promise<string> {
  const { productId } = args;
  const result = await makeApiRequest(`/products/${productId}`);

  if (!result.success) {
    return `Error fetching product details: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

async function handleCheckStock(args: any): Promise<string> {
  const { productIds } = args;
  const result = await makeApiRequest(`/products/stock`, {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });

  if (!result.success) {
    return `Error checking stock: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

async function handleGetPricing(args: any): Promise<string> {
  const { productId, quantity = 1 } = args;
  const result = await makeApiRequest(`/products/${productId}/pricing?quantity=${quantity}`);

  if (!result.success) {
    return `Error fetching pricing: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

async function handleSearchBySpecs(args: any): Promise<string> {
  const { category, specs, limit = 20 } = args;
  const result = await makeApiRequest(`/products/search/specs`, {
    method: "POST",
    body: JSON.stringify({ category, specs, limit }),
  });

  if (!result.success) {
    return `Error searching by specs: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

async function handleGetDatasheets(args: any): Promise<string> {
  const { productId } = args;
  const result = await makeApiRequest(`/products/${productId}/datasheets`);

  if (!result.success) {
    return `Error fetching datasheets: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

async function handleCompareProducts(args: any): Promise<string> {
  const { productIds } = args;
  const result = await makeApiRequest(`/products/compare`, {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });

  if (!result.success) {
    return `Error comparing products: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

async function handleGetCategories(args: any): Promise<string> {
  const { parentCategory } = args;
  const params = parentCategory ? `?parent=${parentCategory}` : "";
  const result = await makeApiRequest(`/products/categories${params}`);

  if (!result.success) {
    return `Error fetching categories: ${result.error}`;
  }

  return JSON.stringify(result.data, null, 2);
}

// Main Server
async function main() {
  const server = new Server(
    {
      name: "sourceparts-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case "search_products":
          result = await handleSearchProducts(args);
          break;
        case "get_product_details":
          result = await handleGetProductDetails(args);
          break;
        case "check_stock":
          result = await handleCheckStock(args);
          break;
        case "get_pricing":
          result = await handleGetPricing(args);
          break;
        case "search_by_specs":
          result = await handleSearchBySpecs(args);
          break;
        case "get_datasheets":
          result = await handleGetDatasheets(args);
          break;
        case "compare_products":
          result = await handleCompareProducts(args);
          break;
        case "get_categories":
          result = await handleGetCategories(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Source Parts MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
