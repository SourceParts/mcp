# Source Parts MCP Server

A Model Context Protocol (MCP) server that provides Claude with direct access to the Source Parts API for searching and managing electronic components, PCB parts, and manufacturing services.

## Features

- **Product Search**: Search the Source Parts marketplace with keywords, categories, and filters
- **Product Details**: Get comprehensive product information including specs, pricing, and availability
- **Stock Checking**: Real-time inventory availability across multiple suppliers
- **Pricing Information**: Detailed pricing with quantity breaks and volume discounts
- **Parametric Search**: Find components by technical specifications
- **Datasheets**: Access product documentation and datasheets
- **Product Comparison**: Compare specifications and pricing across multiple products
- **Categories**: Browse the product category hierarchy

## Installation

### Prerequisites

- Node.js 18 or higher
- Claude Desktop or any MCP-compatible client
- Source Parts API access (optional - works with public API)

### Setup

1. Clone or install the package:

```bash
npm install @sourceparts/mcp
```

Or for development:

```bash
git clone git@github.com:SourceParts/mcp.git
cd mcp
npm install
npm run build
```

2. Configure Claude Desktop to use the MCP server:

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sourceparts": {
      "command": "node",
      "args": [
        "/path/to/mcp/dist/index.js"
      ],
      "env": {
        "SOURCE_PARTS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

3. Restart Claude Desktop

## Configuration

### Environment Variables

Create a `.env` file in the project root (optional):

```env
# Optional: API base URL (defaults to https://source.parts/api)
SOURCE_PARTS_API_URL=https://source.parts/api

# Optional: API key for authenticated requests
SOURCE_PARTS_API_KEY=your_api_key_here
```

The server works without an API key for public product searches. An API key provides access to additional features like:
- Higher rate limits
- Access to private/draft products
- Bulk operations
- Historical data

## Available Tools

### `search_products`

Search for electronic components and products.

**Parameters:**
- `query` (required): Search keywords, part numbers, or descriptions
- `category` (optional): Filter by category (e.g., "resistors", "capacitors")
- `limit` (optional): Max results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```
Search for "STM32 microcontroller" in the "ics" category
```

### `get_product_details`

Get detailed information about a specific product.

**Parameters:**
- `productId` (required): The unique product ID

**Example:**
```
Get details for product ID "prod_123abc"
```

### `check_stock`

Check real-time inventory availability.

**Parameters:**
- `productIds` (required): Array of product IDs to check

**Example:**
```
Check stock for products ["prod_123", "prod_456"]
```

### `get_pricing`

Get pricing information with quantity breaks.

**Parameters:**
- `productId` (required): The product ID
- `quantity` (optional): Desired quantity (default: 1)

**Example:**
```
Get pricing for product "prod_123" with quantity 1000
```

### `search_by_specs`

Parametric search by technical specifications.

**Parameters:**
- `category` (required): Component category
- `specs` (required): Object with specification key-value pairs
- `limit` (optional): Max results (default: 20)

**Example:**
```
Find resistors with specs: {"resistance": "10k", "tolerance": "1%", "power": "0.25W"}
```

### `get_datasheets`

Get datasheet URLs and documentation.

**Parameters:**
- `productId` (required): The product ID

**Example:**
```
Get datasheets for product "prod_123"
```

### `compare_products`

Compare specifications and pricing across products.

**Parameters:**
- `productIds` (required): Array of 2-5 product IDs

**Example:**
```
Compare products ["prod_123", "prod_456", "prod_789"]
```

### `get_categories`

Get product categories and hierarchy.

**Parameters:**
- `parentCategory` (optional): Get subcategories of a parent

**Example:**
```
Get all top-level categories or subcategories of "passives"
```

## Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

This runs TypeScript in watch mode, rebuilding on file changes.

### Testing

Test the MCP server with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Architecture

The server is built using:
- **@modelcontextprotocol/sdk**: Official MCP SDK for Node.js
- **TypeScript**: Type-safe development
- **Zod**: Runtime validation
- **Fetch API**: HTTP requests to Source Parts API

### Project Structure

```
mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## API Endpoints

The server connects to the Source Parts API at `https://source.parts/api` by default. Available endpoints:

- `GET /products/search` - Product search
- `GET /products/:id` - Product details
- `POST /products/stock` - Stock availability
- `GET /products/:id/pricing` - Pricing information
- `POST /products/search/specs` - Parametric search
- `GET /products/:id/datasheets` - Datasheets
- `POST /products/compare` - Product comparison
- `GET /products/categories` - Category listing

## Example Usage in Claude

Once configured, you can ask Claude questions like:

- "Search for STM32 microcontrollers with at least 256KB flash"
- "Compare these three resistors: prod_123, prod_456, prod_789"
- "Check if product prod_abc is in stock and get pricing for 1000 units"
- "Find all ceramic capacitors with 10uF capacitance and 25V rating"
- "Show me the datasheet for product prod_xyz"

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

Apache License 2.0 - see LICENSE file for details

Copyright 2025 Source Parts

## Support

- **Documentation**: https://source.parts/docs
- **API Docs**: https://source.parts/docs/api
- **Issues**: https://github.com/SourceParts/mcp/issues
- **Email**: support@source.parts

## Changelog

### v0.1.0 (2025-10-15)

- Initial release
- 8 core tools for product search and management
- TypeScript support
- Full MCP SDK integration
- Comprehensive API coverage

## Related Projects

- [Source Parts SDK](https://github.com/SourceParts/sdk) - JavaScript/TypeScript SDK for Source Parts API
- [Source Parts CLI](https://source.parts/cli) - Command-line interface for Source Parts
- [Source Parts Docs](https://source.parts/docs) - Official documentation

---

Made with ❤️ by [Source Parts](https://source.parts)
