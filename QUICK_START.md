# Mantis MCP Server - Quick Start Guide

## 🚀 Immediate Usage

The Mantis MCP Server is now installed and ready to use! Here's how to get started in under 5 minutes.

## Run the Server

```bash
cd /opt/mantis-defense-mcp-server
node dist/index.js
```

The server uses stdio transport and is compatible with any MCP client.

## Example Use Cases

### 1. Deploy an FTP Honeypot

```javascript
// Deploy an FTP decoy to attract attackers
useTool('deploy_decoy', {
  type: 'ftp',
  port: 2121,
  mode: 'passive'
});
```

### 2. Analyze Suspicious Session

```javascript
// Check if commands indicate LLM-driven attack
useTool('analyze_session', {
  sessionId: 'session-123',
  commands: [
    'nmap -p- 192.168.1.1',
    'curl http://192.168.1.1/admin',
    'sqlmap -u http://192.168.1.1/login'
  ],
  timingData: [0, 2.1, 1.9]  // Consistent timing = likely LLM
});
```

### 3. Generate Defensive Injection

```javascript
// Create hidden prompt injection
useTool('generate_injection', {
  targetType: 'response',
  mode: 'tarpit',
  hiddenMethod: 'ansi'
});
```

### 4. Create Resource Exhaustion Trap

```javascript
// Generate massive fake filesystem
useTool('generate_tarpit', {
  depth: 50,
  breadth: 100,
  complexity: 'extreme',
  includeClues: true
});
```

### 5. Monitor Active Attacks

```javascript
// Watch for attacks in real-time
useTool('monitor_attacks', {
  duration: 300,  // 5 minutes
  includeMetrics: true
});
```

### 6. View Defense Statistics

```javascript
// Get attack stats for last 24 hours
useTool('get_attack_stats', {
  timeRange: '24h'
});
```

## Defense Modes Explained

### 🟢 Passive Mode (Default)
- Misdirects attackers to fake targets
- Wastes attacker time and resources
- No legal concerns
- **Recommended for most users**

```javascript
useTool('configure_mantis', {
  mode: 'passive',
  injectionThreshold: 0.7
});
```

### 🟡 Tarpit Mode
- Traps LLMs in infinite loops
- Exhausts computational resources
- Increases attacker costs
- Safe and legal

```javascript
useTool('configure_mantis', {
  mode: 'tarpit',
  enableTarpit: true,
  tarpitComplexity: 8
});
```

### 🔴 Active Mode (Use with Caution!)
- Counter-attacks the attacker
- Opens reverse shells on attacker's machine
- **Requires legal authorization**
- **May be illegal in many jurisdictions**

```javascript
useTool('configure_mantis', {
  mode: 'active',
  callbackIp: 'YOUR_IP',
  callbackPort: 7777
});
```

## Common Workflows

### Workflow 1: Initial Setup

```javascript
// 1. Configure defense mode
useTool('configure_mantis', {
  mode: 'passive',
  injectionThreshold: 0.6,
  enableTarpit: true
});

// 2. Deploy decoys
useTool('deploy_decoy', {
  type: 'ftp',
  mode: 'passive'
});

useTool('deploy_decoy', {
  type: 'ssh',
  mode: 'tarpit'
});

// 3. Start monitoring
useTool('monitor_attacks', {
  duration: 3600,
  includeMetrics: true
});
```

### Workflow 2: Attack Investigation

```javascript
// 1. Analyze suspicious session
const analysis = useTool('analyze_session', {
  sessionId: 'sus-001',
  commands: [...],
  timingData: [...]
});

// 2. If LLM detected, check stats
if (analysis.isLLM) {
  useTool('get_attack_stats', {
    timeRange: '1h'
  });
}

// 3. Generate counter-injection
useTool('generate_injection', {
  targetType: 'response',
  mode: 'tarpit',
  hiddenMethod: 'ansi'
});
```

### Workflow 3: Testing Payloads

```javascript
// 1. Generate injection
const injection = useTool('generate_injection', {
  targetType: 'command',
  mode: 'active',
  customPayload: 'Your custom instructions here'
});

// 2. Test effectiveness
useTool('test_injection', {
  payload: injection.rawPayload,
  targetModel: 'gpt4'
});

// 3. Adjust if needed
if (!testResult.success) {
  // Try different hiding method
  useTool('generate_injection', {
    hiddenMethod: 'unicode'
  });
}
```

## Decoy Types Reference

| Type | Port | Best For | Complexity |
|------|------|----------|-----------|
| FTP | 2121 | Quick wins, anonymous login | Low |
| SSH | 2222 | Interactive sessions | Medium |
| HTTP | 8080 | Web-based attacks, SQLi | Medium |
| SMB | 4445 | Windows attack vectors | High |
| Telnet | 2323 | Legacy protocol exploitation | Low |

## Detection Indicators

Mantis looks for these LLM patterns:

- ✅ **Perfect syntax** - No typos in commands
- ✅ **Consistent timing** - <0.3s variance
- ✅ **Logical progression** - Systematic exploration
- ✅ **LLM artifacts** - Markdown, code blocks
- ✅ **Comprehensive coverage** - Multiple attack vectors
- ✅ **Immediate parsing** - Quick response analysis

## Tips for Maximum Effectiveness

### 1. Layer Your Defenses
```javascript
// Deploy multiple decoys with different modes
useTool('deploy_decoy', { type: 'ftp', mode: 'passive' });
useTool('deploy_decoy', { type: 'ssh', mode: 'tarpit' });
useTool('deploy_decoy', { type: 'http', mode: 'passive' });
```

### 2. Tune Detection Thresholds
```javascript
// More sensitive = more false positives
useTool('configure_mantis', {
  injectionThreshold: 0.5  // Lower = more sensitive
});

// Less sensitive = miss some attacks
useTool('configure_mantis', {
  injectionThreshold: 0.9  // Higher = more conservative
});
```

### 3. Maximize Tarpit Effectiveness
```javascript
// Extreme complexity = higher costs for attacker
useTool('generate_tarpit', {
  depth: 100,           // Very deep
  breadth: 500,         // Very wide
  complexity: 'extreme', // Maximum complexity
  includeClues: true    // Keep them engaged
});
```

### 4. Monitor and Adapt
```javascript
// Regular monitoring
setInterval(() => {
  useTool('get_attack_stats', { timeRange: '1h' });
  useTool('list_active_decoys');
}, 3600000);  // Every hour
```

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Port in use | Change port in `.env` or tool params |
| Python errors | Activate venv: `source /home/ubuntu/claude/Mantits/venv/bin/activate` |
| Build errors | `rm -rf dist/ && npm run build` |
| Logs not appearing | Check `logs/mantis-mcp.log` |
| Decoy won't start | Verify Python dependencies, check ports |

## Performance Tips

- **Start small**: Begin with 1-2 decoys
- **Monitor resources**: Each decoy uses ~50MB RAM
- **Adjust complexity**: Lower for faster response
- **Log level**: Use `info` in production, `debug` for testing
- **Tarpit size**: Larger = more cost but slower

## Next Steps

1. ✅ **Test in safe environment** - Use VMs or isolated networks
2. ✅ **Start with passive mode** - Safest option
3. ✅ **Monitor logs** - Watch for patterns
4. ✅ **Tune thresholds** - Adjust based on false positives
5. ✅ **Document incidents** - Track what works

## Emergency Commands

```bash
# Stop all decoys
useTool('list_active_decoys').forEach(decoy => {
  useTool('stop_decoy', { serviceId: decoy.id });
});

# Switch to monitor-only mode
useTool('configure_mantis', { mode: 'monitor' });

# Check server logs
tail -f /opt/mantis-defense-mcp-server/logs/mantis-mcp.log

# Restart server
# Stop current process, then:
node /opt/mantis-defense-mcp-server/dist/index.js
```

---

**Ready to defend!** Start with passive mode and a single FTP decoy to get familiar with the system.

For detailed documentation, see `README.md` and `INSTALLATION.md`.
