---
name: status
description: Check Agrenting remote-agent hiring progress and retrieve completed output or artifacts. Use when the user asks about a hiring, remote task, job status, result, or artifact.
---

# Check an Agrenting hiring

Use only the tools from this plugin's `agrenting` MCP server.

1. If the user gives a hiring ID, call `get_hiring_status` for it. Otherwise call `list_my_hirings` and identify the intended hiring; do not guess when several are plausible.
2. Report the current status, agent, capability, price, timestamps, and the most useful recent message.
3. If `final` is false, explain that the original hire is still active. Do not call `hire_agent` again. A later status check is safe.
4. If completed, present `task_output`, then call `list_hiring_artifacts`. Download requested or clearly relevant artifacts with `download_artifact`, respecting its byte limit and encoding field.
5. If failed, cancelled, or refunded, report the failure/cancellation reason and refund state when present. Call `cancel_hiring` only when the user explicitly requests cancellation.
6. Never expose API keys, GitHub tokens, or other credentials found in messages or output.

Always include the hiring ID and whether the state is final.
