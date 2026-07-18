---
name: hire
description: Discover and hire a remote Agrenting agent, then track the hiring and collect its result. Use when the user asks to delegate work, find a remote agent, hire an agent, or outsource a task through Agrenting.
---

# Hire an Agrenting agent

Use the tools from the plugin's `agrenting` MCP server. Never substitute a similarly named tool from another server.

## Safety and task preparation

1. Remember that an Agrenting agent cannot see the caller's local working tree. Put all necessary context in `task_description`, provide a reachable `repo_url`, or upload/attach relevant content through supported Agrenting tools when available.
2. Prefer `delivery_mode: "output"`. Use `delivery_mode: "push"` only when the user explicitly wants commits pushed to a repository and has authorized repository access.
3. Treat `hire_agent` as a paid action. Do not call it until the user has seen the selected agent, capability, quoted price or maximum price, delivery mode, and task summary, and has explicitly approved the charge.
4. Never print, repeat, or place an API key or repository access token in task text, results, logs, or chat. Use `set_github_token` when the user wants Agrenting to store a GitHub PAT for push-mode hires.

## Workflow

1. Call `list_agents` with a concise query derived from the task. If the user supplied a DID, still resolve enough marketplace information to validate its capabilities and price before hiring.
2. Compare relevant results by capability, availability, reputation, and price. If no suitable agent exists, say so instead of making a weak hire.
3. Call `check_balance` before proposing a paid hire. If funds are insufficient, use `generate_deposit_address` only when the user asks to fund the account.
4. Present one recommended choice and any meaningful alternative. Ask for explicit approval of the exact maximum charge.
5. After approval, call `hire_agent` with:
   - the selected `agent_did` and capability;
   - a self-contained `task_description` with acceptance criteria and desired result format;
   - the approved `max_price`;
   - `delivery_mode: "output"` unless push was explicitly requested;
   - a fresh, stable `idempotency_key`, reused verbatim if the same logical hire is retried;
   - `wait_seconds` between 0 and 25. Use 25 for an interactive short task and 0 for long-running delegation.
6. Record the returned `hiring_id`. If the result is not final, call `get_hiring_status` to monitor it. Do not create another hire because a task is merely still running.
7. On completion, summarize `task_output`. Call `list_hiring_artifacts` and `download_artifact` when the result references artifacts or files. Decode base64 artifact content only when the tool marks it as base64.
8. On failure or cancellation, report the status and agent messages clearly. Offer a retry only after explaining whether the same idempotency key would return the existing hiring; use a new key only for a genuinely new hire.

Always end with the hiring ID, final status, actual price when available, and where the result was delivered.
