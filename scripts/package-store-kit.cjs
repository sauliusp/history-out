// Assemble current handoff bundles from the existing artwork without a browser.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {checkPackageAudit} = require('./check-package-audit.cjs');
const {payloadSha256} = require('./payload-evidence.cjs');
const root = path.resolve(__dirname, '..');
const kit = path.join(root, 'launch/store-kit');
const read = file => fs.readFileSync(path.join(root, file));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function packageStoreKit() {
  const version = JSON.parse(read('extension-unpacked/manifest.json')).version;
  checkPackageAudit(JSON.parse(read('launch/qa/package-audit.json')), root);
  const previous = JSON.parse(fs.readFileSync(path.join(kit, 'manifest.json'), 'utf8'));
  const previousFiles = new Map((previous.files || []).map(entry => [entry.file, entry]));
  const assets = ['brand/icon128.png', 'promotional/small-promo-440x280.png', 'promotional/marquee-1400x560.png',
    ...fs.readdirSync(path.join(kit, 'screenshots')).filter(file => file.endsWith('.png')).sort().map(file => `screenshots/${file}`)];
  const records = [], archives = [];
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'historyout-store-handoff-'));
  try {
    for (const target of ['chrome', 'edge']) {
      const directory = path.join(kit, target);
      const listing = JSON.parse(fs.readFileSync(path.join(directory, 'listing.json'), 'utf8'));
      if (listing.technicalVersion !== version) throw new Error(`${target} listing version does not match the candidate`);
      for (const [field, file] of [['description', 'description.txt'], ['changelog', 'changelog.txt']]) {
        if (listing[field]?.trim() !== fs.readFileSync(path.join(directory, file), 'utf8').trim()) throw new Error(`${target} ${field} is out of sync`);
      }
      const candidate = `historyout-${version}-${target}.zip`;
      fs.copyFileSync(path.join(root, 'releases', candidate), path.join(directory, candidate));
      for (const file of assets) {
        fs.mkdirSync(path.dirname(path.join(directory, file)), {recursive: true});
        fs.copyFileSync(path.join(kit, file), path.join(directory, file));
      }
      // Only the current extension payload goes into the outer bundle. Older
      // loose candidates remain available as history, never as upload choices.
      const included = [candidate, 'listing.json', 'description.txt', 'changelog.txt', 'submission.md', ...assets].sort();
      for (const file of included) {
        const relative = `${target}/${file}`;
        const source = path.join(kit, relative), staged = path.join(temporary, relative);
        fs.mkdirSync(path.dirname(staged), {recursive: true});
        fs.copyFileSync(source, staged);
        const data = fs.readFileSync(source);
        const record = {file: relative, bytes: data.length, sha256: sha(data)};
        const old = previousFiles.get(relative);
        if (old?.sha256 === record.sha256) for (const field of ['width', 'height', 'hasAlpha']) {
          if (old[field] !== undefined) record[field] = old[field];
        }
        records.push(record);
      }
      const archiveName = `historyout-${target}-store-kit.zip`;
      const archive = path.join(temporary, archiveName);
      execFileSync('zip', ['-qr', archive, target], {cwd: temporary});
      execFileSync('unzip', ['-t', archive], {stdio: 'pipe'});
      const inner = execFileSync('unzip', ['-p', archive, `${target}/${candidate}`]);
      if (sha(inner) !== sha(read(`releases/${candidate}`))) throw new Error(`${target} handoff payload mismatch`);
      const data = fs.readFileSync(archive);
      archives.push({file: archiveName, bytes: data.length, sha256: sha(data), extensionVersion: version});
    }
    // Publish the new bundles together only after both staged archives verify.
    checkPackageAudit(JSON.parse(read('launch/qa/package-audit.json')), root);
    for (const archive of archives) fs.copyFileSync(path.join(temporary, archive.file), path.join(kit, archive.file));
    fs.writeFileSync(path.join(kit, 'manifest.json'), JSON.stringify({
      generated: new Date().toISOString(), extensionVersion: version,
      command: 'node scripts/package-store-kit.cjs',
      scope: 'Current Chrome and Edge handoff files. Existing marketing artwork is reused; this command does not render or certify new browser captures.',
      bundleSHA256: sha(read('extension-unpacked/bundle.js')),
      backgroundSHA256: sha(read('extension-unpacked/background.js')),
      payloadSha256: payloadSha256(),
      originalIconGitRef: previous.originalIconGitRef,
      originalIconSHA256: sha(read('extension-unpacked/icons/icon128.png')),
      files: records,
    }, null, 2) + '\n');
    fs.writeFileSync(path.join(kit, 'archives.json'), JSON.stringify(archives, null, 2) + '\n');
    console.log(JSON.stringify({version, files: records.length, archives}, null, 2));
  } finally { fs.rmSync(temporary, {recursive: true, force: true}); }
}

module.exports = {packageStoreKit};
if (require.main === module) packageStoreKit();
