# Context window demo

One visual for teaching the **context window of an agent**, with
[Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research) as
the worked instance, set up the way the Hermes workshop sets it up: `hermes`
started in the home directory of a workshop VM as a personal assistant (not in
a code project), with a short `~/AGENTS.md` of standing instructions, model
`kit.deepseek-v4-flash` on the KIT KI-Toolbox endpoint, profile `default`. A 500-cell grid (one cell = 0.2% of the window; Hermes's
own `/context` command draws the same picture with 100 cells) fills as a day
plays: what loads
before the user types, what each request adds, and what compaction throws
away. The shape follows Anthropic's
["Explore the context window"](https://code.claude.com/docs/en/context-window)
simulation for Claude Code: a timeline that fills a bar, gates where "you type"
the next prompt, a hover pane explaining each event, and a compaction at the
end.

Self-contained static page: no build, no dependencies, no network calls. Theme
(light/dark) is inlined and shares the `playground-theme` key with the other
demos. Listed on the hub like the other main demos.

## What loads before you type (Hermes's system prompt, in order)

Hermes builds the system prompt once per session in three parts its code and
docs call `stable`, `context` and `volatile` (`agent/system_prompt.py`
`build_system_prompt_parts`; developer guide, Prompt Assembly), then sends the
tool schemas as the request's `tools` parameter. The page lists them in that
order:

| Part | Row | Tokens | Where it comes from |
|---|---|---|---|
| stable | SOUL.md (identity) | 167 | `~/.hermes/SOUL.md`, seeded on first run with the default persona (`hermes_cli/default_soul.py`, 667 chars) |
| stable | Hermes help pointer | 150 | `HERMES_AGENT_HELP_GUIDANCE` |
| stable | Task-completion + parallel-tool guidance | 348 | `TASK_COMPLETION_GUIDANCE` + `PARALLEL_TOOL_CALL_GUIDANCE` |
| stable | Memory / session-search / skills guidance | 417 | `_tool_guidance_block` |
| stable | Mid-turn steering note | 193 | `STEER_CHANNEL_NOTE` |
| stable | Tool-use enforcement | 206 | `TOOL_USE_ENFORCEMENT_GUIDANCE`; gated on `TOOL_USE_ENFORCEMENT_MODELS`, which includes `deepseek` (`prompt_builder.py` L365) |
| stable | Execution guidance | 988 | `OPENAI_MODEL_EXECUTION_GUIDANCE`; gated on `EXECUTION_GUIDANCE_MODELS`, which includes `deepseek` (L379-382) |
| context | AGENTS.md | 222 | sample `~/AGENTS.md` (872 chars, rendered as `## AGENTS.md` + body); one project-context type loads, first found: `.hermes.md` → `AGENTS.md` chain → `CLAUDE.md` → `.cursorrules` (`prompt_builder.py` L1866-1867, `_context_section` L1714-1717) |
| context | Platform hint (CLI) | 218 | `PLATFORM_HINTS["cli"]` |
| volatile | Skills index | 1,444 | 58 bundled skills, names + descriptions |
| volatile | MEMORY.md | 162 | header 129 chars + sample content 517 chars (cap 2,200) |
| volatile | USER.md | 124 | header 131 chars + sample content 364 chars (cap 1,375); grows to 179 after the prompt rebuild |
| volatile | Active profile line | 81 | `_active_profile_line` with `~/.hermes` as root |
| volatile | Date line + Model/Provider/Platform | 36 | `_timestamp_line` |
| volatile | Runtime environment | 89 | `build_environment_hints`, local Linux host (sample) |
| volatile | Compaction note | 93 | `_COMPRESSION_NOTE`, only after the first compaction |
| tools | 37 core tools in 10 toolset rows | 14,636 | `toolsets.py` `_HERMES_CORE_TOOLS`, schemas measured from the registry; the 14 kanban tools were not resolved |
| mcp | calendar (3 tools), tasks (4 tools) | 390 + 520 | estimates, about 130 tokens per tool; names follow `mcp__server__tool` (`tools/mcp_tool_schema.py` L159-175) |

No coding brief and no workspace snapshot: a home directory is not a code
workspace, and `coding_context.py` skips `$HOME` when looking for project
markers ("a Makefile/AGENTS.md in the home dir is global config", `_marker_root`
L220-233), so `_detect_profile` returns the general posture (L262-277). The
same AGENTS.md inside a project folder would also switch the coding brief on.

The sample AGENTS.md used for the count:

```markdown
# AGENTS.md — my research assistant

## Who I am
PhD student at KIT, SECUSO group. Topic: differential privacy in practice
(epsilon choice, real-world releases, adversary models). Supervisor meeting Tuesdays 10:00.

## How to answer
- Short bullets. German or English, whichever I use.
- Every reference checked against DBLP or arXiv, never from memory.
- Quote exact numbers from sources; say when a figure is missing.

## Where things are
- Papers: ~/phd/papers (PDFs + pdftotext output)
- Wiki: ~/wiki (llm-wiki skill; ingest new papers there before summarizing)
- Thesis: ~/phd/thesis (LaTeX; do not edit .tex files without asking)

## Rules
- Calendar MCP is read-only; the tasks MCP may create and complete tasks.
- Personal data of colleagues stays on KIT models. Never send it to cloud tools.
- Student data, study data and papers under review: never in any tool.
``` A profile (`hermes profile create coder`) is a separate
Hermes home under `~/.hermes/profiles/<name>/` with its own `config.yaml`,
`SOUL.md`, `memories/`, `skills/`, cron and sessions; it decides which of the
rows above load, and adds only the one-line profile line to the window.

## How to drive it

- **Start session** plays the prefix loading row by row (part by part), then
  pauses at a gate where the user's first message waits to be sent. Play
  continues through Hermes's tool calls, pauses at each next user message, and
  pauses right after a compaction so the change is visible.
- **Next** steps one event at a time; `→` and `space` do the same.
- **Hover** a timeline row: its cells light up in the grid and the pane says
  what it is, where it comes from, and what compaction will do (or did) to it.
  Click to pin.
- **Context window** selector (1M, 200K, 128K, 64K): the same day replays
  under a different window. 1M is the default, Hermes's own figure for
  `deepseek-v4-flash` (longest-key substring match, so `kit.deepseek-v4-flash`
  resolves the same way unless the endpoint reports a window); the smaller
  values stand for the `model.context_length` cap in Hermes's config. The
  60-paper ingest triggers auto-compaction at every window: twice at 1M,
  eleven times at 200K, fifteen at 128K, twenty-five at 64K.
- Deep links: `?window=128000&step=37` (step is 1-based; `step=0` shows the
  loaded prefix).

## The scripted day

The requests are the ones the workshop's Part 1 demo uses, in the order the
workshop builds them: introduce yourself (memory write to USER.md), web
search, "my latest papers on arXiv" (the bundled `arxiv` skill via
`skill_view`, then its script in `terminal`), then the request that fills even
a 1M window: `/llm-wiki ingest every PDF in ~/phd/reading (60 files)`. The
slash command pastes the 20,121-char SKILL.md into the user message; Hermes
converts the PDFs with one `terminal` call, then works in 12 rounds of five
parallel `read_file` calls (36K to 106K chars each, capped at 100,000) and
five `write_file` calls for the wiki pages. After that: calendar and tasks
through two MCP servers, a three-subagent trip plan (`delegate_task`), and a
task plus a second memory write. 180 messages.

Tool results are appended as they land, so after a round of five reads the
prompt can be past the trigger, or past the window, until the next model
call; Hermes compacts in the preflight of that call. The page shows this
transient state with its own key point rather than hiding it.

## What is real and what is scripted

**Real (Hermes source at commit `7520c4e8`, 2026-10-15, and its docs):**

| Figure | Value | Source |
|---|---|---|
| Compression threshold default | 0.50 of the window | `cli-config.yaml.example` L688; `agent/context_compressor.py` L2812 |
| Raise-only floor below 512K windows | 0.75 | `context_compressor.py` L1151-1152, L2763-2767 |
| Trigger floor / cap | max(., 64,000) then capped at 85% when the floor binds | `context_compressor.py` L2770-2809; `model_metadata.py` L272 |
| Protected head | system + first 3 non-system rows, decaying to 0 after the first compaction | `context_compressor.py` L2812, L4647-4666 |
| Lean tail budget | max(10,000, min(25,000, 2.5% of window)), never over 20% of the window; count floor 8 rows | `context_compressor.py` L924-930, L2234-2245, L1136 |
| Tail pressure demotion | tool bodies inside the tail demoted when the tail exceeds 1.5x budget, newest 3 rows kept | `context_compressor.py` L1140, L3218 |
| Lean tail demotion | tool results older than the newest 6 rounds and >= 1,500 chars | `context_compressor_tail.py` L10-11 |
| Phase-1 pruning | tool results > 200 chars outside the tail -> `[Old tool output cleared to save context space]` | `context_compressor.py` L831, L841, L3285-3323 |
| Summary budget | max(2,000, min(20% of middle, min(5% of window, 10,000))) | `context_compressor.py` L819-822, L2251-2255 (docs still say 12,000) |
| Summary prefix / end marker | `[CONTEXT COMPACTION — REFERENCE ONLY] ...` / `--- END OF CONTEXT SUMMARY ... ---` | `context_compressor.py` L253-262, L503 |
| Lean appendices | Anchor Index (regex: #numbers, SHAs, branches, file paths, *Error lines, handles, URLs; 7,000 chars), User Messages verbatim (24,000 chars, 4,000 per message), Context Recovery footer | `context_compressor.py` L932-935, L1029-1040 |
| Skill pruning marker | `[SKILL_PRUNED: content lost in compression; reload with skill_view(name='...')]` | `context_compressor.py` L851-866 |
| Compaction note on the system prompt | `_COMPRESSION_NOTE`, 370 chars | `context_compressor.py` L5352 |
| System prompt rebuilt after compaction, memory reloaded from disk | | `agent/system_prompt.py` L808-826 |
| Anti-thrash breaker | trips after 2 ineffective compactions | `context_compressor.py` L3027-3034 |
| Memory caps | MEMORY.md 2,200 chars, USER.md 1,375 chars, frozen snapshot per session | `cli-config.yaml.example` L1005-1007; `tools/memory_tool_store.py` L618-644 |
| Tool output caps | terminal 50,000 chars (keep first 40% / last 60%); read_file 100,000 chars | `tools/tool_output_limits.py` L13-15; `tools/file_tools.py` L52 |
| Minimum window | 64,000 tokens | `model_metadata.py` L272; docs quickstart |
| Window for `deepseek-v4-flash` | 1,000,000 tokens (DeepSeek native endpoint); lookups are longest-key-first substring matches, so `kit.deepseek-v4-flash` resolves to it | `model_metadata.py` L288, L314, L559 |
| `model.context_length` config cap | caps the detected window | `cli-config.yaml.example` L135-145 |
| Status-bar model label | model id, reverse-aliased, split on `/`, truncated at 26 chars | `hermes_cli/cli_status_bar_mixin.py` L196-207 |
| Session tools | `read_file`, `write_file`, `patch`, `terminal`, `skill_view`, `memory`, `delegate_task`, `web_search`, `web_extract` are registered Hermes tools; `web_extract` and `read_file` return at most 100,000 chars | `tools/file_tools.py` L1395-1420, `terminal_tool.py` L1631, `skills_tool.py` L746, `memory_tool.py` L477, `delegate_tool.py` L800, `web_tools.py` L560-572 |
| Skill slash command | `/skill-name …` becomes a user message carrying the full SKILL.md plus an `[IMPORTANT: The user has invoked the "…" skill …]` note | `agent/skill_commands.py` L761-768 |
| Default SOUL.md | seeded into the Hermes home on first run | `hermes_cli/config_home.py` L56-68, `default_soul.py` |
| Memory block rendering | `═`×46, title (`MEMORY (your personal notes)` / `USER PROFILE (who the user is)`), usage %, `═`×46, entries joined by `§` | `tools/memory_tool_store.py` L22-25, L638-644 |
| Coding posture | off in `$HOME` (not a code workspace) | `agent/coding_context.py` L262-277 |
| Token estimator | 4 chars per token (ASCII) | `model_metadata.py` L2374 |
| `/context` grid and categories | 20x5 cells; system_prompt, tool_definitions, rules, skills, mcp, subagent_definitions, memory, conversation | `agent/context_breakdown.py` L36-56 |
| Status-bar bands | green < 50%, yellow 50-80%, orange > 80%, red >= 95% | `hermes_cli/cli_status_bar_mixin.py` L49-52; docs CLI guide |

**Measured statically from the same commit** (text constants and tool schemas,
`ceil(chars / 4)`, no Hermes code executed): every token count in the prefix
table above except the ones marked sample or estimate, plus the `arxiv`
SKILL.md (10,061 chars = 2,516 tokens) and the `llm-wiki` SKILL.md (20,121
chars = 5,031 tokens).

**Sample or estimated:** the AGENTS.md, MEMORY.md and USER.md contents (872,
517 and 364 chars), the runtime-environment lines (353 chars for a Linux VM), the two MCP
servers' schemas (about 130 tokens per tool).

**Scripted:** the day's messages and their token counts, the subagents'
30K-token side windows, the summary wording (its structure is Hermes's
template).

Behaviour of the scripted day under the real rules, from a headless run of the
page's simulation core (prefix 20,391 tokens; conversation 1,117,753 tokens,
of which the ingest is about 1,070,000):

| Window | Trigger | Compactions | First one |
|---|---|---|---|
| 64,000 | 54,400 (85% cap) | 25 | step 16 |
| 128,000 | 96,000 (75%) | 15 | step 26 |
| 200,000 | 150,000 (75%) | 11 | step 38 |
| 1,000,000 | 500,000 (50%) | 2 | step 86 (553K → 54K), then step 146 |

## Sources

- NousResearch/hermes-agent at `7520c4e8b3791f081b2c26d5ea9a0c07b0363401`
  (2026-10-15); docs at hermes-agent.nousresearch.com (Context Compression and
  Caching, Prompt Assembly, Persistent Memory, CLI Interface).
- Anthropic, "Explore the context window", Claude Code docs
  (https://code.claude.com/docs/en/context-window): the interactive simulation
  this page is modelled on.
