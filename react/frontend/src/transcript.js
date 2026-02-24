/**
 * transcript.js — Growing conversation log panel.
 */

const ROLE_COLORS = {
  'User':           '#66bbff',
  'LLM':            '#ffd700',
  'Observation':    '#51cf66',
  'Assistant':      '#66bbff',
};

const TOOL_COLOR = '#ff6b6b';

let transcriptEl;

export function initTranscript() {
  transcriptEl = document.getElementById('transcript');
}

export function appendTranscript(role, text) {
  if (!transcriptEl) return;

  const entry = document.createElement('div');
  entry.className = 'transcript-entry';

  const roleSpan = document.createElement('span');
  roleSpan.className = 'transcript-role';
  const color = role.startsWith('Tool:') ? TOOL_COLOR : (ROLE_COLORS[role] || '#8888aa');
  roleSpan.style.color = color;
  roleSpan.textContent = `[${role}]`;

  const textSpan = document.createElement('span');
  textSpan.className = 'transcript-text';
  textSpan.textContent = ` ${text}`;

  entry.appendChild(roleSpan);
  entry.appendChild(textSpan);
  transcriptEl.appendChild(entry);

  // Auto-scroll to bottom
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

export function clearTranscript() {
  if (!transcriptEl) return;
  transcriptEl.innerHTML = '';
}
