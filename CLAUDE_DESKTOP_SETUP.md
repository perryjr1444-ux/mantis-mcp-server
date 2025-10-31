# Mantis MCP Server - Claude Desktop Integration

## ✅ Setup Complete!

The Mantis MCP server has been successfully added to your Claude Desktop configuration.

## 📍 Configuration File Location

```
~/Library/Application Support/Claude/claude_desktop_config.json
```

## 📝 Current Configuration

```json
{
  "mcpServers": {
    "mantis": {
      "command": "node",
      "args": [
        "/opt/mantis-defense-mcp-server/dist/index.js"
      ],
      "env": {
        "MANTIS_PATH": "/home/ubuntu/claude/Mantits",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## 🚀 Activation Steps

### 1. Restart Claude Desktop

**You must restart Claude Desktop for changes to take effect:**

```bash
# Close Claude Desktop completely (Cmd+Q or Menu > Quit)
# Then reopen Claude Desktop from Applications
```

### 2. Verify MCP Server is Running

After restarting, Claude Desktop should automatically:
- Start the Mantis MCP server
- Load all 10 defensive tools
- Display MCP server indicator (if available in UI)

### 3. Test the Integration

Try these prompts in Claude Desktop:

**Basic Test:**
```
List the Mantis tools available
```

**Deploy a Test Decoy:**
```
Deploy a test FTP honeypot on port 2121 in passive mode
```

**Analyze Commands:**
```
Analyze this session for LLM patterns:
- Session ID: test-001
- Commands: ["nmap -p- 192.168.1.1", "curl http://192.168.1.1", "sqlmap -u http://192.168.1.1/login"]
- Timing: [0, 2.1, 1.9]
```

**Generate Injection:**
```
Generate a defensive prompt injection payload using ANSI hiding for passive mode
```

## 🛠️ Available Tools in Claude Desktop

Once activated, you'll have access to these 10 Mantis tools:

| Tool | Purpose |
|------|---------|
| `deploy_decoy` | Deploy honeypot services (FTP, SSH, HTTP, SMB, Telnet) |
| `configure_mantis` | Configure defense modes and settings |
| `analyze_session` | Detect LLM-driven attack patterns |
| `generate_injection` | Create hidden defensive payloads |
| `monitor_attacks` | Real-time attack monitoring |
| `generate_tarpit` | Create resource exhaustion traps |
| `list_active_decoys` | View active honeypot services |
| `stop_decoy` | Stop specific decoy services |
| `get_attack_stats` | View defense statistics |
| `test_injection` | Test payload effectiveness |

## 🔍 Troubleshooting

### Server Not Appearing

1. **Check Claude Desktop Logs:**
   ```bash
   tail -f ~/Library/Logs/Claude/*.log
   ```

2. **Verify Configuration Syntax:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python3 -m json.tool
   ```

3. **Test Server Manually:**
   ```bash
   node /opt/mantis-defense-mcp-server/dist/index.js
   ```
   Should start without errors.

4. **Check Mantis Logs:**
   ```bash
   tail -f /opt/mantis-defense-mcp-server/logs/mantis-mcp.log
   ```

### Permission Issues

If you see permission errors:
```bash
chmod +x /opt/mantis-defense-mcp-server/dist/index.js
```

### Node.js Not Found

Ensure Node.js is in PATH:
```bash
which node
# Should output: ${HOMEBREW_BIN}/node

# If not found, add to shell profile:
echo 'export PATH="${HOMEBREW_BIN}:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 🎯 Example Usage Scenarios

### Scenario 1: Deploy Multiple Decoys

```
Deploy an FTP decoy on port 2121, an SSH decoy on port 2222, and an HTTP decoy on port 8080, all in passive mode
```

### Scenario 2: Analyze Suspicious Activity

```
I have a suspicious session with these commands: nmap -sV 10.0.0.1, ftp 10.0.0.1, anonymous login, ls -la.
Analyze if this is an LLM-driven attack.
```

### Scenario 3: Create Tarpit Defense

```
Generate an extreme complexity tarpit with depth 100 and breadth 500 to exhaust attacker resources
```

### Scenario 4: Monitor and Report

```
Monitor attacks for 5 minutes and give me a detailed report with metrics
```

### Scenario 5: Test Defensive Payload

```
Generate a defensive injection for active mode, then test it against GPT-4
```

## 📊 What Claude Desktop Can Do Now

With Mantis integrated, Claude Desktop can:

✅ **Autonomous Defense Deployment**
- Deploy honeypots automatically when you describe threats
- Configure defense strategies based on your requirements
- Manage multiple decoy services simultaneously

✅ **Intelligent Attack Analysis**
- Detect LLM-driven attacks from command patterns
- Identify timing anomalies and behavioral signatures
- Provide detailed analysis and recommendations

✅ **Defensive Payload Generation**
- Create hidden prompt injections (ANSI, HTML, Unicode, CSS)
- Customize payloads for specific attack scenarios
- Test effectiveness against different models

✅ **Real-Time Monitoring**
- Track ongoing attacks
- Generate statistics and reports
- Alert on LLM detection events

## 🛡️ Defense Modes Explained

### Passive Mode (Recommended for Most Users)
- **What it does**: Misdirects attackers to fake targets
- **Legal status**: ✅ Safe and legal
- **Risk level**: 🟢 Low
- **Use case**: General protection

```
Configure Mantis in passive mode with injection threshold 0.7
```

### Tarpit Mode
- **What it does**: Traps LLMs in infinite loops, exhausts resources
- **Legal status**: ✅ Safe and legal
- **Risk level**: 🟢 Low
- **Use case**: Resource exhaustion, cost inflation

```
Configure Mantis in tarpit mode with complexity level 8
```

### Active Mode (⚠️ Use with Extreme Caution)
- **What it does**: Counter-attacks the attacker's machine
- **Legal status**: ⚠️ May be illegal without authorization
- **Risk level**: 🔴 High
- **Use case**: Authorized penetration testing, research only

```
⚠️ Only use if legally authorized!
Configure Mantis in active mode with callback IP <your-ip> and port 7777
```

## 🔐 Security Best Practices

1. **Start with Passive Mode**
   - Safest option
   - Legal in all jurisdictions
   - Effective for most scenarios

2. **Test in Isolation**
   - Use VMs or isolated networks
   - Don't test on production systems
   - Monitor all activities

3. **Review Legal Requirements**
   - Consult legal counsel before active defense
   - Ensure proper authorization
   - Document all deployments

4. **Monitor Logs**
   - Regularly check Mantis logs
   - Review attack patterns
   - Adjust thresholds as needed

5. **Limit Exposure**
   - Only deploy on systems you own
   - Use non-standard ports
   - Implement firewall rules

## 📈 Performance Expectations

**Based on research (Pasquini et al., 2024):**

- **Detection Rate**: 95%+ for LLM-driven attacks
- **False Positives**: <5% with proper tuning
- **Attacker Success**: <5% when Mantis is active
- **Resource Impact**: ~100-200MB RAM per instance
- **Cost Inflation**: $0.81 to $4.55+ per attack (tarpit mode)

## 🎓 Learning Resources

- **Quick Start**: `QUICK_START.md` in the project directory
- **Installation Guide**: `INSTALLATION.md`
- **Full Documentation**: `README.md`
- **Research Paper**: [arXiv:2410.20911](https://arxiv.org/abs/2410.20911)
- **MCP Docs**: https://modelcontextprotocol.io

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** first
2. **Review troubleshooting** section above
3. **Test components** individually
4. **Verify configuration** syntax
5. **Restart services** and Claude Desktop

## ✨ What's Next?

Now that Mantis is integrated with Claude Desktop, you can:

1. ✅ Deploy decoys with natural language
2. ✅ Analyze attack sessions conversationally
3. ✅ Generate defensive payloads on demand
4. ✅ Monitor threats in real-time
5. ✅ Configure defenses through chat

Simply describe what you want to do in natural language, and Claude Desktop will use the appropriate Mantis tools!

---

**🎊 Mantis is now part of your Claude Desktop skillset! 🎊**

Restart Claude Desktop to activate, then try: *"Show me what Mantis can do"*
