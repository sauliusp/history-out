// The complete payload shared by packing, auditing and release verification.
const files = [
  'assets/bmc-cup.svg', 'assets/logo.svg', 'background.js', 'bundle.js',
  'bundle.js.LICENSE.txt', 'icons/icon128.png', 'icons/icon16.png',
  'icons/icon32.png', 'icons/icon48.png', 'manifest.json', 'onboarding.css',
  'onboarding.js', 'side-panel.html', 'styles.css', 'updated.html', 'welcome.html',
].sort();
const targets = ['chrome', 'edge', 'brave', 'chromium'];

module.exports = {files, targets};
