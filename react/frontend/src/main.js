/**
 * main.js — Entry: wires buttons, keyboard, inits modules.
 */

import './styles.css';
import { initTranscript } from './transcript.js';
import { initParserHighlight } from './parser-highlight.js';
import { init, next, prev, reset, toggleAutoplay } from './animator.js';

document.addEventListener('DOMContentLoaded', () => {
  initTranscript();
  initParserHighlight();
  init();

  // Button handlers
  document.getElementById('btn-next').addEventListener('click', next);
  document.getElementById('btn-prev').addEventListener('click', prev);
  document.getElementById('btn-reset').addEventListener('click', reset);
  document.getElementById('btn-auto').addEventListener('click', toggleAutoplay);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prev();
        break;
      case ' ':
        e.preventDefault();
        toggleAutoplay();
        break;
      case 'r':
      case 'R':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          reset();
        }
        break;
    }
  });
});
