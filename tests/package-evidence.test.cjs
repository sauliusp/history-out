const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {checkPackageAudit} = require('../scripts/check-package-audit.cjs');
const {files, targets} = require('../scripts/package-files.cjs');
const {payloadSha256, checkPayloadEvidence} = require('../scripts/payload-evidence.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'historyout-package-evidence-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const write = (file, content) => {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, content);
    const bytes = Buffer.from(content);
    return {bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
  };
  const version = '2.1.0';
  const audit = {status: 'pass', version, source: {files: {}}, packages: []};
  for (const file of files) {
    audit.source.files[file] = write(`extension-unpacked/${file}`, file === 'manifest.json' ? JSON.stringify({version}) : `original ${file}`);
  }
  for (const target of targets) {
    const file = `releases/historyout-${version}-${target}.zip`;
    audit.packages.push({file, target, version, status: 'pass', ...write(file, `audited archive ${target}`)});
  }
  return {root, audit, write};
}

test('package evidence accepts the exact audited source and archives', t => {
  const {root, audit} = fixture(t);
  assert.doesNotThrow(() => checkPackageAudit(audit, root));
});

test('same-version changes to a non-bundle asset invalidate the package audit', t => {
  const {root, audit, write} = fixture(t);
  write('extension-unpacked/updated.html', 'new release notes, same extension version and bundle');
  assert.throws(() => checkPackageAudit(audit, root), /Package audit is stale or incomplete: extension-unpacked\/updated.html/);
});

test('an incomplete source inventory cannot certify the current payload', t => {
  const {root, audit} = fixture(t);
  delete audit.source.files['onboarding.js'];
  assert.throws(() => checkPackageAudit(audit, root), /source file list/);
});

test('replacing an archive invalidates the audit even when unpacked files match', t => {
  const {root, audit, write} = fixture(t);
  write('releases/historyout-2.1.0-chrome.zip', 'different upload candidate');
  assert.throws(() => checkPackageAudit(audit, root), /releases\/historyout-2.1.0-chrome.zip/);
});

test('duplicate package targets cannot substitute for a missing target', t => {
  const {root, audit} = fixture(t);
  audit.packages[3] = {...audit.packages[0]};
  assert.throws(() => checkPackageAudit(audit, root), /package targets/);
});

for (const label of ['browser', 'upgrade', 'visible']) {
  test(`${label} evidence becomes stale after a same-version onboarding edit`, t => {
    const {root, write} = fixture(t);
    const directory = path.join(root, 'extension-unpacked');
    const original = {status: 'passed', payloadSha256: payloadSha256(directory)};
    assert.doesNotThrow(() => checkPayloadEvidence({[label]: original}, directory));
    write('extension-unpacked/onboarding.js', 'changed panel-opening behavior');
    assert.throws(() => checkPayloadEvidence({[label]: original}, directory), new RegExp(`${label} evidence does not match`));
  });
}

test('legacy bundle-only records cannot certify the complete extension payload', t => {
  const {root} = fixture(t);
  const directory = path.join(root, 'extension-unpacked');
  assert.throws(() => checkPayloadEvidence({visible: {status: 'passed', bundleSha256: 'old-bundle-only-record'}}, directory), /visible evidence does not match/);
});
