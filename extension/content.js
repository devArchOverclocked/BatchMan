const DEFAULTS = {
  urlPattern: '',
  rowSelector: '.alert-row',
  descriptionSelector: '',
  triggerFieldName: '',
  triggerFieldValue: '',
  criticalFieldName: '',
  criticalFieldValue: '',
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
  if (!response.ok) {
    throw new Error(`alerts.json not found — did you run "npm run build"?`);
  }
  return response.json();
}

function urlMatchesPattern(pattern) {
  if (!pattern) return true;
  const escaped = pattern.replace(/[.+^${}()|[\]\\?]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(window.location.href);
}

// Walks HTML comment nodes to find the one with FieldInternalName="<name>",
// then returns the text content of the first element sibling that follows it.
// SharePoint places these comments immediately before the field value element.
function getSharePointFieldValue(fieldInternalName) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_COMMENT
  );

  while (walker.nextNode()) {
    const comment = walker.currentNode;
    if (!comment.nodeValue.includes(`FieldInternalName="${fieldInternalName}"`)) continue;

    // Scan forward through siblings for the first element node (skip whitespace text nodes)
    let node = comment.nextSibling;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return node.textContent.trim();
      }
      node = node.nextSibling;
    }

    // Fallback: use the parent container's text (minus the comment text itself)
    return comment.parentElement?.textContent?.trim() ?? null;
  }

  return null;
}

function triggerConditionMet(config) {
  if (!config.triggerFieldName || !config.triggerFieldValue) return true;
  const actual = getSharePointFieldValue(config.triggerFieldName);
  return actual !== null && actual.toLowerCase() === config.triggerFieldValue.toLowerCase();
}

function getDescription(config) {
  if (config.descriptionSelector) {
    const el = document.querySelector(config.descriptionSelector);
    return el ? el.textContent.trim() : '';
  }
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

function buildErrorPanel(message) {
  const panel = document.createElement('div');
  panel.id = 'batchman-main-panel';
  panel.className = 'batchman-panel batchman-error';
  panel.innerHTML = `
    <div class="batchman-panel-header">
      <span class="batchman-badge batchman-badge--unknown">⚠ BatchMan</span>
      <span class="batchman-panel-title">${escapeHtml(message)}</span>
    </div>
  `;
  return panel;
}

function buildHintPanel(matches) {
  const panel = document.createElement('div');
  panel.id = 'batchman-main-panel';
  panel.className = 'batchman-panel';

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
  if (config.descriptionSelector) {
    const descEl = document.querySelector(config.descriptionSelector);
    if (descEl) {
      descEl.insertAdjacentElement('afterend', panel);
      return;
    }
  }
  const anchor = document.querySelector(config.rowSelector);
  if (anchor) {
    anchor.insertAdjacentElement('afterend', panel);
    return;
  }
  document.body.prepend(panel);
}

function isCritical(config) {
  if (!config.criticalFieldName || !config.criticalFieldValue) return false;
  const actual = getSharePointFieldValue(config.criticalFieldName);
  return actual !== null && actual.toLowerCase() === config.criticalFieldValue.toLowerCase();
}

function buildCriticalBanner() {
  const banner = document.createElement('div');
  banner.id = 'batchman-critical-banner';
  banner.innerHTML = `
    <span class="batchman-critical-icon">🚨</span>
    <span class="batchman-critical-text">CRITICAL ALERT — React immediately!</span>
  `;
  return banner;
}

function setBadge(status) {
  chrome.runtime.sendMessage({ type: 'SET_BADGE', status });
}

function storePanelData(matches) {
  const data = matches.length > 0
    ? { status: 'known', titles: matches.map(m => m.title) }
    : { status: 'unknown' };
  chrome.storage.session?.set({ batchmanPageResult: data }).catch(() => {});
}

async function init() {
  const config = await loadConfig();
  if (!urlMatchesPattern(config.urlPattern)) return;

  if (document.getElementById('batchman-main-panel')) return;

  // Critical banner is independent — show it regardless of trigger condition
  if (isCritical(config) && !document.getElementById('batchman-critical-banner')) {
    document.body.prepend(buildCriticalBanner());
    setBadge('critical');
  }

  if (!triggerConditionMet(config)) return;

  let knowledgeBase;
  try {
    knowledgeBase = await loadKnowledgeBase();
  } catch (e) {
    console.error('[BatchMan]', e.message);
    const panel = buildErrorPanel(`Knowledge base not found — run "npm run build" then reload the extension.`);
    document.body.prepend(panel);
    setBadge('unknown');
    return;
  }

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
