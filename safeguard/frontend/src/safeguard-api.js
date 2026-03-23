/**
 * safeguard-api.js — gpt-oss-safeguard classification via OpenRouter + Play mode wiring.
 */

import { buildSafeguardPrompt, parseResult, renderPolicyViewer, renderPolicySelector } from './policies.js';
import { resetPipeline, animateStage } from './pipeline.js';
import { generate, abort, initGeneration } from './generation.js';
import { showUserMessage, showAssistantMessage, showBlockedMessage, showStreamingMessage, appendStreamToken, clearUserView } from './user-view.js';
import { appendTranscript, clearTranscript } from './transcript.js';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const STORAGE_KEY = 'openrouter_api_key';
const SAFEGUARD_MODEL = 'openai/gpt-oss-safeguard-20b';

let isClassifying = false;

/**
 * Classify content using gpt-oss-safeguard (non-streaming).
 */
async function classify(input, policyKey) {
  const apiKey = localStorage.getItem(STORAGE_KEY);
  if (!apiKey) throw new Error('No API key set');

  const { messages } = buildSafeguardPrompt(input, policyKey);
  const start = performance.now();

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: SAFEGUARD_MODEL,
      messages,
      stream: false,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const safeBody = body.length > 200 ? body.slice(0, 200) + '...' : body;
    throw new Error(`OpenRouter ${res.status}: ${safeBody}`);
  }

  const data = await res.json();
  const rawResponse = data.choices?.[0]?.message?.content || '';
  const latencyMs = Math.round(performance.now() - start);

  const result = parseResult(rawResponse);
  result.latencyMs = latencyMs;
  return result;
}

/**
 * Run the full Play mode pipeline — same transcript view as walkthrough.
 */
async function runPlayPipeline() {
  if (isClassifying) return;
  isClassifying = true;

  const input = document.getElementById('user-input').value.trim();
  const policySelect = document.getElementById('policy-select');
  const policyKey = policySelect?.value || 'content_moderation';
  const shouldGenerate = document.getElementById('chk-generate')?.checked;

  const classifyBtn = document.getElementById('btn-classify');
  classifyBtn.disabled = true;
  classifyBtn.textContent = 'Classifying...';

  clearTranscript();
  clearUserView();
  abort();

  // Step 1: Input
  resetPipeline();
  animateStage('input');
  showUserMessage(input);
  await delay(400);

  // Step 2: Classify — show the prompt in transcript
  animateStage('classify');
  const { messages } = buildSafeguardPrompt(input, policyKey);
  for (const msg of messages) {
    appendTranscript(msg.role, msg.content, false);
  }

  try {
    const result = await classify(input, policyKey);

    // Step 3: Decision — show safeguard response in transcript
    if (result.verdict === 'safe') {
      animateStage('decision-safe');
    } else {
      animateStage('decision-unsafe');
    }
    appendTranscript('assistant', result.rawResponse, false);
    await delay(400);

    if (result.verdict === 'safe' && shouldGenerate) {
      animateStage('generate');
      showStreamingMessage();

      await new Promise((resolve) => {
        generate(
          [{ role: 'user', content: input }],
          {
            onToken(token) { appendStreamToken(token); },
            onDone() { animateStage('output'); resolve(); },
            onError(err) { appendStreamToken(`\n[Error: ${err.message}]`); resolve(); },
          }
        );
      });
    } else if (result.verdict === 'safe') {
      animateStage('generate');
      await delay(200);
      animateStage('output');
      showAssistantMessage('(Generation disabled — content passed safety check)');
    } else {
      animateStage('blocked', { categories: result.categories });
      showBlockedMessage(result.categories);
    }
  } catch (err) {
    appendTranscript('assistant', `Error: ${err.message}`, false);
  } finally {
    isClassifying = false;
    classifyBtn.disabled = false;
    classifyBtn.textContent = 'Classify';
  }
}

// ── Play mode examples ──────────────────────────────────────────

const PLAY_EXAMPLES = [
  { label: 'Synergy talk', text: 'Let\'s leverage our core competencies to drive synergy across verticals and move the needle on our north star metrics.' },
  { label: 'Plain language', text: 'Let\'s use our team\'s strengths to improve collaboration between departments and hit our main goals.' },
  { label: 'Star Wars spoiler', text: 'The big twist in Empire Strikes Back is that Darth Vader is actually Luke\'s father.' },
  { label: 'Passive aggressive', text: 'Per my last email, which you clearly didn\'t read, the deadline was yesterday. Just wanted to make sure you saw it :)' },
  { label: 'Humble brag', text: 'Ugh, my Tesla just got another software update and now it drives itself even better. So annoying having to re-learn the new features on my third EV.' },
];

export function renderPlayExamples() {
  const container = document.getElementById('play-examples');
  if (!container) return;
  container.innerHTML = '';
  PLAY_EXAMPLES.forEach(ex => {
    const chip = document.createElement('button');
    chip.className = 'scenario-chip borderline';
    chip.textContent = ex.label;
    chip.addEventListener('click', () => {
      document.getElementById('user-input').value = ex.text;
      updateClassifyButton();
    });
    container.appendChild(chip);
  });
}

/**
 * Initialize Play mode UI wiring.
 */
export function initPlayMode() {
  initGeneration();
  renderPolicySelector();
  renderPolicyViewer('content_moderation');
  renderPlayExamples();

  document.getElementById('policy-selector-container').addEventListener('change', (e) => {
    if (e.target.id === 'policy-select') {
      renderPolicyViewer(e.target.value);
    }
  });

  document.getElementById('btn-classify').addEventListener('click', () => {
    const input = document.getElementById('user-input').value.trim();
    if (!input) return;
    runPlayPipeline();
  });

  document.getElementById('user-input').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const input = document.getElementById('user-input').value.trim();
      if (input) runPlayPipeline();
    }
  });

  document.getElementById('user-input').addEventListener('input', updateClassifyButton);
  document.getElementById('api-key-input').addEventListener('input', updateClassifyButton);
}

function updateClassifyButton() {
  const hasInput = document.getElementById('user-input').value.trim().length > 0;
  const hasKey = (localStorage.getItem(STORAGE_KEY) || document.getElementById('api-key-input').value.trim()).length > 0;
  document.getElementById('btn-classify').disabled = !hasInput || !hasKey;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
