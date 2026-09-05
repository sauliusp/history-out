// Read-only release checks. Writes only launch/qa/package-audit.json.
// Run again after every rebuild: node scripts/audit-release-packages.cjs
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative));
const json = relative => JSON.parse(read(relative));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const run = (command, args) => execFileSync(command, args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const canonical = value => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
};
const permissionFields = ['permissions', 'host_permissions', 'optional_permissions', 'optional_host_permissions'];
const permissions = manifest => Object.fromEntries(permissionFields.map(key => [key, [...(manifest[key] || [])].sort()]));
const files = [
  'background.js', 'bundle.js', 'bundle.js.LICENSE.txt', 'icons/icon128.png',
  'icons/icon16.png', 'icons/icon32.png', 'icons/icon48.png', 'manifest.json',
  'side-panel.html', 'styles.css',
];
const issues = [];
const checks = [];
function check(name, passed, detail) {
  checks.push({ name, passed, ...(detail === undefined ? {} : { detail }) });
  if (!passed) issues.push({ check: name, detail });
  return passed;
}
const started = performance.now();
const sourceManifest = json('extension-unpacked/manifest.json');
const packageJSON = json('package.json');
const lock = json('package-lock.json');
const sourceFiles = Object.fromEntries(files.map(file => [file, { bytes: read(`extension-unpacked/${file}`).length, sha256: sha256(read(`extension-unpacked/${file}`)) }]));
const report = {
  generated_at: new Date().toISOString(),
  command: 'node scripts/audit-release-packages.cjs',
  node_version: process.version,
  git_head: run('git', ['rev-parse', 'HEAD']).toString().trim(),
  version: sourceManifest.version,
  status: 'running',
  scope: 'Local v2 archives and their staging directories compared with extension-unpacked. Does not certify a signed Chrome Web Store package or a store submission.',
  source: { manifest: sourceManifest, files: sourceFiles },
  baseline: {}, packages: [], stress_tests: {}, checks, issues,
};
check('package-lock-and-manifest-versions-match', [packageJSON.version, lock.version, lock.packages[''].version].every(version => version === sourceManifest.version), {
  package_json: packageJSON.version, package_lock: lock.version,
  package_lock_root: lock.packages[''].version, manifest: sourceManifest.version,
});
check('source-permission-set-stays-at-three', equal(permissions(sourceManifest), {
  permissions: ['history', 'sidePanel', 'storage'], host_permissions: [], optional_permissions: [], optional_host_permissions: [],
}), permissions(sourceManifest));

try {
  const metadata = json('launch/qa/packages.json');
  const baselinePath = 'releases/historyout-1.0.1-source-baseline.zip';
  const baselineBytes = read(baselinePath);
  const baselineManifest = JSON.parse(run('unzip', ['-p', baselinePath, 'manifest.json']));
  const originalManifest = JSON.parse(run('git', ['show', `${metadata.baseline_source}:extension-unpacked/manifest.json`]));
  report.baseline = {
    file: baselinePath, bytes: baselineBytes.length, sha256: sha256(baselineBytes),
    source_commit: metadata.baseline_source, version: baselineManifest.version,
    permissions: permissions(baselineManifest),
    note: 'Rebuilt from v1 source. Not downloaded from the signed Chrome Web Store release.',
  };
  check('baseline-manifest-matches-original-source', equal(canonical(baselineManifest), canonical(originalManifest)));
  check('v2-permissions-equal-v1-source-baseline', equal(permissions(sourceManifest), permissions(baselineManifest)));
} catch (error) { check('baseline-audit-completes', false, error.message); }

for (const target of ['chrome', 'edge', 'brave', 'chromium']) {
  const relativePath = `releases/historyout-${sourceManifest.version}-${target}.zip`;
  const entry = { target, file: relativePath, files: [] };
  report.packages.push(entry);
  try {
    const bytes = read(relativePath);
    entry.bytes = bytes.length;
    entry.sha256 = sha256(bytes);
    const archiveEntries = run('unzip', ['-Z1', relativePath]).toString().trim().split(/\r?\n/);
    const archiveFiles = archiveEntries.filter(file => !file.endsWith('/')).sort();
    check(`${target}:exact-file-allowlist`, equal(archiveFiles, files), archiveFiles);
    check(`${target}:no-duplicate-or-unsafe-entries`, new Set(archiveEntries).size === archiveEntries.length &&
      archiveEntries.every(file => file === 'icons/' || files.includes(file)), archiveEntries);
    check(`${target}:no-maps-fixtures-test-or-nested-archives`, !archiveEntries.some(file => /(?:\.map$|fixture|test|\.zip$|\.crx$|node_modules|__MACOSX|\.DS_Store)/i.test(file)));
    const manifestBytes = run('unzip', ['-p', relativePath, 'manifest.json']);
    const manifest = JSON.parse(manifestBytes);
    entry.version = manifest.version;
    entry.permissions = permissions(manifest);
    entry.side_panel = manifest.side_panel || null;
    const expectedManifest = structuredClone(sourceManifest);
    if (target === 'chromium') {
      delete expectedManifest.side_panel;
      expectedManifest.permissions = expectedManifest.permissions.filter(permission => permission !== 'sidePanel');
    }
    check(`${target}:manifest-matches-target`, equal(canonical(manifest), canonical(expectedManifest)));
    check(`${target}:version-matches-source`, manifest.version === sourceManifest.version);
    check(`${target}:permission-baseline`, equal(permissions(manifest), permissions(expectedManifest)), {
      expected: permissions(expectedManifest), actual: permissions(manifest),
      change: target === 'chromium' ? 'sidePanel removed; no permissions added' : 'unchanged',
    });
    for (const file of files) {
      const archived = file === 'manifest.json' ? manifestBytes : run('unzip', ['-p', relativePath, file]);
      const source = read(`extension-unpacked/${file}`);
      const staged = read(`releases/historyout-${sourceManifest.version}-${target}/${file}`);
      const archivedHash = sha256(archived);
      const sourceHash = sha256(source);
      const stagedHash = sha256(staged);
      const matchesSource = file === 'manifest.json'
        ? equal(canonical(JSON.parse(archived)), canonical(expectedManifest))
        : archivedHash === sourceHash;
      entry.files.push({ file, bytes: archived.length, sha256: archivedHash, source_sha256: sourceHash, staging_sha256: stagedHash, matches_source: matchesSource, source_comparison: file === 'manifest.json' ? 'semantic JSON with target-specific sidePanel removal only' : 'exact bytes' });
      check(`${target}:${file}:matches-current-unpacked`, matchesSource);
      check(`${target}:${file}:matches-staging`, archivedHash === stagedHash);
      if (/\.(?:js|html|css)$/.test(file)) {
        const text = archived.toString();
        check(`${target}:${file}:no-source-map-or-qa-fixture`, !text.includes('sourceMappingURL=') && !text.includes('window.__fixture') && !text.includes('Responsive images: a practical guide'));
      }
    }
    entry.status = checks.some(item => item.name.startsWith(`${target}:`) && !item.passed) ? 'fail' : 'pass';
  } catch (error) {
    entry.status = 'fail';
    check(`${target}:audit-completes`, false, error.message);
  }
}

const testStart = performance.now();
const stress = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/release-stress.test.cjs'], {
  cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024,
});
report.stress_tests = {
  command: 'node --test --test-reporter=tap tests/release-stress.test.cjs',
  file_sha256: sha256(read('tests/release-stress.test.cjs')),
  exit_code: stress.status,
  elapsed_ms: Math.round((performance.now() - testStart) * 100) / 100,
  tests: Number(stress.stdout?.match(/^# tests (\d+)$/m)?.[1] || 0),
  passed: Number(stress.stdout?.match(/^# pass (\d+)$/m)?.[1] || 0),
  failed: Number(stress.stdout?.match(/^# fail (\d+)$/m)?.[1] || 0),
  observations: [...(stress.stdout || '').matchAll(/^# (\{.*\})$/gm)].map(match => JSON.parse(match[1])),
};
check('stress-tests-pass', stress.status === 0 && report.stress_tests.tests === 3 && report.stress_tests.passed === 3);
if (stress.status !== 0) report.stress_tests.failure_output = `${stress.stdout || ''}\n${stress.stderr || ''}\n${stress.error?.message || ''}`;
report.status = issues.length ? 'fail' : 'pass';
report.elapsed_ms = Math.round((performance.now() - started) * 100) / 100;
report.check_count = checks.length;
report.passed_check_count = checks.filter(item => item.passed).length;
report.note = 'Snapshot evidence. Re-run this audit after rebuilding or repacking; archive hashes are final only for the bytes recorded here.';
fs.mkdirSync(path.join(root, 'launch/qa'), { recursive: true });
fs.writeFileSync(path.join(root, 'launch/qa/package-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  status: report.status, checks: report.check_count, passed: report.passed_check_count,
  package_targets: report.packages.map(({ target, status, sha256 }) => ({ target, status, sha256 })),
  stress_tests: { passed: report.stress_tests.passed, elapsed_ms: report.stress_tests.elapsed_ms },
  evidence: 'launch/qa/package-audit.json', issues,
}, null, 2));
process.exitCode = issues.length ? 1 : 0;
