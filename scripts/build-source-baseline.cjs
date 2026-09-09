const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

/** Rebuild the historical source payload used by package/upgrade QA. */
function ensureSourceBaseline(outputDirectory) {
  const root = path.resolve(__dirname, '..');
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'launch/qa/packages.json'), 'utf8'));
  const runGit = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'});
  const revision = runGit(['rev-parse', '--verify', `${metadata.baseline_source}^{commit}`]).trim();
  const manifest = JSON.parse(runGit(['show', `${revision}:extension-unpacked/manifest.json`]));
  const output = path.resolve(outputDirectory || path.join(root, 'releases'));
  const archive = path.join(output, `historyout-${manifest.version}-source-baseline.zip`);
  if (fs.existsSync(archive)) return archive;
  fs.mkdirSync(output, {recursive: true});
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'historyout-source-baseline-'));
  try {
    const source = path.join(temporary, 'source');
    fs.mkdirSync(source);
    const tar = path.join(temporary, 'source.tar');
    execFileSync('git', ['archive', '--format=tar', `--output=${tar}`, revision,
      'src', 'extension-unpacked', 'package.json', 'package-lock.json', 'tsconfig.json', 'webpack.config.js'], {cwd: root});
    execFileSync('tar', ['-xf', tar, '-C', source]);
    // The historical lockfile supplies its own dependencies; the current build
    // is neither reused nor modified. Package install scripts are unnecessary.
    execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], {cwd: source, stdio: 'pipe'});
    execFileSync('npm', ['run', 'build'], {cwd: source, stdio: 'pipe'});
    const payload = path.join(source, 'extension-unpacked');
    fs.rmSync(path.join(payload, 'bundle.js.map'), {force: true});
    const built = path.join(temporary, 'baseline.zip');
    execFileSync('zip', ['-qr', built, '.'], {cwd: payload});
    execFileSync('unzip', ['-t', built], {stdio: 'pipe'});
    fs.copyFileSync(built, archive);
    return archive;
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}

module.exports = {ensureSourceBaseline};
if (require.main === module) console.log(ensureSourceBaseline(process.argv[2]));
