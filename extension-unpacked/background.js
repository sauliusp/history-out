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

const RELEASE_SITE = 'https://historyout.sauliusdev.chatgpt.site';
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
    const route = details.reason === 'install' ? '/welcome/' : '/changelog/';
    await chrome.tabs.create({ url: RELEASE_SITE + route });
    await chrome.storage.local.set({ [OPENED_VERSION_KEY]: version });
  }).catch(() => {
    // An unavailable tab or storage service must never prevent normal exporting.
  });
  return lifecycleQueue;
});
