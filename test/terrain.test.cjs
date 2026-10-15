const {test}=require('node:test'),assert=require('node:assert/strict');
const {Battle,generateTerrain,TERRAINS}=require('../src/artillery.js');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
test('all terrain families vary between seeds while retaining bounded, continuous profiles',()=>{
 for(const kind of Object.keys(TERRAINS)){
  const silhouettes=new Set(),centers=[];
  for(let seed=1;seed<=100;seed++){
   const terrain=generateTerrain(kind,rng(seed*104729));
   assert.equal(terrain.length,1001);assert.ok([...terrain].every(y=>Number.isFinite(y)&&y>=170-1e-9&&y<=450+1e-9));
   const relief=Math.max(...terrain)-Math.min(...terrain);
   if(kind==='flat')assert.ok(relief<30);if(kind==='crags')assert.ok(relief>=185-1e-9&&relief<=260+1e-9);
   assert.ok(terrain.every((y,x)=>!x||Math.abs(y-terrain[x-1])<18),'no discontinuous cliffs');
   silhouettes.add([100,300,500,700,900].map(x=>Math.round(terrain[x])).join(','));centers.push(terrain[500]);
   assert.deepEqual(terrain,generateTerrain(kind,rng(seed*104729)),'seeded profiles are reproducible');
  }
  assert.equal(silhouettes.size,100,kind+' has distinct shapes, not a repeated template');
  assert.ok(Math.max(...centers)-Math.min(...centers)>35,kind+' changes elevation as well as detail');
 }
});
test('valleys move their low point and change shoulder widths across battles',()=>{
 const bottoms=[];
 for(let seed=1;seed<=100;seed++){const t=generateTerrain('valley',rng(seed*7919));bottoms.push(t.indexOf(Math.max(...t)));}
 assert.ok(Math.max(...bottoms)-Math.min(...bottoms)>300);
});
test('all bot counts spawn on stable pads with blended edges and clear launch positions',()=>{
 const kinds=new Set();
 for(const bots of [3,4,5])for(let seed=1;seed<=120;seed++){
  const b=new Battle({bots,chaos:'unhinged',random:rng(seed*27183)});kinds.add(b.conditions.terrain);
  assert.ok(b.terrain.every((y,x)=>!x||Math.abs(y-b.terrain[x-1])<20),'pad shoulders blend into steep terrain');
  for(const t of b.tanks){
   for(let x=Math.round(t.x)-18;x<=t.x+18;x++)assert.equal(b.terrain[x],t.y+8);
   for(const angle of [5,55,90,125,175]){const p=b.projectile(t,angle,50,'shell');assert.ok(p.y<b.ground(p.x),'muzzle starts above terrain');}
  }
 }
 assert.equal(kinds.size,5);
});
