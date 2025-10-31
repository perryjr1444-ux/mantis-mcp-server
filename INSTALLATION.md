# Mantis MCP Server - Installation Complete! 🎉

## ✅ Installation Summary

The Mantis MCP Server has been successfully set up and is ready to use!

### What Was Installed

1. **Node.js v24.10.0** - JavaScript runtime
2. **npm 11.6.0** - Package manager
3. **Python Dependencies** - All Mantis framework requirements
4. **TypeScript Build** - Compiled MCP server (in `dist/` directory)
5. **Environment Configuration** - `.env` file created

### Directory Structure

```
/opt/mantis-defense-mcp-server/
├── dist/                  # Compiled JavaScript (ready to run)
├── src/                   # TypeScript source code
├── logs/                  # Log files directory
├── node_modules/          # Node.js dependencies
├── .env                   # Environment configuration
├── package.json           # Node.js project config
├── tsconfig.json          # TypeScript config
└── README.md              # Documentation
```

## 🚀 Quick Start

### Option 1: Use with Claude Code (CLI)

The MCP server is ready to use directly with Claude Code:

```bash
# The server uses stdio transport, so it's already compatible
node /opt/mantis-defense-mcp-server/dist/index.js
```

### Option 2: Add to Claude Desktop

Add this to your Claude Desktop MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mantis": {
      "command": "node",
      "args": ["/opt/mantis-defense-mcp-server/dist/index.js"],
      "env": {
        "MANTIS_PATH": "/home/ubuntu/claude/Mantits"
      }
    }
  }
}
```

## 🛠️ Available Tools

The Mantis MCP server provides 10 defensive tools:

1. **deploy_decoy** - Deploy honeypot services
2. **configure_mantis** - Configure defense settings
3. **analyze_session** - Detect LLM-driven attacks
4. **generate_injection** - Create defensive payloads
5. **monitor_attacks** - Real-time attack monitoring
6. **generate_tarpit** - Create resource exhaustion traps
7. **list_active_decoys** - View running honeypots
8. **stop_decoy** - Stop specific decoys
9. **get_attack_stats** - View defense statistics
10. **test_injection** - Test payload effectiveness

## 🧪 Testing

### Basic Test

Run the test script:

```bash
./test-mcp.sh
```

### Manual Test

Test individual tools:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## 🔧 Maintenance

### Rebuild After Changes

```bash
cd /opt/mantis-defense-mcp-server
npm run build
```

### View Logs

```bash
tail -f /opt/mantis-defense-mcp-server/logs/mantis-mcp.log
```

### Update Dependencies

```bash
npm update
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file to customize:

```bash
# Logging
LOG_LEVEL=info                      # debug, info, warn, error
LOG_DIR=./logs

# Mantis Framework Path
MANTIS_PATH=/home/ubuntu/claude/Mantits

# Active Defense Settings (use with caution!)
CALLBACK_IP=10.0.0.1
CALLBACK_PORT=7777

# Service Ports
FTP_PORT=2121
SSH_PORT=2222
HTTP_PORT=8080
SMB_PORT=4445
TELNET_PORT=2323

# Detection Thresholds
INJECTION_THRESHOLD=0.6
TIMING_VARIANCE_THRESHOLD=0.3
TYPO_THRESHOLD=0.05

# Tarpit Settings
ENABLE_TARPIT=true
TARPIT_COMPLEXITY=5
TARPIT_MAX_DEPTH=50
```

## 🔒 Security Notes

### ⚠️ IMPORTANT WARNINGS

1. **Legal Authorization Required**: Only use on systems you own
2. **Active Defense Risks**: Hack-back features may be illegal
3. **Isolation Recommended**: Test in controlled environments
4. **No Warranty**: Research and educational use only

### Recommended Security Practices

1. **Run in Docker** for isolation
2. **Use non-privileged ports** (> 1024)
3. **Monitor logs** for suspicious activity
4. **Limit network access** to decoy services
5. **Review legal implications** before deployment

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using a port
lsof -i :2121

# Change port in .env file
echo "FTP_PORT=3121" >> .env
```

### Python Module Errors

```bash
# Activate Mantis virtual environment
cd /home/ubuntu/claude/Mantits
source venv/bin/activate
pip install -r requirements.txt
```

### TypeScript Build Errors

```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

## 📊 Performance

Expected resource usage:
- **Memory**: ~100-200MB (idle)
- **CPU**: <5% (idle), varies with decoys
- **Disk**: ~500MB total installation
- **Network**: Minimal (only decoy traffic)

## 🎯 Next Steps

1. **Test Tools**: Try deploying a test decoy
2. **Review Documentation**: Read the full README.md
3. **Configure Defense Mode**: Set passive/active/tarpit mode
4. **Monitor Logs**: Watch for attack patterns
5. **Customize Injections**: Create custom payloads

## 📚 Additional Resources

- Main README: `README.md`
- Mantis Framework: `/home/ubuntu/claude/Mantits/`
- Research Paper: [arXiv:2410.20911](https://arxiv.org/abs/2410.20911)
- MCP Documentation: https://modelcontextprotocol.io

## ✨ What Makes This Special

This MCP server turns LLM vulnerabilities into defensive assets:

- **95%+ success rate** against LLM-driven attacks
- **Invisible to humans** using ANSI/HTML hiding
- **Resource exhaustion** capabilities
- **Automated counter-attacks** (when authorized)
- **Real-time detection** of AI patterns

---

**Installation completed successfully!** 🎊

The Mantis MCP Server is now ready to defend against LLM-driven cyberattacks.

For questions or issues, see the main README.md or GitHub issues.
