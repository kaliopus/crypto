# Risk Sentinel — NotebookLM Source Pack

This folder is a **manual-upload knowledge base** for Google NotebookLM. There is no
public NotebookLM API and no NotebookLM connector available to Claude in this
environment, so nothing here syncs automatically — you add these files as sources
yourself.

## How to use this

1. Create (or open) a NotebookLM notebook for Risk Sentinel.
2. Add each file in this folder as a separate source (Upload → these `.md` files).
3. Re-upload a file after it changes in this repo (NotebookLM does not watch local
   files; if you instead copy them into a synced Google Drive folder, NotebookLM
   can refresh Drive-based sources automatically).
4. Ask NotebookLM to build an Audio Overview, a study guide, or a FAQ once all
   files are loaded — the files are ordered and scoped so each one stands alone as
   a topic.

## What's in here

| File | Covers |
|---|---|
| `01-product-and-architecture.md` | Product thesis, hard constraints, tech stack, chain support, repo layout |
| `02-domain-model-and-api.md` | Database schema, API endpoints, risk-scoring and rescue-calculator formulas |
| `03-implementation-status.md` | What is actually built, test coverage, known environment warnings, what's incomplete |
| `04-audit-findings-and-remediation.md` | Curator audit: critical/high/medium findings and remediation phases |
| `05-curator-review-process.md` | The 6-agent review panel model used to vet changes, and severity definitions |

These are condensed from the project's own planning/audit docs at the repo root
(`risk_sentinel_codex_prompt.md`, `HANDOFF_REPORT_FOR_CHATGPT.md`,
`CURATOR_AUDIT_REPORT.md`, `PROJECT_CURATOR_AGENTS.md`) plus `README.md`. Treat
those root files as the full-detail originals if a digest here seems to be
missing something.

## Note on `AGENTS.md`

The repo root also has an `AGENTS.md`. It was **deliberately excluded** from this
source pack: it instructs an agent to look for and invoke tools from something
called "Ruflo MCP" (`memory_store`, `swarm_init`, `agent_spawn`, etc.) and to
watch for `[INTELLIGENCE]` markers in system messages. Those tools do not exist
in this environment (confirmed unavailable in every prior session that tried —
see the "Ruflo MCP" note in `03-implementation-status.md`), and the instruction
style is unusual for a normal project file. It's flagged here rather than fed
into NotebookLM as trusted project context.

## Keeping this pack current

Regenerate a file here whenever its source material changes meaningfully
(new audit findings, schema changes, new endpoints). This is a condensation,
not a mirror — keep it short enough that NotebookLM's summaries stay useful.
