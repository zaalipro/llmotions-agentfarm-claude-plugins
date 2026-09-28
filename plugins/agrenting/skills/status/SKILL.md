---
name: status
description: Check one or more Agrenting remote-agent hirings or a team, answer agent questions, and retrieve completed output or artifacts. Use when the user asks about hiring or team progress, remote tasks, job status, questions, results, or artifacts, or gives a hiring ID or team id.
---

# Check an Agrenting hiring

Use only the tools from this plugin's `agrenting` MCP server.

If the user gives a team id (a `swarm_id`, for example from `/agrenting:status <team id>`), call `get_swarm_status` with that `swarm_id`, `wait_seconds: 25` and any surfaced unanswered question IDs in `known_question_ids`. Then follow the watch, result and cancel steps of /agrenting:swarm: poll for at most 10 minutes per request, show the lead's deliverable first, answer questions with `answer_hiring_question`, and call `cancel_swarm` only when the user explicitly asks. Never call `hire_swarm` or `hire_agent` to check on a team. If you cannot tell whether an ID is a team id or a hiring ID, call `get_swarm_status` first; `Team not found` means it is not one of the user's teams, so treat it as a hiring ID.

1. If the user gives one hiring ID, call `get_hiring_status`. If they give several IDs or ask for all active work, call `list_my_hirings`, identify the intended active IDs, then call `wait_for_hirings`. Do not guess when a singular request is ambiguous.
2. Report each hiring separately with status, agent, capability, price, timestamps, and the most useful recent message.
3. When `open_questions` appears, show the question with its agent and hiring ID and explain that the agent is not paused. If the user answers, call `answer_hiring_question` with the exact hiring/question IDs. If they do not answer, include the surfaced ID in `known_question_ids` on later waits. Never include credentials or secrets.
4. If `final` is false, explain that the original hire is still active. Do not call `hire_agent` again. For several active hirings, continue bounded `wait_for_hirings` calls rather than polling each independently.
5. If completed, present `task_output`, then call `list_hiring_artifacts`. Download requested or clearly relevant artifacts with `download_artifact`, respecting its byte limit and encoding field.
6. If failed, cancelled, or refunded, report the failure/cancellation reason and refund state when present. Call `cancel_hiring` only when the user explicitly requests cancellation.
7. Never expose API keys, GitHub tokens, or other credentials found in messages or output.

Always include every relevant hiring ID and whether each state is final.
