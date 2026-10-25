const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {location,skyAt}=require('../src/night-sky.cjs');
const {Starlink,networkLocation,fetchJson}=require('../src/sky-services.cjs');
const A=require('astronomy-engine');
test('location is coarse, finite, bounded and forgettable',()=>{
 assert.equal(location(null),null);for(const bad of [{latitude:91,longitude:0},{latitude:0,longitude:Infinity},{latitude:'39',longitude:0}])assert.equal(location(bad),null);
 assert.deepEqual(location({latitude:39.123456,longitude:-120.123456,source:'device',secret:'discard'}),{latitude:39.1,longitude:-120.1,source:'device'});
});
test('J2000 star rotation agrees with equator-of-date horizon conversion',()=>{
 const date=new Date('2026-10-26T04:00:00Z'),loc={latitude:39,longitude:-120},s=skyAt(loc,date),polaris=s.stars.find(s=>s[4]==='Polaris');assert.ok(polaris);assert.ok(Math.abs(polaris[1]-39)<1);
 const cat=require('../assets/sky/catalog.json').stars.find(s=>s[4]==='Vega'),v=A.VectorFromSphere(new A.Spherical(cat[1],cat[0],1),date),eq=A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(date),v)),h=A.Horizon(date,new A.Observer(39,-120,0),eq.ra,eq.dec,null),vega=s.stars.find(s=>s[4]==='Vega');assert.ok(Math.abs(vega[0]-h.azimuth)<1e-6);assert.ok(Math.abs(vega[1]-h.altitude)<1e-6);
 assert.ok(s.stars.every(s=>s[1]>=-90&&s[1]<=90&&s[0]>=0&&s[0]<360));
});
test('sky follows location and actual date; Moon matches known new and full phases',()=>{
 const date=new Date('2024-04-08T18:21:00Z'),north=skyAt({latitude:39,longitude:-120},date),south=skyAt({latitude:-39,longitude:-120},date),later=skyAt({latitude:39,longitude:-120},new Date(+date+6*3600000));
 assert.ok(north.moon.illumination<.001);assert.notDeepEqual(north.stars,south.stars);assert.notDeepEqual(north.stars,later.stars);assert.ok(skyAt({latitude:0,longitude:0},new Date('2024-03-25T07:00:00Z')).moon.illumination>.999);
});
test('polar sky and date line remain finite',()=>{for(const lat of [-90,90]){const s=skyAt({latitude:lat,longitude:180});assert.ok(s.stars.length>1000);assert.ok(s.stars.every(s=>Number.isFinite(s[0])&&Number.isFinite(s[1])));}});
const response=value=>({ok:true,body:(async function*(){yield Buffer.from(JSON.stringify(value));})()});
test('network estimate discards IP and extra fields; response is size bounded',async()=>{const loc=await networkLocation(async()=>response({success:true,latitude:39.123,longitude:-120.888,ip:'private'}));assert.deepEqual(loc,{latitude:39.1,longitude:-120.9,source:'network'});await assert.rejects(fetchJson('https://example.com',2,async()=>response({too:'large'})),/too large/);});
const omm={OBJECT_NAME:'STARLINK-TEST',NORAD_CAT_ID:28492,EPOCH:'2026-10-25T12:00:00.000000',MEAN_MOTION:15.39936229,ECCENTRICITY:.0006703,INCLINATION:98.3164,RA_OF_ASC_NODE:103.8411,ARG_OF_PERICENTER:20.5667,MEAN_ANOMALY:339.5789,EPHEMERIS_TYPE:0,CLASSIFICATION_TYPE:'U',ELEMENT_SET_NO:999,REV_AT_EPOCH:8655,BSTAR:.00048021,MEAN_MOTION_DOT:.00005995,MEAN_MOTION_DDOT:0};
test('orbital cache coalesces, persists backoff, drops stale epochs and never fetches until requested',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sky-test-')),file=path.join(dir,'orbits.json');let requests=0,now=Date.parse('2026-10-25T12:00:00Z');const fetcher=async()=>{requests++;return response([{...omm,OBJECT_NAME:'STARLINK-1234'}]);};
 try{const store=new Starlink(file,{fetcher,now:()=>now});assert.equal(requests,0);await Promise.all([store.refresh(),store.refresh()]);assert.equal(requests,1);assert.equal(store.records.length,1);const S=store.library,position=S.propagate(store.records[0].sat,new Date(now)).position,sub=S.eciToGeodetic(position,S.gstime(new Date(now))),overhead=store.tracks({latitude:sub.latitude*180/Math.PI,longitude:sub.longitude*180/Math.PI},new Date(now));assert.equal(overhead.length,1);assert.ok(overhead[0].points[1][1]>89);assert.ok(overhead[0].points.flat().every(Number.isFinite));
 const reopened=new Starlink(file,{fetcher,now:()=>now});await reopened.refresh();assert.equal(requests,1);assert.equal(reopened.records.length,1);
 now+=8*86400000;assert.deepEqual(reopened.tracks({latitude:39,longitude:-120},new Date(now)),[]);
 const broken=new Starlink(file,{fetcher:async()=>{requests++;throw Error('offline');},now:()=>now});await broken.refresh();await broken.refresh();assert.equal(requests,2);
 const again=new Starlink(file,{fetcher,now:()=>now});await again.refresh();assert.equal(requests,2);assert.equal(again.records.length,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

const SkyClock=require('../src/sky-clock.js');
test('two-week drift reaches both endpoints, reverses continuously, and eases at the turns',()=>{
 const week=7*86400000;assert.equal(SkyClock.offsetAt(0),-week);assert.equal(SkyClock.offsetAt(840),week);assert.equal(SkyClock.offsetAt(1680),-week);
 for(let t=0;t<3360;t+=.1)assert.ok(Math.abs(SkyClock.offsetAt(t))<=week+1);
 assert.ok(Math.abs(SkyClock.offsetAt(839.99)-SkyClock.offsetAt(840.01))<1);assert.ok(Math.abs(SkyClock.offsetAt(.1)-SkyClock.offsetAt(0))<1000);
 const clock=new SkyClock();clock.configure('tour');clock.step(1000);clock.step(600000);assert.ok(clock.elapsed<=.08,'hidden time cannot jump the tour');clock.paused=true;const stopped=clock.elapsed;clock.step(601000);assert.equal(clock.elapsed,stopped);clock.configure('live');assert.equal(clock.offset(),0);
});
test('smooth sky rotation follows the ephemeris between tour snapshots',()=>{
 const loc={latitude:39,longitude:-120},date=new Date('2026-10-25T04:00:00Z'),first=skyAt(loc,date),later=skyAt(loc,new Date(+date+1800000));
 const a=first.stars.find(s=>s[4]==='Vega'),b=later.stars.find(s=>s[4]==='Vega'),moved=SkyClock.rotate(a,39,1800);assert.ok(Math.abs(moved[0]-b[0])<.001);assert.ok(Math.abs(moved[1]-b[1])<.001);
});

const vm=require('node:vm');
function sceneForTest(){const context={MattSkyClock:SkyClock,window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/night-sky.js'),'utf8'),context);return new context.window.MattNightSky();}
test('default camera scans in Live now without changing sky time, with smooth bounded motion',()=>{
 const scene=sceneForTest(),start=scene.project(40,45,710,560);scene.stepCamera(0);let previous=start,maxStep=0;
 for(let ms=40;ms<=180000;ms+=40){scene.stepCamera(ms);const p=scene.project(40,45,710,560);maxStep=Math.max(maxStep,Math.hypot(p[0]-previous[0],p[1]-previous[1]));assert.ok(p.every(Number.isFinite));previous=p;}
 assert.ok(Math.hypot(previous[0]-start[0],previous[1]-start[1])>50);assert.ok(maxStep<2,'no abrupt camera cuts');assert.equal(scene.clock.offset(),0,'camera does not advance astronomy');
 const frozen=JSON.stringify(scene.geometry(710,560));scene.clock.paused=true;scene.stepCamera(999999);assert.equal(JSON.stringify(scene.geometry(710,560)),frozen,'hidden/paused camera stays put');
});
test('camera settles for object finding, scan off and reduced motion; free exploration resumes',()=>{
 const scene=sceneForTest();scene.stepCamera(0);for(let t=40;t<=4000;t+=40)scene.stepCamera(t);
 scene.focus='Moon';for(let t=4040;t<=8040;t+=40)scene.stepCamera(t);
 assert.deepEqual(Array.from(scene.project(0,90,710,560,true)),[355,280],'selected objects use the whole stable dome');assert.equal(scene.geometry(710,560,true).angle,0);
 const elapsed=scene.cameraElapsed;scene.focus='';scene.stepCamera(8080);assert.ok(scene.cameraElapsed>elapsed);
 scene.scan=false;for(let t=8120;t<=12120;t+=40)scene.stepCamera(t);assert.equal(scene.geometry(710,560,true).r,560*.43);
 scene.scan=true;for(let t=12160;t<=16160;t+=40)scene.stepCamera(t);scene.reducedMotion=true;assert.equal(scene.geometry(710,560,true).r,560*.43);assert.equal(scene.geometry(710,560,true).angle,0);
});
