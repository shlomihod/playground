/**
 * diagram.js — SVG arrow animations, node/tool highlighting, tool activity text.
 */

const ARROW_IDS = [
  'arrow-user-orch', 'arrow-orch-user',
  'arrow-orch-llm', 'arrow-llm-orch',
  'arrow-orch-tools', 'arrow-tools-orch',
];

const NODE_CLASSES = ['user', 'orch', 'llm', 'tools'];

const TOOL_IDS = ['tool-calculator', 'tool-search', 'tool-rag', 'tool-send_email'];

const TA_LINE_IDS = ['ta-line-1', 'ta-line-2', 'ta-line-3', 'ta-line-4'];

export function resetDiagram() {
  for (const id of ARROW_IDS) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.style.strokeDashoffset = el.getTotalLength?.() || 200;
    }
  }

  for (const cls of NODE_CLASSES) {
    const nodes = document.querySelectorAll(`.node-${cls}`);
    nodes.forEach(n => n.classList.remove('glow'));
  }

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

/**
 * Show tool activity text lines next to the tools box.
 * lines: array of up to 4 { text, className? } objects.
 */
export function showToolActivity(lines) {
  for (let i = 0; i < TA_LINE_IDS.length; i++) {
    const el = document.getElementById(TA_LINE_IDS[i]);
    if (!el) continue;
    if (lines && lines[i]) {
      el.textContent = lines[i].text;
      el.setAttribute('class', 'tool-activity-line ' + (lines[i].className || ''));
    } else {
      el.textContent = '';
      el.setAttribute('class', 'tool-activity-line');
    }
  }
}

export function clearToolActivity() {
  showToolActivity([]);
}
