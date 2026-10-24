const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/ambient.js'),'utf8'),context);
const Flow=context.window.MattParticleFlow;
test('flow stays bounded through aging and edge crossings at compact and large sizes',()=>{
 for(const [w,h] of [[430,445],[710,900],[5120,2160]]){
  const flow=new Flow(w,h);assert.ok(flow.particles.length>=220&&flow.particles.length<=480);
  for(let i=0;i<1800;i++)flow.step(1/24,i/24,{x:.5,y:.5,strength:1});
  for(const p of flow.particles){
   assert.ok([p.x,p.y,p.vx,p.vy,p.fade].every(Number.isFinite));
   assert.ok(p.x>=-16&&p.x<=w+16&&p.y>=-16&&p.y<=h+16);
   assert.ok(p.trail.length<=64&&p.fade>=0&&p.fade<=1);
   for(let j=1;j<p.trail.length;j++)assert.ok(Math.hypot(p.trail[j].x-p.trail[j-1].x,p.trail[j].y-p.trail[j-1].y)<20,'edge wraps never connect across the window');
  }
 }
});
test('flow freezes with no elapsed time and only reacts to an active pointer',()=>{
 const idle=new Flow(710,445),inactive=new Flow(710,445),active=new Flow(710,445);
 const before=JSON.stringify(idle.particles);for(const dt of [0,-1,NaN])idle.step(dt,10);assert.equal(JSON.stringify(idle.particles),before);
 for(let i=0;i<100;i++){idle.step(1/24,i/24);inactive.step(1/24,i/24,{x:.9,y:.1,strength:0});active.step(1/24,i/24,{x:.5,y:.5,strength:1});}
 assert.deepEqual(idle.particles,inactive.particles);assert.notDeepEqual(idle.particles,active.particles);
});

test('decorative hurricane has a calm eye, circulating eyewall and slowly drifting center',()=>{
 const flow=new Flow(710,445),storm=flow.weather(40);
 const center=flow.wind(storm.x,storm.y,40,storm);
 assert.ok(Math.hypot(center.vx,center.vy)<.01);assert.equal(center.eyeFade,0);
 const east=flow.wind(storm.x+storm.eye*2,storm.y,40,storm);
 const west=flow.wind(storm.x-storm.eye*2,storm.y,40,storm);
 assert.ok(east.vy>30&&west.vy< -30,'opposite sides circulate around the eye');
 const later=flow.weather(40+1/24);assert.ok(Math.hypot(later.x-storm.x,later.y-storm.y)<.2);
 for(let t=0;t<3600;t+=13){const s=flow.weather(t);assert.ok(s.x>0&&s.x<710&&s.y>0&&s.y<445);}
});
