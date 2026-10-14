const {_electron}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mattamp-game-'));
fs.writeFileSync(path.join(profile,'state.json'),JSON.stringify({volume:0,alwaysOnTop:false,ambient:'stars',layout:'sidecar'}));
const captures=path.join(profile,'captures');fs.mkdirSync(captures);
let app;const errors=[];
async function launch(){app=await _electron.launch({ignoreDefaultArgs:['--no-sandbox'],args:[path.resolve(__dirname,'..')],env:{...process.env,DECK_TEST_DIR:profile}});const p=await app.firstWindow();p.on('pageerror',e=>errors.push(e.message));await p.locator('#stations button').first().waitFor();return p;}
(async()=>{try{
 let p=await launch();await p.locator('#source-game').click();await p.locator('#game-sound').click();await p.waitForFunction(()=>arcade.assets['metal-slug-tank']&&arcade.assets['metal-slug-blasts']);await p.screenshot({path:path.join(captures,'mattamp-game-setup.png')});
 await p.locator('#game-initials').fill('TST');await p.locator('#game-bots').selectOption('5');await p.locator('#game-skill').selectOption('2');await p.locator('#game-start').click();assert.equal(await p.locator('.game-tank-stat').count(),6);assert.equal(await p.locator('#game-controls').isDisabled(),false);
 await p.keyboard.press('ArrowUp');assert.equal(await p.locator('#game-power').inputValue(),'56');await p.keyboard.press('ArrowDown');assert.equal(await p.locator('#game-power').inputValue(),'55');
 await p.evaluate(()=>{audio.src='/startup.mp3';audio.loop=true;audio.muted=true;return audio.play();});
 await p.locator('#game-weapon-mirv').check();await p.locator('#game-canvas').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>arcade.battle.projectiles.length>0);await p.screenshot({path:path.join(captures,'mattamp-game-battle-wide.png')});
 await p.locator('#source-radio').click();const snap=await p.evaluate(()=>JSON.stringify(arcade.battle));await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>JSON.stringify(arcade.battle)),snap);assert.equal(await p.evaluate(()=>audio.paused),false);
 await p.locator('#source-game').click();await p.locator('#game-pause').click();const paused=await p.evaluate(()=>JSON.stringify(arcade.battle));await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>JSON.stringify(arcade.battle)),paused);
 await p.locator('#layout').click();await p.waitForFunction(()=>innerWidth===430);await p.waitForTimeout(400);await p.screenshot({path:path.join(captures,'mattamp-game-battle-stack.png')});
 await p.locator('#game-pause').click();
 // Settings and Bug mode also freeze projectiles without disturbing radio.
 await p.locator('#settings-open').click();const settingsSnap=await p.evaluate(()=>JSON.stringify(arcade.battle));await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>JSON.stringify(arcade.battle)),settingsSnap);await p.locator('#settings-close').click();
 await p.locator('#bug-toggle').click();await p.waitForFunction(()=>innerWidth===56);const bugSnap=await p.evaluate(()=>JSON.stringify(arcade.battle));await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>JSON.stringify(arcade.battle)),bugSnap);await p.locator('#bug').click();await p.waitForFunction(()=>innerWidth===430);assert.equal(await p.locator('#game-panel').isVisible(),true);
 // Finish a deterministic fixture in this isolated profile to exercise results and disk persistence.
 await p.evaluate(()=>{for(const t of arcade.battle.tanks.slice(1)){while(t.hp>0)arcade.battle.explode({x:t.x,y:t.y,owner:0,weapon:'shell'});}arcade.battle.projectiles=[];arcade.battle.phase='settle';arcade.battle.delay=0;});
 await p.waitForFunction(()=>document.querySelector('#game-save-status').textContent.startsWith('Saved.'));await p.locator('#game-records summary').click();await p.screenshot({path:path.join(captures,'mattamp-game-scores.png')});
 assert.equal(await p.locator('#game-score-rows tr').count(),1);assert.equal(await p.evaluate(()=>arcade.scores.wins),1);
 for(const clip of ['worms-fire','worms-blast-1','worms-blast-2','worms-blast-3','worms-split']){const duration=await p.evaluate(async clip=>{const a=new Audio('/arcade/'+clip+'.ogg');a.muted=true;await a.play();a.pause();return a.duration;},clip);assert.ok(duration>0);}
 await app.close();app=null;p=await launch();await p.locator('#source-game').click();await p.waitForFunction(()=>arcade.scores?.played===1);assert.equal(await p.locator('#game-initials').inputValue(),'TST');assert.equal(await p.evaluate(()=>arcade.scores.wins),1);
 await p.locator('#source-radio').click();await p.locator('#layout').click();await p.waitForFunction(()=>innerWidth===710);await p.waitForTimeout(400);await p.screenshot({path:path.join(captures,'mattamp-game-radio-regression.png')});
 assert.deepEqual(errors,[]);console.log('PASS: sprites, six tanks, MIRV, pause/tab switch, radio continuity, Settings, Bug mode, layouts, sound decode, saved scores across restart.');
 }finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
