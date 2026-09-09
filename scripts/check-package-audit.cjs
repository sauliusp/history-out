const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {files, targets} = require('./package-files.cjs');

/** Accept package evidence only for the exact payload and archives on disk. */
function checkPackageAudit(audit, root = path.resolve(__dirname, '..')) {
  const read = file => fs.readFileSync(path.join(root, file));
  const version = JSON.parse(read('extension-unpacked/manifest.json')).version;
  const fail = detail => { throw new Error(`Package audit is stale or incomplete: ${detail}. Repack and rerun the package audit.`); };
  const matches = (file, record) => {
    if (!record) fail(`missing ${file}`);
    const bytes = read(file);
    if (record.bytes !== bytes.length || record.sha256 !== createHash('sha256').update(bytes).digest('hex')) fail(file);
  };
  if (audit?.status !== 'pass' || audit.version !== version) fail('status or version');
  if (JSON.stringify(Object.keys(audit.source?.files || {}).sort()) !== JSON.stringify(files)) fail('source file list');
  for (const file of files) matches(`extension-unpacked/${file}`, audit.source.files[file]);
  if (!Array.isArray(audit.packages) || audit.packages.length !== targets.length ||
      !targets.every(target => audit.packages.filter(entry => entry.target === target).length === 1)) fail('package targets');
  for (const target of targets) {
    const record = audit.packages.find(entry => entry.target === target);
    const file = `releases/historyout-${version}-${target}.zip`;
    if (record.file !== file || record.version !== version || record.status !== 'pass') fail(file);
    matches(file, record);
  }
}

module.exports = {checkPackageAudit};
