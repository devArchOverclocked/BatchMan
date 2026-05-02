document.getElementById('settings-link').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

async function renderStatus() {
  const statusEl = document.getElementById('status');
  try {
    const url = chrome.runtime.getURL('alerts.json');
    const response = await fetch(url);
    const entries = await response.json();
    statusEl.innerHTML = `Knowledge base: <strong>${entries.length} entries</strong> loaded.`;
  } catch {
    statusEl.textContent = 'Failed to load knowledge base.';
  }
}

renderStatus();
