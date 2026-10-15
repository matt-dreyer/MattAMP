const {test}=require('node:test'),assert=require('node:assert/strict');
const {Battle}=require('../src/artillery.js');
function rng(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}

test('Very dumb guesses without trajectory prediction and respects ammunition limits',()=>{
 for(const chaos of ['off','mixed','unhinged'])for(let seed=1;seed<=50;seed++){
  const b=new Battle({skill:0,chaos,random:rng(seed)});b.turn=1;b.active.mirvs=0;
  b.predict=()=>{throw new Error('Beginner bots must not solve trajectories');};
  const aim=b.botAim();assert.ok(aim.angle>=5&&aim.angle<=175);assert.ok(aim.power>=1&&aim.power<=100);assert.equal(aim.weapon,'shell');
 }
});

test('Very dumb deals substantially less damage than Casual across seeded live volleys',()=>{
 for(const chaos of ['off','mixed','unhinged']){
  const stats=[0,1].map(skill=>{
   let damage=0,hits=0,mirvs=0;
   for(let seed=1;seed<=400;seed++){
    const b=new Battle({bots:4,skill,chaos,random:rng(seed*7919)});b.turn=1+seed%4;
    const tank=b.active,aim=b.botAim();mirvs+=aim.weapon==='mirv';assert.ok(b.fire(aim.angle,aim.power,aim.weapon));
    for(let i=0;i<2000&&b.phase==='flight';i++)b.step(1/30);
    assert.notEqual(b.phase,'flight');damage+=tank.damage;hits+=tank.damage>0;
   }
   return {damage,hits,mirvs};
  });
  const [easy,casual]=stats;
  assert.ok(easy.damage<casual.damage*.6,`${chaos}: easy damage ${easy.damage}, casual ${casual.damage}`);
  assert.ok(easy.hits<casual.hits*.65,`${chaos}: easy hits ${easy.hits}, casual ${casual.hits}`);
  assert.ok(easy.hits>20,'lucky hits remain possible');assert.ok(easy.mirvs>0&&easy.mirvs<40,'MIRVs are rare, not removed');
 }
});

test('Very dumb remembers rivals without strongly piling onto a past winner',()=>{
 const damage=Array.from({length:6},()=>Array(6).fill(0));damage[0][1]=100;
 const history=Array.from({length:3},()=>({winner:0,damage}));
 const chance=(skill,attacker)=>{
  const b=new Battle({skill,history,random:rng(5)});b.turn=1;
  if(attacker===2){for(const match of b.history){match.winner=2;match.damage=match.damage.map(row=>[...row]);match.damage[2][1]=100;match.damage[0][1]=0;}}
  const choices=b.targetChoices();return choices.find(c=>c.tank.id===attacker).weight/choices.reduce((n,c)=>n+c.weight,0);
 };
 const easy=chance(0,0),casual=chance(1,0);assert.ok(easy>.25&&easy<.45);assert.ok(casual>easy+.15);
 assert.equal(chance(0,2),easy,'human and bot past winners get identical treatment');
});
