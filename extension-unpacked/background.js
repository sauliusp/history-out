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
