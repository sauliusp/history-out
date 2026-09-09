const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function checkFooter() {
  const root = path.resolve(__dirname, '..');
  const source = fs.readFileSync(path.join(root, 'src/components/HistoryExporter.tsx'), 'utf8');
  const start = source.indexOf('        <Stack component="footer"');
  const end = source.indexOf('        </Stack>', start) + '        </Stack>'.length;
  assert(start >= 0 && end > start, 'Footer exists');
  const current = source.slice(start, end);
  const fixture = 'tests/fixtures/historyout-footer.tsx';
  assert.equal(current, fs.readFileSync(path.join(root, fixture), 'utf8').trimEnd(), 'Footer differs from the reviewed 2.1.0 fixture');
  return {current, fixture};
}
module.exports = {checkFooter};
if (require.main === module) {checkFooter(); console.log('Footer matches the reviewed 2.1.0 fixture.');}
