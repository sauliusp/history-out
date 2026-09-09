// Reconfigure on service-worker wake as well as install. Some Chromium browsers
// expose only part of the sidePanel API. Opening our own tab needs no tabs permission.
let panelReady = false;
const panelSetup = (async () => {
  try {
    const manifest = chrome.runtime.getManifest();
    if (!manifest.side_panel?.default_path || !manifest.permissions?.includes('sidePanel')) return;
    if (typeof chrome.sidePanel?.setPanelBehavior !== 'function') return;
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    panelReady = true;
  } catch {
    panelReady = false;
  }
})();

chrome.action.onClicked.addListener(async () => {
  await panelSetup;
  if (!panelReady) {
    await chrome.tabs.create({ url: chrome.runtime.getURL('side-panel.html') });
  }
});

// The panel may close while an older write is pending. Receive every change
// immediately and keep its ordered write queue in this longer-lived context.
let preferenceWriteQueue = Promise.resolve();
chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== 'historyout:save-preferences') return false;
  if (!message.value || typeof message.value !== 'object' || Array.isArray(message.value)) {
    sendResponse({ok: false});
    return false;
  }
  preferenceWriteQueue = preferenceWriteQueue.catch(() => {}).then(() =>
    chrome.storage.local.set({HISTORY_OUTPUT_CONFIG: message.value}));
  preferenceWriteQueue.then(
    () => { try { sendResponse({ok: true}); } catch {} },
    () => { try { sendResponse({ok: false}); } catch {} }
  );
  return true;
});

const OPENED_VERSION_KEY = 'historyoutOpenedVersion';
let lifecycleQueue = Promise.resolve();

// A welcome or release note is shown once per extension version. Browser updates
// and shared-module updates do not interrupt the user or alter export settings.
chrome.runtime.onInstalled.addListener((details) => {
  lifecycleQueue = lifecycleQueue.then(async () => {
    if (details.reason !== 'install' && details.reason !== 'update') return;
    const version = chrome.runtime.getManifest().version;
    if (details.reason === 'update' && details.previousVersion === version) return;
    const saved = await chrome.storage.local.get(OPENED_VERSION_KEY);
    if (saved[OPENED_VERSION_KEY] === version) return;
    const page = details.reason === 'install' ? 'welcome.html' : 'updated.html';
    await chrome.tabs.create({ url: chrome.runtime.getURL(page) });
    await chrome.storage.local.set({ [OPENED_VERSION_KEY]: version });
  }).catch(() => {
    // An unavailable tab or storage service must never prevent normal exporting.
  });
  return lifecycleQueue;
});
