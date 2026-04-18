const KEY = 'playground-theme';
const ALLOWED = ['light', 'dark'];

function validate(value) {
  return ALLOWED.includes(value) ? value : null;
}

function systemPreference() {
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function getTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  return validate(attr) || 'dark';
}

function applyTheme(theme) {
  const next = validate(theme) || 'dark';
  if (document.documentElement.getAttribute('data-theme') === next) return next;
  document.documentElement.setAttribute('data-theme', next);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  return next;
}

export function setTheme(theme) {
  const next = applyTheme(theme);
  try { localStorage.setItem(KEY, next); } catch {}
  return next;
}

export function toggleTheme() {
  return setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

function makeButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle color theme');
  return btn;
}

function render(btn) {
  const t = getTheme();
  btn.textContent = t === 'light' ? '\u{1F319}' : '\u2600\uFE0F';
  btn.title = t === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  btn.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
}

export function initTheme(mountEl) {
  const btn = makeButton();
  render(btn);

  btn.addEventListener('click', () => {
    toggleTheme();
    render(btn);
  });

  addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const val = validate(e.newValue);
    if (val) {
      applyTheme(val);
      render(btn);
    }
  });

  addEventListener('pageshow', () => {
    let stored = null;
    try { stored = localStorage.getItem(KEY); } catch {}
    applyTheme(validate(stored) || systemPreference());
    render(btn);
  });

  try {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      let stored = null;
      try { stored = localStorage.getItem(KEY); } catch {}
      if (!validate(stored)) {
        applyTheme(systemPreference());
        render(btn);
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
  } catch {}

  if (mountEl) mountEl.appendChild(btn);
  return btn;
}
