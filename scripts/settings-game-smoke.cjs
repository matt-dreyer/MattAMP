const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-settings-'));fs.writeFileSync(dir+'/state.json',JSON.stringify({volume:0,alwaysOnTop:false,layout:'sidecar',ambient:'off'}));
(async()=>{let app;try{
 app=await _electron.launch({ignoreDefaultArgs:['--no-sandbox'],args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:dir}});
 const p=await app.firstWindow(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.locator('#stations button').first().waitFor();await p.locator('#source-game').click();await p.locator('#game-sound').click();
 await p.evaluate(()=>{audio.src='/startup.mp3';audio.muted=true;audio.loop=true;return audio.play();});
 async function settingsStayOpen(){
  await p.locator('#settings-open').click();await p.waitForTimeout(150);
  assert.equal(await p.locator('.full').evaluate(el=>getComputedStyle(el).display),'none','Game content must be hidden behind Settings');
  const snap=await p.evaluate(()=>JSON.stringify(arcade.battle));
  await p.locator('#ambient-mode').selectOption('stars');await p.waitForTimeout(450);
  assert.equal(await p.evaluate(()=>JSON.stringify(arcade.battle)),snap,'battle remains frozen');
  assert.equal(await p.evaluate(()=>audio.paused),false,'radio keeps playing');
  assert.equal(await p.evaluate(()=>{const r=document.querySelector('.settings-title').getBoundingClientRect();return settings&&r.top>=0&&r.bottom<=innerHeight;}),true,'Settings stays on screen');
  assert.equal(await p.evaluate(()=>arcade.visible),false);
  await p.locator('#settings-close').click();await p.waitForFunction(()=>arcade.visible);
  assert.equal(await p.locator('#game-panel').isVisible(),true);
 }
 await settingsStayOpen();await p.locator('#game-start').click();await settingsStayOpen();
 await p.locator('#layout').click();await p.waitForFunction(()=>innerWidth===430);await settingsStayOpen();
 await p.locator('#game-expand').click();await p.waitForFunction(()=>innerWidth>710);await settingsStayOpen();await p.waitForFunction(()=>innerWidth===430);
 assert.equal(await p.locator('#game-expand').getAttribute('aria-pressed'),'false');
 assert.equal(await p.locator('#game-controls').isEnabled(),true);assert.equal(await p.locator('#ambient-mode').inputValue(),'stars');
 assert.deepEqual(errors,[]);console.log('PASS: Settings stays usable from Game setup, active battle, stacked and expanded modes; preferences, battle freeze/resume, radio continuity and widget restoration.');
 }finally{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
