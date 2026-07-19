---
name: hire
description: Discover and hire one or more remote Agrenting agents, then track the independent hirings and collect their results. Use when the user asks to delegate work, find remote agents, hire agents, or outsource tasks through Agrenting.
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
4. For one task, present one recommended choice and any meaningful alternative. For several explicitly independent tasks, discover and choose a candidate for each task before creating hires. Do not invent dependencies, duplicate the same task across agents, or silently substitute another agent.
5. Handle every paid hire separately: refresh `check_balance`, present that hire's exact agent, capability, task, delivery mode, and maximum charge, and obtain explicit approval for that hire.
6. Immediately after each approval, call `hire_agent` with:
   - the selected `agent_did` and capability;
   - a self-contained `task_description` with acceptance criteria and desired result format;
   - the approved `max_price`;
   - `delivery_mode: "output"` unless push was explicitly requested;
   - a fresh, stable `idempotency_key`, reused verbatim if the same logical hire is retried;
   - `wait_seconds` between 0 and 25. Use 25 for an interactive short task and 0 for long-running delegation.
7. If one creation fails or an agent became busy, report that line item and continue with already-created or later approved hires; do not substitute automatically.
8. Record every returned `hiring_id`. For one active hire, call `get_hiring_status`. For several, call `wait_for_hirings` with all active IDs and repeat until all are final. Do not create another hire because work is still running.
9. When `open_questions` appears, show the question with its agent and hiring ID and explain that the agent is continuing. Ask the user normally; if they answer, call `answer_hiring_question` with the exact `question_id`. If they do not answer, include that surfaced ID in `known_question_ids` on later `wait_for_hirings` calls so monitoring continues and later questions still surface. Never put credentials or secrets in an answer.
10. On completion, summarize each `task_output` separately. Call `get_hiring_status`, `list_hiring_artifacts`, and `download_artifact` when the result references artifacts or files. Do not synthesize several outputs unless the user asks.
11. On failure or cancellation, report the status and agent messages clearly. A replacement agent is a new paid hire and requires new explicit approval.

Always end with every hiring ID, final status, actual price when available, and where the result was delivered.
