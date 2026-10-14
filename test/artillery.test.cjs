const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Battle}=require('../src/artillery.js');
const {createArcadeStore}=require('../src/arcade-store.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
function rng(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
function battle(options={}){return new Battle({random:rng(123),...options});}
function finishFlight(b){for(let i=0;i<2000&&!['aim','over'].includes(b.phase);i++)b.step(1/30);assert.ok(['aim','over'].includes(b.phase),'shot resolves');}
test('three to five bots spawn on terrain, with equal health and ammunition',()=>{
 for(const bots of [3,4,5]){const b=battle({bots});assert.equal(b.tanks.length,bots+1);assert.equal(b.active.id,0);assert.equal(new Set(b.tanks.map(t=>t.x)).size,bots+1);for(const t of b.tanks){assert.equal(t.hp,100);assert.equal(t.mirvs,3);assert.equal(t.y,b.ground(t.x)-8);}}
});
test('wind bends trajectories, while prediction agrees with actual first impact',()=>{
 const b=battle();b.wind=-18;const left=b.predict(b.active,70,55);b.wind=18;const right=b.predict(b.active,70,55);assert.ok(right.x>left.x+50);
 b.fire(70,55);let hit;const explode=b.explode.bind(b);b.explode=p=>{hit={...p};explode(p);};finishFlight(b);assert.ok(Math.abs(hit.x-right.x)<3);assert.ok(Math.abs(hit.y-right.y)<3);
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
