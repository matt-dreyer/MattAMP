const A=require('astronomy-engine');
const catalog=require('../assets/sky/meteor-showers.json');
const {location}=require('./night-sky.cjs');
const DAY=86400000,STEP=1800000;
const date=(year,md)=>Date.parse(`${year}-${md}T00:00:00Z`);
// Seasonal dates and peak J2000 radiants, not outburst predictions or weather.
function occurrences(now){
 const year=new Date(now).getUTCFullYear(),all=[];
 for(const s of catalog.showers)for(let y=year-1;y<=year+1;y++){
  const peak=date(y,s.peak),start=date(y-(s.start>s.peak?1:0),s.start),end=date(y+(s.end<s.peak?1:0),s.end)+DAY;
  all.push({...s,peak,start,end});
 }
 return all;
}
function outlook(where,now=Date.now()){
 const loc=location(where);if(!loc)return null;
 now=+now;if(!Number.isFinite(now))throw new Error('Invalid outlook date');
 const until=now+7*DAY,all=occurrences(now),observer=new A.Observer(loc.latitude,loc.longitude,0),samples=[];
 for(let t=Math.ceil(now/STEP)*STEP;t<=until;t+=STEP){
  const at=new Date(t),alt=body=>{const eq=A.Equator(body,at,observer,true,true);return A.Horizon(at,observer,eq.ra,eq.dec,null).altitude;};
  samples.push({at:t,sun:alt('Sun'),moon:alt('Moon'),lit:A.Illumination('Moon',at).phase_fraction,rotation:A.Rotation_EQJ_HOR(at,observer)});
 }
 const showers=all.filter(s=>s.start<until&&s.end>now).map(s=>{
  const v=A.VectorFromSphere(new A.Spherical(s.dec,s.ra,1),new Date(now));
  const points=samples.map(p=>({...p,alt:A.HorizonFromVector(A.RotateVector(p.rotation,v),null).lat}));
  let best=null;
  for(let i=0;i+2<points.length;i++){
   const window=points.slice(i,i+3);
   if(window.some(p=>p.at<s.start||p.at>=s.end||p.sun>-18||p.alt<20))continue;
   const middle=window[1],minAltitude=Math.min(...window.map(p=>p.alt)),moonUp=window.some(p=>p.moon>0);
   const score=minAltitude-(moonUp?middle.lit*35:0)-Math.abs(middle.at-(s.peak+DAY/2))/DAY*3;
   if(!best||score>best.score)best={score,start:window[0].at,end:window[2].at,altitude:Math.round(minAltitude),moonUp,moonIllumination:middle.lit};
  }
  if(best)delete best.score;
  const activePoints=points.filter(p=>p.at>=s.start&&p.at<s.end);
  const reason=best?null:activePoints.some(p=>p.sun<=-18)?'The radiant stays too low during dark hours for our viewing window.':'No fully dark viewing window at this location during its activity this week.';
  return {name:s.name,peak:s.peak,peakThisWeek:s.peak<until&&s.peak+DAY>now,activeNow:s.start<=now&&s.end>now,window:best,reason};
 }).sort((a,b)=>Number(b.peakThisWeek)-Number(a.peakThisWeek)||Number(!!b.window)-Number(!!a.window)||Math.abs(a.peak-now)-Math.abs(b.peak-now));
 const next=all.filter(s=>s.peak>=until).sort((a,b)=>a.peak-b.peak)[0];
 return {at:now,until,location:loc,showers,next:next?{name:next.name,peak:next.peak}:null,sourceYear:catalog.year};
}
// Main-process cache uses the real clock; the animated sky's offset is never accepted.
function createOutlookCache(clock=Date.now){let cached=null,key=null;return {clear(){cached=null;key=null;},get(where){const loc=location(where);if(!loc){this.clear();return null;}const now=clock(),k=JSON.stringify(loc);if(!cached||k!==key||now-cached.at>=1800000||now<cached.at){cached=outlook(loc,now);key=k;}return cached;}};}
module.exports={outlook,occurrences,createOutlookCache};
