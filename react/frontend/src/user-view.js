/**
 * user-view.js — Shows what the end user actually sees: their message + final answer.
 */

import { USER_QUERY } from './scenario.js';

let viewEl;

export function initUserView() {
  viewEl = document.getElementById('user-view');
}

/** Show the user's original message + thinking indicator */
export function showUserMessage() {
  if (!viewEl) return;
  const bubble = document.createElement('div');
  bubble.className = 'uv-bubble uv-user';
  bubble.textContent = USER_QUERY;
  viewEl.appendChild(bubble);

  showThinking();
}

/** Show the assistant's final answer (replaces thinking indicator) */
export function showAssistantMessage(text) {
  if (!viewEl) return;
  removeThinking();

  const bubble = document.createElement('div');
  bubble.className = 'uv-bubble uv-assistant';
  bubble.textContent = text;
  viewEl.appendChild(bubble);
}

/** Reset to empty */
export function clearUserView() {
  if (viewEl) viewEl.innerHTML = '';
}

// ─── Internal ────────────────────────────────────────────────────

function showThinking() {
  if (viewEl.querySelector('.uv-thinking')) return;
  const el = document.createElement('div');
  el.className = 'uv-thinking';
  el.innerHTML = '<span class="uv-dot"></span><span class="uv-dot"></span><span class="uv-dot"></span>';
  viewEl.appendChild(el);
}

function removeThinking() {
  const el = viewEl?.querySelector('.uv-thinking');
  if (el) el.remove();
}
