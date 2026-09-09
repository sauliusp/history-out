const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {files} = require('./package-files.cjs');
const defaultDirectory = path.resolve(__dirname, '../extension-unpacked');

function payloadSha256(directory = defaultDirectory) {
  const entries = files.map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(directory, file))).digest('hex')]);
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

function checkPayloadEvidence(records, directory = defaultDirectory) {
  const current = payloadSha256(directory);
  for (const [label, record] of Object.entries(records)) {
    if (record?.status !== 'passed' || record.payloadSha256 !== current) {
      throw new Error(`${label} evidence does not match the complete current extension payload. Repeat that check before generating a release report.`);
    }
  }
}

module.exports = {payloadSha256, checkPayloadEvidence};
// Record this digest before and after the actual visible inspection. A digest
// alone is not inspection evidence and must never mark a review as passed.
if (require.main === module) console.log(payloadSha256(process.argv[2]));
