/**
 * scenario.js — Pure data: tool definitions and the 17-step ReAct walkthrough.
 *
 * Each step has:
 *   type        — 'user' | 'orch-to-llm' | 'llm-generate' | 'orch-parse' |
 *                 'orch-call-tool' | 'tool-return' | 'observation' | 'final-answer' | 'deliver'
 *   label       — short description shown in step counter
 *   arrows      — array of SVG arrow IDs to animate this step
 *   highlightNodes — node class suffixes to glow
 *   highlightTool  — tool id to highlight (e.g. 'calculator')
 *   llmText     — text for LLM output panel (streamed char-by-char for 'llm-generate')
 *   transcript  — { role, text } to append to the conversation log
 *   insight     — educational callout text
 */

export const TOOLS = [
  { id: 'calculator', icon: '\u{1F522}', desc: 'Arithmetic evaluation' },
  { id: 'search',     icon: '\u{1F50D}', desc: 'Web search' },
  { id: 'rag',        icon: '\u{1F4DA}', desc: 'Retrieve context from knowledge base' },
  { id: 'send_email', icon: '\u{1F4E7}', desc: 'Send an email' },
];

export const USER_QUERY =
  'I had dinner in NYC. The bill was $85. What\'s 20% tip? Also, search for the best dessert spot nearby and email me a summary at alice@example.com.';

export const STEPS = [
  // ── Loop 1: Calculator ─────────────────────────────────────────
  {
    type: 'user',
    label: 'User sends query',
    arrows: ['arrow-user-orch'],
    highlightNodes: ['user', 'orch'],
    transcript: { role: 'User', text: USER_QUERY },
    insight: 'The user\'s message is sent to the **orchestrator**, which manages the ReAct loop. The orchestrator will repeatedly call the LLM and tools until it has a final answer.',
  },
  {
    type: 'orch-to-llm',
    label: 'Orchestrator → LLM',
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
    insight: 'The orchestrator forwards the user\'s message to the LLM along with a system prompt describing available tools and the Thought/Action/Observation format.',
  },
  {
    type: 'llm-generate',
    label: 'LLM reasons + picks tool',
    arrows: [],
    highlightNodes: ['llm'],
    llmText:
`Thought: The user wants a 20% tip on $85. I should calculate that first.
Action: calculator
Action Input: 85 * 0.20`,
    transcript: {
      role: 'LLM',
      text: 'Thought: The user wants a 20% tip on $85. I should calculate that first.\nAction: calculator\nAction Input: 85 * 0.20',
    },
    insight: 'The LLM **generates text** — it\'s just predicting tokens. But notice the structured format: `Thought:`, `Action:`, `Action Input:`. These are plain text patterns the orchestrator knows how to parse.',
  },
  {
    type: 'orch-parse',
    label: 'Orchestrator parses action',
    arrows: ['arrow-llm-orch'],
    highlightNodes: ['orch'],
    highlightTool: 'calculator',
    insight: 'Generation is **stopped** when the orchestrator detects the `Action:` pattern. The LLM doesn\'t "call" anything — the orchestrator extracts the tool name and input from the text.',
  },
  {
    type: 'orch-call-tool',
    label: 'Call calculator',
    arrows: ['arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'calculator',
    transcript: { role: 'Tool: calculator', text: 'Input: 85 * 0.20' },
    insight: 'The orchestrator executes `calculator("85 * 0.20")` — a real function call in code, not an LLM operation.',
  },
  {
    type: 'tool-return',
    label: 'Calculator returns 17.0',
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'calculator',
    transcript: { role: 'Tool: calculator', text: 'Output: 17.0' },
    insight: 'The tool runs actual code and returns a concrete result. This is the "Acting" in ReAct — grounding the LLM in real computation.',
  },
  {
    type: 'observation',
    label: 'Observation injected',
    arrows: [],
    highlightNodes: ['orch'],
    transcript: { role: 'Observation', text: '17.0' },
    insight: 'The orchestrator injects the result as an `Observation:` line into the conversation. The LLM will see this on its next turn, closing the loop.',
  },

  // ── Loop 2: Search ─────────────────────────────────────────────
  {
    type: 'orch-to-llm',
    label: 'Orchestrator → LLM (loop 2)',
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
    insight: 'The orchestrator sends the **entire** conversation so far (including the observation) back to the LLM for another reasoning step.',
  },
  {
    type: 'llm-generate',
    label: 'LLM reasons → search',
    arrows: [],
    highlightNodes: ['llm'],
    llmText:
`Thought: Good, 20% tip on $85 is $17.00. Now I need to find the best dessert spot near NYC.
Action: search
Action Input: best dessert spot NYC`,
    transcript: {
      role: 'LLM',
      text: 'Thought: Good, 20% tip on $85 is $17.00. Now I need to find the best dessert spot near NYC.\nAction: search\nAction Input: best dessert spot NYC',
    },
    insight: 'The LLM reads the observation, updates its reasoning, and picks the next tool. Each loop follows the same Thought → Action → Observation cycle.',
  },
  {
    type: 'orch-parse',
    label: 'Parse → call search',
    arrows: ['arrow-llm-orch', 'arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'search',
    transcript: { role: 'Tool: search', text: 'Input: best dessert spot NYC' },
    insight: 'Same parsing logic — the orchestrator detects `Action: search` and routes accordingly.',
  },
  {
    type: 'tool-return',
    label: 'Search returns result',
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'search',
    transcript: { role: 'Tool: search', text: 'Output: Levain Bakery — famous for gooey chocolate chip cookies, 167 W 74th St, NYC.' },
    insight: 'The search tool returns real-world information the LLM couldn\'t have generated reliably on its own.',
  },

  // ── Loop 3: RAG ────────────────────────────────────────────────
  {
    type: 'orch-to-llm',
    label: 'Orchestrator → LLM (loop 3)',
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
    insight: 'With the search result added as an observation, the orchestrator loops back to the LLM again.',
  },
  {
    type: 'llm-generate',
    label: 'LLM reasons → rag',
    arrows: [],
    highlightNodes: ['llm'],
    llmText:
`Thought: Before emailing, let me retrieve some tipping etiquette context to include a helpful note.
Action: rag
Action Input: tipping etiquette NYC restaurants`,
    transcript: {
      role: 'LLM',
      text: 'Thought: Before emailing, let me retrieve some tipping etiquette context to include a helpful note.\nAction: rag\nAction Input: tipping etiquette NYC restaurants',
    },
    insight: 'RAG (Retrieval-Augmented Generation) is just another tool! The LLM decides it needs more context from a knowledge base before composing the email.',
  },
  {
    type: 'orch-parse',
    label: 'Parse → call rag',
    arrows: ['arrow-llm-orch', 'arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'rag',
    transcript: { role: 'Tool: rag', text: 'Input: tipping etiquette NYC restaurants' },
    insight: 'The orchestrator detects `Action: rag` and calls the retrieval tool, which embeds the query and searches a vector store — just like the RAG Playground demo!',
  },
  {
    type: 'tool-return',
    label: 'RAG returns context',
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'rag',
    transcript: {
      role: 'Tool: rag',
      text: 'Output: "In NYC, 18–20% is standard for sit-down dining. For exceptional service, 22–25% is common. Tax (8.875%) is not included in the tip base."',
    },
    insight: 'The RAG tool retrieves relevant chunks from a knowledge base. This grounds the LLM\'s response in factual, sourced information rather than relying on parametric memory.',
  },

  // ── Loop 4: send_email ─────────────────────────────────────────
  {
    type: 'orch-to-llm',
    label: 'Orchestrator → LLM (loop 4)',
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
    insight: 'Now the LLM has all the pieces: the tip calculation, the dessert spot, and tipping etiquette. Time to compose the email.',
  },
  {
    type: 'llm-generate',
    label: 'LLM reasons → send_email',
    arrows: [],
    highlightNodes: ['llm'],
    llmText:
`Thought: I have the tip ($17), dessert recommendation (Levain Bakery), and tipping context. Time to send the summary email.
Action: send_email
Action Input: {"to": "alice@example.com", "subject": "NYC Dinner Summary", "body": "Hi Alice! Here's your dinner summary:\\n\\n• 20% tip on $85 = $17.00 (18-20% is standard in NYC)\\n• Best dessert spot: Levain Bakery, 167 W 74th St — famous for gooey chocolate chip cookies\\n\\nEnjoy!"}`,
    transcript: {
      role: 'LLM',
      text: 'Thought: I have the tip ($17), dessert recommendation (Levain Bakery), and tipping context. Time to send the summary email.\nAction: send_email\nAction Input: {"to": "alice@example.com", "subject": "NYC Dinner Summary", "body": "..."}',
    },
    insight: 'The LLM composes a structured JSON payload. Again — this is just generated text. The orchestrator will parse it and make the real API call.',
  },
  {
    type: 'orch-parse',
    label: 'Parse → call send_email',
    arrows: ['arrow-llm-orch', 'arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'send_email',
    transcript: { role: 'Tool: send_email', text: 'Input: {to: "alice@example.com", subject: "NYC Dinner Summary", ...}' },
    insight: 'This tool has a **side effect** — it actually sends an email. The orchestrator must be careful about which tools can modify external state.',
  },
  {
    type: 'tool-return',
    label: 'Email sent',
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'send_email',
    transcript: { role: 'Tool: send_email', text: 'Output: Email sent successfully to alice@example.com' },
    insight: 'Side-effect tools (email, database writes, API calls) are where agent safety matters most. Many systems require user confirmation before executing these.',
  },

  // ── Final Answer ───────────────────────────────────────────────
  {
    type: 'llm-generate',
    label: 'LLM gives final answer',
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['llm'],
    llmText:
`Thought: All tasks are done. Let me summarize for the user.
Final Answer: Your 20% tip on $85 is **$17.00** (right in the standard NYC range of 18–20%). The best dessert spot nearby is **Levain Bakery** at 167 W 74th St, famous for their gooey chocolate chip cookies. I've emailed a summary to alice@example.com!`,
    transcript: {
      role: 'LLM',
      text: 'Final Answer: Your 20% tip on $85 is **$17.00** (right in the standard NYC range of 18–20%). The best dessert spot nearby is **Levain Bakery** at 167 W 74th St, famous for their gooey chocolate chip cookies. I\'ve emailed a summary to alice@example.com!',
    },
    insight: 'When the LLM outputs `Final Answer:` instead of `Action:`, the orchestrator knows the loop is done. No more tool calls needed.',
  },
  {
    type: 'deliver',
    label: 'Deliver to user',
    arrows: ['arrow-llm-orch', 'arrow-orch-user'],
    highlightNodes: ['orch', 'user'],
    transcript: {
      role: 'Assistant',
      text: 'Your 20% tip on $85 is **$17.00** (right in the standard NYC range of 18–20%). The best dessert spot nearby is **Levain Bakery** at 167 W 74th St, famous for their gooey chocolate chip cookies. I\'ve emailed a summary to alice@example.com!',
    },
    insight: 'The orchestrator strips the `Final Answer:` prefix and delivers the clean response to the user. The ReAct loop used **4 iterations** with 4 different tools to answer one question.',
  },
];
