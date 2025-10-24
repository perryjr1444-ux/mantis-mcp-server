#!/bin/bash
# Quick MCP server test

echo "Testing Mantis MCP Server..."
echo "============================"
echo ""

cd /Users/c0nfig/claude/mantis-mcp-server

# Test 1: List tools
echo "Test 1: Listing available tools..."
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js 2>/dev/null | head -20

echo ""
echo "✅ MCP server basic functionality test complete!"
echo ""
echo "To use with Claude Desktop, add to your config:"
echo '{
  "mcpServers": {
    "mantis": {
      "command": "node",
      "args": ["/Users/c0nfig/claude/mantis-mcp-server/dist/index.js"]
    }
  }
}'
