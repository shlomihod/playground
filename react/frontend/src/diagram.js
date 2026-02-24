/**
 * diagram.js — SVG arrow animations + node/tool highlighting.
 */

const ARROW_IDS = [
  'arrow-user-orch', 'arrow-orch-llm', 'arrow-llm-orch',
  'arrow-orch-tools', 'arrow-tools-orch', 'arrow-orch-user',
];

const NODE_CLASSES = ['user', 'orch', 'llm', 'tools'];

const TOOL_IDS = ['tool-calculator', 'tool-search', 'tool-rag', 'tool-send_email'];

export function resetDiagram() {
  // Hide all arrows
  for (const id of ARROW_IDS) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.style.strokeDashoffset = el.getTotalLength?.() || 200;
    }
  }

  // Remove highlight from all nodes
  for (const cls of NODE_CLASSES) {
    const nodes = document.querySelectorAll(`.node-${cls}`);
    nodes.forEach(n => n.classList.remove('glow'));
  }

  // Remove highlight from tools
  for (const id of TOOL_IDS) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }
}

export function showArrows(ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const len = el.getTotalLength?.() || 200;
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    el.classList.add('active');
    // Trigger reflow then animate
    void el.getBoundingClientRect();
    el.style.strokeDashoffset = '0';
  }
}

export function highlightNodes(nodeSuffixes) {
  for (const suffix of nodeSuffixes) {
    const nodes = document.querySelectorAll(`.node-${suffix}`);
    nodes.forEach(n => n.classList.add('glow'));
  }
}

export function highlightTool(toolId) {
  const el = document.getElementById(`tool-${toolId}`);
  if (el) el.classList.add('active');
}
