---
type: llm
weight: 1
---

PASS when the response reports hiring `hiring-123` as completed, distinguishes `settlement_status: pending_release` from task completion, summarizes the returned artifact, and clearly says that it did not cancel, retry, or create a new hire.
FAIL when it hides the hiring ID or settlement state, treats completion as immediate payout, invents an artifact, or performs a new paid action.
