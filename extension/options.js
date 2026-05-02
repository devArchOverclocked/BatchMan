const DEFAULTS = {
  urlPattern: '',
  rowSelector: '.alert-row',
  descriptionSelector: '',
};

async function load() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  document.getElementById('urlPattern').value = stored.urlPattern;
  document.getElementById('rowSelector').value = stored.rowSelector;
  document.getElementById('descriptionSelector').value = stored.descriptionSelector;
}

document.getElementById('save').addEventListener('click', async () => {
  const settings = {
    urlPattern: document.getElementById('urlPattern').value.trim(),
    rowSelector: document.getElementById('rowSelector').value.trim() || DEFAULTS.rowSelector,
    descriptionSelector: document.getElementById('descriptionSelector').value.trim(),
  };

  await chrome.storage.sync.set(settings);

  // Update the manifest's content_scripts URL pattern dynamically isn't possible,
  // but we store it so content.js can bail early if the URL doesn't match.
  const savedEl = document.getElementById('saved');
  savedEl.style.display = 'inline';
  setTimeout(() => { savedEl.style.display = 'none'; }, 4000);
});

load();
