const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mattamp-power-'));
fs.writeFileSync(path.join(profile,'state.json'),JSON.stringify({volume:0,tabSounds:false,alwaysOnTop:false,ambient:'waves',layout:'sidecar'}));
(async()=>{let app;try{
 app=await _electron.launch({chromiumSandbox:true,args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:profile}});
 const p=await app.firstWindow(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.locator('#stations button').first().waitFor();await p.locator('#source-game').click();await p.waitForFunction(()=>arcade.scores&&arcade.assets['metal-slug-tank']);
 await p.locator('#game-initials').fill('MAT');await p.locator('#game-sound').click();await p.locator('#game-start').click();
 assert.equal(await p.locator('#game-power').inputValue(),'50');assert.equal(await p.locator('#game-power-value').textContent(),'50%');
 await p.locator('#game-power').fill('1');await p.locator('#game-power').dispatchEvent('input');await p.locator('#game-power').focus();await p.keyboard.press('ArrowDown');assert.equal(await p.locator('#game-power').inputValue(),'1');
 await p.keyboard.press('ArrowUp');assert.equal(await p.locator('#game-power').inputValue(),'2');
 await p.locator('#game-power').fill('100');await p.locator('#game-power').dispatchEvent('input');await p.keyboard.press('ArrowUp');assert.equal(await p.locator('#game-power').inputValue(),'100');
 await p.locator('#game-power-value').hover();await p.mouse.wheel(0,80);await p.waitForFunction(()=>document.querySelector('#game-power').value==='99');
 await p.locator('#game-power').fill('50');await p.locator('#game-power').dispatchEvent('input');
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(710,900));await p.waitForTimeout(3500);await p.locator('#game-canvas').focus();
 await p.screenshot({path:'/tmp/mattamp-power-widget.png'});
 await p.locator('#game-expand').click();await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1160,900));await p.waitForTimeout(250);await p.screenshot({path:'/tmp/mattamp-power-expanded.png'});await p.locator('#game-expand').click();
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(710,900));await p.waitForTimeout(150);
 const botShot=()=>p.evaluate(()=>{
  cancelAnimationFrame(arcade.raf);const b=arcade.battle;b.turn=1;b.phase='aim';b.delay=1;b.projectiles=[];
  b.botAim=()=>({angle:66,power:54,weapon:'shell'});arcade.last=100;arcade.tick(116);cancelAnimationFrame(arcade.raf);
 });
 await botShot();assert.equal(await p.locator('#game-shot').textContent(),'Byte · 66° · 54% power');assert.equal(await p.locator('#game-shot').isVisible(),true);
 assert.deepEqual(await p.evaluate(()=>({angle:arcade.battle.active.angle,power:arcade.battle.active.power})),{angle:66,power:54});
 assert.equal(await p.locator('#game-power').inputValue(),'50','bot readout never overwrites player power');
 for(const width of [710,430]){
  if(width===430)await p.locator('#layout').click();await p.waitForFunction(w=>innerWidth===w,width);await p.waitForTimeout(100);
  assert.equal(await p.locator('#game-shot').evaluate(el=>{const r=el.getBoundingClientRect(),f=el.parentElement.getBoundingClientRect();return r.left>=f.left&&r.right<=f.right&&r.top>=f.top&&r.bottom<=f.bottom;}),true);
  await p.screenshot({path:`/tmp/mattamp-bot-shot-${width}.png`});if(width===710)await p.locator('.game-field').screenshot({path:'/tmp/mattamp-bot-readout.png'});
 }
 await p.waitForFunction(()=>document.querySelector('#game-shot').hidden,null,{timeout:4500});
 await botShot();await p.locator('#source-radio').click();assert.equal(await p.locator('#game-shot').isVisible(),false);
 await p.locator('#source-game').click();await botShot();await p.evaluate(()=>arcade.reset());assert.equal(await p.locator('#game-shot').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS: 1–100% power, keyboard/wheel limits, real bot-shot values, unchanged player aim, timed dismissal, tab/reset cleanup and 710/430 layouts.');
 }finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
