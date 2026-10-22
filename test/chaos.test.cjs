const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Battle,rollConditions,describeConditions,GRAVITY}=require('../src/artillery.js');
const {createArcadeStore}=require('../src/arcade-store.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const fixture=(walls='open',gravity='normal')=>{const b=new Battle({chaos:'off',random:rng(17)});b.conditions=Object.freeze({...b.conditions,walls,gravity});return b;};
test('Mixed is the default; Off preserves rules; Mixed rolls one modifier and Unhinged combines both',()=>{
 assert.equal(new Battle().conditions.chaos,'mixed');
 const random=rng(621),seen=new Set();
 for(let i=0;i<1000;i++)for(const mode of ['off','mixed','unhinged']){
  const c=rollConditions(mode,random),modifiers=Number(c.gravity!=='normal')+Number(c.walls!=='open');
  assert.ok(Object.isFrozen(c));assert.equal(modifiers,mode==='off'?0:mode==='mixed'?1:2);
  if(mode==='off')assert.equal(c.terrain,'rolling');else seen.add(c.terrain+':'+c.gravity+':'+c.walls);
 }
 assert.equal(new Set([...seen].map(s=>s.split(':')[0])).size,5);
 assert.ok(seen.has('valley:moon:wrap')&&seen.has('crags:heavy:ricochet'));
});
test('every terrain keeps tanks on safe flat pads and conditions stay fixed across turns',()=>{
 const shapes=new Map();
 for(let seed=1;seed<=150;seed++){
  const b=new Battle({chaos:'unhinged',bots:5,random:rng(seed*12345)}),conditions=b.conditions;
  assert.ok([...b.terrain].every(y=>Number.isFinite(y)&&y>=170&&y<=450));
  for(const t of b.tanks){assert.equal(t.y,b.ground(t.x)-8);for(let x=Math.round(t.x)-18;x<=t.x+18;x++)assert.equal(b.terrain[x],t.y+8);}
  shapes.set(conditions.terrain,Math.max(...b.terrain)-Math.min(...b.terrain));
  b.nextTurn();b.nextTurn();assert.strictEqual(b.conditions,conditions);
 }
 assert.equal(shapes.size,5);assert.ok(shapes.get('flat')<30);assert.ok(shapes.get('crags')>150);
});
test('Off keeps its opening wind through rounds, eliminations and the final result; new battles roll anew',()=>{
 const random=rng(813),winds=new Set();
 for(let game=0;game<20;game++){
  const b=new Battle({chaos:'off',random}),wind=b.wind;winds.add(wind);
  b.newWind=()=>{throw new Error('Normal battle must not reroll wind');};
  for(let turn=0;turn<30;turn++){if(turn===10)b.tanks[2].hp=0;b.nextTurn();assert.equal(b.wind,wind);}
  assert.ok(b.round>1);b.tanks.slice(1).forEach(t=>t.hp=0);b.nextTurn();assert.equal(b.phase,'over');assert.equal(b.wind,wind);
 }
 assert.ok(winds.size>1,'each new battle gets a fresh opening wind');
});
test('Mixed and Unhinged still change wind on each turn',()=>{
 for(const chaos of ['mixed','unhinged']){
  const b=new Battle({chaos,random:rng(32)});let rolls=0;b.newWind=()=>++rolls%2?37:-82;
  for(let turn=1;turn<=12;turn++){b.nextTurn();assert.equal(rolls,turn);assert.equal(b.wind,turn%2?37:-82);}
 }
});
test('Moonshot lengthens arcs and heavy gravity shortens them',()=>{
 // Keep every landing inside the field so open-edge exits cannot mask gravity.
 const ranges=[];
 for(const gravity of ['moon','normal','heavy']){const b=fixture('open',gravity);b.wind=0;b.terrain.fill(440);b.active.x=100;b.active.y=432;b.tanks.slice(1).forEach(t=>t.hp=0);ranges.push(b.predict(b.active,45,40).x);}
 assert.ok(ranges[0]>ranges[1]+80&&ranges[1]>ranges[2]+80);
});
test('side walls reflect without energy gain or wrap overshoot without flipping direction',()=>{
 for(const side of [-1,1])for(const walls of ['ricochet','wrap','open']){
  const b=fixture(walls);b.wind=0;const p={x:side<0?1:999,y:20,vx:side*300,vy:0,time:0};b.move(p,.02);
  assert.equal(Math.abs(p.vx),300);
  if(walls==='open')assert.ok(p.x<0||p.x>1000);
  if(walls==='ricochet'){assert.equal(p.vx,-side*300);assert.equal(p.x,side<0?5:995);assert.equal(p.trailBreak,false);}
  if(walls==='wrap'){assert.equal(p.vx,side*300);assert.equal(p.x,side<0?995:5);assert.equal(p.trailBreak,true);}
 }
});
test('actual shell impacts match bot prediction across both walls, gravities and extreme winds',()=>{
 for(const walls of ['ricochet','wrap'])for(const gravity of Object.keys(GRAVITY))for(const wind of [-150,0,150]){
  const b=fixture(walls,gravity);b.wind=wind;const expected=b.predict(b.active,35,70);let hit;
  const explode=b.explode.bind(b);b.explode=p=>{hit={...p};explode(p);};b.fire(35,70);
  for(let i=0;i<2500&&b.phase==='flight';i++)b.step(1/120/2.3);
  assert.equal(b.phase,'settle');assert.ok(hit,`${walls}/${gravity}/${wind} impacts within flight limit`);
  assert.ok(Math.abs(hit.x-expected.x)<.01&&Math.abs(hit.y-expected.y)<.01);
 }
});
test('wrap trails break at portals and the opposite edge can hit a tank',()=>{
 const b=fixture('wrap');b.wind=0;b.terrain.fill(440);b.tanks.forEach(t=>{t.x=500;t.y=432;});
 b.tanks[1].x=10;b.tanks[1].y=50;b.phase='flight';b.projectiles=[{x:999,y:50,vx:600,vy:0,owner:0,weapon:'shell',time:1,trail:[{x:995,y:50}]}];b.step(1/120/2.3);
 assert.equal(b.phase,'settle');assert.ok(b.tanks[1].hp<100);assert.equal(b.lastTrails[0].at(-1).moveTo,true);
});
test('MIRVs resolve in all arena combinations and expired shots dissipate',()=>{
 for(const walls of ['ricochet','wrap'])for(const gravity of ['moon','heavy']){
  const b=fixture(walls,gravity);b.wind=45;b.fire(90,60,'mirv');let split=false;
  for(let i=0;i<2200&&b.phase==='flight';i++){b.step(1/60);split ||= b.projectiles.some(p=>p.weapon==='child');}
  assert.ok(split);assert.equal(b.phase,'settle');assert.ok(b.tanks.every(t=>Number.isFinite(t.hp)));
 }
 const b=fixture('wrap');b.fire(90,100);Object.assign(b.projectiles[0],{y:-1e7,time:19.99});b.step(.05);assert.equal(b.phase,'settle');assert.equal(b.blasts.length,0);
});
test('bot search considers bank and wrap routes on either side',()=>{
 for(const walls of ['ricochet','wrap']){
  const b=fixture(walls);b.turn=1;const angles=[];b.predict=(tank,angle)=>{angles.push(angle);return {x:500,y:320};};b.botAim();
  assert.ok(angles.some(a=>a<90)&&angles.some(a=>a>90));
 }
});
test('scores preserve arena conditions and old records load as the original rules',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-chaos-score-'));
 try{
  const store=createArcadeStore(path.join(dir,'scores.json')),b=new Battle({random:rng(991),chaos:'unhinged'});b.tanks.slice(1).forEach(t=>t.hp=0);b.nextTurn();
  const record=b.record('MAT','chaos-record-000001');store.record(record);
  assert.deepEqual(store.read().scores[0].conditions,b.conditions);assert.match(describeConditions(b.conditions),/Unhinged/);
  const legacy={...record,id:'legacy-record-00001'};delete legacy.conditions;store.record(legacy);assert.equal(store.read().scores.find(s=>s.id===legacy.id).conditions.chaos,'off');
  assert.throws(()=>store.record({...record,id:'invalid-record-001',conditions:{...record.conditions,walls:'__proto__'}}),/Invalid arena/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
