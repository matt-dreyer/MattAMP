/* Low-contrast local canvas: passive pointer response, no network or media coupling. */
/* Bounded, shuffled journeys: every route meets at the same wide view. */
class MattFractalCamera {
 constructor(random=Math.random){this.random=random;this.elapsed=0;this.previousSite=-1;this.previousRoute='';this.flight=this.nextFlight();}
 nextFlight(){
  // These detail windows are sampled at the renderer's 360-iteration budget.
  const sites=[
   [-.743643887,.131825904,.0008],[-.7453,.1127,.003],
   [-.16,1.0405,.006],[-1.25066,.02012,.004],
   [-1.768778833,.001738996,.0006],[-.088,.654,.004]
  ];
  const choices=sites.map((_,i)=>i).filter(i=>i!==this.previousSite);
  const site=choices[Math.floor(this.random()*choices.length)];
  const routes=['horizontal','vertical','arc','spiral'].filter(route=>route!==this.previousRoute);
  const route=routes[Math.floor(this.random()*routes.length)];
  const [x,y,span]=sites[site],direction=this.random()<.5?-1:1;
  this.previousSite=site;this.previousRoute=route;
  return {site,route,x,y:y*direction,span:span*(.85+this.random()*.3),duration:150+this.random()*60,
   phase:this.random()*Math.PI*2,amplitude:.16+this.random()*.1,turns:.7+this.random()*.4,direction};
 }
 update(dt=0){
  if(Number.isFinite(dt))this.elapsed+=Math.max(0,dt);
  while(this.elapsed>=this.flight.duration){this.elapsed-=this.flight.duration;this.flight=this.nextFlight();}
  const f=this.flight,u=this.elapsed/f.duration,depth=Math.sin(Math.PI*u)**2;
  const span=3.2*Math.exp(Math.log(f.span/3.2)*depth),approach=1-(span/3.2)**1.2;
  const phase=f.phase+u*Math.PI*2*f.turns*f.direction,drift=span*f.amplitude*depth;
  let dx=0,dy=0,angle=0;
  if(f.route==='horizontal')dx=Math.sin(phase)*drift;
  else if(f.route==='vertical')dy=Math.sin(phase)*drift;
  else if(f.route==='arc'){dx=Math.cos(phase)*drift;dy=Math.sin(phase*.7)*drift*.65;}
  else{dx=Math.cos(phase)*drift;dy=Math.sin(phase)*drift;angle=f.direction*Math.PI*.75*depth;}
  return {x:-.5+(f.x+.5)*approach+dx,y:f.y*approach+dy,span,angle};
 }
}

/* Endless local-space route: seeded turns and scenery without an ever-growing world. */
class MattTrenchScene {
 constructor(seed=Math.floor(Math.random()*4294967296)){this.seed=seed>>>0;}
 random(index,salt=0){let n=(Math.imul(index,374761393)^Math.imul(salt,668265263)^this.seed)>>>0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
 ease(t){t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);}
 noise(z,span,salt){const cell=Math.floor(z/span),s=this.ease(z/span-cell);return (this.random(cell,salt)*(1-s)+this.random(cell+1,salt)*s)*2-1;}
 turn(cell){return {start:cell*96+42+this.random(cell,1)*8,length:14+this.random(cell,2)*6,angle:(cell%3!==0&&this.random(cell,3)<.2?0:1.05+this.random(cell,4)*.52)*(this.random(cell,5)<.5?-1:1)};}
 headingBetween(a,b){
  let heading=0;for(let cell=Math.floor(Math.min(a,b)/96)-1;cell<=Math.floor(Math.max(a,b)/96);cell++){
   const t=this.turn(cell);heading+=t.angle*(this.ease((b-t.start)/t.length)-this.ease((a-t.start)/t.length));
  }return heading;
 }
 maneuver(z){
  const cell=Math.floor(z/96),u=(z-cell*96-8)/24,chance=this.random(cell,8);
  // At 3.2 units/second, alternate 96-unit sections give one full roll per minute.
  const kind=cell>0&&cell%2===0?'roll':chance<.3?'knife':'none',active=u>0&&u<1&&kind!=='none';
  const pinch=active?Math.sin(Math.PI*u)**2:0,sign=this.random(cell,9)<.5?-1:1;
  return {kind,pinch,roll:active?(kind==='roll'?Math.PI*2*this.ease(u):1.32*pinch)*sign:0};
 }
 width(z){const base=5.7+this.noise(z,48,12)*2,m=this.maneuver(z);return base*(1-m.pinch)+(m.kind==='roll'?1.35:2)*m.pinch;}
 wall(z,side){return {height:4.5+this.noise(z,18,side+30)*1.4};}
 vent(index){const z=index*96+12+this.random(index,50)*36,length=5+this.random(index,51)*2,half=Math.min(1.8,this.width(z+length/2)*.45);return {z,end:z+length,half,depth:2+this.random(index,52)*3};}
 route(origin){
  // Positions in camera-relative world space. Only the visible neighborhood is built.
  const poses=new Map([[0,{x:0,z:0,heading:0}]]);
  for(const sign of [-1,1])for(let n=1;n<=130;n++){
   const offset=n*sign,prev=poses.get(offset-sign),h=this.headingBetween(origin,origin+offset-sign*.5);
   poses.set(offset,{x:prev.x+Math.sin(h)*sign,z:prev.z+Math.cos(h)*sign,heading:this.headingBetween(origin,origin+offset)});
  }
  return distance=>{const at=distance-origin,n=Math.floor(at),t=at-n,a=poses.get(n),b=poses.get(n+1)||a;
   if(!a)return null;return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,heading:a.heading+(b.heading-a.heading)*t};};
 }
 frame(time,w,h,pointer={x:.5,y:.5,strength:0}){
  if(!Number.isFinite(time)||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return [];
  const travel=time*3.2,near=1.5,far=110,step=3,lines=[],pose=this.route(travel);
  const strength=pointer.strength||0,px=(pointer.x-.5)*strength,py=(pointer.y-.5)*strength;
  const cameraY=2.2+Math.sin(time*.2)*.08-py*.5;
  const turnBank=Math.max(-.16,Math.min(.16,-this.headingBetween(travel-4,travel+4)*.25));
  const bank=turnBank+this.maneuver(travel).roll-px*.055,ca=Math.cos(bank),sa=Math.sin(bank);
  const focal=Math.min(w*.85,h*.9),cx=w*.5,cy=h*(.43+py*.035);
  const point=([s,x,y])=>{const p=pose(s);return [p.x+x*Math.cos(p.heading),y,p.z-x*Math.sin(p.heading)];};
  const project=p=>{const x=(p[0]-px*.8)*focal/p[2],y=(cameraY-p[1])*focal/p[2];return [cx+x*ca-y*sa,cy+x*sa+y*ca];};
  const line=(a,b,accent=0)=>{
   a=point(a);b=point(b);if(a[2]<near&&b[2]<near||a[2]>far&&b[2]>far)return;
   if(a[2]<near||b[2]<near){if(a[2]<near){const t=(near-a[2])/(b[2]-a[2]);a=a.map((v,i)=>v+(b[i]-v)*t);}else{const t=(near-b[2])/(a[2]-b[2]);b=b.map((v,i)=>v+(a[i]-v)*t);}}
   const depth=(a[2]+b[2])*.5,A=project(a),B=project(b);
   if(A[0]<0&&B[0]<0||A[0]>w&&B[0]>w||A[1]<0&&B[1]<0||A[1]>h&&B[1]>h)return;
   lines.push([...A,...B,Math.min(3,Math.floor(depth/27.5)),accent]);
  };
  const vents=Array.from({length:4},(_,i)=>this.vent(Math.floor(travel/96)-1+i));
  const floorLine=(a,b)=>{
   // Cut the grid at each opening, so shafts read as holes rather than drawn-on boxes.
   let spans=[[0,1]];
   for(const v of vents){let lo=0,hi=1;
    for(const [axis,min,max] of [[0,v.z,v.end],[1,-v.half,v.half]]){
     const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-9){if(a[axis]<min||a[axis]>max){hi=-1;break;}}
     else{const p=(min-a[axis])/delta,q=(max-a[axis])/delta;lo=Math.max(lo,Math.min(p,q));hi=Math.min(hi,Math.max(p,q));}
    }
    if(lo>=hi)continue;spans=spans.flatMap(([l,r])=>hi<=l||lo>=r?[[l,r]]:[...(l<lo?[[l,lo]]:[]),...(hi<r?[[hi,r]]:[])]);
   }
   const at=t=>a.map((v,i)=>v+(b[i]-v)*t);for(const [l,r] of spans)line(at(l),at(r));
  };
  const section=z=>{
   const half=this.width(z),left=this.wall(z,-1),right=this.wall(z,1);
   const side=(s,p)=>[[s*(half+8),p.height+1],[s*(half+3),p.height+1],[s*(half+3),p.height],[s*half,p.height],[s*half,p.height*.55],[s*half,0]];
   return [...side(-1,left),[-half*.5,0],[0,0],[half*.5,0],...side(1,right).reverse()].map(([x,y])=>[z,x,y]);
  };
  const first=Math.floor(travel/step)*step;
  for(let i=-1;i<36;i++){
   const z=first+i*step,a=section(z),b=section(z+step);
   for(let j=0;j<a.length;j++)a[j][2]===0&&b[j][2]===0?floorLine(a[j],b[j]):line(a[j],b[j],j===3||j===11?1:0);
   for(let j=0;j<a.length-1;j++)a[j][2]===0&&a[j+1][2]===0?floorLine(a[j],a[j+1]):line(a[j],a[j+1]);
  }
  for(const v of vents){
   if(v.z>travel+108||v.end<travel-3)continue;
   const lip=[[v.z,-v.half,0],[v.z,v.half,0],[v.end,v.half,0],[v.end,-v.half,0]],bottom=lip.map(([s,x])=>[s,x*.7,-v.depth]);
   for(let j=0;j<4;j++){line(lip[j],lip[(j+1)%4],1);line(lip[j],bottom[j]);line(bottom[j],bottom[(j+1)%4]);}
   for(let rung=1;rung<=3;rung++)line([v.end,-v.half*.4,-v.depth*rung/4],[v.end,v.half*.4,-v.depth*rung/4],1);
  }
  // Seeded mechanical panels, braces, and rim machinery follow local wall width.
  for(let i=Math.floor(travel/18)-1;i<Math.floor(travel/18)+7;i++)for(const side of [-1,1]){
   const z=i*18+3,half=this.width(z),wall=this.wall(z,side),type=Math.floor(this.random(i,side+60)*3);
   if(type===0){line([z,side*half,.6],[z+6,side*this.width(z+6),wall.height-.4],1);line([z,side*half,wall.height-.4],[z+6,side*this.width(z+6),.6],1);}
   else if(type===1){for(const y of [1,1.5,2])line([z,side*(half+.15),y],[z+5,side*(this.width(z+5)+.15),y],1);}
   else{
    const points=[];for(const y of [wall.height,wall.height+1.5])for(const [s,x] of [[z,half+.3],[z,half+2],[z+4,this.width(z+4)+2],[z+4,this.width(z+4)+.3]])points.push([s,side*x,y]);
    for(let j=0;j<4;j++){line(points[j],points[j+4]);line(points[j+4],points[(j+1)%4+4],1);}
   }
  }
  const current=Math.floor(time/5.5);
  for(let slot=current-3;slot<=current+5;slot++){
   if(this.random(slot,70)<.3)continue;
   const fireAt=slot*5.5+this.random(slot,71)*2,side=this.random(slot,72)<.5?-1:1,z=fireAt*3.2+36,half=this.width(z);
   if(z>travel+110)continue;
   const muzzle=[z-1.5,side*(half-.7),2.8];
   line([z,side*half,2.4],[z,side*half,3.2],1);line([z,side*half,2.4],muzzle,1);line([z,side*half,3.2],muzzle,1);
   for(const delay of [0,.18]){const age=time-fireAt-delay;if(age<0||age>1.8)continue;
    const bolt=t=>[z-1.5-30*t,muzzle[1]*(1-t),2.8-1.1*t];line(bolt(Math.max(0,age/1.8-.075)),bolt(age/1.8),2);
   }
  }
  return lines;
 }
}

/* Moving eddies carry layered tracers; trails and particle count stay bounded. */
class MattParticleFlow {
 constructor(w,h){
  this.width=w;this.height=h;
  this.particles=Array.from({length:Math.min(360,Math.max(180,Math.round(w*h/1350)))},(_,i)=>{
   const depth=.35+(i*.754877666%1)*.65;
   return {x:(i*.61803398875%1)*w,y:(i*.41421356237%1)*h,vx:0,vy:0,depth,tint:i%7===0?2:i%3===0?1:0,trail:[],age:(i*.56984029%1)*24,life:24+(i%11),generation:0,index:i,fade:1};
  });
 }
 step(dt,time,pointer={x:.5,y:.5,strength:0}){
  if(!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,.08);const w=this.width,h=this.height,scale=Math.min(w,h);
  const eddies=[
   {x:w*(.31+.12*Math.sin(time*.085)),y:h*(.38+.17*Math.cos(time*.065)),r:scale*.36,spin:1},
   {x:w*(.7+.12*Math.cos(time*.07)),y:h*(.64+.16*Math.sin(time*.09)),r:scale*.3,spin:-1},
   {x:w*(.48+.23*Math.sin(time*.045)),y:h*(.5+.25*Math.cos(time*.055)),r:scale*.47,spin:.65}
  ];
  const mx=pointer.x*w,my=pointer.y*h,radius=Math.max(100,Math.min(190,scale*.4));
  for(const p of this.particles){
   const x=p.x/w,y=p.y/h;
   let vx=19+19*Math.sin(y*7+time*.18)+12*Math.cos(y*13-time*.13),vy=17*Math.sin(x*8-time*.16)+10*Math.cos(x*15+time*.11);
   for(const e of eddies){const dx=p.x-e.x,dy=p.y-e.y,falloff=Math.exp(-(dx*dx+dy*dy)/(e.r*e.r));vx-=dy/e.r*155*falloff*e.spin;vy+=dx/e.r*155*falloff*e.spin;}
   const dx=p.x-mx,dy=p.y-my,falloff=Math.exp(-(dx*dx+dy*dy)/(radius*radius))*(pointer.strength||0);
   // A soft whirlpool with an outward wake; no hard mouse collision or input interception.
   vx+=(dx*.32-dy)*falloff*1.3;vy+=(dy*.32+dx)*falloff*1.3;
   const ease=1-Math.exp(-dt*2.8),speed=.65+p.depth*.65;
   p.vx+=(vx*speed-p.vx)*ease;p.vy+=(vy*speed-p.vy)*ease;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;
   if(p.age>=p.life){
    p.generation++;const n=p.index+p.generation*127;
    p.x=((n*.61803398875+.19)%1)*w;p.y=((n*.41421356237+.27)%1)*h;p.age=0;p.vx=0;p.vy=0;p.trail=[];
   }else if(p.x< -16||p.x>w+16||p.y< -16||p.y>h+16){
    p.x=((p.x+16)%(w+32)+w+32)%(w+32)-16;p.y=((p.y+16)%(h+32)+h+32)%(h+32)-16;p.trail=[];
   }
   p.fade=Math.max(0,Math.min(1,p.age/1.2,(p.life-p.age)/1.5));
   p.trail.push({x:p.x,y:p.y});if(p.trail.length>64)p.trail.shift();
  }
 }
}

/* Decorative wind field, not live weather: storm passes alternate with broad currents. */
class MattWindyFlow {
 constructor(w,h,seed=123){
  this.width=w;this.height=h;this.seed=seed>>>0;
  this.particles=Array.from({length:Math.min(480,Math.max(220,Math.round(w*h/1050)))},(_,i)=>{
   const depth=.35+(i*.754877666%1)*.65;
   return {x:(i*.61803398875%1)*w,y:(i*.41421356237%1)*h,vx:0,vy:0,depth,energy:0,trail:[],age:(i*.56984029%1)*24,life:24+(i%11),generation:0,index:i,fade:1};
  });
 }
 random(index,salt){let n=(Math.imul(index,374761393)^Math.imul(salt,668265263)^this.seed)>>>0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
 weather(time){
  // Each three-minute chapter has a seeded route; quiet fronts separate storm passes.
  const cell=Math.floor(time/180),local=time-cell*180,scale=Math.min(this.width,this.height);
  const u=Math.max(0,Math.min(1,(local-20)/120)),smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
  const strength=this.random(cell,1)<.22?0:smooth((local-20)/12)*smooth((140-local)/12);
  const direction=this.random(cell,2)<.5?1:-1,along=direction===1?u:1-u;
  const cross=.25+this.random(cell,3)*.5+.1*Math.sin(u*Math.PI*2+this.random(cell,4)*6)*Math.sin(u*Math.PI);
  const horizontal=this.random(cell,5)<.5;
  return {x:this.width*(horizontal?-.7+along*2.4:cross),y:this.height*(horizontal?cross:-.7+along*2.4),
   r:scale*(.3+this.random(cell,6)*.17),eye:scale*(.035+this.random(cell,7)*.02),phase:time*.07,
   strength,spin:this.random(cell,8)<.5?1:-1};
 }
 wind(x,y,time,storm=this.weather(time)){
  const dx=x-storm.x,dy=y-storm.y,d=Math.hypot(dx,dy),r=storm.r;
  const angle=Math.atan2(dy,dx),q=Math.max(0,(d-storm.eye)/(r*.15));
  const wall=1-Math.exp(-q*q),influence=storm.strength*Math.exp(-Math.pow(d/(r*1.4),4));
  const bands=.66+.34*Math.sin(angle*3-Math.log(Math.max(d,storm.eye)/r)*5+storm.phase);
  const rotation=storm.strength*storm.spin*115*wall*Math.exp(-d/(r*.9))*(.86+bands*.14);
  const inflow=-storm.strength*20*wall*Math.exp(-d/r)*bands;
  const norm=Math.max(d,1),background=1-influence;
  const vx=(19+19*Math.sin(y/this.height*7+time*.1)+12*Math.cos(y/this.height*13-time*.08))*background+(-dy*rotation+dx*inflow)/norm;
  const vy=(17*Math.sin(x/this.width*8-time*.09)+10*Math.cos(x/this.width*15+time*.07))*background+(dx*rotation+dy*inflow)/norm;
  const eyeFade=1-storm.strength*(1-Math.max(0,Math.min(1,(d-storm.eye*.65)/(storm.eye*.6))));
  return {vx,vy,energy:Math.min(1,Math.hypot(vx,vy)/65),wash:storm.strength*wall*Math.exp(-d/(r*1.15))*bands+.12*background*Math.min(1,Math.hypot(vx,vy)/65),eyeFade};
 }
 // Subdued wind-map palette: cool currents, green bands, warmer eyewall.
 color(energy){
  const stops=[[123,177,204],[145,190,171],[185,168,126],[166,143,185]];
  const t=Math.max(0,Math.min(1,energy))*3,i=Math.min(2,Math.floor(t)),f=t-i;
  return stops[i].map((n,j)=>Math.round(n+(stops[i+1][j]-n)*f));
 }
 step(dt,time,pointer={x:.5,y:.5,strength:0}){
  if(!Number.isFinite(dt)||dt<=0)return;
  dt=Math.min(dt,.08);const w=this.width,h=this.height,storm=this.weather(time);
  const mx=pointer.x*w,my=pointer.y*h,radius=Math.max(100,Math.min(190,Math.min(w,h)*.4));
  for(const p of this.particles){
   const wind=this.wind(p.x,p.y,time,storm);let {vx,vy}=wind;
   const dx=p.x-mx,dy=p.y-my,falloff=Math.exp(-(dx*dx+dy*dy)/(radius*radius))*(pointer.strength||0);
   vx+=(dx*.32-dy)*falloff*1.3;vy+=(dy*.32+dx)*falloff*1.3;
   // Fast directional response keeps the eyewall coherent; depth still varies speed.
   const ease=1-Math.exp(-dt*7),speed=.8+p.depth*.4;
   p.vx+=(vx*speed-p.vx)*ease;p.vy+=(vy*speed-p.vy)*ease;p.energy+=(wind.energy-p.energy)*ease;
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.age+=dt;
   if(p.age>=p.life){
    p.generation++;const n=p.index+p.generation*127;
    p.x=((n*.61803398875+.19)%1)*w;p.y=((n*.41421356237+.27)%1)*h;p.age=0;p.vx=0;p.vy=0;p.trail=[];
   }else if(p.x< -16||p.x>w+16||p.y< -16||p.y>h+16){
    p.x=((p.x+16)%(w+32)+w+32)%(w+32)-16;p.y=((p.y+16)%(h+32)+h+32)%(h+32)-16;p.trail=[];
   }
   p.fade=Math.max(0,Math.min(1,p.age/1.2,(p.life-p.age)/1.5))*wind.eyeFade;
   // Keep the long trails that make Particle Flow distinctive.
   p.trail.push({x:p.x,y:p.y});if(p.trail.length>64)p.trail.shift();
  }
 }
}

class MattAmbient {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mode='off';this.paused=false;this.timer=0;this.frame=0;this.time=0;this.last=0;this.width=0;this.height=0;this.particles=[];this.stars=[];this.fractal=null;this.fractalFailed=false;this.fractalStill=null;
  this.nightSky=new MattNightSky();
  this.fractalCamera=new MattFractalCamera();this.trench=new MattTrenchScene();this.windySeed=Math.floor(Math.random()*4294967296);
  this.pointer={inside:false,x:.5,y:.5,targetX:.5,targetY:.5,strength:0};
  const host=canvas.parentElement;
  host.addEventListener('pointermove',event=>{
   if(event.pointerType==='touch'||this.canvas.hidden)return;
   if(event.target.closest?.('iframe,#x-viewport')){this.pointer.inside=false;return;}
   const bounds=host.getBoundingClientRect(),p=this.pointer;
   if(!bounds.width||!bounds.height)return;
   p.targetX=Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width));
   p.targetY=Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height));
   if(!p.inside){p.x=p.targetX;p.y=p.targetY;}p.inside=true;
  },{passive:true,capture:true});
  const leave=()=>{this.pointer.inside=false;};
  host.addEventListener('pointerleave',leave,{passive:true});
  host.addEventListener('pointercancel',leave,{passive:true});
  // Provider frames own their input; never intercept clicks or inject listeners there.
  host.addEventListener('pointerover',event=>{if(event.target.closest?.('iframe,#x-viewport'))leave();},{passive:true,capture:true});
  window.addEventListener('blur',leave);
  this.motion=matchMedia('(prefers-reduced-motion: reduce)');
  this.motion.addEventListener('change',()=>this.sync());
  document.addEventListener('visibilitychange',()=>this.sync());
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
 }
 resize(){
  const w=this.canvas.parentElement.clientWidth,h=this.canvas.parentElement.clientHeight;
  if(w===this.width&&h===this.height)return;
  this.width=w;this.height=h;const scale=Math.min(devicePixelRatio||1,1.5);
  this.canvas.width=Math.round(w*scale);this.canvas.height=Math.round(h*scale);this.ctx?.setTransform(scale,0,0,scale,0,0);
  this.flow=new MattParticleFlow(w,h);this.particles=this.flow.particles;this.windy=new MattWindyFlow(w,h,this.windySeed);this.windMapTime=-Infinity;
  this.stars=Array.from({length:Math.min(300,Math.max(110,Math.round(w*h/1900)))},(_,i)=>({
   x:((i*.61803398875+.17)%1)*w,y:((i*.41421356237+.31)%1)*h,
   depth:.2+((i*.754877666)%1)*.8,phase:i*2.39996323
  }));
  this.draw(0);
 }
 configure(mode,paused=false){
  const next=['flow','windy','waves','stars','night-sky','mandelbrot','trench'].includes(mode)?mode:'off';
  if(next===this.mode&&paused===this.paused)return;
  this.mode=next;this.paused=paused;this.sync();
 }
 sync(){
  clearTimeout(this.timer);cancelAnimationFrame(this.frame);this.timer=0;this.frame=0;this.last=0;
  const active=this.ctx&&this.mode!=='off'&&!this.paused&&!document.hidden&&!this.motion.matches;
  this.canvas.hidden=!active;
  if(!active){this.pointer.inside=false;this.pointer.strength=0;this.ctx?.clearRect(0,0,this.width,this.height);return;}
  this.resize();this.draw(0);this.schedule();
 }
 fps(){return this.mode==='mandelbrot'?18:24;}
 schedule(){this.timer=setTimeout(()=>{this.timer=0;this.frame=requestAnimationFrame(now=>{this.frame=0;const dt=this.last?Math.min((now-this.last)/1000,.08):1/this.fps();this.last=now;this.time+=dt;this.draw(dt);this.schedule();});},1000/this.fps());}
 draw(dt){
  const c=this.ctx,w=this.width,h=this.height;if(!c||!w||!h)return;c.clearRect(0,0,w,h);
  if(this.mode==='off'||this.paused||this.motion.matches||document.hidden)return;
  const pointer=this.pointer,ease=1-Math.exp(-dt*5);
  pointer.x+=(pointer.targetX-pointer.x)*ease;pointer.y+=(pointer.targetY-pointer.y)*ease;
  pointer.strength+=((pointer.inside?1:0)-pointer.strength)*ease;
  const mx=pointer.x*w,my=pointer.y*h,power=pointer.strength,radius=130;
  if(this.mode==='night-sky'){this.nightSky.draw(c,w,h,this.time,pointer);}
  else if(this.mode==='trench'){this.drawTrench();}
  else if(this.mode==='windy'){this.drawWindy(dt);}
  else if(this.mode==='mandelbrot'){this.drawFractal(dt);}
  else if(this.mode==='waves'){
   const rows=Math.max(18,Math.min(32,Math.round(h/25)));
   for(let row=0;row<rows;row++){
    c.beginPath();for(let x=-20;x<=w+20;x+=12){const base=h*(row+.5)/rows+Math.sin(x/w*5+this.time*.22+row*.45)*17+Math.sin(x/w*9-this.time*.12+row*.7)*8;const distance=Math.hypot(x-mx,base-my),ripple=Math.sin(distance/19-this.time*2)*14*Math.exp(-distance*distance/(radius*radius))*power,y=base+ripple;x===-20?c.moveTo(x,y):c.lineTo(x,y);}
    c.strokeStyle=row%3===0?'rgba(130,181,164,.18)':'rgba(120,171,198,.22)';c.lineWidth=row%3===0?1.2:.8;c.stroke();
   }
  }else if(this.mode==='stars'){
   // Three-dimensional feel through size and drift, without bright warp trails.
   for(const star of this.stars){
    const speed=.7+star.depth*2.2;
    star.x=(star.x+dt*speed)%w;star.y=(star.y+dt*speed*.15)%h;
    const shimmer=.88+Math.sin(this.time*.35+star.phase)*.12;
    c.fillStyle=`rgba(151,184,207,${(.13+star.depth*.22)*shimmer})`;
    c.beginPath();c.arc((star.x+(pointer.x-.5)*28*star.depth*power+w)%w,(star.y+(pointer.y-.5)*28*star.depth*power+h)%h,.45+star.depth*.7,0,Math.PI*2);c.fill();
   }
  }else{this.drawFlow(dt);}
 }
 drawFlow(dt){
  this.flow.step(dt,this.time,this.pointer);
  const c=this.ctx,colors=['123,177,204','145,190,171','142,159,201'];
  c.lineCap='round';c.lineJoin='round';
  for(const p of this.particles){
   const trail=p.trail,n=trail.length;if(n<2)continue;
   // Faint tails build into brighter tips, with depth carried by speed and line weight.
   for(let band=0;band<3;band++){
    const from=Math.floor((n-1)*band/3),to=Math.floor((n-1)*(band+1)/3);
    c.strokeStyle=`rgba(${colors[p.tint]},${[.065,.16,.3][band]*p.fade*(.6+p.depth*.4)})`;
    c.lineWidth=.55+p.depth*.65;c.beginPath();c.moveTo(trail[from].x,trail[from].y);
    for(let j=from+1;j<=to;j++)c.lineTo(trail[j].x,trail[j].y);c.stroke();
   }
   c.fillStyle=`rgba(${colors[p.tint]},${(.25+p.depth*.25)*p.fade})`;
   c.beginPath();c.arc(p.x,p.y,.65+p.depth*.65,0,Math.PI*2);c.fill();
  }
  c.lineCap='butt';c.lineJoin='miter';
 }

 drawWindy(dt){
  this.windy.step(dt,this.time,this.pointer);
  const c=this.ctx;this.drawWindWash();
  c.lineCap='round';c.lineJoin='round';
  for(const p of this.windy.particles){
   const trail=p.trail,n=trail.length;if(n<2)continue;const color=this.windy.color(p.energy).join(',');
   // Faint tails build into brighter tips, with depth carried by speed and line weight.
   for(let band=0;band<3;band++){
    const from=Math.floor((n-1)*band/3),to=Math.floor((n-1)*(band+1)/3);
    c.strokeStyle=`rgba(${color},${[.065,.16,.3][band]*p.fade*(.6+p.depth*.4)})`;
    c.lineWidth=.55+p.depth*.65;c.beginPath();c.moveTo(trail[from].x,trail[from].y);
    for(let j=from+1;j<=to;j++)c.lineTo(trail[j].x,trail[j].y);c.stroke();
   }
   c.fillStyle=`rgba(${color},${(.25+p.depth*.25)*p.fade})`;
   c.beginPath();c.arc(p.x,p.y,.65+p.depth*.65,0,Math.PI*2);c.fill();
  }
  c.lineCap='butt';c.lineJoin='miter';
 }

 drawWindWash(){
  // A small, slowly updated field keeps the color wash inexpensive and softly blended.
  const w=this.width,h=this.height,scale=96/Math.max(w,h),sw=Math.max(1,Math.round(w*scale)),sh=Math.max(1,Math.round(h*scale));
  if(!this.windMap){this.windMap=document.createElement('canvas');this.windMapTime=-Infinity;}
  if(this.windMap.width!==sw||this.windMap.height!==sh){this.windMap.width=sw;this.windMap.height=sh;this.windMapTime=-Infinity;}
  if(Math.abs(this.time-this.windMapTime)>=.25){
   const context=this.windMap.getContext('2d'),pixels=context.createImageData(sw,sh),storm=this.windy.weather(this.time);
   for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
    const wind=this.windy.wind((x+.5)*w/sw,(y+.5)*h/sh,this.time,storm),color=this.windy.color(wind.energy),i=(y*sw+x)*4;
    pixels.data[i]=color[0];pixels.data[i+1]=color[1];pixels.data[i+2]=color[2];pixels.data[i+3]=Math.round(wind.wash*wind.eyeFade*30);
   }
   context.putImageData(pixels,0,0);this.windMapTime=this.time;
  }
  this.ctx.drawImage(this.windMap,0,0,w,h);
 }

 drawTrench(){
  const c=this.ctx,lines=this.trench.frame(this.time,this.width,this.height,this.pointer);
  // Batch by depth and tint: twelve strokes per frame, no glow or full-screen fills.
  for(let shade=3;shade>=0;shade--)for(let accent=0;accent<3;accent++){
   c.beginPath();for(const line of lines)if(line[4]===shade&&line[5]===accent){c.moveTo(line[0],line[1]);c.lineTo(line[2],line[3]);}
   const alpha=[.27,.19,.11,.045][shade];
   c.strokeStyle=accent===2?`rgba(218,139,106,${alpha*1.3})`:accent===1?`rgba(156,202,176,${alpha})`:`rgba(121,185,205,${alpha})`;
   c.lineWidth=accent===2?1.5:accent===1?1.1:.85;c.stroke();
  }
 }
 initFractal(){
  if(this.fractal||this.fractalFailed)return;
  const surface=document.createElement('canvas');
  const gl=surface.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,premultipliedAlpha:false});
  if(!gl){this.fractalFailed=true;return;}
  const shaders=[];let program,buffer;
  try{
   const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Shader unavailable');return shader;};
   program=gl.createProgram();
   gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 point; varying vec2 uv; void main(){uv=point*.5+.5;gl_Position=vec4(point,0.,1.);}'));
   gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`
    precision highp float;
    varying vec2 uv; uniform vec2 aspect; uniform vec2 pointerShift; uniform vec2 center; uniform float angle; uniform float span;
    void main(){
     vec2 screen=(uv-.5+pointerShift)*aspect;
     float ca=cos(angle),sa=sin(angle);
     vec2 c=center+vec2(ca*screen.x-sa*screen.y,sa*screen.x+ca*screen.y)*span;
     vec2 z=vec2(0.); float n=0.; bool escaped=false;
     for(int i=0;i<360;i++){
      z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+c;
      if(dot(z,z)>256.){n=float(i)+1.-log2(log2(dot(z,z))*.5);escaped=true;break;}
     }
     if(!escaped){gl_FragColor=vec4(.035,.065,.085,.45);return;}
     float band=.5+.5*cos(n*.32);
     vec3 ink=mix(vec3(.10,.22,.30),vec3(.25,.39,.35),band);
     gl_FragColor=vec4(ink,.48);
    }`));
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader unavailable');
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   gl.useProgram(program);const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
   this.fractal={surface,gl,program,span:gl.getUniformLocation(program,'span'),aspect:gl.getUniformLocation(program,'aspect'),pointerShift:gl.getUniformLocation(program,'pointerShift'),center:gl.getUniformLocation(program,'center'),angle:gl.getUniformLocation(program,'angle')};
   surface.addEventListener('webglcontextlost',event=>{event.preventDefault();this.fractal=null;this.fractalFailed=true;});
   surface.addEventListener('webglcontextrestored',()=>{this.fractalFailed=false;});
  }catch{if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);this.fractalFailed=true;}
  finally{for(const shader of shaders)gl.deleteShader(shader);}
 }
 drawFractal(dt=0){
  this.initFractal();const f=this.fractal;
  if(!f){
   // One quiet still if GPU rendering is unavailable; never spin a CPU fractal loop.
   if(!this.fractalStill){
    const surface=document.createElement('canvas');surface.width=160;surface.height=160;
    const c=surface.getContext('2d'),image=c.createImageData(160,160);
    for(let y=0;y<160;y++)for(let x=0;x<160;x++){
     const cr=(x/160-.5)*3.2-.5,ci=(y/160-.5)*3.2;let a=0,b=0,n=0;
     while(a*a+b*b<256&&n<100){const next=a*a-b*b+cr;b=2*a*b+ci;a=next;n++;}
     const band=n===100?0:(.5+.5*Math.cos(n*.32)),i=(y*160+x)*4;
     image.data.set([25+band*39,56+band*43,76+band*13,90],i);
    }
    c.putImageData(image,0,0);this.fractalStill=surface;
   }
   const size=Math.max(this.width,this.height)+24,p=this.pointer;this.ctx.drawImage(this.fractalStill,(this.width-size)/2+(p.x-.5)*16*p.strength,(this.height-size)/2+(p.y-.5)*16*p.strength,size,size);return;
  }
  const scale=Math.min(1,640/Math.max(this.width,this.height));
  const w=Math.max(1,Math.round(this.width*scale)),h=Math.max(1,Math.round(this.height*scale));
  if(f.surface.width!==w||f.surface.height!==h){f.surface.width=w;f.surface.height=h;}
  const gl=f.gl;gl.viewport(0,0,w,h);gl.useProgram(f.program);
  const camera=this.fractalCamera.update(dt);
  gl.uniform1f(f.span,camera.span);gl.uniform2f(f.center,camera.x,camera.y);gl.uniform1f(f.angle,camera.angle);
  gl.uniform2f(f.aspect,w/Math.min(w,h),h/Math.min(w,h));
  const p=this.pointer;gl.uniform2f(f.pointerShift,(p.x-.5)*.07*p.strength,(.5-p.y)*.07*p.strength);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);this.ctx.drawImage(f.surface,0,0,this.width,this.height);
 }

}
window.MattAmbient=MattAmbient;
window.MattFractalCamera=MattFractalCamera;

window.MattTrenchScene=MattTrenchScene;

window.MattParticleFlow=MattParticleFlow;

window.MattWindyFlow=MattWindyFlow;
