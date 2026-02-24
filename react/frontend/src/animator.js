/**
 * animator.js — Step engine: manages current step, streaming, autoplay.
 */

import { STEPS } from './scenario.js';
import { showArrows, highlightNodes, highlightTool, resetDiagram } from './diagram.js';
import { appendTranscript, clearTranscript } from './transcript.js';
import { renderLLMOutput, clearLLMOutput, streamLLMOutput } from './parser-highlight.js';

let currentStep = -1;
let streamingTimer = null;
let autoplayTimer = null;
let isAutoPlaying = false;

const STREAM_CHARS_PER_SEC = 55;
const AUTOPLAY_DELAY_MS = 2000;

export function getCurrentStep() { return currentStep; }
export function getTotalSteps() { return STEPS.length; }
export function getIsAutoPlaying() { return isAutoPlaying; }

export function init() {
  updateUI();
}

export function goToStep(n) {
  cancelStream();
  cancelAutoplay();

  if (n < 0) n = -1;
  if (n >= STEPS.length) n = STEPS.length - 1;

  // Rebuild state by replaying from start
  currentStep = -1;
  clearTranscript();
  clearLLMOutput();
  resetDiagram();

  for (let i = 0; i <= n; i++) {
    currentStep = i;
    const step = STEPS[i];

    // Apply diagram state
    resetDiagram();
    showArrows(step.arrows || []);
    highlightNodes(step.highlightNodes || []);
    if (step.highlightTool) highlightTool(step.highlightTool);

    // Append transcript (don't stream — instant replay)
    if (step.transcript) {
      appendTranscript(step.transcript.role, step.transcript.text);
    }

    // Show LLM text instantly for replayed steps (stream only the last)
    if (step.llmText) {
      if (i < n) {
        renderLLMOutput(step.llmText);
      } else {
        // Last step — stream it
        streamLLMText(step.llmText);
      }
    } else if (i === n) {
      clearLLMOutput();
    }
  }

  if (n < 0) {
    currentStep = -1;
    resetDiagram();
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

  if (step.transcript) {
    appendTranscript(step.transcript.role, step.transcript.text);
  }

  if (step.llmText) {
    streamLLMText(step.llmText);
  } else {
    clearLLMOutput();
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
  const delay = step.llmText
    ? (step.llmText.length / STREAM_CHARS_PER_SEC) * 1000 + 800
    : AUTOPLAY_DELAY_MS;

  autoplayTimer = setTimeout(autoStep, delay);
}

function cancelAutoplay() {
  isAutoPlaying = false;
  clearTimeout(autoplayTimer);
  autoplayTimer = null;
  updateUI();
}

function streamLLMText(text) {
  cancelStream();
  streamingTimer = streamLLMOutput(text, STREAM_CHARS_PER_SEC, () => {
    streamingTimer = null;
  });
}

function cancelStream() {
  if (streamingTimer !== null) {
    clearInterval(streamingTimer);
    streamingTimer = null;
    // Show the full text of the current step
    if (currentStep >= 0 && STEPS[currentStep].llmText) {
      renderLLMOutput(STEPS[currentStep].llmText);
    }
  }
}

function updateUI() {
  const counter = document.getElementById('step-counter');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnAuto = document.getElementById('btn-auto');
  const insight = document.getElementById('insight');

  counter.textContent = `Step ${currentStep + 1}/${STEPS.length}`;
  btnPrev.disabled = currentStep <= -1;
  btnNext.disabled = currentStep >= STEPS.length - 1;
  btnAuto.textContent = isAutoPlaying ? 'Pause' : 'Auto-play';
  btnAuto.classList.toggle('active', isAutoPlaying);

  if (currentStep >= 0 && STEPS[currentStep].insight) {
    insight.innerHTML = formatInsight(STEPS[currentStep].insight);
    insight.classList.remove('empty');
  } else {
    insight.innerHTML = '<p class="insight-placeholder">Click <strong>Next</strong> or press <strong>→</strong> to begin the walkthrough.</p>';
    insight.classList.add('empty');
  }
}

function formatInsight(text) {
  // Simple markdown-like bold + code
  const escaped = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  return `<p class="insight-text">\u{1F4A1} ${escaped}</p>`;
}
