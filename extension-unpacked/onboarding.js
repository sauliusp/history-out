// Cache this page's tab before a click. Its ID remains valid if the user moves
// the page to another window. Awaiting an API during the click can lose the
// user gesture required by sidePanel.open().
let pageTabId;
try {
  chrome.tabs.getCurrent().then(tab => { pageTabId = tab?.id; }).catch(() => {});
} catch {
  // The links still open the full-page workspace when a panel is unavailable.
}

const manifest = chrome.runtime.getManifest();
const version = document.querySelector('[data-version]');
if (version) version.textContent = manifest.version;

for (const link of document.querySelectorAll('[data-open-historyout]')) {
  link.addEventListener('click', async event => {
    // Preserve normal modified-link behavior, including opening a new tab.
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!manifest.side_panel?.default_path || !manifest.permissions?.includes('sidePanel') ||
        typeof chrome.sidePanel?.open !== 'function' || !Number.isInteger(pageTabId)) return;
    event.preventDefault();
    const status = document.getElementById('open-status');
    try {
      await chrome.sidePanel.open({ tabId: pageTabId });
      status.textContent = 'HistoryOut is open beside this page. Choose Today, then Preview to get started.';
    } catch {
      // Some Chromium browsers expose the API but cannot open a side panel.
      window.location.assign(link.href);
    }
  });
}
