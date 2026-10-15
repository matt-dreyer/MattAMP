const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {Battle}=require('../src/artillery.js'),{createArcadeStore}=require('../src/arcade-store.cjs');
function victory(winner,id='shared-battle-00001'){
 const b=new Battle({bots:3,skill:0,chaos:'off',random:()=>.4});b.turn=winner;
 assert.ok(b.fire(90,50,'mirv'));assert.equal(b.fire(90,50,'mirv'),false);
 for(const tank of b.tanks.filter(t=>t.id!==winner))while(tank.hp>0)b.explode({x:tank.x,y:tank.y,owner:winner,weapon:'child'});
 b.projectiles=[];b.nextTurn();return {b,row:b.record('MAT',id)};
}
test('every tank earns the same damage, knockout and survivor points; MIRVs count as one shot',()=>{
 for(let winner=0;winner<4;winner++){
  const {b,row}=victory(winner),tank=b.tanks[winner];
  assert.equal(tank.damage,300);assert.equal(tank.kills,3);assert.equal(tank.shots,1);assert.equal(b.scoreFor(tank),5250);
  const score=winner?row.botScores.find(s=>s.tankId===winner):row;
  assert.equal(score.score,5250);assert.equal(score.win,true);assert.equal(score.kills,3);assert.equal(score.shots,1);
  for(const other of b.tanks.filter(t=>t.id!==winner))assert.equal(b.scoreFor(other),0);
 }
});
test('bot self damage earns nothing, falls credit the attacker and repeated blasts cannot duplicate kills',()=>{
 const b=new Battle({bots:3,chaos:'off',random:()=>.4}),bot=b.tanks[1],target=b.tanks[2];
 b.explode({x:bot.x,y:bot.y,owner:1,weapon:'shell'});assert.equal(bot.damage,0);assert.equal(bot.kills,0);
 while(target.hp>0)b.explode({x:target.x,y:target.y,owner:1,weapon:'shell'});
 assert.equal(bot.damage,100);assert.equal(bot.kills,1);
 b.explode({x:target.x,y:target.y,owner:1,weapon:'shell'});assert.equal(bot.kills,1);assert.equal(bot.damage,100);
 const falling=b.tanks[3];b.terrain.fill(520,Math.floor(falling.x)-20,Math.ceil(falling.x)+21);
 const before=falling.hp;b.explode({x:0,y:20,owner:1,weapon:'child'});assert.ok(falling.hp<before);assert.equal(bot.damage,100+before-falling.hp);
});
test('shared scores persist and deduplicate a whole match without inflating player totals',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-bot-scores-'));try{
  const file=path.join(dir,'scores.json'),store=createArcadeStore(file),{row}=victory(1);
  store.record(row);store.record(row);const data=createArcadeStore(file).read();
  assert.equal(data.scores.length,4);assert.equal(data.scores[0].tankId,1);assert.equal(data.scores[0].score,5250);
  assert.equal(data.played,1);assert.equal(data.wins,0);assert.equal(data.initials,'MAT');assert.equal(data.rivalry.length,1);
  for(let i=2;i<=5;i++)store.record(victory(i%4,'shared-battle-0000'+i).row);
  const capped=store.read();assert.equal(capped.scores.length,10);assert.equal(capped.played,5);assert.equal(capped.wins,1);
  assert.ok(capped.scores.some(s=>s.tankId===0)&&capped.scores.some(s=>s.tankId>0));
  assert.ok(capped.scores.every((s,i,a)=>!i||s.score<=a[i-1].score));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('old human records remain human, including initials matching a bot name',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-legacy-scores-'));try{
  const file=path.join(dir,'scores.json'),row={...victory(0).row,initials:'DOS',date:'2026-10-01T00:00:00Z'};delete row.botScores;delete row.memory;
  fs.writeFileSync(file,JSON.stringify({version:1,initials:'DOS',played:1,wins:1,scores:[row],recent:[row.id]}));
  const store=createArcadeStore(file);assert.equal(store.read().scores[0].tankId,0);
  store.record(victory(1,'new-shared-battle-01').row);const data=store.read();
  assert.equal(data.scores.length,5);assert.ok(data.scores.some(s=>s.initials==='DOS'&&s.tankId===0));assert.equal(data.played,2);assert.equal(data.wins,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('invalid bot batches never partially save, and draws award nobody a win bonus',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-invalid-scores-'));try{
  const file=path.join(dir,'scores.json'),store=createArcadeStore(file);store.record(victory(0).row);const original=fs.readFileSync(file,'utf8');
  const {row}=victory(1,'invalid-shared-battle');
  const cases=[{...row,botScores:[]},{...row,botScores:[row.botScores[0],row.botScores[0],row.botScores[2]]},{...row,botScores:row.botScores.map((s,i)=>i?s:{...s,tankId:5})},{...row,botScores:row.botScores.map((s,i)=>i?s:{...s,score:Infinity})},{...row,botScores:row.botScores.map((s,i)=>i?s:{...s,result:'loss',win:false})},{...row,memory:undefined}];
  for(const input of cases){assert.throws(()=>store.record(input));assert.equal(fs.readFileSync(file,'utf8'),original);}
  const b=new Battle({bots:3,skill:0});b.tanks.forEach(t=>t.hp=0);b.nextTurn();const draw=b.record('MAT','shared-draw-battle-01');
  assert.ok(draw.botScores.every(s=>!s.win&&s.result==='draw'&&s.score===0));store.record(draw);assert.equal(store.read().wins,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
