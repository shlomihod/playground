/**
 * OpenRouter LLM generation with streaming support.
 * Adapted from rag/frontend/src/generation.js.
 * Shares the same localStorage key so users don't need to re-enter their key.
 */

const STORAGE_KEY = 'openrouter_api_key';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4.1-nano';

const activeControllers = new Set();

export function initGeneration() {
  const keyInput = document.getElementById('api-key-input');
  const clearBtn = document.getElementById('clear-key-btn');
  const hint = document.getElementById('generation-hint');

  // Load saved key
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    keyInput.value = saved;
    hint.classList.add('hidden');
    clearBtn.classList.remove('hidden');
  }

  keyInput.addEventListener('input', () => {
    const key = keyInput.value.trim();
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
      hint.classList.add('hidden');
      clearBtn.classList.remove('hidden');
    } else {
      localStorage.removeItem(STORAGE_KEY);
      hint.classList.remove('hidden');
      clearBtn.classList.add('hidden');
    }
  });

  clearBtn.addEventListener('click', () => {
    keyInput.value = '';
    localStorage.removeItem(STORAGE_KEY);
    hint.classList.remove('hidden');
    clearBtn.classList.add('hidden');
  });
}

/**
 * Stream a chat completion from OpenRouter.
 */
export async function generate(messages, { onToken, onDone, onError }) {
  const apiKey = localStorage.getItem(STORAGE_KEY);
  if (!apiKey) {
    onError?.(new Error('No API key set'));
    return;
  }

  const controller = new AbortController();
  activeControllers.add(controller);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        stream: true,
        temperature: 0,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      const safeBody = body.length > 200 ? body.slice(0, 200) + '...' : body;
      throw new Error(`OpenRouter ${res.status}: ${safeBody}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onToken(content);
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    onDone?.();
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.();
    } else {
      onError?.(err);
    }
  } finally {
    activeControllers.delete(controller);
  }
}

export function abort() {
  for (const c of activeControllers) c.abort();
  activeControllers.clear();
}
