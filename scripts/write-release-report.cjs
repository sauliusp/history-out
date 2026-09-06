const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const browser=read('launch/qa/release-readiness.json');
const upgrade=read('launch/qa/native-update.json');
const audit=read('launch/qa/package-audit.json');
if(browser.status!=='passed'||upgrade.status!=='passed'||audit.status!=='pass')throw new Error('A required QA record has not passed.');
const tests=fs.readdirSync('tests').filter(file=>file.endsWith('.test.cjs')).sort().map(file=>path.join('tests',file));
const unit=execFileSync(process.execPath,['--test','--test-reporter=tap',...tests],{encoding:'utf8'});
fs.writeFileSync('launch/qa/unit-results.tap',unit);
const count=Number(unit.match(/^# tests (\d+)/m)[1]);const failed=Number(unit.match(/^# fail (\d+)/m)[1]);if(failed)throw new Error('Unit tests failed.');
execFileSync('npm',['run','typecheck'],{encoding:'utf8'});
const icons={};
for(const size of [16,32,48,128]){
 const file=`extension-unpacked/icons/icon${size}.png`;const current=fs.readFileSync(file);const baseline=execFileSync('git',['show',`0272441:${file}`]);if(!current.equals(baseline))throw new Error('Original icon differs: '+file);icons[size]=crypto.createHash('sha256').update(current).digest('hex');
}
const visible=read('launch/qa/visible-review.json');
if(visible.bundleSha256!==crypto.createHash('sha256').update(fs.readFileSync('extension-unpacked/bundle.js')).digest('hex'))throw new Error('Visible app inspection is from a different bundle.');
const summary={checked:new Date().toISOString(),status:'passed',unitTests:{tests:count,failed:0},typecheck:'passed',browserCases:browser.cases.length,nativeUpgradeCases:upgrade.cases.length,packageChecks:audit.check_count,originalIcons:{baseline:'0272441',sha256:icons},bundleBytes:fs.statSync('extension-unpacked/bundle.js').size};
fs.writeFileSync('launch/qa/verification-summary.json',JSON.stringify(summary,null,2)+'\n');
const scale=browser.cases.find(item=>item.candidateURLs===10000);
const browsers=browser.browsers.map(item=>`| ${item.name==='edge'?'Installed Microsoft Edge':'Google Chrome for Testing (Chromium)'} | ${item.version} | Native unpacked MV3 history, settings, clipboard and all three downloads |`).join('\n');
const md=`# HistoryOut local release readiness

Checked ${summary.checked}. Candidate technical version: **2.0.0**. Product name: **HistoryOut**. Previous source release: **1.0.1**, baseline \`0272441\`.

**Local extension checks passed:** ${count} automated core/background/stress tests, ${browser.cases.length} browser scenarios, ${upgrade.cases.length} native upgrade checks and ${audit.check_count} package integrity checks. TypeScript and the production build pass. The build emits the existing webpack bundle-size advisory; the local bundle is ${summary.bundleBytes.toLocaleString()} bytes.

## Environment and isolation

${browser.platform.os.replace(/\n/g,'; ')}; ${browser.platform.architecture}; Node ${browser.platform.node}.

| Browser | Exact version | Verified scope |
| --- | --- | --- |
${browsers}

All browser profiles used by these tests were freshly created for QA. The only history inserted was fictional fixture data. Precise historical timestamps were written to the **closed isolated profile's** SQLite history database, then queried through the actual extension APIs. No ordinary Chrome or Edge profile was opened or modified.

## Verified behavior

- Original icons match all four baseline PNGs byte-for-byte. The interface says HistoryOut without a numeric product badge.
- Fresh native Chromium and Edge installs open one welcome page. Unit tests also cover duplicate events and ignore browser/module updates.
- Chrome's native unpacked installer updates the rebuilt 1.0.1 source package to 2.0.0, opens exactly one changelog, retains native history and exact v1 preferences, and does not repeat the lifecycle page after a same-version restart. This is a real local installer transition, not a simulated event; it is not a signed Chrome Web Store update.
- Custom dates include start-of-day and end-of-day visits. A page visited within the range and again later still appears. Visits immediately outside the range are excluded.
- Native CSV, JSON and HTML downloads match exactly six selected visits. JSON fields and timestamps are exact; CSV safely preserves multiline/formula-looking titles; HTML preserves selected cell text while escaping hostile markup.
- Search, domain matching, latest-URL deduplication and query/fragment removal produce the same rows in preview and export. Preview renders up to 100 rows; export includes the complete matching result.
- V1 settings migrate without changing valid saved choices. New Timestamp and Domain columns remain off unless selected. Saved views persist and reapply without storing visit records.
- Clipboard success, clipboard-denial fallback and the canonical share URL pass fixture checks. Native browser clipboard outcomes are recorded separately in the machine-readable results. Support remains optional and uses the existing Buy Me a Coffee URL.
- Empty results, no matches, delayed cancellation and API failures are handled without silently exporting partial data. Cancelled or failed refreshes retain the prior explicitly loaded snapshot. Filters cannot be reset mid-load while an export uses the previous settings.
- No preview/export page network uploads or runtime exceptions were observed. Install/update pages are deliberate user-requested navigation, separate from history processing.
- Search result caps fail explicitly; the tests do not treat the one-million-candidate limit as a silent truncation boundary. Browser-retained history remains the source of truth.

## Scale observation

A browser UI fixture loaded **10,000 URLs / 30,000 visits**, displayed only 100 preview rows and exported all 30,000 rows. Measured load: **${scale.loadMs.toLocaleString()} ms**; changing the search to a 333-visit result: **${scale.filterMs.toLocaleString()} ms**; CSV size: **${scale.downloadBytes.toLocaleString()} bytes**. Progress painting is limited to roughly ten updates per second, with exact initial/final counts.

This is a synthetic zero-latency API fixture running in a real browser UI, not a real-profile speed guarantee. A previous mock used per-call zero-duration timers, whose timer scheduling dominated the result; zero-delay fixture responses now resolve immediately. Nonzero test delays remain for cancellation/failure scenarios. Independent core stress tests also verify deterministic exports, bounded API concurrency of eight and recovery from cancelled/failed large loads.

## Reviewable local app

The current built extension is open as a **Google Chrome for Testing app window** in an isolated profile. Native computer-use inspection clicked Preview and observed six fictional visits, five pages and three sites. The original icon and updated footer were verified. Its profile and app URL are in [visible-review.json](./visible-review.json). Normal user history remains untouched.

## Remaining release limits

- Verify the signed Chrome Web Store package's clean install and update after store approval, using the existing listing. The local baseline archive is rebuilt source, not the fetched signed production ZIP.
- Brave is not installed on this Mac. Its package passes integrity/permission checks, but no Brave runtime certification is claimed. Run the same practical workflow in Brave before claiming tested Brave support.
- Store approval/publication, public live-site checks, DNS and YouTube publication are separate release operations. They are not implied by this extension test result.

## Evidence and reproduction

- [Browser scenarios and downloads](./release-readiness.json)
- [Native 1.0.1 to 2.0.0 upgrade](./native-update.json)
- [Core/background/stress results](./unit-results.tap)
- [Package hashes and exact source comparisons](./package-audit.json)
- [Verification summary and original icon hashes](./verification-summary.json)

Run \`npm run typecheck\`, \`npm test\`, \`npm run build\`, \`node scripts/release-readiness.cjs\`, \`node scripts/native-update-qa.cjs\`, \`node scripts/pack.mjs\`, then \`node scripts/audit-release-packages.cjs\`. Add \`--show-review\` to the release-readiness command to launch a fictional-data app profile for review. Refresh package hashes after any source or asset change.
`;
fs.writeFileSync('launch/qa/release-readiness.md',md);
console.log(JSON.stringify(summary,null,2));
