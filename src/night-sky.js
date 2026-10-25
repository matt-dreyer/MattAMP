/* The sky is a chart of real positions; camera motion, twinkle and glyph sizes are artistic. */
class MattNightSky {
 constructor(){this.clock=new MattSkyClock();this.data=null;this.focus='';this.scan=true;this.cameraElapsed=0;this.cameraLast=null;this.cameraBlend=1;this.layers={constellations:true,labels:true,milkyWay:true};}
 // Camera time is independent of astronomical time, so Live now also glides.
 stepCamera(now){
  const dt=this.cameraLast===null?0:Math.max(0,Math.min(.08,(now-this.cameraLast)/1000));this.cameraLast=now;
  if(this.clock.paused)return;
  const moving=this.scan&&!this.focus;
  if(moving)this.cameraElapsed+=dt;
  this.cameraBlend+=((moving?1:0)-this.cameraBlend)*(1-Math.exp(-dt*2.2));
  if(Math.abs(this.cameraBlend-(moving?1:0))<.001)this.cameraBlend=moving?1:0;
 }
 geometry(w,h,full=false){
  const t=this.cameraElapsed,b=this.reducedMotion?0:this.cameraBlend,base=full?Math.min(w,h)*.43:Math.max(w,h)*.62,scanRadius=Math.hypot(w*.70,h*.67)*(1+.035*Math.sin(t/23));
  // Different slow periods avoid a conspicuous repeating orbit or hard turnaround.
  return {cx:w*(.5+b*.17*Math.sin(t/14)),cy:h*(.5+b*.13*Math.sin(t/19)),
   r:base+b*(scanRadius-base),angle:b*.22*Math.sin(t/17)};
 }
 project(az,alt,w,h,full=false){const g=this.geometry(w,h,full),r=g.r*Math.sqrt(Math.max(0,1-Math.sin(alt*Math.PI/180))),a=az*Math.PI/180+g.angle;return [g.cx-r*Math.sin(a),g.cy-r*Math.cos(a)];}
 view(){
  const data=this.data;if(!data)return null;
  this.clock.step(performance.now());
  if(this.clock.mode!=='tour')return data;
  const at=Date.now()+this.clock.offset(),seconds=(at-data.at)/1000,latitude=data.location.latitude,rotate=p=>MattSkyClock.rotate(p,latitude,seconds);
  const interpolate=(a,b,t)=>{let da=b[0]-a[0];da=((da+540)%360)-180;return [a[0]+da*t,a[1]+(b[1]-a[1])*t];};
  const bodies=data.bodies.map(b=>{const p=rotate(interpolate([b.az,b.alt],b.next||[b.az,b.alt],seconds/3600));return {...b,az:p[0],alt:p[1],illumination:b.illumination===undefined?undefined:Math.max(0,Math.min(1,b.illumination+((b.nextIllumination??b.illumination)-b.illumination)*seconds/3600))};});
  const cloudKey=[data.at,Math.floor(performance.now()/125)].join(':');if(this.cloudKey!==cloudKey){this.cloudKey=cloudKey;this.clouds=data.milkyWay.map(layer=>layer.map(ring=>ring.map(rotate)));}
  return {...data,at,stars:data.stars.map(rotate),constellations:data.constellations.map(t=>({...t,center:rotate(t.center),lines:t.lines.map(line=>line.map(rotate))})),bodies,moon:bodies.find(b=>b.name==='Moon'),milkyWay:this.clouds,satellites:[],targets:data.targets.map(t=>{const body=bodies.find(b=>b.name===t.name),p=body?[body.az,body.alt]:rotate([t.az,t.alt]);return {...t,az:p[0],alt:p[1]};})};
 }
 draw(c,w,h,time,pointer,full=false){
  const sky=this.view();if(!sky)return;this.stepCamera(performance.now());
  const project=(az,alt)=>this.project(az,alt,w,h,full),{r,cx,cy}=this.geometry(w,h,full);
  c.save();c.lineWidth=.7;c.textAlign='center';c.font='11px system-ui';
  if(full){
   const haze=c.createRadialGradient(cx,cy,0,cx,cy,r);haze.addColorStop(0,'#14283a');haze.addColorStop(.65,'#0d1b2b');haze.addColorStop(1,'#070e19');c.fillStyle=haze;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
   for(const alt of [0,30,60]){c.strokeStyle=alt===0?'#44616e':'rgba(126,167,186,.12)';c.beginPath();c.arc(cx,cy,r*Math.sqrt(1-Math.sin(alt*Math.PI/180)),0,Math.PI*2);c.stroke();}
   c.setLineDash([2,7]);c.strokeStyle='rgba(126,167,186,.16)';for(const az of [0,90]){const a=project(az,0),b=project(az+180,0);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}c.setLineDash([]);
   c.fillStyle='#8baebd';for(const [az,label] of [[0,'N'],[90,'E'],[180,'S'],[270,'W']]){const p=project(az,-5);c.fillText(label,p[0],p[1]+4);}
  }
  if(this.layers.milkyWay)this.drawMilkyWay(c,w,h,full,sky);
  let hover=null,nearest=full?38:55;
  const nearestConstellation=pointer?.inside?sky.constellations.filter(t=>t.center[1]>0).map(t=>{const p=project(...t.center);return {name:t.name,d:Math.hypot(p[0]-pointer.x*w,p[1]-pointer.y*h)};}).sort((a,b)=>a.d-b.d)[0]:null;
  if(this.layers.constellations)for(const constellation of sky.constellations){
   const center=project(...constellation.center);
   const selected=this.focus===constellation.name||(nearestConstellation?.name===constellation.name&&nearestConstellation.d<75);
   c.strokeStyle=selected?'rgba(153,210,202,.65)':full?'rgba(114,162,181,.3)':'rgba(128,182,192,.19)';c.lineWidth=selected?1.1:.7;c.beginPath();
   for(const line of constellation.lines)for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];if(a[1]<0||b[1]<0)continue;c.moveTo(...project(...a));c.lineTo(...project(...b));}c.stroke();
   if(constellation.center[1]>8&&((full&&this.layers.labels)||selected)){c.fillStyle=selected?'#b0dbd0':'rgba(133,169,186,.6)';c.font='10px system-ui';c.fillText(constellation.name,...center);}
  }
  for(let i=0;i<sky.stars.length;i++){
   const [az,alt,mag,bv,name]=sky.stars[i];if(alt<=0)continue;const p=project(az,alt);if(p[0]<-10||p[0]>w+10||p[1]<-10||p[1]>h+10)continue;
   const bright=Math.max(.12,Math.min(1,(6.4-mag)/5)),twinkle=.88+.12*Math.sin(time*(.45+(i%7)*.08)+i*2.4),alpha=bright*twinkle*(full?.95:.64),size=Math.max(.35,1.9-mag*.26)*(full?1:1.1);
   const color=bv>1.2?'230,193,150':bv<.15?'166,205,244':'205,222,231';
   if(mag<1.8){const glow=c.createRadialGradient(p[0],p[1],0,p[0],p[1],size*5);glow.addColorStop(0,`rgba(${color},${alpha*.5})`);glow.addColorStop(1,`rgba(${color},0)`);c.fillStyle=glow;c.fillRect(p[0]-size*5,p[1]-size*5,size*10,size*10);}
   c.fillStyle=`rgba(${color},${alpha})`;c.beginPath();c.arc(...p,size,0,Math.PI*2);c.fill();
   if(pointer?.inside&&name){const distance=Math.hypot(p[0]-pointer.x*w,p[1]-pointer.y*h);if(distance<nearest){nearest=distance;hover={p,name};}}
  }
  for(const body of sky.bodies){if(body.alt<=0)continue;const p=project(body.az,body.alt);
   if(body.name==='Moon'){
    const radius=full?18:13,angle=this.limbAngle(body,sky.bodies[0],w,h,full);
    c.save();c.translate(...p);c.rotate(angle);const glow=c.createRadialGradient(0,0,radius*.3,0,0,radius*4);glow.addColorStop(0,`rgba(210,218,197,${full?.2:.12})`);glow.addColorStop(1,'rgba(210,218,197,0)');c.fillStyle=glow;c.fillRect(-radius*4,-radius*4,radius*8,radius*8);
    c.fillStyle=full?'#222e3a':'rgba(31,45,58,.7)';c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.fill();
    const terminator=1-2*body.illumination;c.beginPath();for(let i=0;i<=50;i++){const y=-radius+2*radius*i/50,x=Math.sqrt(Math.max(0,radius*radius-y*y));i?c.lineTo(x,y):c.moveTo(x,y);}for(let i=50;i>=0;i--){const y=-radius+2*radius*i/50;c.lineTo(terminator*Math.sqrt(Math.max(0,radius*radius-y*y)),y);}c.closePath();c.fillStyle=full?'#dce0ca':'rgba(215,224,205,.65)';c.fill();c.clip();c.fillStyle=full?'rgba(55,67,71,.12)':'rgba(55,67,71,.07)';for(const [x,y,size] of [[-.3,-.25,.22],[.15,-.4,.17],[.4,.1,.28],[-.25,.3,.17],[.05,.5,.1]]){c.beginPath();c.ellipse(x*radius,y*radius,size*radius,size*radius*.8,.4,0,Math.PI*2);c.fill();}c.restore();
   }else{c.fillStyle=body.name==='Sun'?'#d0ad69':body.name==='Mars'?'#dcae8e':'#c3d5c0';c.globalAlpha=full?.9:.55;c.beginPath();c.arc(...p,body.name==='Sun'?6:2.3,0,Math.PI*2);c.fill();c.globalAlpha=1;}
   if(full&&this.layers.labels){c.font='11px system-ui';c.fillStyle='#c0ccc8';c.fillText(body.name,p[0],p[1]+(body.name==='Moon'?31:16));}
  }
  // Interpolate short SGP4 predictions. Never extrapolate stale tracks indefinitely.
  const age=(Date.now()-sky.at)/1000;
  c.save();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.clip();
  if(age>=0&&age<=15)for(const sat of sky.satellites||[]){const points=sat.points.map(p=>project(...p)),t=age/15,a=points[1],b=points[2],p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
   c.strokeStyle=full?'rgba(119,205,185,.45)':'rgba(119,205,185,.25)';c.lineWidth=1;c.beginPath();c.moveTo(...points[0]);c.lineTo(...a);c.lineTo(...p);c.stroke();c.fillStyle='#9bdfc2';c.fillRect(p[0]-1,p[1]-1,2,2);
   if(full&&sat===sky.satellites[0]){c.font='10px system-ui';c.fillText(sat.name,p[0],p[1]-8);}
  }
  c.restore();
  const target=sky.targets?.find(t=>t.name===this.focus);
  if(target&&target.alt>0){const p=project(target.az,target.alt);c.strokeStyle='#b1d9b5';c.lineWidth=1;c.beginPath();c.arc(...p,16,0,Math.PI*2);c.stroke();for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){c.beginPath();c.moveTo(p[0]+dx*20,p[1]+dy*20);c.lineTo(p[0]+dx*26,p[1]+dy*26);c.stroke();}}
  if(hover){c.fillStyle=full?'#d7e6e4':'rgba(186,215,214,.8)';c.font='12px system-ui';c.fillText(hover.name,hover.p[0],hover.p[1]-12);}
  c.restore();
 }
 drawMilkyWay(c,w,h,full,sky){
  // Cache the entire dome, then move it with the camera. No camera-dependent
  // polygon rebuilds or missing cloud edges when the viewport pans or zooms.
  const cache=full?'full':'ambient';this.milkyCaches ||= {};const key=[this.data.at,this.clock.mode==='tour'?this.cloudKey:0,full].join(':');let layer=this.milkyCaches[cache];
  if(layer?.key!==key){
   const canvas=layer?.canvas||document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');
   ctx.save();ctx.beginPath();ctx.arc(512,512,512,0,Math.PI*2);ctx.clip();
   for(const cloud of sky.milkyWay||[]){ctx.beginPath();for(const ring of cloud){ring.forEach(([az,alt],i)=>{const r=512*Math.sqrt(Math.max(0,1-Math.sin(alt*Math.PI/180))),a=az*Math.PI/180,q=[512-r*Math.sin(a),512-r*Math.cos(a)];i?ctx.lineTo(...q):ctx.moveTo(...q);});ctx.closePath();}ctx.fillStyle=full?'rgba(116,155,183,.045)':'rgba(116,155,183,.024)';ctx.fill('evenodd');}ctx.restore();
   layer=this.milkyCaches[cache]={key,canvas};
  }
  const {cx,cy,r,angle}=this.geometry(w,h,full);c.save();c.translate(cx,cy);c.rotate(-angle);c.drawImage(layer.canvas,-r,-r,2*r,2*r);c.restore();
 }
 limbAngle(moon,sun,w,h,full){
  const D=Math.PI/180,v=p=>[Math.cos(p.alt*D)*Math.sin(p.az*D),Math.cos(p.alt*D)*Math.cos(p.az*D),Math.sin(p.alt*D)],m=v(moon),s=v(sun),dot=m.reduce((n,x,i)=>n+x*s[i],0),p=m.map((x,i)=>x+.01*(s[i]-dot*x)),len=Math.hypot(...p),q=this.project((Math.atan2(p[0],p[1])/D+360)%360,Math.asin(p[2]/len)/D,w,h,full),a=this.project(moon.az,moon.alt,w,h,full);return Math.atan2(q[1]-a[1],q[0]-a[0]);
 }
}
window.MattNightSky=MattNightSky;
