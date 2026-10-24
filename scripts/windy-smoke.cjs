const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mattamp-windy-'));
fs.writeFileSync(path.join(profile,'state.json'),JSON.stringify({volume:0,tabSounds:false,alwaysOnTop:false,ambient:'off',layout:'sidecar'}));
(async()=>{let app;try{
 const launch=async()=>{app=await _electron.launch({chromiumSandbox:true,args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:profile}});const p=await app.firstWindow();await p.locator('#stations button').first().waitFor();return p;};
 let p=await launch();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.locator('#settings-open').click();await p.locator('#ambient-mode').selectOption('windy');await p.locator('#settings-close').click();
 await p.waitForFunction(()=>ambient.mode==='windy'&&!ambient.canvas.hidden&&ambient.time>0);
 const before=await p.evaluate(()=>ambient.canvas.toDataURL());await p.waitForTimeout(200);assert.notEqual(await p.evaluate(()=>ambient.canvas.toDataURL()),before,'the scene moves');
 await p.locator('#stations button').first().hover();await p.waitForFunction(()=>ambient.pointer.strength>.5);
 await p.locator('#settings-open').click();await p.locator('#ambient-mode').selectOption('flow');await p.locator('#settings-close').click();
 assert.equal(await p.evaluate(()=>ambient.mode==='flow'&&ambient.flow instanceof MattParticleFlow&&ambient.windy instanceof MattWindyFlow),true,'Particle flow remains separate');
 await p.locator('#settings-open').click();await p.locator('#ambient-mode').selectOption('windy');await p.locator('#settings-close').click();
 await p.locator('#volume').fill('12');await p.locator('#volume').dispatchEvent('input');assert.equal(await p.locator('#volume').inputValue(),'12','background leaves controls usable');
 const cost=await p.evaluate(()=>{const start=performance.now();for(let i=0;i<100;i++){ambient.time+=1/24;ambient.drawWindy(1/24);}return (performance.now()-start)/100;});console.log('Mean scene draw time:',cost.toFixed(2),'ms');
 for(const appearance of ['retro','apple2','modern']){
  await p.locator('#settings-open').click();await p.locator('#appearance').selectOption(appearance);await p.locator('#settings-close').click();
  assert.equal(await p.evaluate(()=>ambient.canvas.hidden),appearance!=='modern');assert.equal(await p.evaluate(()=>state.ambient),'windy');
 }
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>ambient.canvas.hidden&&!ambient.timer&&!ambient.frame);
 const stopped=await p.evaluate(()=>ambient.time);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>ambient.time),stopped);
 await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!ambient.canvas.hidden);
 await p.locator('#bug-toggle').click();await p.waitForFunction(()=>ambient.canvas.hidden&&!ambient.timer&&!ambient.frame);
 await p.locator('#bug').click();await p.waitForFunction(()=>!ambient.canvas.hidden);
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].hide());await p.waitForFunction(()=>ambient.canvas.hidden&&!ambient.timer&&!ambient.frame);
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].show());await p.waitForFunction(()=>!ambient.canvas.hidden);
 await p.locator('#layout').click();await p.waitForFunction(()=>innerWidth===430);await p.waitForTimeout(250);await p.screenshot({path:'/tmp/mattamp-windy-stack.png'});
 await p.locator('#layout').click();await p.waitForFunction(()=>innerWidth===710);await p.waitForTimeout(250);await p.screenshot({path:'/tmp/mattamp-windy-wide.png'});
 await p.waitForFunction(async()=>(await window.deck.init()).data.state.ambient==='windy');
 await app.close();app=null;p=await launch();await p.waitForFunction(()=>ambient.mode==='windy'&&!ambient.canvas.hidden);assert.equal(await p.evaluate(()=>state.ambient),'windy','effect persists across restart');
 await p.locator('#settings-open').click();await p.locator('#ambient-mode').selectOption('off');await p.waitForFunction(()=>ambient.canvas.hidden&&!ambient.timer&&!ambient.frame);
 assert.deepEqual(errors,[]);console.log('PASS: selection, animation, pointer response, controls, classic-theme suppression, reduced motion, bug/hidden pause, resize, restart persistence and Off.');
 }finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
