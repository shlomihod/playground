/**
 * transcript.js — Chat transcript log with streaming + highlight of new entries.
 *
 * Only 4 roles: System, User, Assistant, Tool
 */

const ROLE_COLORS = {
  'System':    '#e8e8ff',
  'User':      '#66bbff',
  'Assistant': '#ffd700',
  'Tool':      '#ff6b6b',
};

let transcriptEl;

export function initTranscript() {
  transcriptEl = document.getElementById('transcript');
}

/**
 * Append a complete transcript entry (or array of entries for the first step).
 * @param {boolean} dim — if true, entry appears without highlight (replaying old steps)
 */
export function appendTranscript(role, text, dim) {
  if (!transcriptEl) return;

  // Dim all previous entries
  if (!dim) {
    transcriptEl.querySelectorAll('.transcript-entry').forEach(e => {
      e.classList.remove('new');
    });
  }

  const entry = createEntry(role);
  const textSpan = entry.querySelector('.transcript-text');

  if (role === 'Assistant') {
    textSpan.innerHTML = highlightAssistantText(text);
  } else if (role === 'Tool') {
    textSpan.innerHTML = `<span class="hl-json">${esc(text)}</span>`;
  } else {
    textSpan.textContent = text;
  }

  if (!dim) entry.classList.add('new');
  transcriptEl.appendChild(entry);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
  return entry;
}

/**
 * Stream a transcript entry char-by-char. Returns interval ID.
 */
export function streamTranscriptEntry(role, text, charsPerSec, onDone) {
  if (!transcriptEl) return null;

  // Dim all previous entries
  transcriptEl.querySelectorAll('.transcript-entry').forEach(e => {
    e.classList.remove('new');
  });

  const entry = createEntry(role);
  entry.classList.add('new');
  const textSpan = entry.querySelector('.transcript-text');
  transcriptEl.appendChild(entry);

  let idx = 0;
  const interval = 1000 / charsPerSec;

  const timer = setInterval(() => {
    idx++;
    const partial = text.slice(0, idx);
    textSpan.innerHTML = highlightAssistantText(partial);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;

    if (idx >= text.length) {
      clearInterval(timer);
      if (onDone) onDone();
    }
  }, interval);

  return timer;
}

export function getLastEntry() {
  if (!transcriptEl) return null;
  return transcriptEl.querySelector('.transcript-entry:last-child');
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
  roleSpan.textContent = `[${role}]`;

  const textSpan = document.createElement('span');
  textSpan.className = 'transcript-text';

  entry.appendChild(roleSpan);
  entry.appendChild(textSpan);
  return entry;
}

/**
 * Syntax-highlight Assistant text:
 * - Lines starting with thinking: get .hl-thinking
 * - Lines from tool_call: onward get .hl-tool-call
 * - Everything else is plain text
 */
export function highlightAssistantText(text) {
  const lines = text.split('\n');
  let inToolCall = false;
  return lines.map(line => {
    if (line.startsWith('tool_call:')) inToolCall = true;
    if (inToolCall) return `<span class="hl-tool-call">${esc(line)}</span>`;
    if (line.startsWith('thinking:')) return `<span class="hl-thinking">${esc(line)}</span>`;
    return esc(line);
  }).join('\n');
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
