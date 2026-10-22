const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/ambient.js'),'utf8'),context);
const scene=new context.window.MattTrenchScene(123);
test('trench geometry is deterministic, bounded and finite through near-plane crossings',()=>{
 for(const [w,h] of [[430,900],[710,445],[5120,2160]])for(const time of [0,.46874,.46876,2.81249,2.81251,15,200,36000]){
  const lines=scene.frame(time,w,h);assert.ok(lines.length>100&&lines.length<1600);
  assert.ok(lines.every(line=>line.every(Number.isFinite)&&line[4]>=0&&line[4]<=3&&[0,1,2].includes(line[5])));
  assert.deepEqual(scene.frame(time,w,h),lines,'redrawing without elapsed time does not change the scene');
 }
 assert.equal(scene.frame(0,0,500).length,0);assert.equal(scene.frame(NaN,710,445).length,0);
});
test('trench advances with time and only responds to an active pointer',()=>{
 const still=scene.frame(10,710,445);
 assert.notDeepEqual(scene.frame(11,710,445),still);
 assert.deepEqual(scene.frame(10,710,445,{x:1,y:0,strength:0}),still);
 assert.notDeepEqual(scene.frame(10,710,445,{x:1,y:0,strength:1}),still);
});
test('seeded trench bends have continuous position and heading, with new paths per seed',()=>{
 const other=new context.window.MattTrenchScene(456),same=new context.window.MattTrenchScene(scene.seed);
 assert.deepEqual(same.frame(100,710,445),scene.frame(100,710,445));assert.notDeepEqual(other.frame(100,710,445),scene.frame(100,710,445));
 for(let cell=0;cell<20;cell++){
  const turn=scene.turn(cell);for(const z of [turn.start,turn.start+turn.length])assert.ok(Math.abs(scene.headingBetween(z-.001,z+.001))<.001);
 }

 assert.notDeepEqual(scene.frame(30,710,445),scene.frame(630,710,445),'no short timed loop');
});

test('seeded cannons fire occasional paired bolts and clear them between volleys',()=>{
 const trench=new context.window.MattTrenchScene(123);let firing=0,quiet=0;
 for(let time=0;time<90;time+=.2){const bolts=trench.frame(time,710,445).filter(line=>line[5]===2);assert.ok(bolts.length<=2);if(bolts.length)firing++;else quiet++;}
 assert.ok(firing>20&&quiet>firing,'lasers are visible but leave quiet stretches');
});

test('trench turns change actual heading sharply while width and rolls remain smooth',()=>{
 const kinds=new Set(),directions=new Set();let min=Infinity,max=0;
 for(let cell=0;cell<100;cell++){
  const t=scene.turn(cell),angle=scene.headingBetween(t.start,t.start+t.length);if(angle)directions.add(Math.sign(angle));
  if(t.angle)assert.ok(Math.abs(angle)>=Math.PI/3&&Math.abs(angle)<=Math.PI/2,'corners turn 60–90 degrees');
  const pose=scene.route(t.start)(t.start+t.length);assert.ok(Number.isFinite(pose.x)&&Number.isFinite(pose.z));
  if(angle)assert.ok(Math.abs(pose.x)>4,'the route actually turns rather than sliding the horizon');
  for(let z=cell*96;z<(cell+1)*96;z+=.5){const w=scene.width(z);min=Math.min(min,w);max=Math.max(max,w);assert.ok(w>=1.34&&w<=7.71);assert.ok(Math.abs(scene.width(z+.001)-w)<.01);kinds.add(scene.maneuver(z).kind);}
  const begin=cell*96+8,end=begin+24;
  for(const z of [begin,end]){const a=scene.maneuver(z-.0001).roll,b=scene.maneuver(z+.0001).roll;assert.ok(Math.abs(Math.cos(a)-Math.cos(b))<.0001);assert.ok(Math.abs(Math.sin(a)-Math.sin(b))<.0001,'rotation never snaps at full-roll boundaries');}
 }
 assert.equal(directions.size,2);assert.deepEqual([...kinds].sort(),['knife','none','roll']);assert.ok(min<1.4&&max>7);
});
test('floor vent openings fit the narrow sections and have recessed bottoms',()=>{
 for(let i=0;i<100;i++){const v=scene.vent(i);assert.ok(v.depth>=2&&v.depth<=5);assert.ok(v.half<scene.width((v.z+v.end)/2));assert.ok(v.end-v.z>=5);}
});

test('full rolls wait a minute and remain a minute apart for every route',()=>{
 for(const seed of [0,123,456,9876]){
  const route=new context.window.MattTrenchScene(seed),starts=[];
  for(let cell=0;cell<20;cell++)if(route.maneuver(cell*96+20).kind==='roll')starts.push((cell*96+8)/3.2);
  assert.ok(starts[0]>=60);assert.ok(starts.length>2);
  for(let i=1;i<starts.length;i++)assert.equal(starts[i]-starts[i-1],60);
 }
});
