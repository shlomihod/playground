# Context window demo

A teaching aid for the **context window of an agent**, using
[Hermes Agent](https://github.com/NousResearch/hermes-agent) (Nous Research) as
the worked instance: what sits in the window before the user types, how a
session fills it and is re-sent on every call, what compaction keeps, stubs and
summarizes, and why the agent "forgets".

Self-contained static page: no build, no dependencies, no network calls. Theme
(light/dark) is inlined and shares the `playground-theme` key with the other
demos. Listed on the hub and indexable, like the other main demos.

Deep links: `?window=128000&threshold=0.5&step=19` preselects the window, the
configured threshold and the session step.

## Four panels

1. **Before you type: the fixed prefix.** A 100-cell grid (one cell = 1% of
   the window, the same metaphor as Hermes's own `/context` command) fills with
   the system prompt, tool schemas, AGENTS.md, the skills index and the memory
   snapshot. Toggles remove parts; a selector switches the window (64K, 128K,
   200K, 1M). A replica of Hermes's status bar shows the `used/max` readout and
   its colour bands. Takeaway: ~22K tokens are sent before the first word, and
   again on every call.
2. **A session fills the window.** A scripted debugging session (36 messages:
   user, assistant tool calls, tool results, a skill load, a memory write, a
   sub-agent, a PR) is stepped through with Prev/Next/autoplay (arrow keys,
   space). The grid, the status bar, per-call token counts (cached vs new) and
   the cumulative "sent so far" counter update at each step. Clicking a message
   shows its text and what the compressor will do to it.
3. **Compaction.** The live formulas for the trigger, tail budget, head and
   summary budget with the current window and threshold; the four phases with
   the real counts from the last compaction; the summary row now in the window
   (Hermes's template, simulated wording). A slider changes the threshold, a
   button forces `/compress`.
4. **Will it still remember?** Seven planted facts; the student bets, then the
   reveal applies the compressor's actual rules (head/tail protection, regex
   anchor index, verbatim user quotes, tool-output stubs, skill pruning, memory
   reload at the prompt rebuild). A four-layer box separates live context,
   memory files, session history and skills.

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
| Token estimator | 4 chars per token (ASCII) | `model_metadata.py` L2374 |
| `/context` grid and categories | 20x5 cells; system_prompt, tool_definitions, rules, skills, mcp, subagent_definitions, memory, conversation | `agent/context_breakdown.py` L36-56 |
| Status-bar bands | green < 50%, yellow 50-80%, orange > 80%, red >= 95% | `hermes_cli/cli_status_bar_mixin.py` L49-52; docs CLI guide |
| Prompt cache | 4 breakpoints (static system prefix, end of system, last 2 messages), 5-minute TTL default | `agent/prompt_caching.py` L1-5, L330-362 |

**Measured statically from the same commit** (text constants and tool schemas,
`ceil(chars / 4)`, no Hermes code executed):

| Prefix part | Tokens | Note |
|---|---|---|
| Default identity | 166 | `DEFAULT_AGENT_IDENTITY` |
| Hermes help pointer | 150 | `HERMES_AGENT_HELP_GUIDANCE` |
| Task-completion + parallel-tool guidance | 348 | 769 + 618 chars |
| Memory / session-search / skills guidance | 417 | `build_memory_guidance(True, True)` + two constants |
| Mid-turn steering note | 193 | `STEER_CHANNEL_NOTE` |
| Coding brief | 658 | `coding_context.CODING_AGENT_GUIDANCE` |
| Platform hint (CLI) | 218 | `PLATFORM_HINTS["cli"]` |
| Skills index, 58 bundled skills | 1,444 | full `## Skills` block |
| AGENTS.md example | 2,988 | the Hermes repo's own `AGENTS.md` (11,952 chars) |
| Tool schemas | 14,636 | 37 of the 51 core CLI tools resolved; the 14 kanban tools (dispatcher workers only) were not. Hermes's own comment: "50+ tools ≈ 20-30K tokens" |
| python-debugpy skill body | 3,746 | 14,984 chars, loaded by `skill_view` in the session |

Not measured, assumed: the workspace snapshot / timestamp / profile / runtime
lines (150 tokens, labelled as an estimate in the ledger); the memory block's
starting fill (1,320 / 2,200 and 820 / 1,375 chars).

**Scripted:** the session's messages and their token counts, the sub-agent's
41,000-token side window, the summary wording (its structure is Hermes's
template), and the cache accounting (modelled on Hermes's breakpoint layout,
not measured).

Behaviour of the scripted session under the real rules, from a headless run of
the page's simulation core:

| Window | Trigger | Compactions | When |
|---|---|---|---|
| 64,000 | 54,400 (85% cap) | 5 | steps 14, 19, 27, 29, 31 |
| 128,000 | 96,000 (75%) | 1 | step 19 |
| 200,000 | 150,000 (75%) | 1 | step 34 (and none if AGENTS.md or the browser toolset is switched off) |
| 1,000,000 | 500,000 (50%) | 0 | never in this session |

## Prior art

The closest existing demo is Anthropic's
["Explore the context window"](https://code.claude.com/docs/en/context-window)
on the Claude Code docs: a scripted timeline that fills a 200K bar with
illustrative blocks and ends with `/compact`. This page borrows its
scripted-session shape and adds what it lacks: a Hermes-faithful compaction
algorithm with live formulas and knobs, head/summary/tail zones, per-call cache
accounting, a cumulative "sent so far" counter, and a place-your-bets recall
check. Product UIs (Claude Code `/context`, Cursor's context ring, Cline's bar,
Roo's tri-segment bar, Hermes's own `/context` grid) show *how full* a window
is; none explains *what compaction does*.

## Sources

- NousResearch/hermes-agent at `7520c4e8b3791f081b2c26d5ea9a0c07b0363401`
  (2026-10-15); docs at hermes-agent.nousresearch.com (Context Compression and
  Caching, Prompt Assembly, Persistent Memory, CLI Interface, "My Agent Feels
  Dumber").
- Kelly Hong, Anton Troynikov, Jeff Huber (2025), *Context Rot: How Increasing
  Input Tokens Impacts LLM Performance*, Chroma technical report.
- Shiyang Chen (2026), *Governance Decay: How Context Compaction Silently
  Erases Safety Constraints in Long-Horizon LLM Agents*, arXiv:2606.22528.
