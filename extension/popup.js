document.getElementById('settings-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

async function getKnowledgeBaseCount() {
  try {
    const url = chrome.runtime.getURL('alerts.json');
    const response = await fetch(url);
    const entries = await response.json();
    return entries.length;
  } catch {
    return null;
  }
}

async function getCurrentPageResult() {
  try {
    const data = await chrome.storage.session.get('batchmanPageResult');
    return data?.batchmanPageResult ?? null;
  } catch {
    return null;
  }
}

async function render() {
  const statusEl = document.getElementById('status');
  const pageEl = document.getElementById('page-status');

  const [count, pageResult] = await Promise.all([
    getKnowledgeBaseCount(),
    getCurrentPageResult(),
  ]);

  statusEl.innerHTML = count !== null
    ? `Knowledge base: <strong>${count} entries</strong>`
    : 'Failed to load knowledge base.';

  if (!pageResult) {
    pageEl.textContent = 'Not on an alert page.';
    pageEl.className = 'page-status page-status--neutral';
    return;
  }

  if (pageResult.status === 'known') {
    const titles = pageResult.titles.join(', ');
    pageEl.innerHTML = `<strong>✓ Known:</strong> ${titles}`;
    pageEl.className = 'page-status page-status--known';
  } else {
    pageEl.innerHTML = `<strong>⚠ Unknown</strong> — escalate internally`;
    pageEl.className = 'page-status page-status--unknown';
  }
}

render();
