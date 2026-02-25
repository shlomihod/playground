/**
 * animator.js — Step engine: manages current step, streaming, autoplay.
 */

import { STEPS } from './scenario.js';
import { showArrows, highlightNodes, highlightTool, resetDiagram, showToolActivity, clearToolActivity } from './diagram.js';
import { appendTranscript, clearTranscript, streamTranscriptEntry, getLastEntry, highlightAssistantText } from './transcript.js';
import { showUserMessage, showAssistantMessage, clearUserView } from './user-view.js';

let currentStep = -1;
let streamingTimer = null;
let autoplayTimer = null;
let isAutoPlaying = false;

const STREAM_CHARS_PER_SEC = 55;
const AUTOPLAY_DELAY_MS = 1800;

// Find the step index where the user's query first appears (step 0)
// and the step with the final assistant answer (last Assistant without tool_call:)
const FINAL_ANSWER_STEP = (() => {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    const t = STEPS[i].transcript;
    if (t && !Array.isArray(t) && t.role === 'Assistant' && !t.text.includes('tool_call:')) {
      return i;
    }
  }
  return -1;
})();

export function getCurrentStep() { return currentStep; }
export function getTotalSteps() { return STEPS.length; }

export function init() {
  updateUI();
}

export function goToStep(n) {
  cancelStream();
  cancelAutoplay();

  if (n < 0) n = -1;
  if (n >= STEPS.length) n = STEPS.length - 1;

  // Rebuild by replaying from start
  currentStep = -1;
  clearTranscript();
  clearToolActivity();
  clearUserView();
  resetDiagram();

  for (let i = 0; i <= n; i++) {
    currentStep = i;
    const step = STEPS[i];

    resetDiagram();
    showArrows(step.arrows || []);
    highlightNodes(step.highlightNodes || []);
    if (step.highlightTool) highlightTool(step.highlightTool);
    if (step.toolActivity) showToolActivity(step.toolActivity);

    appendStepTranscript(step, i < n);
  }

  // Rebuild user view state for this step
  rebuildUserView(n);

  // Stream only the very last step if it's a stream step
  if (n >= 0) {
    const last = STEPS[n];
    if (last.transcript && !Array.isArray(last.transcript) && last.transcript.stream) {
      // Remove the instant entry we just added and re-stream it
      const lastEntry = getLastEntry();
      if (lastEntry) lastEntry.remove();
      streamIntoTranscript(last.transcript.role, last.transcript.text);
    }
  }

  if (n < 0) {
    currentStep = -1;
    resetDiagram();
    clearToolActivity();
  }

  updateUI();
}

export function next() {
  if (currentStep >= STEPS.length - 1) return;
  cancelStream();

  currentStep++;
  const step = STEPS[currentStep];

  resetDiagram();
  showArrows(step.arrows || []);
  highlightNodes(step.highlightNodes || []);
  if (step.highlightTool) highlightTool(step.highlightTool);
  if (step.toolActivity) showToolActivity(step.toolActivity);

  if (step.transcript) {
    if (Array.isArray(step.transcript)) {
      step.transcript.forEach(t => appendTranscript(t.role, t.text, false));
    } else if (step.transcript.stream) {
      streamIntoTranscript(step.transcript.role, step.transcript.text);
    } else {
      appendTranscript(step.transcript.role, step.transcript.text, false);
    }
  }

  // User view: show user message at step 0, final answer only at last step (delivery)
  if (currentStep === 0) {
    showUserMessage();
  } else if (currentStep === STEPS.length - 1) {
    clearUserView();
    showUserMessage();
    const finalText = STEPS[FINAL_ANSWER_STEP].transcript.text;
    showAssistantMessage(finalText);
  }

  updateUI();
}

export function prev() {
  if (currentStep <= -1) return;
  goToStep(currentStep - 1);
}

export function reset() {
  goToStep(-1);
}

export function toggleAutoplay() {
  if (isAutoPlaying) {
    cancelAutoplay();
  } else {
    isAutoPlaying = true;
    updateUI();
    autoStep();
  }
}

function autoStep() {
  if (!isAutoPlaying) return;
  if (currentStep >= STEPS.length - 1) {
    cancelAutoplay();
    return;
  }
  next();

  const step = STEPS[currentStep];
  const t = step.transcript;
  const delay = (t && !Array.isArray(t) && t.stream)
    ? (t.text.length / STREAM_CHARS_PER_SEC) * 1000 + 600
    : AUTOPLAY_DELAY_MS;

  autoplayTimer = setTimeout(autoStep, delay);
}

function cancelAutoplay() {
  isAutoPlaying = false;
  clearTimeout(autoplayTimer);
  autoplayTimer = null;
  updateUI();
}

function streamIntoTranscript(role, text) {
  cancelStream();
  streamingTimer = streamTranscriptEntry(role, text, STREAM_CHARS_PER_SEC, () => {
    streamingTimer = null;
  });
}

function cancelStream() {
  if (streamingTimer !== null) {
    clearInterval(streamingTimer);
    streamingTimer = null;
    // Complete the last streaming entry instantly
    const step = currentStep >= 0 ? STEPS[currentStep] : null;
    const t = step?.transcript;
    if (t && !Array.isArray(t) && t.stream) {
      const lastEntry = getLastEntry();
      if (lastEntry) {
        const textEl = lastEntry.querySelector('.transcript-text');
        if (textEl) {
          textEl.innerHTML = highlightAssistantText(t.text);
        }
      }
    }
  }
}

/**
 * Append transcript entries for a step during replay.
 */
function appendStepTranscript(step, dim) {
  if (!step.transcript) return;
  if (Array.isArray(step.transcript)) {
    step.transcript.forEach(t => appendTranscript(t.role, t.text, dim));
  } else {
    appendTranscript(step.transcript.role, step.transcript.text, dim);
  }
}

/**
 * Rebuild user view state for a given step index (used during goToStep replay).
 */
function rebuildUserView(stepIdx) {
  clearUserView();
  if (stepIdx < 0) return;

  // Once past step 0, user message is always visible
  showUserMessage();

  if (stepIdx >= STEPS.length - 1) {
    const finalText = STEPS[FINAL_ANSWER_STEP].transcript.text;
    showAssistantMessage(finalText);
  }
}

function updateUI() {
  const counter = document.getElementById('step-counter');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnAuto = document.getElementById('btn-auto');

  counter.textContent = `Step ${currentStep + 1}/${STEPS.length}`;
  btnPrev.disabled = currentStep <= -1;
  btnNext.disabled = currentStep >= STEPS.length - 1;
  btnAuto.textContent = isAutoPlaying ? 'Pause' : 'Auto-play';
  btnAuto.classList.toggle('active', isAutoPlaying);
}
