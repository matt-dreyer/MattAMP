const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-window-order-'));
fs.writeFileSync(path.join(dir,'state.json'),JSON.stringify({volume:0,tabSounds:false,ambient:'off',podcasts:[]}));
(async()=>{let app;try{
 const launch=()=>_electron.launch({chromiumSandbox:true,args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:dir}});
 app=await launch();let p=await app.firstWindow();await p.locator('#stations button').first().waitFor();
 const pinned=()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isAlwaysOnTop());
 assert.equal(await pinned(),false,'default window participates in normal stacking');
 await p.locator('#settings-open').press('Enter');await p.locator('#always-top').check();await p.waitForFunction(()=>state.alwaysOnTop===true);await p.waitForTimeout(100);assert.equal(await pinned(),true,'opt-in pins native window');
 await p.locator('#settings-close').press('Enter');await p.locator('#bug-toggle').press('Enter');await p.waitForTimeout(150);assert.equal(await pinned(),true,'bug preserves opt-in');await p.locator('#bug').press('Enter');
 await app.close();app=await launch();p=await app.firstWindow();await p.locator('#stations button').first().waitFor();assert.equal(await pinned(),true,'explicit pin survives restart');
 await p.locator('#settings-open').press('Enter');await p.locator('#always-top').uncheck();await p.waitForTimeout(100);assert.equal(await pinned(),false,'unpin updates native window immediately');
 await app.close();app=await launch();p=await app.firstWindow();await p.locator('#stations button').first().waitFor();assert.equal(await pinned(),false,'normal stacking survives restart');
 console.log('PASS: native window default, optional pin/unpin, bug mode, and restart persistence.');
 }finally{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
