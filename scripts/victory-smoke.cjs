const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-victory-'));fs.writeFileSync(dir+'/state.json',JSON.stringify({volume:0,alwaysOnTop:false,layout:'sidecar',ambient:'waves'}));
(async()=>{let app;try{
 app=await _electron.launch({ignoreDefaultArgs:['--no-sandbox'],args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:dir}});
 const p=await app.firstWindow(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/i.test(m.text()))errors.push(m.text());});
 await p.locator('#stations button').first().waitFor();await p.locator('#source-game').click();await p.locator('#game-sound').click();
 await p.evaluate(()=>{audio.src='/startup.mp3';audio.muted=true;audio.loop=true;return audio.play();});
 async function finish(result='win'){
  await p.evaluate(result=>{arcade.reset();arcade.start();const b=arcade.battle;b.tanks.forEach(t=>{if(result==='draw'||(result==='win'?t.id!==0:t.id===0))t.hp=0;});b.phase='settle';b.delay=0;},result);
  await p.waitForFunction(()=>arcade.battle.phase==='over'&&!arcade.saving);
 }
 await finish();await p.waitForFunction(()=>arcade.victory.host.dataset.renderer==='webgl');await p.waitForTimeout(1100);
 assert.ok(await p.evaluate(()=>arcade.victory.renderer.info.render.triangles>4000));assert.ok(await p.evaluate(()=>arcade.victory.frames>1));assert.equal(await p.evaluate(()=>arcade.victory.audio),null);
 assert.equal(await p.evaluate(()=>audio.paused),false);assert.equal(await p.evaluate(()=>arcade.scores.wins),1);
 await p.screenshot({path:'/tmp/mattamp-victory-wide.png'});
 await p.keyboard.press('Escape');assert.equal(await p.locator('#game-victory').isVisible(),false);assert.equal(await p.evaluate(()=>arcade.victory.renderer),null);
 await p.evaluate(()=>arcade.sync());assert.equal(await p.locator('#game-victory').isVisible(),false);
 await p.locator('#layout').click();await p.waitForFunction(()=>innerWidth===430);await finish();await p.waitForFunction(()=>arcade.victory.host.dataset.renderer==='webgl');await p.waitForTimeout(1100);await p.screenshot({path:'/tmp/mattamp-victory-narrow.png'});
 assert.equal(await p.evaluate(()=>{const r=document.querySelector('.victory-dismiss').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}),true);
 await p.locator('#source-radio').click();assert.equal(await p.evaluate(()=>arcade.victory.active),false);assert.equal(await p.evaluate(()=>arcade.victory.raf),0);assert.equal(await p.evaluate(()=>audio.paused),false);
 await p.locator('#source-game').click();assert.equal(await p.locator('#game-victory').isVisible(),false);
 for(const result of ['loss','draw']){await finish(result);assert.equal(await p.locator('#game-victory').isVisible(),false);}
 await p.emulateMedia({reducedMotion:'reduce'});await finish();await p.waitForFunction(()=>arcade.victory.host.dataset.renderer==='webgl');const frames=await p.evaluate(()=>arcade.victory.frames);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>arcade.victory.frames),frames);assert.equal(await p.evaluate(()=>arcade.victory.raf),0);
 await p.locator('.victory-dismiss').click();await p.emulateMedia({reducedMotion:'no-preference'});
 // A context loss leaves the accessible static celebration and its dismissal available.
 await finish();await p.waitForFunction(()=>arcade.victory.host.dataset.renderer==='webgl');await p.evaluate(()=>arcade.victory.renderer.forceContextLoss());await p.waitForFunction(()=>arcade.victory.host.dataset.renderer==='fallback');await p.locator('.victory-dismiss').click();
 // Muting/closing the ceremony closes its synthesizer, without touching the radio.
 await p.evaluate(()=>{arcade.victory.fanfare();arcade.victory.mute();});assert.equal(await p.evaluate(()=>arcade.victory.audio),null);
 await finish();await p.waitForFunction(()=>arcade.victory.host.dataset.renderer==='webgl');await p.locator('#game-victory').waitFor({state:'hidden',timeout:11000});assert.equal(await p.evaluate(()=>arcade.victory.renderer),null);
 assert.deepEqual(errors,[]);console.log('PASS: actual 3D rendering, win-only/once, wide/narrow, dismissal, auto-end, GPU cleanup, reduced motion, context-loss fallback, mute, score save and radio continuity.');
 }finally{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
