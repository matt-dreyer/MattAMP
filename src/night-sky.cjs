/* Real, local sky coordinates. Catalog: assets/sky/README.md. */
const A=require('astronomy-engine');
const catalog=require('../assets/sky/catalog.json');
const D=Math.PI/180;
function location(value){
 if(!value||!Number.isFinite(value.latitude)||!Number.isFinite(value.longitude)||Math.abs(value.latitude)>90||Math.abs(value.longitude)>180)return null;
 return {latitude:Math.round(value.latitude*10)/10,longitude:Math.round(value.longitude*10)/10,source:['device','network','manual'].includes(value.source)?value.source:'manual'};
}
const vectors=new Map();
function vector(lon,lat){const key=lon+','+lat;if(!vectors.has(key))vectors.set(key,[Math.cos(lat*D)*Math.cos(lon*D),Math.cos(lat*D)*Math.sin(lon*D),Math.sin(lat*D)]);return vectors.get(key);}
for(const s of catalog.stars)vector(s[0],s[1]);
for(const c of catalog.constellations){vector(...c.center);for(const line of c.lines)for(const p of line)vector(...p);}
for(const layer of catalog.milkyWay)for(const ring of layer)for(const p of ring)vector(...p);
function skyAt(where,date=new Date()){
 where=location(where);if(!where)throw new Error('Choose a sky location first.');
 const observer=new A.Observer(where.latitude,where.longitude,0),rotation=A.Rotation_EQJ_HOR(date,observer).rot;
 const horizontal=(lon,lat)=>{const v=vector(lon,lat),r=rotation.map((_,j)=>v.reduce((sum,x,i)=>sum+x*rotation[i][j],0));return [(Math.atan2(-r[1],r[0])/D+360)%360,Math.asin(Math.max(-1,Math.min(1,r[2])))/D];};
 const allStars=catalog.stars.map(s=>[...horizontal(s[0],s[1]),s[2],s[3],s[4]]);
 const stars=allStars;
 const constellations=catalog.constellations.map(c=>({name:c.name,center:horizontal(...c.center),lines:c.lines.map(line=>line.map(p=>horizontal(...p)))}));
 const future=new Date(+date+3600000);
 const bodyPoint=(name,at)=>{const eq=A.Equator(name,at,observer,false,true),v=A.RotateVector({rot:rotation},eq.vec),h=A.HorizonFromVector(v,null);return [h.lon,h.lat];};
 const bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn'].map(name=>{const [az,alt]=bodyPoint(name,date);return {name,az,alt,next:bodyPoint(name,future)};});
 const moon=bodies.find(b=>b.name==='Moon');moon.phase=A.MoonPhase(date);moon.illumination=A.Illumination('Moon',date).phase_fraction;moon.nextIllumination=A.Illumination('Moon',future).phase_fraction;
 const sun=bodies[0];
 const milkyWay=catalog.milkyWay.map(layer=>layer.map(ring=>ring.map(p=>horizontal(...p))));
 const targets=[...allStars.filter(s=>s[4]&&s[2]<3).map(s=>({name:s[4],az:s[0],alt:s[1],kind:'Star'})),...catalog.constellations.map(c=>{const p=horizontal(...c.center);return {name:c.name,az:p[0],alt:p[1],kind:'Constellation'};}),...bodies.map(b=>({...b,kind:b.name==='Sun'?'Star':b.name==='Moon'?'Moon':'Planet'}))];
 return {milkyWay,targets,at:date.getTime(),location:where,stars,constellations,bodies,moon,daylight:sun.alt>-6,satellites:[],satelliteStatus:'Starlink off'};
}
module.exports={location,skyAt};
