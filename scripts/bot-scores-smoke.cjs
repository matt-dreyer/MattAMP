const {_electron}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-bot-board-'));
fs.writeFileSync(dir+'/state.json',JSON.stringify({volume:0,tabSounds:false,alwaysOnTop:false,layout:'sidecar',ambient:'off'}));
(async()=>{let app;const errors=[];async function launch(){app=await _electron.launch({chromiumSandbox:true,args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:dir}});const p=await app.firstWindow();p.on('pageerror',e=>errors.push(e.message));await p.locator('#stations button').first().waitFor();await p.locator('#source-game').click();return p;}
 try{
  let p=await launch();await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#game-bots').selectOption('5');await p.locator('#game-skill').selectOption('0');await p.locator('#game-chaos').selectOption('off');await p.locator('#game-start').click();
  // Stage a real bot victory using the normal damage/scoring path.
  await p.evaluate(()=>{const b=arcade.battle;b.turn=1;b.fire(90,50,'mirv');for(const t of b.tanks.filter(t=>t.id!==1))while(t.hp>0)b.explode({x:t.x,y:t.y,owner:1,weapon:'child'});b.projectiles=[];b.phase='settle';b.delay=0;});
  await p.waitForFunction(()=>arcade.record&&!arcade.saving&&arcade.scores?.played===1);
  assert.equal(await p.locator('#game-score-rows tr').count(),6);assert.match(await p.locator('#game-score-rows tr').first().textContent(),/Byte · BOT.*WIN/s);
  assert.match(await p.locator('#game-save-status').innerText(),/You’re #2/,'rank message belongs to the human, not the winning bot');
  assert.equal(await p.evaluate(()=>arcade.scores.wins),0);await p.locator('#game-records summary').click();
  for(const width of [710,430]){
   await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setSize(width,1050),width);await p.waitForTimeout(200);await p.locator('#game-records').scrollIntoViewIfNeeded();
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'table scroll stays inside the widget');
   await p.screenshot({path:`/tmp/mattamp-bot-scores-${width}.png`});
  }
  const snapshot=await p.evaluate(()=>JSON.stringify(arcade.scores));await p.evaluate(()=>arcade.saveScore());assert.equal(await p.evaluate(()=>JSON.stringify(arcade.scores)),snapshot,'retry does not double-count participants');
  await app.close();app=null;p=await launch();await p.waitForFunction(()=>arcade.scores?.played===1);assert.equal(await p.evaluate(()=>JSON.stringify(arcade.scores)),snapshot);assert.match(await p.locator('#game-score-rows tr').first().textContent(),/Byte · BOT/);assert.deepEqual(errors,[]);
  console.log('PASS: real bot scoring/save, shared names/results, correct human rank and totals, 710/430 layouts, retry deduplication and persistence across restart.');
 }finally{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
