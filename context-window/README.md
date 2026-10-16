# Context window demo

One visual for teaching the **context window of an agent**, with
[Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research)
running DeepSeek V4 Flash as the worked instance. A 100-cell grid (one cell = 1% of the window, the same
metaphor as Hermes's own `/context` command) fills as a session plays: what
loads before the user types, what each tool call adds, and what compaction
throws away. The shape follows Anthropic's
["Explore the context window"](https://code.claude.com/docs/en/context-window)
simulation for Claude Code: a timeline that fills a bar, gates where "you type"
the next prompt, a hover pane explaining each event, and a compaction at the
end.

Self-contained static page: no build, no dependencies, no network calls. Theme
(light/dark) is inlined and shares the `playground-theme` key with the other
demos. Listed on the hub like the other main demos.

## How to drive it

- **Start session** plays the prefix loading, then pauses at a gate where the
  user's prompt waits to be sent. Play continues through Hermes's tool calls,
  pauses at the next user prompt, and pauses right after a compaction so the
  change is visible.
- **Next** steps one event at a time; `→` and `space` do the same.
- **Hover** a timeline row: its cells light up in the grid and the pane says
  what it is and what compaction will do (or did) to it. Click to pin.
- **Context window** selector (1M, 200K, 128K, 64K): the same session replays
  under a different window. 1M is the default, Hermes's own figure for
  `deepseek-v4-flash`; the smaller values stand for the `model.context_length`
  cap in Hermes's config. At 1M auto-compaction never fires, so a `/compress`
  gate is offered at the end; at 200K it fires once, late; at 128K once,
  mid-session; at 64K five times.
- Deep links: `?window=128000&step=19` (step is 1-based; `step=0` shows the
  loaded prefix).

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
| Window for `deepseek-v4-flash` | 1,000,000 tokens (DeepSeek native endpoint) | `model_metadata.py` L314 |
| `model.context_length` config cap | caps the detected window | `cli-config.yaml.example` L135-145 |
| Status-bar model label | model id, reverse-aliased, split on `/`, truncated at 26 chars | `hermes_cli/cli_status_bar_mixin.py` L196-207 |
| Session tools | `read_file`, `search_files`, `patch`, `terminal`, `skill_view`, `memory`, `delegate_task`, `web_search`, `web_extract` are registered Hermes tools | `tools/file_tools.py` L1395-1420, `terminal_tool.py` L1631, `skills_tool.py` L746, `memory_tool.py` L477, `delegate_tool.py` L800, `web_tools.py` L560-566 |
| Token estimator | 4 chars per token (ASCII) | `model_metadata.py` L2374 |
| `/context` grid and categories | 20x5 cells; system_prompt, tool_definitions, rules, skills, mcp, subagent_definitions, memory, conversation | `agent/context_breakdown.py` L36-56 |
| Status-bar bands | green < 50%, yellow 50-80%, orange > 80%, red >= 95% | `hermes_cli/cli_status_bar_mixin.py` L49-52; docs CLI guide |

**Measured statically from the same commit** (text constants and tool schemas,
`ceil(chars / 4)`, no Hermes code executed):

| Prefix part | Tokens | Note |
|---|---|---|
| System prompt text | 2,300 | identity 166, help pointer 150, task + parallel-tool guidance 348, memory/session-search/skills guidance 417, steering note 193, coding brief 658, CLI platform hint 218, plus 150 assumed for the workspace/timestamp/profile lines (not measured) |
| Tool schemas | 14,636 | 37 of the 51 core CLI tools resolved; the 14 kanban tools (dispatcher workers only) were not. Hermes's own comment: "50+ tools ≈ 20-30K tokens" |
| AGENTS.md example | 2,988 | the Hermes repo's own `AGENTS.md` (11,952 chars) |
| Skills index, 58 bundled skills | 1,444 | full `## Skills` block |
| Memory snapshot | 570 | assumed fill: 1,320 / 2,200 chars of MEMORY.md and 820 / 1,375 of USER.md |
| python-debugpy skill body | 3,746 | 14,984 chars, loaded by `skill_view` in the session |

**Scripted:** the coding session (35 messages: user, Hermes tool calls, tool
results, a skill load, a memory write, a sub-agent, a PR) and its token counts;
the sub-agent's 41,000-token side window; the summary wording (its structure is
Hermes's template). The grid fills with the scripted numbers; the rules that
shrink it are the real ones above.

Behaviour of the scripted session under those rules, from a headless run of the
page's simulation core:

| Window | Trigger | Compactions | When |
|---|---|---|---|
| 64,000 | 54,400 (85% cap) | 5 | steps 14, 19, 27, 29, 31 |
| 128,000 | 96,000 (75%) | 1 | step 19 |
| 200,000 | 150,000 (75%) | 1 | step 34 |
| 1,000,000 | 500,000 (50%) | 0 | never; the page offers `/compress` at the end |

## Sources

- NousResearch/hermes-agent at `7520c4e8b3791f081b2c26d5ea9a0c07b0363401`
  (2026-10-15); docs at hermes-agent.nousresearch.com (Context Compression and
  Caching, Prompt Assembly, Persistent Memory, CLI Interface).
- Anthropic, "Explore the context window", Claude Code docs
  (https://code.claude.com/docs/en/context-window): the interactive simulation
  this page is modelled on.
