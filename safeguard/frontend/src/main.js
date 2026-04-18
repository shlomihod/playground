/**
 * main.js — Entry point: wires mode toggle and delegates to modules.
 */

import './styles.css';
import { initTranscript } from './transcript.js';
import { initUserView } from './user-view.js';
import { resetPipeline } from './pipeline.js';
import { getScenarios } from './scenario.js';
import { setScenario, next, prev, reset, toggleAutoplay } from './animator.js';
import { initPlayMode } from './safeguard-api.js';
import { initTheme } from '../../../_shared/theme.js';

let currentMode = 'walkthrough';

function init() {
  initTranscript();
  initUserView();
  wireModeToggle();
  wireWalkthroughControls();
  wireKeyboard();
  renderScenarioChips();
  updateModeVisibility();
  initPlayMode();

  const headerRight = document.querySelector('.header-right');
  if (headerRight) initTheme(headerRight);
}

function wireModeToggle() {
  const btns = document.querySelectorAll('#mode-toggle .toggle-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      updateModeVisibility();
      resetPipeline();
    });
  });
}

function wireWalkthroughControls() {
  document.getElementById('btn-prev').addEventListener('click', prev);
  document.getElementById('btn-next').addEventListener('click', next);
  document.getElementById('btn-auto').addEventListener('click', toggleAutoplay);
  document.getElementById('btn-reset').addEventListener('click', reset);
}

function wireKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (currentMode !== 'walkthrough') return;

    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); next(); break;
      case 'ArrowLeft':  e.preventDefault(); prev(); break;
      case ' ':          e.preventDefault(); toggleAutoplay(); break;
      case 'r': case 'R':
        if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); reset(); }
        break;
    }
  });
}

function renderScenarioChips() {
  const container = document.getElementById('scenario-selector');
  const descEl = document.getElementById('scenario-description');
  if (!container) return;

  const scenarios = getScenarios();
  container.innerHTML = '';

  scenarios.forEach((scenario) => {
    const chip = document.createElement('button');
    chip.className = `scenario-chip ${scenario.tag}`;
    chip.textContent = scenario.title;
    chip.addEventListener('click', () => {
      container.querySelectorAll('.scenario-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      descEl.textContent = scenario.description;
      setScenario(scenario);
    });
    container.appendChild(chip);
  });

  if (scenarios.length > 0) {
    container.querySelector('.scenario-chip')?.click();
  }
}

function updateModeVisibility() {
  const isWalkthrough = currentMode === 'walkthrough';

  document.getElementById('walkthrough-controls').classList.toggle('hidden', !isWalkthrough);
  document.getElementById('walkthrough-left').classList.toggle('hidden', !isWalkthrough);
  document.getElementById('play-left').classList.toggle('hidden', isWalkthrough);
  document.getElementById('api-config').classList.toggle('hidden', isWalkthrough);
}

document.addEventListener('DOMContentLoaded', init);
