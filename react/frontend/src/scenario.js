/**
 * scenario.js — Pure data: the 28-step ReAct walkthrough.
 *
 * Each step:
 *   arrows         — SVG arrow IDs to animate
 *   highlightNodes — node class suffixes to glow
 *   highlightTool  — tool id to highlight
 *   transcript     — { role, text, stream? } entry to add
 *   toolActivity   — array of { text, className? } for SVG lines next to tools
 *   insight        — (unused, kept for potential tooltip later)
 *
 * Chat Transcript shows only 4 roles: System, User, Assistant, Tool: <name>
 * Orchestration mechanics are visible only via diagram animation.
 */

export const USER_QUERY =
  'I had dinner in NYC. The bill was $85. What\'s 20% tip? Also, search for the best dessert spot nearby and email me a summary at alice@example.com.';

const SYSTEM_PROMPT = `You are a helpful assistant. You have these tools:

- calculator(expression) — evaluate a math expression
- search(query) — search the web
- rag(query) — retrieve context from the user's knowledge base
- send_email(to, subject, body) — send an email

To call a tool, include in your response:
tool_call: { "tool": "<name>", "input": { ... } }`;

export const STEPS = [
  // ── Loop 1: Calculator ─────────────────────────────────────────
  {
    arrows: ['arrow-user-orch'],
    highlightNodes: ['user', 'orch'],
    transcript: [
      { role: 'System', text: SYSTEM_PROMPT },
      { role: 'User', text: USER_QUERY },
    ],
  },
  {
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
  },
  {
    highlightNodes: ['llm'],
    transcript: {
      role: 'Assistant',
      text: 'The user wants a 20% tip on $85. I should calculate that first.\n\ntool_call: { "tool": "calculator", "input": { "expression": "85 * 0.20" } }',
      stream: true,
    },
  },
  {
    arrows: ['arrow-llm-orch'],
    highlightNodes: ['orch'],
    highlightTool: 'calculator',
  },
  {
    arrows: ['arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'calculator',
    toolActivity: [
      { text: '\u{1F522} calculator', className: 'ta-name' },
      { text: 'Input: 85 * 0.20', className: 'ta-input' },
      { text: 'Executing...', className: 'ta-running' },
    ],
  },
  {
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'calculator',
    transcript: { role: 'Tool: calculator', text: '{ "result": "17.0" }' },
    toolActivity: [
      { text: '\u{1F522} calculator', className: 'ta-name' },
      { text: 'Input: 85 * 0.20', className: 'ta-input' },
      { text: 'Output: 17.0', className: 'ta-output' },
      { text: '\u2713 Done', className: 'ta-done' },
    ],
  },
  {
    highlightNodes: ['orch'],
  },

  // ── Loop 2: Search ─────────────────────────────────────────────
  {
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
  },
  {
    highlightNodes: ['llm'],
    transcript: {
      role: 'Assistant',
      text: 'Good, 20% tip on $85 is $17.00. Now I need to find the best dessert spot near NYC.\n\ntool_call: { "tool": "search", "input": { "query": "best dessert spot NYC" } }',
      stream: true,
    },
  },
  {
    arrows: ['arrow-llm-orch'],
    highlightNodes: ['orch'],
    highlightTool: 'search',
  },
  {
    arrows: ['arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'search',
    toolActivity: [
      { text: '\u{1F50D} search', className: 'ta-name' },
      { text: 'Query: best dessert spot NYC', className: 'ta-input' },
      { text: 'Searching...', className: 'ta-running' },
    ],
  },
  {
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'search',
    transcript: { role: 'Tool: search', text: '{ "results": [\n  "Levain Bakery \u2014 famous for gooey chocolate chip cookies, 167 W 74th St",\n  "Magnolia Bakery \u2014 classic banana pudding & cupcakes, 401 Bleecker St",\n  "Veniero\'s \u2014 Italian pastries since 1894, 342 E 11th St"\n] }' },
    toolActivity: [
      { text: '\u{1F50D} search', className: 'ta-name' },
      { text: 'Query: best dessert spot NYC', className: 'ta-input' },
      { text: '3 results returned', className: 'ta-output' },
      { text: '\u2713 Done', className: 'ta-done' },
    ],
  },
  {
    highlightNodes: ['orch'],
  },

  // ── Loop 3: RAG ────────────────────────────────────────────────
  {
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
  },
  {
    highlightNodes: ['llm'],
    transcript: {
      role: 'Assistant',
      text: 'I should check Alice\'s notes for any dining preferences before sending the email.\n\ntool_call: { "tool": "rag", "input": { "query": "Alice dining preferences NYC" } }',
      stream: true,
    },
  },
  {
    arrows: ['arrow-llm-orch'],
    highlightNodes: ['orch'],
    highlightTool: 'rag',
  },
  {
    arrows: ['arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'rag',
    toolActivity: [
      { text: '\u{1F4DA} rag', className: 'ta-name' },
      { text: 'Query: Alice dining preferences', className: 'ta-input' },
      { text: 'Embed \u2192 vector search \u2192 top-k', className: 'ta-desc' },
      { text: 'Retrieving...', className: 'ta-running' },
    ],
  },
  {
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'rag',
    transcript: { role: 'Tool: rag', text: '{ "chunks": [\n  "Alice prefers 20% tip as default. Always tips in cash when possible.",\n  "Alice\'s favorite NYC dessert: chocolate lava cake. Allergic to peanuts."\n] }' },
    toolActivity: [
      { text: '\u{1F4DA} rag', className: 'ta-name' },
      { text: 'Query: Alice dining preferences', className: 'ta-input' },
      { text: '2 chunks retrieved', className: 'ta-output' },
      { text: '\u2713 Done', className: 'ta-done' },
    ],
  },
  {
    highlightNodes: ['orch'],
  },

  // ── Loop 4: send_email ─────────────────────────────────────────
  {
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
  },
  {
    highlightNodes: ['llm'],
    transcript: {
      role: 'Assistant',
      text: 'I have the tip ($17), dessert spots, and Alice\'s preferences from her notes. Time to send the summary email.\n\ntool_call: {\n  "tool": "send_email",\n  "input": {\n    "to": "alice@example.com",\n    "subject": "NYC Dinner Summary",\n    "body": "Hi Alice! Here\'s your dinner summary:\\n\\n\u2022 20% tip on $85 = $17.00 (your usual default)\\n\u2022 Top dessert spots: Levain Bakery (cookies), Magnolia (pudding), Veniero\'s (pastries)\\n\u2022 Heads up: Levain uses peanut butter in some cookies \u2014 check before ordering!\\n\\nEnjoy!"\n  }\n}',
      stream: true,
    },
  },
  {
    arrows: ['arrow-llm-orch'],
    highlightNodes: ['orch'],
    highlightTool: 'send_email',
  },
  {
    arrows: ['arrow-orch-tools'],
    highlightNodes: ['orch', 'tools'],
    highlightTool: 'send_email',
    toolActivity: [
      { text: '\u{1F4E7} send_email', className: 'ta-name' },
      { text: 'To: alice@example.com', className: 'ta-input' },
      { text: 'Subj: NYC Dinner Summary', className: 'ta-input' },
      { text: 'Sending...', className: 'ta-running' },
    ],
  },
  {
    arrows: ['arrow-tools-orch'],
    highlightNodes: ['tools', 'orch'],
    highlightTool: 'send_email',
    transcript: { role: 'Tool: send_email', text: '{ "result": "Email sent successfully to alice@example.com" }' },
    toolActivity: [
      { text: '\u{1F4E7} send_email', className: 'ta-name' },
      { text: 'To: alice@example.com', className: 'ta-input' },
      { text: 'Email sent successfully', className: 'ta-output' },
      { text: '\u2713 Done', className: 'ta-done' },
    ],
  },
  {
    highlightNodes: ['orch'],
  },

  // ── Final Answer ───────────────────────────────────────────────
  {
    arrows: ['arrow-orch-llm'],
    highlightNodes: ['orch', 'llm'],
  },
  {
    arrows: ['arrow-llm-orch'],
    highlightNodes: ['llm'],
    transcript: {
      role: 'Assistant',
      text: 'All done! Your 20% tip on $85 is $17.00. I found 3 great dessert spots and cross-referenced your notes \u2014 flagged a peanut allergy warning for Levain Bakery. Summary emailed to alice@example.com!',
      stream: true,
    },
  },
  {
    arrows: ['arrow-llm-orch', 'arrow-orch-user'],
    highlightNodes: ['orch', 'user'],
  },
];
