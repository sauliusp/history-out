/* Validate deployable locale assets and their capture provenance against the current bundle. */
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const {locales,localeKeys}=require('./localization/store-copy.cjs');
const {sceneNames}=require('./localized-store-kit.cjs');
const hash=data=>createHash('sha256').update(data).digest('hex');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file));
const json=file=>JSON.parse(read(file));
const bundle=hash(read('extension-unpacked/bundle.js'));
const version=json('extension-unpacked/manifest.json').version;
const images=[],listings=[];
for(const locale of localeKeys){
 const prefix=`launch/store-kit/locales/${locale}`;
 const listing=json(`${prefix}/listing.json`),capture=json(`launch/assets/localized/${locale}/capture.json`);
 assert.equal(listing.technicalVersion,version,`${locale} version`);
 assert.equal(listing.existingItemId,'idohnkdgejocejlkihihonhemndpiiei',`${locale} item identity`);
 assert.equal(listing.youtubeVideo,'https://youtu.be/cGybkRSkk2Y',`${locale} existing video`);
 assert.ok(listing.name.length<=75&&listing.shortDescription.length<=132&&listing.description.length<=16000,`${locale} Store field limits`);
 for(const field of ['description','changelog'])assert.equal(listing[field].trim(),read(`${prefix}/${field}.txt`).toString().trim(),`${locale} ${field} sync`);
 assert.ok(listing.description.endsWith(listing.changelog),`${locale} public Store description must include the current changelog`);
 const nativePath=path.join(root,'extension-unpacked/_locales',locale,'messages.json');
 if(fs.existsSync(nativePath)){
  const native=JSON.parse(fs.readFileSync(nativePath,'utf8')),manifest=json('extension-unpacked/manifest.json');
  for(const [manifestKey,listingKey] of [['name','name'],['description','shortDescription']]){
   const key=/^__MSG_(.+)__$/.exec(manifest[manifestKey])?.[1];if(key)assert.equal(native[key]?.message,listing[listingKey],`${locale} package and listing ${listingKey} must match`);
  }
 }
 assert.equal(capture.bundleSha256,bundle,`${locale} screenshots must be recaptured after final bundle changes`);
 assert.equal(capture.language,locales[locale].tag,`${locale} capture language`);
 const expected=[...sceneNames.map(name=>[`${prefix}/screenshots/${name}`,1280,800]),[`${prefix}/promotional/small-promo-440x280.png`,440,280],[`${prefix}/promotional/marquee-1400x560.png`,1400,560],[`launch/assets/localized/${locale}/website-export-hero.png`,1600,1350],[`launch/assets/localized/${locale}/social-card.png`,1280,720]];
 for(const [file,width,height] of expected){const bytes=read(file);assert.equal(bytes.subarray(1,4).toString(),'PNG',file);assert.equal(bytes.readUInt32BE(16),width,file);assert.equal(bytes.readUInt32BE(20),height,file);assert.equal(bytes[25],2,`${file}: final PNG must be RGB, without alpha`);images.push({locale,file,width,height,sha256:hash(bytes)});}
 if(locale!=='en'){
  const web=`website/public/assets/localized/${locales[locale].tag}`;
  assert.equal(hash(read(`${web}/historyout-export-hero.png`)),hash(read(`launch/assets/localized/${locale}/website-export-hero.png`)),`${locale} website hero sync`);
  assert.equal(hash(read(`${web}/social-card.png`)),hash(read(`launch/assets/localized/${locale}/social-card.png`)),`${locale} social card sync`);
  assert.equal(hash(read(`${web}/sample-history.html`)),hash(read(`launch/assets/localized/${locale}/demo-history.html`)),`${locale} sample HTML sync`);
 }
 listings.push({locale,language:listing.language,titleLength:listing.name.length,summaryLength:listing.shortDescription.length,descriptionLength:listing.description.length});
}
for(const name of sceneNames){const rows=images.filter(image=>image.file.endsWith(`/screenshots/${name}`));assert.equal(new Set(rows.map(image=>image.sha256)).size,localeKeys.length,`${name} must be a distinct localized screenshot in every language`);}
const thumbnail='launch/store-kit/youtube/thumbnail-1280x720.png';
assert.equal(hash(read(thumbnail)),hash(execFileSync('git',['show',`HEAD:${thumbnail}`],{cwd:root})), 'Existing YouTube thumbnail must remain unchanged');
for(const file of ['small-promo-440x280.png','marquee-1400x560.png']) {
 const relative=`launch/store-kit/promotional/${file}`;
 assert.equal(hash(read(relative)),hash(execFileSync('git',['show',`HEAD:${relative}`],{cwd:root})), 'Existing approved global Chrome promotional images must remain unchanged');
}
const report={generatedAt:new Date().toISOString(),version,bundleSha256:bundle,passed:true,locales:localeKeys,images:images.length,storeScreenshots:localeKeys.length*5,promotionalVariants:localeKeys.length*2,websiteImages:localeKeys.length*2,chromeGlobalPromosUnchanged:true,youtubeVideoUnchanged:true,listings,files:images};
fs.mkdirSync(path.join(root,'launch/qa'),{recursive:true});fs.writeFileSync(path.join(root,'launch/qa/localized-assets.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,version,locales:localeKeys,images:images.length},null,2));
