const fs=require('node:fs');
const {location}=require('./night-sky.cjs');
const TWO_HOURS=2*60*60*1000,DAY=86400000;
async function fetchJson(url,limit=8*1024*1024,fetcher=fetch){
 const response=await fetcher(url,{signal:AbortSignal.timeout(12000),redirect:'error',headers:{'User-Agent':'MattAMP Night Sky','Accept':'application/json'}});
 if(!response.ok)throw new Error('Sky service is temporarily unavailable.');
 let size=0;const chunks=[];for await(const chunk of response.body){size+=chunk.length;if(size>limit)throw new Error('Sky service response too large.');chunks.push(chunk);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function validElements(rows,now){
 if(!Array.isArray(rows))return [];
 return rows.filter(r=>r&&/^STARLINK-\d+$/.test(r.OBJECT_NAME)&&Number.isFinite(r.NORAD_CAT_ID)&&['MEAN_MOTION','ECCENTRICITY','INCLINATION','RA_OF_ASC_NODE','ARG_OF_PERICENTER','MEAN_ANOMALY','BSTAR','MEAN_MOTION_DOT','MEAN_MOTION_DDOT'].every(k=>Number.isFinite(r[k]))&&r.MEAN_MOTION>0&&r.MEAN_MOTION<20&&r.ECCENTRICITY>=0&&r.ECCENTRICITY<1&&Math.abs(now-Date.parse(String(r.EPOCH).replace(/Z$/,'')+'Z'))<7*DAY);
}
class Starlink {
 constructor(file,{fetcher=fetch,now=Date.now}={}){this.file=file;this.fetcher=fetcher;this.now=now;this.rows=[];this.records=[];this.next=0;this.fetched=0;this.status='Starlink not loaded';this.pending=null;this.library=null;
  try{const c=JSON.parse(fs.readFileSync(file,'utf8'));this.next=Math.min(Number(c.next)||0,now()+TWO_HOURS);this.fetched=Number(c.fetched)||0;this.rows=validElements(c.rows,now());}catch{}
 }
 refresh(){
  if(this.pending)return this.pending;
  this.pending=(async()=>{
   this.library ||= await import('satellite.js');
   if(this.now()>=this.next){
    this.next=this.now()+TWO_HOURS;this.status='Loading Starlink orbits…';
    // Persist backoff even for errors so restarting cannot hammer the provider.
    this.write();
    try{
     const rows=validElements(await fetchJson('https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json',8*1024*1024,this.fetcher),this.now());
     if(!rows.length)throw new Error('No fresh orbits');
     rows.sort((a,b)=>a.NORAD_CAT_ID-b.NORAD_CAT_ID);
     const step=Math.max(1,rows.length/768);this.rows=Array.from({length:Math.min(768,rows.length)},(_,i)=>rows[Math.floor(i*step)]);this.fetched=this.now();this.write();
    }catch{this.status='Starlink unavailable; stars and Moon still work';}
   }
   this.rows=validElements(this.rows,this.now());
   this.records=this.rows.flatMap(row=>{try{return [{name:row.OBJECT_NAME,epoch:Date.parse(String(row.EPOCH).replace(/Z$/,'')+'Z'),sat:this.library.json2satrec(row)}];}catch{return [];}});
   if(!this.records.length)this.status='Starlink unavailable; stars and Moon still work';
   if(this.records.length)this.status=`Starlink sample (${this.records.length} orbits); updated ${new Date(this.fetched).toISOString().slice(0,16).replace('T',' ')} UTC`;
  })().catch(()=>{this.status='Starlink unavailable; stars and Moon still work';}).finally(()=>{this.pending=null;});return this.pending;
 }
 write(){try{fs.writeFileSync(this.file,JSON.stringify({next:this.next,fetched:this.fetched,rows:this.rows}),{mode:0o600});}catch{/* An unwritable cache must not prevent the local sky. */}}
 tracks(where,date){
  if(!this.library)return [];const S=this.library,observer={latitude:where.latitude*Math.PI/180,longitude:where.longitude*Math.PI/180,height:0};
  const point=(sat,time)=>{try{const state=S.propagate(sat,new Date(time));if(!state?.position)return null;const h=S.ecfToLookAngles(observer,S.eciToEcf(state.position,S.gstime(new Date(time))));return Number.isFinite(h.azimuth)&&Number.isFinite(h.elevation)?[h.azimuth*180/Math.PI,h.elevation*180/Math.PI]:null;}catch{return null;}};
  const at=date.getTime(),tracks=[];
  for(const record of this.records){if(Math.abs(at-record.epoch)>7*DAY)continue;const start=point(record.sat,at);if(!start||start[1]<5)continue;
   const past=point(record.sat,at-15000),end=point(record.sat,at+15000);if(!past||!end)continue;
   tracks.push({name:record.name,points:[past,start,end]});
  }return tracks.sort((a,b)=>b.points[1][1]-a.points[1][1]).slice(0,16);
 }
}
async function networkLocation(fetcher=fetch){const result=await fetchJson('https://ipwho.is/?fields=success,latitude,longitude',16384,fetcher);const loc=result.success&&location({...result,source:'network'});if(!loc)throw new Error('Location unavailable. Enter coordinates instead.');return loc;}
module.exports={Starlink,networkLocation,validElements,fetchJson};
