const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-chaos-'));fs.writeFileSync(dir+'/state.json',JSON.stringify({volume:0,alwaysOnTop:false,layout:'sidecar',ambient:'waves'}));
(async()=>{let app;const errors=[];try{
 async function launch(){app=await _electron.launch({ignoreDefaultArgs:['--no-sandbox'],args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:dir}});const p=await app.firstWindow();p.on('pageerror',e=>errors.push(e.message));await p.locator('#stations button').first().waitFor();await p.locator('#source-game').click();await p.locator('#game-sound').click();return p;}
 let p=await launch();assert.equal(await p.locator('#game-chaos').inputValue(),'mixed');
 await p.screenshot({path:'/tmp/mattamp-chaos-setup-wide.png'});
 await p.locator('#layout').click();await p.waitForFunction(()=>innerWidth===430);await p.waitForTimeout(150);
 await p.screenshot({path:'/tmp/mattamp-chaos-setup-stack.png'});
 assert.equal(await p.locator('#game-chaos').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),true);
 for(const chaos of ['off','mixed','unhinged']){
  await p.locator('#game-chaos').selectOption(chaos);const preview=await p.evaluate(()=>({conditions:arcade.preview.conditions,terrain:[...arcade.preview.terrain]}));
  assert.match(await p.locator('#game-conditions').innerText(),new RegExp(chaos,'i'));
  await p.locator('#game-start').click();assert.deepEqual(await p.evaluate(()=>({conditions:arcade.battle.conditions,terrain:[...arcade.battle.terrain]})),preview,'start keeps the shown arena');
  await p.locator('#game-new').click();await p.locator('#game-abandon-yes').click();assert.equal(await p.locator('#game-chaos').inputValue(),chaos);
 }
 // Use an actual seeded recipe for a stable screenshot, then start that exact preview.
 await p.evaluate(()=>{let seed=11;arcade.preview=new MattArtillery.Battle({chaos:'unhinged',random:()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)});arcade.render();arcade.draw();});
 await p.locator('#game-start').click();await p.screenshot({path:'/tmp/mattamp-chaos-battle-stack.png'});
 await p.locator('#game-expand').click();await p.waitForFunction(()=>innerWidth>710);
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1280,900));await p.waitForTimeout(200);await p.screenshot({path:'/tmp/mattamp-chaos-expanded.png'});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true);
 await p.evaluate(()=>{audio.src='/startup.mp3';audio.muted=true;audio.loop=true;return audio.play();});
 const conditions=await p.evaluate(()=>arcade.battle.conditions);await p.locator('#settings-open').click();await p.locator('#settings-close').click();assert.deepEqual(await p.evaluate(()=>arcade.battle.conditions),conditions);assert.equal(await p.evaluate(()=>audio.paused),false);
 await p.evaluate(()=>{arcade.battle.tanks.slice(1).forEach(t=>t.hp=0);arcade.battle.phase='settle';arcade.battle.delay=0;});await p.waitForFunction(()=>arcade.battle.phase==='over'&&!arcade.saving);await p.locator('.victory-dismiss').click();
 assert.deepEqual(await p.evaluate(()=>arcade.scores.scores[0].conditions),conditions);
 await p.locator('#game-records summary').click();assert.match(await p.locator('#game-score-rows').innerText(),/Unhinged/);await p.screenshot({path:'/tmp/mattamp-chaos-scores.png'});
 await p.waitForFunction(()=>state.chaos==='unhinged');await p.evaluate(()=>persist());await app.close();app=null;p=await launch();
 assert.equal(await p.locator('#game-chaos').inputValue(),'unhinged');await p.waitForFunction(()=>arcade.scores?.played===1);assert.deepEqual(await p.evaluate(()=>arcade.scores.scores[0].conditions),conditions);
 assert.deepEqual(errors,[]);console.log('PASS: Mixed default, selector persistence, fixed preview/start rules, all modes, compact/expanded layouts, Settings/radio continuity and arena records across restart.');
 }finally{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
