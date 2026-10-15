const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-sticky-'));
fs.writeFileSync(dir+'/state.json',JSON.stringify({volume:0,alwaysOnTop:false,layout:'stack',ambient:'waves'}));
(async()=>{let app;try{
 app=await _electron.launch({chromiumSandbox:true,args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:dir}});
 const p=await app.firstWindow(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
 await p.locator('#stations button').first().waitFor();await p.locator('#source-game').click();
 await p.locator('.game-credits summary').click();
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(430,550));
 await p.waitForTimeout(300);await p.evaluate(()=>window.scrollTo(0,9999));await p.waitForTimeout(150);
 const checkChrome=async(game=false)=>{
  const layout=await p.evaluate(game=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}};
   const targets=['#settings-open','#source-radio','#source-game',...(game?['#game-expand','#game-sound']:[])];
   return {scroll:scrollY,height:innerHeight,title:rect('.titlebar'),tabs:rect('.sourcebar'),hit:targets.map(s=>{const el=document.querySelector(s),r=el.getBoundingClientRect();return el.contains(document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2));})};
  },game);
  assert.ok(layout.scroll>100,'body really scrolled');assert.ok(layout.title.top>=0&&layout.title.top<=1,'title stays at top');assert.ok(Math.abs(layout.tabs.top-layout.title.bottom)<=1,'tabs stay immediately below title');assert.ok(layout.hit.every(Boolean),'pinned buttons remain clickable');
 };
 await checkChrome(true);await p.screenshot({path:'/tmp/mattamp-sticky-game.png'});
 await p.locator('#settings-open').click();await p.locator('#settings-close').click();
 await p.locator('#source-radio').click();await p.waitForTimeout(300);await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(430,350));await p.waitForTimeout(250);await p.evaluate(()=>window.scrollTo(0,9999));await p.waitForTimeout(100);await checkChrome();
 await p.locator('#layout').click();await p.waitForTimeout(300);
 const sidecar=await p.evaluate(()=>{const r=s=>document.querySelector(s).getBoundingClientRect();return {tabs:r('.sourcebar').bottom,content:r('.content').top,system:r('.system').top,title:r('.titlebar').bottom,overlap:r('.content').right-r('.system').left};});
 assert.ok(Math.abs(sidecar.tabs-sidecar.content)<1);assert.ok(Math.abs(sidecar.system-sidecar.title)<1);assert.ok(sidecar.overlap<=1);
 await p.screenshot({path:'/tmp/mattamp-sticky-sidecar.png'});
 // Native remote content must not paint over pinned controls when scrolled.
 await app.evaluate(({session})=>session.fromPartition('persist:mattamp-x').protocol.handle('https',()=>new Response('<html><body>X fixture</body></html>',{headers:{'content-type':'text/html'}})));
 await p.locator('#layout').click();await p.locator('#source-x').click();await p.waitForTimeout(500);
 const visibleX=()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].contentView.children.some(v=>v.webContents?.getURL().startsWith('https://x.com')&&v.getVisible()));
 assert.equal(await visibleX(),true,'native X visible initially');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(430,400));await p.waitForTimeout(200);await p.evaluate(()=>window.scrollTo(0,250));await p.waitForTimeout(200);await checkChrome();assert.equal(await visibleX(),false,'native X hidden under pinned tabs');
 await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(200);assert.equal(await visibleX(),true,'native X restored after scroll back');
 await app.evaluate(({session})=>{
  session.fromPartition('mattamp-ski-cams').protocol.handle('https',()=>new Response('<html><body>Camera fixture</body></html>',{headers:{'content-type':'text/html'}}));
  const original=global.fetch;global.fetch=(url,...args)=>String(url).includes('sierraattahoe.com')?Promise.resolve(new Response('<script id="sierra-live-webcams-cfg-14">{"cams":{"grandview":{"youtube_video_id":"abcdefghijk"},"westbowl":{"youtube_video_id":"ABCDEFGHIJK"}}}</script>')):original(url,...args);
 });
 await p.locator('#source-cameras').click();await p.waitForTimeout(700);
 const visibleCam=()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].contentView.children.some(v=>v.webContents?.getURL().startsWith('https://')&&!v.webContents.getURL().startsWith('https://x.com')&&v.getVisible()));
 assert.equal(await visibleCam(),true,'native camera visible initially');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(430,320));await p.waitForTimeout(250);await p.evaluate(()=>window.scrollTo(0,200));await p.waitForTimeout(250);assert.equal(await visibleCam(),false,'native camera cannot overlap pinned tabs');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(430,900));await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(500);assert.equal(await visibleCam(),true,'native camera restored');
 assert.deepEqual(errors,[]);console.log('PASS: scrolling game, stacked metrics, sidecar layout, clickable pinned controls, settings, native X/camera overlap and restoration.');
 }finally{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
