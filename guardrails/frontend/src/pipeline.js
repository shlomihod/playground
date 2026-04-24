/**
 * pipeline.js — SVG flow diagram rendering + animation.
 *
 * Pipeline stages: input → classify → decision → generate → output
 * OR:              input → classify → decision → blocked
 */

const ARROW_IDS = [
  'arrow-input-guardrails',
  'arrow-policy-guardrails',
  'arrow-guardrails-gate',
  'arrow-gate-llm',
  'arrow-llm-output',
  'arrow-gate-blocked',
];

const NODE_CLASSES = ['input', 'guardrails', 'policy', 'llm', 'output'];

export function resetPipeline() {
  // Reset arrows
  for (const id of ARROW_IDS) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.style.strokeDashoffset = el.getTotalLength?.() || 200;
    }
  }

  // Reset nodes
  for (const cls of NODE_CLASSES) {
    const nodes = document.querySelectorAll(`.node-${cls}`);
    nodes.forEach(n => {
      n.classList.remove('glow', 'glow-safe', 'glow-unsafe');
    });
  }

  // Reset decision gate
  const gate = document.getElementById('decision-gate');
  if (gate) {
    gate.classList.remove('glow', 'safe', 'unsafe');
  }
  const gateText = document.getElementById('gate-text');
  if (gateText) gateText.textContent = '?';

  // Reset blocked node
  const blocked = document.querySelector('.node-blocked');
  if (blocked) blocked.classList.remove('visible');
  const blockedLabel = document.querySelector('.blocked-label');
  if (blockedLabel) blockedLabel.classList.remove('visible');

  // Reset verdict labels
  document.getElementById('verdict-safe')?.classList.remove('visible');
  document.getElementById('verdict-unsafe')?.classList.remove('visible');

  // Reset category text
  const catText = document.getElementById('category-text');
  if (catText) {
    catText.textContent = '';
    catText.classList.remove('visible');
  }
}

function showArrow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const len = el.getTotalLength?.() || 200;
  el.style.strokeDasharray = len;
  el.style.strokeDashoffset = len;
  el.classList.add('active');
  void el.getBoundingClientRect();
  el.style.strokeDashoffset = '0';
}

function highlightNode(nodeSuffix, variant) {
  const nodes = document.querySelectorAll(`.node-${nodeSuffix}`);
  const cls = variant === 'safe' ? 'glow-safe' : variant === 'unsafe' ? 'glow-unsafe' : 'glow';
  nodes.forEach(n => n.classList.add(cls));
}

/**
 * Animate the pipeline through a specific stage.
 * Stages: 'input' | 'classify' | 'decision-safe' | 'decision-unsafe' | 'generate' | 'output' | 'blocked'
 */
export function animateStage(stage, data) {
  switch (stage) {
    case 'input':
      highlightNode('input');
      showArrow('arrow-input-guardrails');
      break;

    case 'classify':
      highlightNode('guardrails');
      highlightNode('policy');
      showArrow('arrow-policy-guardrails');
      showArrow('arrow-guardrails-gate');
      break;

    case 'decision-safe': {
      const gate = document.getElementById('decision-gate');
      const gateText = document.getElementById('gate-text');
      if (gate) gate.classList.add('safe');
      if (gateText) gateText.textContent = '\u2713';  // checkmark
      document.getElementById('verdict-safe')?.classList.add('visible');
      break;
    }

    case 'decision-unsafe': {
      const gate = document.getElementById('decision-gate');
      const gateText = document.getElementById('gate-text');
      if (gate) gate.classList.add('unsafe');
      if (gateText) gateText.textContent = '\u2717';  // X mark
      document.getElementById('verdict-unsafe')?.classList.add('visible');
      break;
    }

    case 'generate':
      showArrow('arrow-gate-llm');
      highlightNode('llm');
      break;

    case 'output':
      showArrow('arrow-llm-output');
      highlightNode('output', 'safe');
      break;

    case 'blocked': {
      showArrow('arrow-gate-blocked');
      const blocked = document.querySelector('.node-blocked');
      const blockedLabel = document.querySelector('.blocked-label');
      if (blocked) blocked.classList.add('visible');
      if (blockedLabel) blockedLabel.classList.add('visible');

      // Show category labels if provided
      if (data?.categories) {
        const catText = document.getElementById('category-text');
        if (catText) {
          catText.textContent = data.categories.join(', ');
          catText.classList.add('visible');
        }
      }
      break;
    }
  }
}

