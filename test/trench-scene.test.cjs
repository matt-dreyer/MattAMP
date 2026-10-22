const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/ambient.js'),'utf8'),context);
const scene=new context.window.MattTrenchScene();
test('trench geometry is deterministic, bounded and finite through near-plane crossings',()=>{
 for(const [w,h] of [[430,900],[710,445],[5120,2160]])for(const time of [0,.46874,.46876,2.81249,2.81251,15,200,36000]){
  const lines=scene.frame(time,w,h);assert.ok(lines.length>100&&lines.length<1100);
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
 for(let z=90;z<2700;z+=90){assert.ok(Math.abs(scene.path(z-.001)-scene.path(z+.001))<.001);assert.ok(Math.abs(scene.slope(z-.001)-scene.slope(z+.001))<.0001);}
 assert.notDeepEqual(scene.frame(30,710,445),scene.frame(630,710,445),'no short timed loop');
});

test('seeded cannons fire occasional paired bolts and clear them between volleys',()=>{
 const trench=new context.window.MattTrenchScene(123);let firing=0,quiet=0;
 for(let time=0;time<90;time+=.2){const bolts=trench.frame(time,710,445).filter(line=>line[5]===2);assert.ok(bolts.length<=2);if(bolts.length)firing++;else quiet++;}
 assert.ok(firing>20&&quiet>firing,'lasers are visible but leave quiet stretches');
});
