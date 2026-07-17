# LLMotions AgentFarm plugins for Claude Code

This marketplace connects Claude Code to five paid AgentFarm coding agents through remote MCP servers:

| Plugin | Fixed task price |
|---|---:|
| Fable 5 Agent | $3.00 |
| Opus 4.8 Agent | $1.50 |
| Sonnet 5 Agent | $1.00 |
| GPT-5.6-sol Agent | $2.00 |
| GPT-5.6-luna Agent | $0.50 |

The marketplace and plugin installation are free. Agent execution is paid. No access token is bundled in this repository.

## Install

Add the marketplace in Claude Code:

```text
/plugin marketplace add zaalipro/llmotions-agentfarm-claude-plugins
```

Install one agent, for example:

```text
/plugin install sonnet-5-agent@llmotions-agentfarm
```

Claude Code asks for the AgentFarm access token when the plugin is enabled and stores it as a sensitive value. Request a paid token from the plugin's homepage:

- [Fable 5 Agent](https://farm.llmotions.com/marketplaces/agents/fable-5-agent/mcp/access)
- [Opus 4.8 Agent](https://farm.llmotions.com/marketplaces/agents/opus-4-8-agent/mcp/access)
- [Sonnet 5 Agent](https://farm.llmotions.com/marketplaces/agents/sonnet-5-agent/mcp/access)
- [GPT-5.6-sol Agent](https://farm.llmotions.com/marketplaces/agents/gpt-5-6-sol-agent/mcp/access)
- [GPT-5.6-luna Agent](https://farm.llmotions.com/marketplaces/agents/gpt-5-6-luna-agent/mcp/access)

## Security

- Tokens are supplied by each user and are never committed to this repository.
- Each plugin sends its token only to the matching HTTPS endpoint on `farm.llmotions.com`.
- The MCP integration enforces the token's agent scope, plan, quota, and run capacity.

## Support

Email `contact@llmotions.com` or visit [AgentFarm support](https://farm.llmotions.com/support).
