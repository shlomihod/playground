/**
 * user-view.js — Shows what the end user actually sees:
 * their message → thinking indicator → response (or blocked notice).
 */

let viewEl;

export function initUserView() {
  viewEl = document.getElementById('user-view');
}

export function showUserMessage(text) {
  if (!viewEl) return;
  const bubble = document.createElement('div');
  bubble.className = 'uv-bubble uv-user';
  bubble.textContent = text;
  viewEl.appendChild(bubble);
  showThinking();
  viewEl.scrollTop = viewEl.scrollHeight;
}

export function showAssistantMessage(text) {
  if (!viewEl) return;
  removeThinking();
  const bubble = document.createElement('div');
  bubble.className = 'uv-bubble uv-assistant';
  bubble.textContent = text;
  viewEl.appendChild(bubble);
  viewEl.scrollTop = viewEl.scrollHeight;
}

export function showBlockedMessage(categories) {
  if (!viewEl) return;
  removeThinking();
  const bubble = document.createElement('div');
  bubble.className = 'uv-bubble uv-blocked';
  bubble.textContent = categories?.length
    ? `Request blocked by safety filter (${categories.join(', ')})`
    : 'Request blocked by safety filter';
  viewEl.appendChild(bubble);
  viewEl.scrollTop = viewEl.scrollHeight;
}

export function showStreamingMessage() {
  if (!viewEl) return;
  removeThinking();
  const bubble = document.createElement('div');
  bubble.className = 'uv-bubble uv-assistant';
  bubble.id = 'uv-streaming';
  viewEl.appendChild(bubble);
  viewEl.scrollTop = viewEl.scrollHeight;
}

export function appendStreamToken(token) {
  const bubble = document.getElementById('uv-streaming');
  if (bubble) {
    bubble.textContent += token;
    viewEl.scrollTop = viewEl.scrollHeight;
  }
}

export function clearUserView() {
  if (viewEl) viewEl.innerHTML = '';
}

// ─── Internal ────────────────────────────────────────────────────

function showThinking() {
  if (!viewEl || viewEl.querySelector('.uv-thinking')) return;
  const el = document.createElement('div');
  el.className = 'uv-thinking';
  el.innerHTML = '<span class="uv-dot"></span><span class="uv-dot"></span><span class="uv-dot"></span>';
  viewEl.appendChild(el);
}

function removeThinking() {
  const el = viewEl?.querySelector('.uv-thinking');
  if (el) el.remove();
}
