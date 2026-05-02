const DEFAULTS = {
  urlPattern: '',
  rowSelector: '.alert-row',
  descriptionSelector: '',
  triggerFieldName: '',
  triggerFieldValue: '',
};

async function load() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  document.getElementById('urlPattern').value = stored.urlPattern;
  document.getElementById('rowSelector').value = stored.rowSelector;
  document.getElementById('descriptionSelector').value = stored.descriptionSelector;
  document.getElementById('triggerFieldName').value = stored.triggerFieldName;
  document.getElementById('triggerFieldValue').value = stored.triggerFieldValue;
}

document.getElementById('save').addEventListener('click', async () => {
  const settings = {
    urlPattern: document.getElementById('urlPattern').value.trim(),
    rowSelector: document.getElementById('rowSelector').value.trim() || DEFAULTS.rowSelector,
    descriptionSelector: document.getElementById('descriptionSelector').value.trim(),
    triggerFieldName: document.getElementById('triggerFieldName').value.trim(),
    triggerFieldValue: document.getElementById('triggerFieldValue').value.trim(),
  };

  await chrome.storage.sync.set(settings);

  const savedEl = document.getElementById('saved');
  savedEl.style.display = 'inline';
  setTimeout(() => { savedEl.style.display = 'none'; }, 4000);
});

load();
