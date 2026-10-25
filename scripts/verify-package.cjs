// Verify the packaged ASAR rather than accidentally testing the source checkout.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const asar=require('@electron/asar');
const [platform,arch]=process.argv.slice(2);
const folder=platform==='mac'?'mac'+(arch==='x64'?'':'-'+arch):platform==='win'?'win-unpacked':'linux-unpacked';
const resources=platform==='mac'?path.join('dist',folder,'MattAMP.app','Contents','Resources'):path.join('dist',folder,'resources');
const archive=path.join(resources,'app.asar');
const required=['src/meteor-showers.cjs','assets/sky/meteor-showers.json','src/sky-clock.js','src/night-sky.cjs','src/sky-services.cjs','src/night-sky.js','src/sky-ui.js','assets/sky/catalog.json','assets/sky/LICENSE-d3-celestial.txt','node_modules/astronomy-engine/astronomy.js','node_modules/satellite.js/dist/index.js','src/apple2.js','src/apple2.css','src/appearance.cjs','src/station-image.cjs','assets/fonts/VT323-Regular.ttf','assets/fonts/VT323-OFL.txt','assets/tab-sounds/apple2.wav','src/main.cjs','src/preload.cjs','src/retro.js','src/retro.css','src/platform-stats.cjs','src/ski-cams-ui.js','assets/icon.png','assets/tab-sounds/send-it.mp3','assets/tab-sounds/modem.wav','assets/arcade/metal-slug-tank.png','node_modules/lucide/dist/umd/lucide.js','node_modules/three/build/three.module.js','node_modules/fast-xml-parser/package.json','node_modules/systeminformation/package.json'];
for(const file of required)assert.ok(asar.extractFile(archive,path.normalize(file)).length,file);
const meta=JSON.parse(asar.extractFile(archive,'package.json'));assert.equal(meta.version,require('../package.json').version);
const entries=asar.listPackage(archive).map(n=>n.replaceAll('\\','/'));assert.ok(!entries.some(n=>/(?:^|\/)(?:state\.json|sky-orbits\.json|arcade-scores\.json|\.env|\.git|userData)(?:\/|$)/.test(n)),'No private profiles or credentials');
console.log('Verified packaged MattAMP '+meta.version+' for '+platform+'/'+arch+' ('+entries.length+' entries).');
