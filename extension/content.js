const BATCHMAN_ATTR = 'data-batchman-processed';

const DEFAULTS = {
  urlPattern: '',
  rowSelector: '.alert-row',
  descriptionSelector: '',
};

const ACTION_LABELS = {
  close:    { text: 'Safe to close',              cls: 'batchman-action--close' },
  sql:      { text: 'Run SQL below, then close',  cls: 'batchman-action--sql' },
  escalate: { text: 'Escalate internally',         cls: 'batchman-action--escalate' },
};

async function loadConfig() {
  return chrome.storage.sync.get(DEFAULTS);
}

async function loadKnowledgeBase() {
  const url = chrome.runtime.getURL('alerts.json');
  const response = await fetch(url);
  return response.json();
}

function urlMatchesPattern(pattern) {
  if (!pattern) return true;
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(window.location.href);
}

function getDescription(config) {
  if (config.descriptionSelector) {
    const el = document.querySelector(config.descriptionSelector);
    return el ? el.textContent.trim() : '';
  }
  // Fallback: look for any element matching the row selector
  const el = document.querySelector(config.rowSelector);
  return el ? el.textContent.trim() : document.body.innerText;
}

function findMatches(description, knowledgeBase) {
  return knowledgeBase.filter(entry =>
    description.toLowerCase().includes(entry.match.toLowerCase())
  );
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildActionTag(action) {
  const def = ACTION_LABELS[action];
  if (!def) return '';
  return `<span class="batchman-action ${def.cls}">${def.text}</span>`;
}

function buildHintPanel(matches) {
  const panel = document.createElement('div');
  panel.className = 'batchman-panel';
  panel.setAttribute('id', 'batchman-main-panel');

  if (matches.length === 0) {
    panel.classList.add('batchman-unknown');
    panel.innerHTML = `
      <div class="batchman-panel-header">
        <span class="batchman-badge batchman-badge--unknown">⚠ Unknown alert</span>
        <span class="batchman-panel-title">No match found in knowledge base — escalate internally</span>
      </div>
    `;
    return panel;
  }

  panel.classList.add('batchman-known');
  matches.forEach(match => {
    const entry = document.createElement('div');
    entry.className = 'batchman-entry';
    entry.innerHTML = `
      <div class="batchman-panel-header">
        <span class="batchman-badge batchman-badge--known">✓ Known</span>
        <span class="batchman-panel-title">${escapeHtml(match.title)}</span>
        ${match.action ? buildActionTag(match.action) : ''}
      </div>
      <div class="batchman-hint">${escapeHtml(match.hint)}</div>
      ${match.wiki ? `<a class="batchman-link" href="${escapeHtml(match.wiki)}" target="_blank">Open wiki guide →</a>` : ''}
      ${match.sql ? `
        <div class="batchman-sql-wrap">
          <code class="batchman-sql">${escapeHtml(match.sql)}</code>
          <button class="batchman-copy" data-sql="${escapeHtml(match.sql)}">Copy SQL</button>
        </div>
      ` : ''}
    `;
    panel.appendChild(entry);
  });

  return panel;
}

function attachCopyHandlers(panel) {
  panel.querySelectorAll('.batchman-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.sql).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy SQL'; }, 2000);
      });
    });
  });
}

function injectPanel(panel, config) {
  // Prefer injecting right after the description field
  if (config.descriptionSelector) {
    const descEl = document.querySelector(config.descriptionSelector);
    if (descEl) {
      descEl.insertAdjacentElement('afterend', panel);
      return;
    }
  }
  // Fall back to injecting at the top of the main content area
  const anchor = document.querySelector(config.rowSelector) || document.body;
  anchor.insertAdjacentElement('afterend', panel);
}

function setBadge(status) {
  chrome.runtime.sendMessage({ type: 'SET_BADGE', status });
}

function storePanelData(matches) {
  // Store current page result so popup can read it
  const data = matches.length > 0
    ? { status: 'known', titles: matches.map(m => m.title) }
    : { status: 'unknown' };
  chrome.storage.session?.set({ batchmanPageResult: data }).catch(() => {});
}

async function init() {
  const config = await loadConfig();
  if (!urlMatchesPattern(config.urlPattern)) return;

  let knowledgeBase;
  try {
    knowledgeBase = await loadKnowledgeBase();
  } catch (e) {
    console.error('[BatchMan] Failed to load alerts.json:', e);
    return;
  }

  // Bail if already injected (e.g. on back/forward navigation)
  if (document.getElementById('batchman-main-panel')) return;

  const description = getDescription(config);
  if (!description) return;

  const matches = findMatches(description, knowledgeBase);
  const panel = buildHintPanel(matches);

  attachCopyHandlers(panel);
  injectPanel(panel, config);
  setBadge(matches.length > 0 ? 'known' : 'unknown');
  storePanelData(matches);
}

init();
