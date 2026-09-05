import { readFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const manifest=JSON.parse(readFileSync('extension-unpacked/manifest.json'));
if(JSON.stringify([...manifest.permissions].sort())!==JSON.stringify(['history','sidePanel','storage']))throw new Error('Permission baseline changed.');
if(!existsSync('extension-unpacked/bundle.js'))throw new Error('Build the extension first.');
mkdirSync('releases',{recursive:true});
for(const target of ['chrome','edge','brave','chromium']){
  const staging=path.resolve(`releases/historyout-${manifest.version}-${target}`);
  rmSync(staging,{recursive:true,force:true});mkdirSync(staging,{recursive:true});
  for(const file of ['manifest.json','background.js','bundle.js','bundle.js.LICENSE.txt','side-panel.html','styles.css','icons'])cpSync(path.join('extension-unpacked',file),path.join(staging,file),{recursive:true});
  const targetManifest=structuredClone(manifest);
  // The generic package is for Chromium browsers without the sidePanel API.
  // It reduces permissions and uses the toolbar's full-page fallback.
  if(target==='chromium'){
    delete targetManifest.side_panel;
    targetManifest.permissions=targetManifest.permissions.filter(p=>p!=='sidePanel');
  }
  const {writeFileSync}=await import('node:fs');
  writeFileSync(path.join(staging,'manifest.json'),JSON.stringify(targetManifest,null,2)+'\n');
  const archive=path.resolve(`releases/historyout-${manifest.version}-${target}.zip`);
  rmSync(archive,{force:true});
  execFileSync('zip',['-qr',archive,'.'],{cwd:staging});
  const entries=execFileSync('unzip',['-Z1',archive],{encoding:'utf8'}).split('\n');
  if(!entries.includes('manifest.json')||entries.some(p=>p.includes('.map')||p.includes('fixture')))throw new Error('Invalid store archive');
  console.log(archive);
}
