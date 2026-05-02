const DEFAULTS = {
  urlPattern: '',
  rowSelector: '.alert-row',
  descriptionFieldName: '',
  descriptionSelector: '',
  triggerFieldName: '',
  triggerFieldValue: '',
  criticalFieldName: '',
  criticalFieldValue: '',
  suppressFieldName: '',
  suppressFieldValue: '',
};

async function load() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  document.getElementById('urlPattern').value = stored.urlPattern;
  document.getElementById('rowSelector').value = stored.rowSelector;
  document.getElementById('descriptionFieldName').value = stored.descriptionFieldName;
  document.getElementById('descriptionSelector').value = stored.descriptionSelector;
  document.getElementById('triggerFieldName').value = stored.triggerFieldName;
  document.getElementById('triggerFieldValue').value = stored.triggerFieldValue;
  document.getElementById('criticalFieldName').value = stored.criticalFieldName;
  document.getElementById('criticalFieldValue').value = stored.criticalFieldValue;
  document.getElementById('suppressFieldName').value = stored.suppressFieldName;
  document.getElementById('suppressFieldValue').value = stored.suppressFieldValue;
}

document.getElementById('save').addEventListener('click', async () => {
  const settings = {
    urlPattern: document.getElementById('urlPattern').value.trim(),
    rowSelector: document.getElementById('rowSelector').value.trim() || DEFAULTS.rowSelector,
    descriptionFieldName: document.getElementById('descriptionFieldName').value.trim(),
    descriptionSelector: document.getElementById('descriptionSelector').value.trim(),
    triggerFieldName: document.getElementById('triggerFieldName').value.trim(),
    triggerFieldValue: document.getElementById('triggerFieldValue').value.trim(),
    criticalFieldName: document.getElementById('criticalFieldName').value.trim(),
    criticalFieldValue: document.getElementById('criticalFieldValue').value.trim(),
    suppressFieldName: document.getElementById('suppressFieldName').value.trim(),
    suppressFieldValue: document.getElementById('suppressFieldValue').value.trim(),
  };

  await chrome.storage.sync.set(settings);

  const savedEl = document.getElementById('saved');
  savedEl.style.display = 'inline';
  setTimeout(() => { savedEl.style.display = 'none'; }, 4000);
});

load();
