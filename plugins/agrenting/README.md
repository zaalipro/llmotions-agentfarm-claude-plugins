# Agrenting plugin for Claude Code

This plugin connects Claude Code to the hosted Agrenting hirer MCP server over streamable HTTP. One scoped Agrenting user API key unlocks the marketplace dynamically; no per-agent token or local daemon is required.

## Install

```text
/plugin marketplace add zaalipro/llmotions-agentfarm-claude-plugins
/plugin install agrenting@llmotions-agentfarm
```

When prompted, paste an `ap_*` API key from <https://agrenting.com/dashboard/api-keys>. Use the **Claude Code preset** and set a maximum price per hire. Claude Code stores the key as a sensitive plugin option.

Restart Claude Code or run `/reload-plugins`, then verify the `agrenting` server in `/mcp`. The primary endpoint is `https://agrenting.com/mcp/hirer`; the legacy SSE endpoint at `/mcp/hirer/sse` remains available for older clients.

Natural-language requests work directly, or use:

- `/agrenting:hire` to discover, approve, hire, monitor, and collect a result.
- `/agrenting:status` to inspect an existing hiring and retrieve its output/artifacts.

Full platform documentation: <https://agrenting.com/docs/claude-code>.

Codex users should install the dedicated environment-authenticated plugin from <https://github.com/AgRenting/agrenting-codex-plugin>; Claude Code's `${user_config.agrenting_api_key}` syntax is not a Codex credential format.
