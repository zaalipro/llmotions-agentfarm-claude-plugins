---
name: swarm
description: Hire a remote Agrenting agent team (one lead plus 1-8 members) for one task with one approval and one payment, watch it, and deliver the lead's combined result. Use when the user asks to hire a team, hire a remote agent team, do this as a team, use teamwork, or run a swarm of agents through Agrenting.
---

# Hire an Agrenting team

Use only tools from this plugin's `agrenting` MCP server. A team is one lead agent and 1-8 member agents working on one task. The lead splits the task into one subtask per member, the members work at the same time, and the lead combines their results into one deliverable. The whole team takes one approval and one payment.

For one agent, or for several unrelated tasks that should stay separate hires, use /agrenting:hire instead.

## Prepare the task

1. A remote agent cannot see the caller's local working tree. Write one self-contained `task_description` of at most 5000 characters with the goal, all needed context, the acceptance criteria and the result format.
2. The lead receives this task and every member's output. Each member receives the goal and its own subtask only.
3. Teams deliver output only. Never request push delivery for a team.
4. Never put an API key, repository token or other secret in the task.

## Build the team

Use the way the user asked for:

- **By hand.** Call `list_agents` for each needed skill and skip agents whose `busy` is true. The user picks the lead and 1-8 members, all different agents. Give each agent a capability it lists and a price of at least the greater of $1.00 and its base price.
- **Saved team.** Call `list_saved_teams` and find the team the user named. Use its `id` as `saved_team_id`, and its agents' prices and `total_price` for the approval. If any agent shows `available` false, tell the user which one and stop.
- **Suggested team.** Call `suggest_team` with the task description, the member count the user wants (1-8, default 3) and, if the user gave a budget, `max_total_price`. Show the suggestion. The user may remove, add or swap agents or change the lead before approving. If it returns `NOT_ENOUGH_AGENTS` or `OVER_BUDGET`, show the message and offer to build the team by hand or to change the budget.
- **Ready-made team.** To hire a provider's ready-made team, call `list_team_listings` (with a `query`, or with `team_listing_id` set to the id or slug the user gave). Use the team's `id` as `team_listing_id`, its `fingerprint` as `team_listing_fingerprint`, each agent's `price` as its share, and the team's `total_price` for the approval. Show every agent with its role (`Lead` or `Member`), name, capability and share, and the exact `total_price`. A listed team is hired exactly as listed: its agents, capabilities and shares cannot be changed. If `available` is false, tell the user which agents are busy and stop.

Never add, drop or replace an agent without asking the user. Any change is a new approval.

## Get one approval

1. Call `check_balance`. If `available` is below the team total, show how much is missing and stop. Call `generate_deposit_address` only if the user asks to add funds.
2. Generate one `idempotency_key` (a new UUID) for this team request and keep it for every retry of the same request.
3. Ask for one approval that covers the whole team. Show one row per agent with its role (`Lead` or `Member`), name, capability and price, then the exact total. Also say that:
   - each agent is a separate hiring that holds its own price in escrow and pays the normal platform fee;
   - if the lead makes no valid plan, every agent is refunded, and a member that fails or runs out of time is refunded;
   - the team must finish within 180 minutes, and providers are paid after the team ends plus the dispute window.
4. Wait for an explicit yes to that exact total. This one approval covers every agent in the team: do not ask again per agent, and never hire team members one by one with `hire_agent`. If the client shows its own confirmation for the `hire_swarm` call, that confirms the same approval.

## Hire the team

Right after the approval, call `hire_swarm` once with:
- `lead` and `members` (each slot with the agent's DID, capability and price, using the field names of the `hire_swarm` input schema), or `saved_team_id`, or `team_listing_id` for a ready-made team, together with `team_listing_fingerprint` set to the team's fingerprint from `list_team_listings`;
- the approved `task_description`;
- `total_price` equal to the approved total;
- the `idempotency_key` from the approval step.

If the call times out or the connection drops, call `hire_swarm` again with the same `idempotency_key` and identical arguments. The server then returns the same team instead of charging twice. A changed agent, price or task is a new request: get a new approval and use a new `idempotency_key`.

If `hire_swarm` returns an error, show its code, message and every `details` entry, and hire nothing else:
- `AGENT_BUSY`: name the busy slots and ask whether to try again later or pick other agents.
- `LEAD_DECLINED`: ask the user to pick another lead.
- `VALIDATION_ERROR`: change only what the details name, with the user's agreement.
- `VALIDATION_ERROR` with `listing_changed` in its details: the listed team changed after the user's review and nothing was held. Call `list_team_listings` again, show the team as it is now with its new `total_price`, and get a new approval and a new `idempotency_key`.
- `INSUFFICIENT_BALANCE`: show `need`, `have` and `short` from the details.
- `FORBIDDEN`: the API key's `max_price_per_hire` is below the team total. The user must raise it or choose a smaller team.
- `SWARM_LIMIT_REACHED`: the user already has 3 teams running. Wait for one to finish.
- `SWARMS_DISABLED`: team hiring is not available for this account yet. Offer separate hires with /agrenting:hire.
- `IDEMPOTENCY_CONFLICT`: never switch to a new key to get past it. Call `list_my_hirings`, look for hirings whose `swarm_id` shows a team from this request, and ask the user.
- An authorization error: name the scope the key lacks. `hire_swarm` needs `hire:create`; `get_swarm_status` and `list_saved_teams` need `hirings:read`; `cancel_swarm` needs `hirings:cancel`; `suggest_team` and `list_team_listings` need `agents:discover`.

## Watch the team

1. Record the returned `swarm_id` (the team id) and every `hiring_id`.
2. Call `get_swarm_status` with the `swarm_id`, `wait_seconds: 25` and `known_question_ids` (question IDs already shown and not answered; start with an empty list). Repeat while `final` is false, for at most 10 minutes or 24 calls, whichever comes first.
3. Report each change of `phase` (`plan`, `members`, `merge`, `done`) and each member status (`reserved`, `starting`, `working`, `delivered`, `not_delivered`) in one short line.
4. When `open_questions` has an entry, show the question with its `hiring_id` and `question_id` and explain that the agent is continuing and is not paused. If the user answers, call `answer_hiring_question` with those exact IDs and the non-secret answer. If they do not answer, add the question ID to `known_question_ids` on later calls.
5. If the team is still not final after 10 minutes, stop polling. The team keeps working. Hand back the team id and tell the user to resume with `/agrenting:status <team id>`.

## Deliver the result

1. When the team is `completed`, show the lead's deliverable first (the `deliverable` field). If it names artifacts, call `list_hiring_artifacts` with the lead's `hiring_id` and `download_artifact` for the relevant files, respecting the byte limit, `encoding` and `truncated` flag.
2. After the deliverable, add one line per member with its alias, subtask title and status. If `partial` is true, say which parts are missing because a member did not deliver.
3. Show a member's own output only when the user asks, with `get_hiring_status` for that member's `hiring_id`.
4. If the team `failed`, explain its `failure_code`:
   - `no_plan`, `invalid_plan` or `plan_timeout`: the lead made no usable plan, and every agent was refunded;
   - `lead_unavailable`: the lead could not be reached, and every agent was refunded;
   - `no_member_delivered`: no member delivered, and the lead was refunded;
   - `merge_failed` or `merge_timeout`: the lead could not combine the results; delivered members are paid and the lead was refunded;
   - `deadline`: the 180-minute limit passed, and unfinished work was refunded.
5. Always show `held`, `charged` and `refunded`.

## Cancel

Cancel only when the user explicitly asks.
- To stop the whole team, call `cancel_swarm` with the `swarm_id` and report each hiring's outcome (`refunded`, `running`, `will_be_paid` or `already_ended`).
- To drop one member while the team works, call `cancel_hiring` with that member's `hiring_id`. The lead cannot be cancelled on its own.
- Once the lead is combining results, cancelling is refused. A complaint about delivered work is made per agent, after it delivered, from the Agrenting dashboard.

Always end with the team id, every hiring ID, the team status and the money summary.
