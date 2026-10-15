const {_electron}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mattamp-tab-sounds-'));let app;
 fs.writeFileSync(path.join(profile,'state.json'),JSON.stringify({volume:0,podcasts:[],ambient:'off',alwaysOnTop:false}));
 try{
  app=await _electron.launch({chromiumSandbox:true,args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:profile}});
  const p=await app.firstWindow();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.waitForFunction(()=>typeof state!=='undefined'&&state);
  await app.evaluate(({webContents,session})=>{for(const w of webContents.getAllWebContents())w.setAudioMuted(true);session.fromPartition('mattamp-ski-cams').protocol.handle('https',()=>new Response('<html>Camera fixture</html>',{headers:{'content-type':'text/html'}}));});
  await p.evaluate(()=>{state.volume=50;stopStartup();window.voicePlays=[];tabAudio.addEventListener('play',()=>voicePlays.push(tabAudio.src));});
  for(const [tab,clip] of [['game','hell-yeah'],['podcast','meh'],['x','meh'],['cameras','send-it'],['radio','yeah']]){
   const count=await p.evaluate(()=>voicePlays.length);await p.locator('#source-'+tab).click();
   await p.waitForFunction(n=>voicePlays.length>n,count);
   await p.waitForFunction(()=>tabAudio.readyState>=2&&Number.isFinite(tabAudio.duration));
   const result=await p.evaluate(()=>({src:tabAudio.src,duration:tabAudio.duration,volume:tabAudio.volume,error:tabAudio.error}));
   assert.ok(result.src.endsWith('/'+clip+'.mp3'));assert.ok(result.duration>.3&&result.duration<3);assert.equal(result.volume,.5);assert.equal(result.error,null);
  }
  await p.evaluate(()=>{audio.src='/startup.mp3';audio.loop=true;audio.volume=0;return audio.play();});
  await p.locator('#source-game').click();assert.equal(await p.evaluate(()=>audio.paused),false);
  await p.locator('#game-sound').click();assert.equal(await p.evaluate(()=>tabAudio.paused),true);
  let count=await p.evaluate(()=>voicePlays.length);await p.locator('#source-game').click();assert.equal(await p.evaluate(()=>voicePlays.length),count);
  await p.locator('#source-radio').click();await p.locator('#mute').click();count=await p.evaluate(()=>voicePlays.length);
  await p.locator('#source-podcast').click();assert.equal(await p.evaluate(()=>voicePlays.length),count);
  await p.evaluate(()=>{muted=false;});
  await p.locator('#settings-open').click();await p.locator('#tab-sounds').uncheck();
  await p.waitForFunction(async()=>!(await window.deck.init()).data.state.tabSounds);
  await p.locator('#settings-close').click();count=await p.evaluate(()=>voicePlays.length);
  await p.locator('#source-cameras').click();assert.equal(await p.evaluate(()=>voicePlays.length),count);
  await p.reload();await p.waitForFunction(()=>typeof state!=='undefined'&&state);assert.equal(await p.evaluate(()=>state.tabSounds),false);
  await p.locator('#settings-open').click();assert.equal(await p.locator('#tab-sounds').isChecked(),false);
  await p.locator('#tab-sounds').check();await p.waitForFunction(async()=>(await window.deck.init()).data.state.tabSounds);
  await p.screenshot({path:'/tmp/mattamp-tab-sounds-setting.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: four bundled clips decode/play, correct tab mapping, volume/mute, game sound off, radio continuity, saved off/on preference.');
 }finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}
})().catch(e=>{console.error(e);process.exitCode=1;});
