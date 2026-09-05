const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('extension-unpacked/background.js', 'utf8');
for (const behavior of ['supported','missing','partial','rejected']) {
  test(`toolbar opens the right surface when side panel is ${behavior}`, async()=>{
    let click; const opened=[]; const requests=[];
    const chrome={action:{onClicked:{addListener(fn){click=fn;}}},runtime:{getURL:p=>`chrome-extension://fixture/${p}`,getManifest:()=>({permissions:['history','storage','sidePanel'],side_panel:{default_path:'side-panel.html'}})},tabs:{create:async arg=>opened.push(arg)}};
    if(behavior!=='missing') chrome.sidePanel=behavior==='partial'?{}:{setPanelBehavior:async args=>{requests.push(args);if(behavior==='rejected')throw new Error('unsupported');}};
    vm.runInNewContext(source,{chrome}); await click();
    assert.equal(opened.length,behavior==='supported'?0:1);
    if(opened.length)assert.equal(opened[0].url,'chrome-extension://fixture/side-panel.html');
  });
}
test('v2 retains exactly the shipped permission set and no additional access declarations',()=>{
  const manifest=JSON.parse(fs.readFileSync('extension-unpacked/manifest.json','utf8'));
  assert.deepEqual(manifest.permissions.sort(),['history','sidePanel','storage']);
  for(const key of ['host_permissions','optional_permissions','optional_host_permissions','content_scripts','externally_connectable'])assert.equal(manifest[key],undefined,key);
  assert.equal(manifest.version,require('../package.json').version);
});

for (const missing of ['permission', 'path']) {
  test(`generic tab fallback ignores an available sidePanel API without manifest ${missing}`, async () => {
    let click;
    let setupCalls = 0;
    const opened = [];
    const manifest = { permissions: ['history', 'storage', 'sidePanel'], side_panel: {default_path: 'side-panel.html'} };
    if (missing === 'permission') manifest.permissions = ['history', 'storage'];
    else delete manifest.side_panel;
    const chrome = {
      action: {onClicked: {addListener(fn) {click = fn;}}},
      runtime: {getURL: file => `chrome-extension://fixture/${file}`, getManifest: () => manifest},
      sidePanel: {setPanelBehavior: async () => {setupCalls++;}},
      tabs: {create: async options => opened.push(options)},
    };
    vm.runInNewContext(source, {chrome});
    await click();
    assert.equal(setupCalls, 0);
    assert.equal(opened.length, 1);
    assert.equal(opened[0].url, 'chrome-extension://fixture/side-panel.html');
  });
}
