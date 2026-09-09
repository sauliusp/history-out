const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, file);
const exporter = require('../src/services/ExportService.ts').ExportService.getInstance();
// Fictional example rows, serialized by the same production code as downloads.
const rows = [
  ['Responsive images: a practical guide', 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images'],
  ['CSS grid layout: research notes', 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout'],
  ['Responsive design foundations', 'https://web.dev/learn/design'],
  ['Web accessibility: getting started', 'https://developer.mozilla.org/en-US/docs/Learn/Accessibility'],
].map(([title, url], index) => ({
  order: index + 1, id: String(index + 1), date: '05/09/2026', time: `${16-index}:30:00`,
  title, url, visitCount: 1, typedCount: 0, transition: 'link',
  timestamp: Date.parse(`2026-09-05T${String(13-index).padStart(2,'0')}:30:00Z`), domain: new URL(url).hostname,
}));
const fields = { order: true, date: true, time: true, title: true, url: true };
for (const format of ['csv', 'json', 'html']) {
  fs.writeFileSync(`website/public/assets/sample-history.${format}`, exporter.serializeData(rows, format, fields));
}
console.log('Generated three fictional sample exports with the production serializer.');
