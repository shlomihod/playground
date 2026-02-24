/**
 * parser-highlight.js — Syntax-colors Thought/Action/Observation/Final Answer text.
 */

let llmOutputEl;

export function initParserHighlight() {
  llmOutputEl = document.getElementById('llm-output');
}

export function renderLLMOutput(text) {
  if (!llmOutputEl) return;
  llmOutputEl.innerHTML = highlightText(text);
}

export function clearLLMOutput() {
  if (!llmOutputEl) return;
  llmOutputEl.innerHTML = '';
}

/**
 * Stream text char-by-char into the LLM output panel.
 * Returns the interval ID so it can be cancelled.
 */
export function streamLLMOutput(text, charsPerSec, onDone) {
  if (!llmOutputEl) return null;
  llmOutputEl.innerHTML = '';

  let idx = 0;
  const interval = 1000 / charsPerSec;

  const timer = setInterval(() => {
    idx++;
    const partial = text.slice(0, idx);
    llmOutputEl.innerHTML = highlightText(partial);
    if (idx >= text.length) {
      clearInterval(timer);
      if (onDone) onDone();
    }
  }, interval);

  return timer;
}

function highlightText(text) {
  return text.split('\n').map(line => {
    if (line.startsWith('Thought:')) {
      return `<span class="hl-thought">${escapeHtml(line)}</span>`;
    }
    if (line.startsWith('Action Input:')) {
      return `<span class="hl-action-input">${escapeHtml(line)}</span>`;
    }
    if (line.startsWith('Action:')) {
      return `<span class="hl-action">${escapeHtml(line)}</span>`;
    }
    if (line.startsWith('Final Answer:')) {
      return `<span class="hl-final">${escapeHtml(line)}</span>`;
    }
    if (line.startsWith('Observation:')) {
      return `<span class="hl-observation">${escapeHtml(line)}</span>`;
    }
    return escapeHtml(line);
  }).join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
