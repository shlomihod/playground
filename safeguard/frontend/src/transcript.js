/**
 * transcript.js — Shows the safeguard model interaction as actual API messages.
 *
 * Roles match real API calls:
 *   system  — system prompt (gpt-oss-safeguard policy)
 *   user    — user message sent to the safeguard model
 *   assistant — safeguard model's response
 */

import { esc } from './utils.js';

const ROLE_COLORS = {
  'system':    '#8888aa',
  'user':      '#66bbff',
  'assistant': '#ff9f43',
};

let transcriptEl;

export function initTranscript() {
  transcriptEl = document.getElementById('transcript');
}

export function appendTranscript(role, text, dim) {
  if (!transcriptEl) return;

  if (!dim) {
    transcriptEl.querySelectorAll('.transcript-entry').forEach(e => {
      e.classList.remove('new');
    });
  }

  const entry = createEntry(role);
  const textSpan = entry.querySelector('.transcript-text');

  if (role === 'assistant') {
    textSpan.innerHTML = highlightSafeguardOutput(text);
  } else {
    textSpan.innerHTML = highlightPromptText(text);
  }

  if (!dim) entry.classList.add('new');
  transcriptEl.appendChild(entry);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

export function clearTranscript() {
  if (!transcriptEl) return;
  transcriptEl.innerHTML = '';
}

// ─── Internal ────────────────────────────────────────────────────

function createEntry(role) {
  const entry = document.createElement('div');
  entry.className = 'transcript-entry';

  const roleSpan = document.createElement('span');
  roleSpan.className = 'transcript-role';
  roleSpan.style.color = ROLE_COLORS[role] || '#8888aa';
  roleSpan.textContent = `${role}: `;

  const textSpan = document.createElement('span');
  textSpan.className = 'transcript-text';

  entry.appendChild(roleSpan);
  entry.appendChild(textSpan);
  return entry;
}

/**
 * Highlight safeguard model output — safe/unsafe verdict + JSON rationale.
 */
function highlightSafeguardOutput(text) {
  try {
    const parsed = JSON.parse(text);
    const pretty = JSON.stringify(parsed, null, 2);
    const isUnsafe = parsed.violation === 1 || parsed.violation === '1';
    const verdictClass = isUnsafe ? 'hl-unsafe' : 'hl-safe';
    return esc(pretty).replace(
      /&quot;violation&quot;: (\d)/,
      `<span class="${verdictClass}">&quot;violation&quot;: $1</span>`
    );
  } catch {
    return esc(text);
  }
}

/**
 * Highlight prompt text — dim markdown headers.
 */
function highlightPromptText(text) {
  const lines = text.split('\n');
  return lines.map(line => {
    if (line.startsWith('###') || line.startsWith('##')) {
      return `<span class="hl-dim">${esc(line)}</span>`;
    }
    return esc(line);
  }).join('\n');
}
