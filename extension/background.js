chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== 'SET_BADGE') return;

  const tabId = sender.tab?.id;
  if (!tabId) return;

  switch (message.status) {
    case 'known':
      chrome.action.setBadgeText({ text: 'OK', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#16a34a', tabId });
      break;
    case 'unknown':
      chrome.action.setBadgeText({ text: '!', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#ea580c', tabId });
      break;
    default:
      chrome.action.setBadgeText({ text: '', tabId });
      break;
  }
});
