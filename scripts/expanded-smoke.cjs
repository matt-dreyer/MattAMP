const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-expanded-'));
fs.writeFileSync(dir+'/state.json',JSON.stringify({volume:0,alwaysOnTop:false,layout:'sidecar',ambient:'waves'}));
(async()=>{let app;try{
 app=await _electron.launch({ignoreDefaultArgs:['--no-sandbox'],args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:dir}});
 const p=await app.firstWindow(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.locator('#stations button').first().waitFor();await p.locator('#source-game').click();await p.locator('#game-sound').click();await p.locator('#game-start').click();
 await p.evaluate(()=>{audio.src='/startup.mp3';audio.muted=true;audio.loop=true;return audio.play();});
 const battle=await p.evaluate(()=>JSON.stringify(arcade.battle));
 await p.locator('#game-expand').click();await p.waitForFunction(()=>innerWidth>710);
 for(const [width,height] of [[2200,1200],[1000,820],[640,480]]){
  await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setSize(...size),[width,height]);await p.waitForTimeout(250);
  await p.evaluate(()=>window.scrollTo(0,9999));
  const layout=await p.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   return {height:innerHeight,scroll:scrollY,overflow:document.documentElement.scrollHeight-innerHeight,canvas:rect('#game-canvas'),controls:rect('#game-controls'),visible:['.titlebar','.sourcebar','#game-expand','#game-fire'].map(rect)};
  });
  assert.equal(layout.scroll,0,'window cannot scroll titlebar away');assert.ok(layout.overflow<=1,'no document overflow');
  for(const r of layout.visible)assert.ok(r.top>=0&&r.bottom<=layout.height,'essential controls fit viewport');
  assert.ok(Math.abs(layout.canvas.width/layout.canvas.height-1000/540)<.01,'battlefield keeps aspect ratio');assert.ok(layout.canvas.height>80,'battlefield stays usable');
  assert.ok(layout.canvas.bottom<=layout.controls.top,'controls clear battlefield');assert.ok(layout.controls.width<=901,'bounded aiming strip');
  assert.equal(await p.evaluate(()=>JSON.stringify(arcade.battle)),battle,'resize preserves battle');assert.equal(await p.evaluate(()=>audio.paused),false,'radio continues');
  await p.screenshot({path:`/tmp/mattamp-expanded-${width}.png`});
 }
 await p.locator('#game-records summary').click();await p.locator('.game-credits summary').click();
 assert.equal(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true,'open records and credits remain contained');
 await p.locator('#game-expand').click();await p.waitForFunction(()=>innerWidth===710);assert.equal(await p.locator('#deck').evaluate(el=>el.classList.contains('arcade-expanded')),false);
 await p.screenshot({path:'/tmp/mattamp-expanded-restored.png'});assert.deepEqual(errors,[]);
 console.log('PASS: expanded viewport at 2200×1200, 1000×820 and 640×480; persistent chrome, bounded controls, aspect ratio, records, restoration, battle and audio continuity.');
 }finally{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
