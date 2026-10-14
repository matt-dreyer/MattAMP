const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/ambient.js'),'utf8'),context);const Camera=context.window.MattFractalCamera;
function random(){let seed=7;return ()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
test('fractal flights cover every area and route without immediate repeats',()=>{
 const camera=new Camera(random()),sites=new Set(),routes=new Set();let previous;
 for(let i=0;i<100;i++){
  const f=camera.flight;sites.add(f.site);routes.add(f.route);
  if(previous){assert.notEqual(previous.site,f.site);assert.notEqual(previous.route,f.route);}
  assert.ok(f.duration>=150&&f.duration<=210);previous=f;
  camera.update(f.duration-camera.elapsed);
 }
 assert.equal(sites.size,6);assert.equal(routes.size,4);
});
test('flights remain finite, bounded and continuous at transitions',()=>{
 const camera=new Camera(random());
 for(let flight=0;flight<12;flight++){
  const duration=camera.flight.duration;
  for(let i=0;i<=100;i++){
   camera.elapsed=duration*i/100;const c=camera.update(0);
   assert.ok(Object.values(c).every(Number.isFinite));assert.ok(c.span>=.0005&&c.span<=3.200001);assert.ok(Math.abs(c.angle)<=Math.PI*.75);
   if(i===100){assert.ok(Math.hypot(c.x+.5,c.y)<1e-10);assert.ok(Math.abs(c.angle)<1e-12);}
  }
  camera.elapsed=camera.flight.duration-.001;const before=camera.update(0),after=camera.update(.002);
  assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-7);assert.ok(Math.abs(before.span-after.span)<1e-7);assert.ok(Math.abs(before.angle-after.angle)<1e-7);
  camera.elapsed=0;
 }
});
test('camera holds still at zero elapsed time and spiral adds gradual rotation',()=>{
 const camera=new Camera(random());while(camera.flight.route!=='spiral')camera.update(camera.flight.duration);
 const start=camera.update(0);assert.equal(start.angle,0);
 camera.update(camera.flight.duration*.5);const middle=camera.update(0);assert.ok(Math.abs(middle.angle)>2);assert.ok(middle.span<.01);assert.deepEqual(camera.update(0),middle);
 const elapsed=camera.elapsed;camera.update(NaN);camera.update(-5);assert.equal(camera.elapsed,elapsed);
});
