const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Battle}=require('../src/artillery.js');
const {createArcadeStore}=require('../src/arcade-store.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
function rng(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function battle(options={}){return new Battle({random:rng(123),chaos:'off',...options});}
function finishFlight(b){for(let i=0;i<2000&&!['aim','over'].includes(b.phase);i++)b.step(1/30);assert.ok(['aim','over'].includes(b.phase),'shot resolves');}
test('three to five bots spawn on terrain, with equal health and ammunition',()=>{
 for(const bots of [3,4,5]){const b=battle({bots});assert.equal(b.tanks.length,bots+1);assert.equal(b.active.id,0);assert.equal(new Set(b.tanks.map(t=>t.x)).size,bots+1);for(const t of b.tanks){assert.equal(t.hp,100);assert.equal(t.mirvs,3);assert.equal(t.y,b.ground(t.x)-8);}}
});
test('wind bends trajectories, while prediction agrees with actual first impact',()=>{
 const b=battle();b.wind=-18;const left=b.predict(b.active,70,55);b.wind=18;const right=b.predict(b.active,70,55);assert.ok(right.x>left.x+50);
 b.fire(70,55);let hit;const explode=b.explode.bind(b);b.explode=p=>{hit={...p};explode(p);};finishFlight(b);assert.ok(Math.abs(hit.x-right.x)<3);assert.ok(Math.abs(hit.y-right.y)<3);
});
test('wind has occasional extreme gusts, calm turns and balanced directions',()=>{
 const b=battle({random:rng(934)}),counts=[0,0,0];let left=0,right=0,calm=0;
 for(let i=0;i<20000;i++){const w=b.newWind(),n=Math.abs(w);assert.ok(Number.isInteger(w)&&n<=150);counts[n<=30?0:n<=75?1:2]++;if(w<0)left++;else if(w>0)right++;else calm++;}
 assert.ok(counts[0]>11400&&counts[0]<12600,'most turns remain manageable');
 assert.ok(counts[1]>5400&&counts[1]<6600,'strong crosswinds are common');
 assert.ok(counts[2]>1600&&counts[2]<2400,'wild gusts remain occasional');
 assert.ok(calm>0);assert.ok(Math.abs(left-right)<600,'no directional bias');
});
test('extreme winds bend shots sharply, stay fixed in flight and match prediction',()=>{
 const endpoints=[];
 for(const wind of [-150,150]){
  const b=battle();b.wind=wind;const expected=b.predict(b.active,90,55);endpoints.push(expected.x);
  let hit;const explode=b.explode.bind(b);b.explode=p=>{hit={...p};explode(p);};b.fire(90,55);
  for(let i=0;i<2000&&b.phase==='flight';i++){b.step(1/120/2.3);assert.equal(b.wind,wind);}
  assert.equal(b.phase,'settle');assert.ok(Number.isFinite(hit.x)&&Number.isFinite(hit.y));
  assert.ok(Math.abs(hit.x-expected.x)<1&&Math.abs(hit.y-expected.y)<1,'bot prediction and real shells share gust physics');
 }
 assert.ok(endpoints[1]-endpoints[0]>500,'a wild gust can sweep a high shot across the battlefield');
});
test('bots and MIRVs remain finite and resolve under either extreme wind',()=>{
 for(const wind of [-150,150])for(const skill of [0,1,2,3]){
  const b=battle({skill});b.wind=wind;b.turn=1;const aim=b.botAim();assert.ok(Number.isFinite(aim.angle)&&Number.isFinite(aim.power));
  b.fire(aim.angle,aim.power,'mirv');finishFlight(b);assert.ok(b.tanks.every(t=>Number.isFinite(t.hp)&&Number.isFinite(t.y)));
 }
});
test('MIRV splits into five warheads, charges once, and resolves its whole volley before changing turn',()=>{
 const b=battle();b.wind=0;assert.ok(b.fire(90,45,'mirv'));assert.equal(b.tanks[0].mirvs,2);assert.equal(b.shots,1);assert.equal(b.fire(90,45),false);
 for(let i=0;i<1000&&b.projectiles.length===1&&b.phase==='flight';i++)b.step(1/60);
 assert.equal(b.projectiles.length,5);assert.equal(b.turn,0);assert.ok(b.projectiles.every(p=>p.weapon==='child'));finishFlight(b);
});
test('empty MIRV magazine and invalid shots cannot consume a turn',()=>{
 const b=battle();b.active.mirvs=0;assert.equal(b.fire(45,60,'mirv'),false);assert.equal(b.fire(NaN,60),false);assert.equal(b.fire(45,60,'nuke'),false);assert.equal(b.phase,'aim');assert.equal(b.shots,0);
});
test('craters lower terrain, fall damage settles tanks, and kills are counted once',()=>{
 const b=battle(),target=b.tanks[1],before=b.ground(target.x);b.explode({x:target.x,y:target.y,owner:0,weapon:'shell'});
 assert.ok(b.ground(target.x)>before);assert.equal(target.y,b.ground(target.x)-8);assert.ok(target.hp<100);b.explode({x:target.x,y:target.y,owner:0,weapon:'shell'});b.explode({x:target.x,y:target.y,owner:0,weapon:'shell'});
 assert.equal(target.hp,0);assert.equal(b.kills,1);assert.equal(b.damage,100);
});
test('self damage and enemy-versus-enemy damage award no player points',()=>{
 const b=battle();b.explode({x:b.tanks[0].x,y:b.tanks[0].y,owner:0,weapon:'shell'});b.explode({x:b.tanks[1].x,y:b.tanks[1].y,owner:2,weapon:'shell'});assert.equal(b.score,0);
});
test('turn order skips destroyed tanks and result is final',()=>{
 const b=battle();b.tanks[1].hp=0;b.nextTurn();assert.equal(b.active.id,2);
 for(const t of b.tanks.slice(1))t.hp=0;b.nextTurn();assert.equal(b.result,'win');assert.equal(b.phase,'over');const score=b.score;b.step(.05);assert.equal(b.score,score);assert.equal(b.fire(90,50),false);assert.equal(b.record('MAT','test-result-id-123').win,true);
});
test('mutual destruction is a draw; unfinished battles produce no record',()=>{
 const b=battle();assert.equal(b.record('MAT','test-result-id-123'),null);for(const t of b.tanks)t.hp=0;b.nextTurn();assert.equal(b.result,'draw');assert.equal(b.record('MAT','test-result-id-123').win,false);
});
test('stronger skill earns more points and bots shoot at other bots too',()=>{
 const easy=battle({skill:0}),hard=battle({skill:3});easy.damage=hard.damage=100;assert.ok(hard.score>easy.score);
 const targets=new Set();for(const pick of [0,.99]){const b=battle();b.turn=1;b.tanks.forEach((t,i)=>{t.x=[100,500,300,700,900][i];});let first=true;const random=rng(41);b.random=()=>{if(first){first=false;return pick;}return random();};b.predict=()=>({x:500,y:320});const aim=b.botAim();targets.add(aim.angle<90?'right':'left');assert.ok(aim.power>=10&&aim.power<=100);}assert.equal(targets.size,2);
});
test('high scores persist, rank, cap at ten, and deduplicate retried results',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mattamp-scores-'));try{
  const file=path.join(dir,'scores.json'),store=createArcadeStore(file);assert.equal(store.read().played,0);
  const row={id:'battle-000000000001',initials:'MAT',score:100,win:true,result:'win',bots:4,skill:1,kills:2,shots:8};
  store.record(row);store.record(row);assert.equal(store.read().played,1);
  for(let i=2;i<=12;i++)store.record({...row,id:'battle-'+String(i).padStart(12,'0'),score:i*100});
  const loaded=createArcadeStore(file).read();assert.equal(loaded.played,12);assert.equal(loaded.wins,12);assert.equal(loaded.scores.length,10);assert.equal(loaded.scores[0].score,1200);assert.equal(loaded.initials,'MAT');assert.equal(fs.statSync(file).mode&0o777,0o600);
  assert.throws(()=>store.record({...row,initials:'<script>'}));assert.throws(()=>store.record({...row,score:Infinity}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('damaged score files are preserved rather than silently overwritten',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mattamp-scores-'));try{const file=path.join(dir,'scores.json');fs.writeFileSync(file,'broken');const store=createArcadeStore(file);assert.throws(()=>store.read(),/kept/);assert.equal(fs.readFileSync(file,'utf8'),'broken');}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

const memory=(winner=null)=>({winner,damage:Array.from({length:6},()=>Array(6).fill(0))});
test('rivalries favor actual attackers and repeat winners, equally for humans and bots',()=>{
 const recent=memory(3);recent.damage[2][1]=70;
 const b=battle({history:[memory(3),recent]});b.turn=1;
 const choices=b.targetChoices();assert.equal(choices.find(c=>c.tank.id===2).reason,'grudge');assert.equal(choices.find(c=>c.tank.id===3).reason,'leader');assert.equal(choices.find(c=>c.tank.id===0).weight,1);
 b.random=rng(91);const counts=Array(6).fill(0);for(let i=0;i<3000;i++)counts[b.chooseTarget().id]++;
 assert.ok(counts[2]>counts[0]*1.8);assert.ok(counts[3]>counts[0]*1.8);assert.ok(counts[0]>0&&counts[4]>0);
 for(const target of [0,2]){const m=memory(target);m.damage[target][1]=70;const game=battle({history:[m,m]});game.turn=1;assert.equal(game.targetChoices().find(c=>c.tank.id===target).weight,5);}
});
test('grudges fade for three completed games and absent rivals never become targets',()=>{
 const wound=memory();wound.damage[2][1]=70;
 const weight=history=>{const b=battle({bots:3,history});b.turn=1;return b.targetChoices().find(c=>c.tank.id===2).weight;};
 assert.ok(weight([wound])>weight([wound,memory()]));assert.ok(weight([wound,memory()])>weight([wound,memory(),memory()]));assert.equal(weight([wound,memory(),memory(),memory()]),1);
 const b=battle({bots:3,history:[memory(5),memory(5)]});b.turn=1;assert.ok(b.targetChoices().every(c=>c.weight===1&&c.tank.id!==5));
});
test('rivalry ledger attributes blast and fall damage to bots and excludes self damage',()=>{
 const b=battle(),target=b.tanks[1];b.explode({x:target.x,y:target.y,owner:2,weapon:'shell'});assert.equal(b.damageLedger[2][1],100-target.hp);
 b.explode({x:target.x,y:target.y,owner:2,weapon:'shell'});assert.equal(b.damageLedger[2][1],100);
 const self=b.tanks[2];b.explode({x:self.x,y:self.y,owner:2,weapon:'shell'});assert.equal(b.damageLedger[2][2],0);assert.equal(b.score,0);
});
test('surviving bots earn an offscreen winner without changing the visible result or score',async()=>{
 const b=battle({bots:3,skill:3});b.tanks[0].hp=0;b.nextTurn();const before=JSON.stringify(b),result=await b.finishRivals();
 assert.equal(JSON.stringify(b),before);assert.ok([1,2,3].includes(result.winner));assert.ok(result.damage.flat().some(n=>n>0));
 const won=battle();won.tanks.slice(1).forEach(t=>t.hp=0);won.nextTurn();assert.equal((await won.finishRivals()).winner,0);
});
test('rivalry persists separately from high scores, expires and deduplicates with old saves intact',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'amp-rivalry-'));try{
  const file=path.join(dir,'scores.json'),store=createArcadeStore(file);
  const row={id:'battle-memory-0001',initials:'MAT',score:0,win:false,result:'loss',bots:4,skill:1,kills:0,shots:1,memory:memory(2)};row.memory.damage[2][1]=60;
  store.record(row);store.record(row);assert.equal(store.read().rivalry.length,1);
  for(let i=2;i<=4;i++)store.record({...row,id:'battle-memory-000'+i,memory:memory(i)});
  assert.deepEqual(createArcadeStore(file).read().rivalry.map(m=>m.winner),[2,3,4]);
  const invalid=memory(1);invalid.damage[1][1]=1;assert.throws(()=>store.record({...row,id:'battle-memory-0005',memory:invalid}));
  const legacy=JSON.parse(fs.readFileSync(file));delete legacy.rivalry;fs.writeFileSync(file,JSON.stringify(legacy));assert.deepEqual(store.read().rivalry,[]);assert.equal(store.read().played,4);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('current-battle retaliation grows with damage and difficulty but keeps other targets possible',()=>{
 const odds=[];
 for(let skill=0;skill<4;skill++){
  const b=battle({skill});b.turn=1;
  const chance=()=>{const choices=b.targetChoices();return choices.find(c=>c.tank.id===2).weight/choices.reduce((sum,c)=>sum+c.weight,0);};
  const neutral=chance();b.damageLedger[2][1]=10;const scratched=chance();b.damageLedger[2][1]=40;const hurt=chance();
  assert.ok(scratched>neutral&&hurt>scratched);assert.ok(hurt<1);odds.push(hurt);
  if(skill===3){assert.equal(b.targetChoices().find(c=>c.tank.id===2).reason,'retaliation');b.random=()=>.99;assert.notEqual(b.chooseTarget().id,2);}
 }
 assert.ok(odds.every((n,i)=>i===0||n>odds[i-1]));assert.ok(odds[3]>.6&&odds[0]<.35);
});
test('real incoming damage triggers retaliation equally against human and bot attackers',()=>{
 const weights=[];
 for(const attacker of [0,2]){
  const b=battle({skill:3}),victim=b.tanks[1];b.turn=1;
  b.explode({x:victim.x+43,y:victim.y,owner:attacker,weapon:'shell'});assert.ok(victim.hp>0&&victim.hp<100);
  const choice=b.targetChoices().find(c=>c.tank.id===attacker);assert.equal(choice.reason,'retaliation');weights.push(choice.weight);
  b.tanks[attacker].hp=0;assert.ok(b.targetChoices().every(c=>c.tank.id!==attacker));
 }
 assert.equal(weights[0],weights[1]);
 const self=battle({skill:3});self.turn=1;self.explode({x:self.active.x+43,y:self.active.y,owner:1,weapon:'shell'});assert.ok(self.targetChoices().every(c=>c.weight===1));
 const miss=battle({skill:3});miss.turn=1;miss.explode({x:-100,y:300,owner:2,weapon:'shell'});assert.ok(miss.targetChoices().every(c=>c.weight===1));
});
test('current retaliation combines with existing rivalries and resets with a new battle',()=>{
 const past=memory(2);past.damage[2][1]=70;const b=battle({skill:3,history:[past,past]});b.turn=1;
 const before=b.targetChoices().find(c=>c.tank.id===2).weight;b.damageLedger[2][1]=40;
 assert.ok(b.targetChoices().find(c=>c.tank.id===2).weight>before);
 const fresh=battle({skill:3,history:[past,past]});fresh.turn=1;assert.equal(fresh.targetChoices().find(c=>c.tank.id===2).weight,before);
});
