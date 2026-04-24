/**
 * animator.js — Step engine for walkthrough mode: manages current step, streaming, autoplay.
 */

import { resetPipeline, animateStage } from './pipeline.js';
import { appendTranscript, clearTranscript } from './transcript.js';
import { showUserMessage, showAssistantMessage, showBlockedMessage, clearUserView } from './user-view.js';

let currentScenario = null;
let currentStep = -1;
let streamingTimer = null;
let autoplayTimer = null;
let isAutoPlaying = false;

const AUTOPLAY_DELAY_MS = 2000;

function getTotalSteps() { return currentScenario ? currentScenario.steps.length : 0; }

/**
 * Set active scenario and reset to step -1.
 */
export function setScenario(scenario) {
  cancelStream();
  cancelAutoplay();
  currentScenario = scenario;
  currentStep = -1;
  clearTranscript();
  clearUserView();
  resetPipeline();
  updateUI();
}

/**
 * Jump to a specific step by replaying from the start.
 */
function goToStep(n) {
  if (!currentScenario) return;
  cancelStream();
  cancelAutoplay();

  const steps = currentScenario.steps;
  if (n < 0) n = -1;
  if (n >= steps.length) n = steps.length - 1;

  // Rebuild by replaying from start
  currentStep = -1;
  clearTranscript();
  clearUserView();
  resetPipeline();

  for (let i = 0; i <= n; i++) {
    currentStep = i;
    const step = steps[i];

    applyPipelineStage(step);

    appendStepTranscript(step, i < n);
  }

  rebuildUserView(n);

  if (n < 0) {
    currentStep = -1;
    resetPipeline();
  }

  updateUI();
}

export function next() {
  if (!currentScenario) return;
  if (currentStep >= currentScenario.steps.length - 1) return;
  cancelStream();

  currentStep++;
  const step = currentScenario.steps[currentStep];

  resetPipeline();
  for (let i = 0; i <= currentStep; i++) {
    applyPipelineStage(currentScenario.steps[i]);
  }

  appendStepTranscript(step, false);

  // Update user view at key moments
  applyUserViewStep(step);

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
  if (!isAutoPlaying || !currentScenario) return;
  if (currentStep >= currentScenario.steps.length - 1) {
    cancelAutoplay();
    return;
  }
  next();
  autoplayTimer = setTimeout(autoStep, AUTOPLAY_DELAY_MS);
}

function cancelAutoplay() {
  isAutoPlaying = false;
  clearTimeout(autoplayTimer);
  autoplayTimer = null;
  updateUI();
}

function cancelStream() {
  if (streamingTimer !== null) {
    clearInterval(streamingTimer);
    streamingTimer = null;
  }
}

// ─── Pipeline + User View helpers ─────────────────────────────────

/**
 * Append transcript entries for a step. Handles single entry or array (system + user).
 */
function appendStepTranscript(step, dim) {
  if (!step.transcript) return;
  if (Array.isArray(step.transcript)) {
    step.transcript.forEach(t => appendTranscript(t.role, t.text, dim));
  } else {
    appendTranscript(step.transcript.role, step.transcript.text, dim);
  }
}

function applyPipelineStage(step) {
  if (!step.stage) return;
  if (step.stage === 'blocked') {
    animateStage('blocked', { categories: step.categories });
  } else {
    animateStage(step.stage);
  }
}

/**
 * Update user view during next() -- show user message at input stage,
 * assistant response at output stage, blocked notice at blocked stage.
 */
function applyUserViewStep(step) {
  if (step.stage === 'input' && currentScenario) {
    showUserMessage(currentScenario.input);
  } else if (step.stage === 'output' && currentScenario?.llmResponse) {
    showAssistantMessage(currentScenario.llmResponse);
  } else if (step.stage === 'blocked') {
    showBlockedMessage(step.categories);
  }
}

/**
 * Rebuild user view state for a given step index (used during goToStep replay).
 */
function rebuildUserView(stepIdx) {
  clearUserView();
  if (stepIdx < 0 || !currentScenario) return;

  for (let i = 0; i <= stepIdx; i++) {
    const step = currentScenario.steps[i];
    if (step.stage === 'input') {
      showUserMessage(currentScenario.input);
    } else if (step.stage === 'output' && currentScenario.llmResponse) {
      showAssistantMessage(currentScenario.llmResponse);
    } else if (step.stage === 'blocked') {
      showBlockedMessage(step.categories);
    }
  }
}

function updateUI() {
  const counter = document.getElementById('step-counter');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnAuto = document.getElementById('btn-auto');

  const total = getTotalSteps();
  counter.textContent = total > 0 ? `Step ${currentStep + 1}/${total}` : 'Step 0/0';
  btnPrev.disabled = currentStep <= -1;
  btnNext.disabled = !currentScenario || currentStep >= total - 1;
  btnAuto.textContent = isAutoPlaying ? 'Pause' : 'Auto-play';
  btnAuto.classList.toggle('active', isAutoPlaying);
  btnAuto.disabled = !currentScenario;
}
