// Verify the packaged ASAR rather than accidentally testing the source checkout.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const asar=require('@electron/asar');
const [platform,arch]=process.argv.slice(2);
const folder=platform==='mac'?'mac'+(arch==='x64'?'':'-'+arch):platform==='win'?'win-unpacked':'linux-unpacked';
const resources=platform==='mac'?path.join('dist',folder,'MattAMP.app','Contents','Resources'):path.join('dist',folder,'resources');
const archive=path.join(resources,'app.asar');
const required=['src/main.cjs','src/preload.cjs','src/platform-stats.cjs','src/ski-cams-ui.js','assets/icon.png','assets/tab-sounds/send-it.mp3','assets/arcade/metal-slug-tank.png','node_modules/lucide/dist/umd/lucide.js','node_modules/three/build/three.module.js','node_modules/fast-xml-parser/package.json','node_modules/systeminformation/package.json'];
for(const file of required)assert.ok(asar.extractFile(archive,file).length,file);
const meta=JSON.parse(asar.extractFile(archive,'package.json'));assert.equal(meta.version,require('../package.json').version);
const entries=asar.listPackage(archive);assert.ok(!entries.some(n=>/(?:^|\/)(?:state\.json|arcade-scores\.json|\.env|\.git|userData)(?:\/|$)/.test(n)),'No private profiles or credentials');
console.log('Verified packaged MattAMP '+meta.version+' for '+platform+'/'+arch+' ('+entries.length+' entries).');
