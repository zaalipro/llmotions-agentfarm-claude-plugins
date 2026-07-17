# Install an LLMotions AgentFarm MCP server in Cline

These are hosted Streamable HTTP MCP servers. Do not clone or run a local process.

1. Ask the user which agent they want.
2. Ask the user for a paid AgentFarm MCP token from that agent's access URL.
3. Open Cline's MCP configuration and merge only the selected server entry into `mcpServers`.
4. Replace `REPLACE_WITH_PAID_AGENTFARM_TOKEN` with the user's token. Never write the token to this repository or print it in chat.
5. Keep `autoApprove` empty so the user reviews every tool call.
6. Verify that `agentfarm_agent_info`, `agentfarm_create_run`, `agentfarm_get_run_status`, and `agentfarm_get_run_result` appear. Calling `agentfarm_agent_info` is public and does not start a paid run.

```json
{
  "mcpServers": {
    "fable-5-agent": {
      "type": "streamableHttp",
      "url": "https://farm.llmotions.com/mcp/agents/fable-5-agent",
      "headers": {
        "Authorization": "Bearer REPLACE_WITH_PAID_AGENTFARM_TOKEN"
      },
      "disabled": false,
      "autoApprove": []
    },
    "opus-4-8-agent": {
      "type": "streamableHttp",
      "url": "https://farm.llmotions.com/mcp/agents/opus-4-8-agent",
      "headers": {
        "Authorization": "Bearer REPLACE_WITH_PAID_AGENTFARM_TOKEN"
      },
      "disabled": false,
      "autoApprove": []
    },
    "sonnet-5-agent": {
      "type": "streamableHttp",
      "url": "https://farm.llmotions.com/mcp/agents/sonnet-5-agent",
      "headers": {
        "Authorization": "Bearer REPLACE_WITH_PAID_AGENTFARM_TOKEN"
      },
      "disabled": false,
      "autoApprove": []
    },
    "gpt-5-6-sol-agent": {
      "type": "streamableHttp",
      "url": "https://farm.llmotions.com/mcp/agents/gpt-5-6-sol-agent",
      "headers": {
        "Authorization": "Bearer REPLACE_WITH_PAID_AGENTFARM_TOKEN"
      },
      "disabled": false,
      "autoApprove": []
    },
    "gpt-5-6-luna-agent": {
      "type": "streamableHttp",
      "url": "https://farm.llmotions.com/mcp/agents/gpt-5-6-luna-agent",
      "headers": {
        "Authorization": "Bearer REPLACE_WITH_PAID_AGENTFARM_TOKEN"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Paid-token access pages:

- Fable 5: <https://farm.llmotions.com/marketplaces/agents/fable-5-agent/mcp/access>
- Opus 4.8: <https://farm.llmotions.com/marketplaces/agents/opus-4-8-agent/mcp/access>
- Sonnet 5: <https://farm.llmotions.com/marketplaces/agents/sonnet-5-agent/mcp/access>
- GPT-5.6-sol: <https://farm.llmotions.com/marketplaces/agents/gpt-5-6-sol-agent/mcp/access>
- GPT-5.6-luna: <https://farm.llmotions.com/marketplaces/agents/gpt-5-6-luna-agent/mcp/access>
