# Mantis MCP Server

A Model Context Protocol (MCP) server for the Mantis defensive framework - turning LLM vulnerabilities into defensive assets against AI-driven cyberattacks.

## Overview

This MCP server provides a programmatic interface to the Mantis framework, which uses defensive prompt injection to protect against LLM-driven cyberattacks. Based on the research paper "Hacking Back the AI-Hacker: Prompt Injection as a Defense Against LLM-driven Cyberattacks" (Pasquini et al., 2024).

## Features

### 🛡️ Defense Modes
- **Passive Defense**: Misdirect attacking LLMs to false targets
- **Active Defense**: Counter-attack capabilities (use with caution and legal authorization)
- **Tarpit Mode**: Exhaust attacker resources through complex fake environments
- **Monitor Mode**: Observation and analysis only

### 🎭 Decoy Services
- FTP Honeypot with anonymous login traps
- SSH Honeypot with interactive shell simulation
- Web Application Honeypot with SQL injection vulnerabilities
- SMB/Telnet decoys for Windows attack vectors
- Dynamic tarpit generation for resource exhaustion

### 🔍 LLM Detection
- Timing pattern analysis
- Command progression logic detection
- Syntax perfection analysis
- LLM artifact recognition
- Real-time attack pattern matching

### 💉 Prompt Injection Techniques
- ANSI escape sequences for terminal hiding
- HTML comment injection for web interfaces
- Unicode zero-width character exploitation
- CSS-based hiding methods

## Installation

### Prerequisites
- Node.js 20+
- Python 3.9+
- The Mantis framework installed at `/Users/c0nfig/claude/mantis`

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mantis-mcp-server
cd mantis-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Build the TypeScript code:
```bash
npm run build
```

5. Start the server:
```bash
npm start
```

### Docker Installation

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t mantis-mcp .
docker run -p 2121:2121 -p 2222:2222 -p 8080:8080 mantis-mcp
```

## MCP Tools

The server exposes the following tools through the MCP protocol:

### `deploy_decoy`
Deploy a honeypot decoy service to attract attackers.

**Parameters:**
- `type`: Type of decoy (`ftp`, `ssh`, `http`, `smb`, `telnet`)
- `port`: Port number (optional, uses defaults)
- `mode`: Defense mode (`passive`, `active`, `tarpit`)
- `injectionPayload`: Custom injection payload (optional)

### `configure_mantis`
Configure the Mantis framework settings.

**Parameters:**
- `mode`: Global defense mode
- `injectionThreshold`: Confidence threshold (0-1)
- `callbackIp`: IP for active defense
- `callbackPort`: Port for callbacks
- `enableTarpit`: Enable tarpit functionality
- `tarpitComplexity`: Complexity level (1-10)

### `analyze_session`
Analyze a session for LLM-driven attack patterns.

**Parameters:**
- `sessionId`: Session identifier
- `commands`: List of executed commands
- `timingData`: Timing between commands (optional)

### `generate_injection`
Generate a defensive prompt injection payload.

**Parameters:**
- `targetType`: Type of target (`command`, `response`, `file`)
- `mode`: Defense mode
- `hiddenMethod`: Hiding method (`ansi`, `html_comment`, `unicode`, `css`)
- `customPayload`: Custom payload (optional)

### `monitor_attacks`
Monitor ongoing attack attempts.

**Parameters:**
- `duration`: Monitoring duration in seconds (1-3600)
- `includeMetrics`: Include detailed metrics

### `generate_tarpit`
Generate a tarpit filesystem to exhaust resources.

**Parameters:**
- `depth`: Maximum directory depth (1-100)
- `breadth`: Directories per level (2-1000)
- `fileCount`: Total fake files (0-10000)
- `includeClues`: Include fake clues
- `complexity`: Overall complexity (`low`, `medium`, `high`, `extreme`)

### `list_active_decoys`
List all currently active decoy services.

### `stop_decoy`
Stop a specific decoy service.

**Parameters:**
- `serviceId`: ID of the decoy to stop

### `get_attack_stats`
Get attack and defense statistics.

**Parameters:**
- `timeRange`: Time range (`1h`, `24h`, `7d`, `30d`, `all`)

### `test_injection`
Test an injection payload against simulated LLMs.

**Parameters:**
- `payload`: The injection payload to test
- `targetModel`: Target model (`gpt4`, `gpt4o`, `claude`, `llama`, `generic`)

## Usage Examples

### Using with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "mantis": {
      "command": "node",
      "args": ["/path/to/mantis-mcp-server/dist/index.js"],
      "cwd": "/Users/c0nfig/claude/mantis-mcp-server",
      "env": {
        "MANTIS_PATH": "/Users/c0nfig/claude/mantis",
        "LOG_LEVEL": "info",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Example: Deploy FTP Honeypot

```javascript
// Deploy an FTP decoy in passive mode
await useTool('deploy_decoy', {
  type: 'ftp',
  port: 2121,
  mode: 'passive'
});
```

### Example: Analyze Attack Session

```javascript
// Analyze commands for LLM patterns
await useTool('analyze_session', {
  sessionId: 'attack-001',
  commands: [
    'nmap -p- 192.168.1.1',
    'ftp 192.168.1.1',
    'anonymous',
    'ls -la'
  ],
  timingData: [0, 2.1, 1.9, 2.0]
});
```

### Example: Generate Tarpit

```javascript
// Create a complex tarpit structure
await useTool('generate_tarpit', {
  depth: 20,
  breadth: 50,
  complexity: 'high',
  includeClues: true
});
```

## Security Considerations

⚠️ **IMPORTANT SECURITY WARNINGS:**

1. **Legal Authorization Required**: Only deploy on systems you own or have explicit permission to protect
2. **Active Defense Risks**: "Hack-back" features may be illegal in many jurisdictions
3. **Isolation Recommended**: Run in isolated environments when testing
4. **No Warranty**: This software is provided as-is for research purposes

## Architecture

```
┌─────────────────────────┐
│     MCP Client          │
│   (Claude Desktop)      │
└───────────┬─────────────┘
            │ MCP Protocol
┌───────────▼─────────────┐
│   Mantis MCP Server     │
├─────────────────────────┤
│ • Tool Handlers         │
│ • Session Management    │
│ • LLM Detection         │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   Mantis Framework      │
├─────────────────────────┤
│ • Decoy Services        │
│ • Injection Manager     │
│ • Tarpit Generator      │
└─────────────────────────┘
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `MANTIS_PATH`: Path to Mantis framework
- `CALLBACK_IP`: IP for active defense callbacks
- `INJECTION_THRESHOLD`: Confidence threshold for injections
- `ENABLE_TARPIT`: Enable/disable tarpit functionality

### Service Ports

Default ports for decoy services:
- FTP: 2121
- SSH: 2222
- HTTP: 8080
- SMB: 4445
- Telnet: 2323

## Development

### Project Structure

```
mantis-mcp-server/
├── src/
│   ├── index.ts           # Main MCP server
│   ├── types.ts            # TypeScript interfaces
│   ├── mantisController.ts # Core controller
│   ├── decoyManager.ts     # Decoy lifecycle
│   ├── tarpitGenerator.ts  # Tarpit creation
│   ├── llmDetector.ts      # Attack detection
│   └── logger.ts           # Logging utility
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Running in Development

```bash
# Watch mode for development
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Performance Metrics

The Mantis framework has demonstrated:
- **95%+ success rate** against LLM-driven attacks
- **$0.81 to $4.55** cost inflation per attack through tarpits
- **Sub-5% attacker success rate** when properly configured

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Check if another service is using the decoy ports
   - Modify port numbers in configuration

2. **Python Module Not Found**
   - Ensure Mantis framework is installed
   - Verify MANTIS_PATH environment variable

3. **Permission Denied**
   - Some features require elevated privileges
   - Run with appropriate permissions or in Docker

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Ensure tests pass
4. Submit a pull request

## Citation

If using this for research, please cite:

```bibtex
@article{pasquini2024mantis,
  title={Hacking Back the AI-Hacker: Prompt Injection as a Defense Against LLM-driven Cyberattacks},
  author={Pasquini, Dario and Kornaropoulos, Evgenios M. and Ateniese, Giuseppe},
  journal={arXiv preprint arXiv:2410.20911},
  year={2024}
}
```

## License

MIT License - See LICENSE file for details

## Disclaimer

This software is for research and authorized testing purposes only. The authors assume no liability for misuse or damage caused by this software. Always ensure you have proper authorization before deploying defensive measures.

## Support

- Issues: GitHub Issues
- Documentation: See `/docs` directory
- Research Paper: [arXiv:2410.20911](https://arxiv.org/abs/2410.20911)

---

**Remember: With great power comes great responsibility. Use Mantis ethically and legally.**