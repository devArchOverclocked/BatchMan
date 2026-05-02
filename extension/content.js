const BATCHMAN_ATTR = 'data-batchman-processed';

const DEFAULTS = {
  urlPattern: '',
  rowSelector: '.alert-row',
  descriptionSelector: '',
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
  if (!pattern) return true; // no filter set — run on all pages
  // Convert glob-style pattern to a regex
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(window.location.href);
}

function getDescription(row, descriptionSelector) {
  if (descriptionSelector) {
    const el = row.querySelector(descriptionSelector);
    return el ? el.textContent.trim() : row.textContent.trim();
  }
  return row.textContent.trim();
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

function buildHintPanel(matches) {
  const panel = document.createElement('div');
  panel.className = 'batchman-panel';

  if (matches.length === 0) {
    panel.classList.add('batchman-unknown');
    panel.innerHTML = `<span class="batchman-badge batchman-badge--unknown">⚠ Unknown — escalate</span>`;
    return panel;
  }

  panel.classList.add('batchman-known');
  matches.forEach(match => {
    const entry = document.createElement('div');
    entry.className = 'batchman-entry';
    entry.innerHTML = `
      <div class="batchman-header">
        <span class="batchman-badge batchman-badge--known">✓ Known</span>
        <span class="batchman-title">${escapeHtml(match.title)}</span>
      </div>
      <div class="batchman-hint">${escapeHtml(match.hint)}</div>
      ${match.wiki ? `<a class="batchman-link" href="${escapeHtml(match.wiki)}" target="_blank">Open wiki →</a>` : ''}
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

function processRow(row, knowledgeBase, descriptionSelector) {
  if (row.hasAttribute(BATCHMAN_ATTR)) return;
  row.setAttribute(BATCHMAN_ATTR, 'true');

  const description = getDescription(row, descriptionSelector);
  const matches = findMatches(description, knowledgeBase);
  const panel = buildHintPanel(matches);

  attachCopyHandlers(panel);
  row.appendChild(panel);
}

function scanPage(knowledgeBase, config) {
  const rows = document.querySelectorAll(
    `${config.rowSelector}:not([${BATCHMAN_ATTR}])`
  );
  rows.forEach(row => processRow(row, knowledgeBase, config.descriptionSelector));
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

  scanPage(knowledgeBase, config);

  const observer = new MutationObserver(() => scanPage(knowledgeBase, config));
  observer.observe(document.body, { childList: true, subtree: true });
}

init();
