const {test}=require('node:test'),assert=require('node:assert/strict');
const {outlook,occurrences,createOutlookCache}=require('../src/meteor-showers.cjs');
const A=require('astronomy-engine');
const DAY=86400000,north={latitude:39.1,longitude:-120.1};
test('October distinguishes continuing activity from next week peaks',()=>{
 const s=outlook(north,Date.parse('2026-10-25T12:00:00Z'));
 assert.equal(s.showers.find(x=>x.name==='Orionids').peakThisWeek,false);
 assert.equal(s.showers.filter(x=>x.peakThisWeek).length,0);assert.equal(s.next.name,'Southern Taurids');
 assert.ok(s.showers.every(x=>x.activeNow));
});
test('New Year includes December activity and January peak without duplicate showers',()=>{
 const now=Date.parse('2026-12-30T12:00:00Z'),s=outlook(north,now),q=s.showers.find(x=>x.name==='Quadrantids');
 assert.ok(q.activeNow&&q.peakThisWeek);assert.equal(new Date(q.peak).getUTCFullYear(),2027);
 assert.equal(new Set(s.showers.map(x=>x.name)).size,s.showers.length);
 const january=occurrences(Date.parse('2027-01-02')).find(x=>x.name==='Quadrantids'&&new Date(x.peak).getUTCFullYear()===2027);
 assert.equal(new Date(january.start).toISOString().slice(0,10),'2026-12-28');
});
test('suggested hours are future, within seven days, dark and geometrically visible',()=>{
 const now=Date.parse('2026-08-10T12:00:00Z'),s=outlook(north,now),observer=new A.Observer(north.latitude,north.longitude,0);
 assert.ok(s.showers.some(x=>x.window));
 for(const shower of s.showers){if(!shower.window)continue;const w=shower.window;assert.ok(w.start>=now&&w.end<=now+7*DAY);assert.equal(w.end-w.start,3600000);assert.ok(w.altitude>=20);assert.ok(w.moonIllumination>=0&&w.moonIllumination<=1);
 for(let t=w.start;t<=w.end;t+=1800000){const d=new Date(t),eq=A.Equator('Sun',d,observer,true,true);assert.ok(A.Horizon(d,observer,eq.ra,eq.dec,null).altitude<=-18);}
 }
});
test('polar daylight and southern radiant visibility do not invent viewing windows',()=>{
 const polar=outlook({latitude:90,longitude:0},Date.parse('2026-08-10'));
 assert.ok(polar.showers.length);assert.ok(polar.showers.every(x=>!x.window&&x.reason.includes('No fully dark')));
 const south=outlook({latitude:-60,longitude:0},Date.parse('2026-12-20'));
 assert.equal(south.showers.find(x=>x.name==='Ursids').window,null);
});
test('real clock cache ignores animation offsets, expires, switches location and forgets',()=>{
 let now=Date.parse('2026-10-25'),cache=createOutlookCache(()=>now),first=cache.get(north);
 assert.equal(cache.get(north),first);now+=1800000;assert.notEqual(cache.get(north),first);
 const moved=cache.get({latitude:-39,longitude:120});assert.equal(moved.location.latitude,-39);
 assert.equal(cache.get(null),null);assert.equal(outlook({latitude:91,longitude:0}),null);
 const again=cache.get(north);cache.clear();assert.notEqual(cache.get(north),again);
 now-=DAY;assert.equal(cache.get(north).at,now);
});
