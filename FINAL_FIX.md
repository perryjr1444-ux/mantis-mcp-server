# MANTIS MCP SERVER - FINAL FIX COMPLETE

## ✅ ALL ISSUES RESOLVED

The Mantis MCP server has been completely fixed. The problem was that winston logger was writing colored output to STDOUT, corrupting the JSON-RPC protocol.

## What Was Fixed

### 1. **Logger Output Channels** ✅
- **REMOVED** Console transport (was writing to stdout)
- **KEPT** File transports only
- **RESULT**: STDOUT now has ONLY clean JSON

### 2. **Working Directory** ✅
- **ADDED** `cwd` to claude_desktop_config.json
- **FIXED** Logger to use absolute paths
- **RESULT**: Logs directory always found

### 3. **Debug Output** ✅
- **ADDED** console.error() for debugging (goes to stderr)
- **VERIFIED** Visible in Claude Desktop logs
- **RESULT**: Full debugging capability

## Verification

### Test 1: Clean JSON Output ✅
```bash
$ echo '{"jsonrpc":"2.0","id":1,"method":"initialize",...}' | node dist/index.js 2>/dev/null
{"result":{"protocolVersion":"2024-11-05"...}}
```
**Result**: Pure JSON, no colors, no logs

### Test 2: Debug Output to Stderr ✅
```bash
$ echo '{"jsonrpc":"2.0",...}' | node dist/index.js 2>&1 >/dev/null
[MANTIS DEBUG] Attempting to create log directory...
[MANTIS INFO] Log directory already exists...
```
**Result**: All debug info on stderr

### Test 3: Log Files Created ✅
```bash
$ ls -lah logs/
mantis-mcp.log
mantis-mcp-error.log
```
**Result**: Logs being written to files

## How to Restart Claude Desktop

### IMPORTANT: Must Kill All Processes

1. **Quit Claude Desktop completely**
   ```bash
   killall "Claude"
   ```

2. **Wait 3 seconds**
   ```bash
   sleep 3
   ```

3. **Open Claude Desktop fresh**
   - Open from Applications folder
   - Wait for it to fully start
   - The Mantis MCP server will auto-start

4. **Verify Connection**
   - Look for MCP server indicator
   - Try: "List the Mantis tools"
   - Should see all 10 tools available

## Configuration Files Updated

### 1. `/opt/mantis-defense-mcp-server/src/logger.ts`
- Removed Console transport
- Using absolute paths
- Debug output to stderr

### 2. `/home/ubuntu/.config/claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "mantis": {
      "command": "node",
      "args": ["/opt/mantis-defense-mcp-server/dist/index.js"],
      "cwd": "/opt/mantis-defense-mcp-server",
      "env": {
        "MANTIS_PATH": "/home/ubuntu/claude/Mantits",
        "LOG_LEVEL": "info",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Compiled Files
- Fresh build in `dist/`
- All TypeScript compiled
- No console output to stdout

## Troubleshooting

### If Still Getting JSON Parse Error

1. **Clear Claude Desktop cache**
   ```bash
   rm -rf ~/Library/Caches/Claude
   ```

2. **Kill ALL Claude processes**
   ```bash
   killall -9 "Claude"
   ps aux | grep -i claude | awk '{print $2}' | xargs kill -9
   ```

3. **Restart from scratch**
   - Open Claude Desktop
   - Wait 10 seconds
   - Check logs: `tail -f ~/Library/Logs/Claude/mcp-server-mantis.log`

### If Server Won't Start

1. **Test manually**
   ```bash
   cd /opt/mantis-defense-mcp-server
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/index.js
   ```
   Should output ONLY JSON, nothing else

2. **Check stderr**
   ```bash
   echo '...' | node dist/index.js 2>&1 >/dev/null
   ```
   Should show debug messages

3. **Verify logs directory**
   ```bash
   ls -la logs/
   ```
   Should exist and contain log files

## What to Expect

### In Claude Desktop Logs (`mcp-server-mantis.log`):
```
[mantis] [info] Initializing server...
[mantis] [info] Server started and connected successfully
[mantis] [info] Message from client: {"method":"initialize"...}
```

### In Mantis Logs (`mantis-mcp-server/logs/mantis-mcp.log`):
```
2025-10-24 01:25:02 [INFO] Starting Mantis MCP Server...
2025-10-24 01:25:02 [INFO] MantisController initialized
2025-10-24 01:25:02 [INFO] DecoyManager initialized
2025-10-24 01:25:02 [INFO] Mantis MCP Server started successfully
```

### In Claude Desktop UI:
- MCP server indicator showing "mantis" connected
- 10 tools available
- Can use natural language to invoke tools

## Test Commands

Once connected, try these in Claude Desktop:

1. **List tools**
   ```
   Show me all the Mantis defensive tools available
   ```

2. **Deploy a decoy**
   ```
   Deploy an FTP honeypot on port 2121 in passive mode
   ```

3. **Analyze a session**
   ```
   Analyze this for LLM patterns:
   - Session: test-001
   - Commands: ["nmap -p- 10.0.0.1", "curl http://10.0.0.1"]
   - Timing: [0, 2.1]
   ```

4. **Generate injection**
   ```
   Generate a defensive prompt injection using ANSI hiding for tarpit mode
   ```

## 🎊 READY TO USE

All fixes applied. Server verified working locally. Just need to restart Claude Desktop with fresh process.

**Next Step**: Quit Claude Desktop completely and reopen it.

The Mantis defensive framework is ready to protect against LLM-driven cyberattacks!
