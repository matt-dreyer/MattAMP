/* Original pocket artillery simulation. Shared by the renderer and Node tests. */
(function(root){
 'use strict';
 const W=1000,H=540,DT=1/120,FLIGHT_LIMIT=20;
 const SKILLS=[{name:'Very dumb',error:200,retaliation:.15,samples:8,multiplier:1},{name:'Casual',error:110,retaliation:.65,samples:28,multiplier:1.35},{name:'Sharp',error:55,retaliation:1.3,samples:90,multiplier:1.8},{name:'Human-ish',error:28,retaliation:2,samples:160,multiplier:2.2}];
 const COLORS=['#b6ddbd','#d5ac82','#94b7da','#c7a3cf','#d4cd87','#83c5c2'];
 const BOT_NAMES=['Byte','Floppy','Modem','Turbo','DOS'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 // Fine control for nearby shots; retain the old maximum for long lobs and wild wind.
 const launchSpeed=power=>40+530*(clamp(power,1,100)/100)**2;
 const TERRAINS={rolling:'Rolling hills',valley:'Valley',crags:'Craggy peaks',plateaus:'Plateaus',flat:'Flatlands'};
 const GRAVITY={normal:125,moon:80,heavy:200};
 const GRAVITY_NAMES={normal:'Normal gravity',moon:'Moonshot ×0.64',heavy:'Heavy gravity ×1.6'};
 const WALLS={open:'Open edges',ricochet:'Ricochet walls',wrap:'Wraparound walls'};
 const CHAOS={off:'Off',mixed:'Mixed',unhinged:'Unhinged'};
 function validateConditions(value){
  if(value===undefined)return {chaos:'off',terrain:'rolling',gravity:'normal',walls:'open'};
  if(!value||![['chaos',CHAOS],['terrain',TERRAINS],['gravity',GRAVITY],['walls',WALLS]].every(([key,values])=>Object.hasOwn(values,value[key])))throw new Error('Invalid arena conditions');
  return Object.fromEntries(['chaos','terrain','gravity','walls'].map(key=>[key,value[key]]));
 }
 function rollConditions(chaos,random){
  if(!Object.hasOwn(CHAOS,chaos))chaos='mixed';
  if(chaos==='off')return Object.freeze(validateConditions());
  const pick=items=>items[Math.floor(random()*items.length)];
  const terrain=pick(Object.keys(TERRAINS)),changeGravity=chaos==='unhinged'||random()<.5;
  return Object.freeze({chaos,terrain,gravity:changeGravity?pick(['moon','heavy']):'normal',walls:chaos==='unhinged'||!changeGravity?pick(['ricochet','wrap']):'open'});
 }
 function describeConditions(value){const c=validateConditions(value);return CHAOS[c.chaos]+' · '+TERRAINS[c.terrain]+' · '+GRAVITY_NAMES[c.gravity]+' · '+WALLS[c.walls];}
 const smooth=t=>t*t*(3-2*t);
 function terrainNoise(random,spacing){
  const offset=random(),values=Array.from({length:Math.ceil(W/spacing)+3},()=>random()*2-1);
  return x=>{const at=x/spacing+offset,i=Math.floor(at),t=smooth(at-i);return values[i]*(1-t)+values[i+1]*t;};
 }
 function generateTerrain(kind,random){
  const between=(low,high)=>low+(high-low)*random();
  const broad=terrainNoise(random,between(140,260)),detail=terrainNoise(random,between(35,75));
  const base=between(310,355),tilt=between(-35,35),relief=between(50,85),heights=new Float64Array(W+1);
  let profile;
  if(kind==='valley'){
   const center=between(260,740),left=between(160,330),right=between(160,330),depth=between(145,210),rim=between(205,245);
   profile=x=>{const distance=(x-center)/(x<center?left:right);return rim+depth*Math.exp(-distance*distance)+broad(x)*23+detail(x)*5+tilt*(x/W-.5);};
  }else if(kind==='crags'){
   const count=3+Math.floor(random()*4),peaks=Array.from({length:count},(_,i)=>({x:(i+between(.15,.85))*W/count,width:between(35,100),height:between(100,205),lean:between(.65,1.6)}));
   profile=x=>base+broad(x)*38+detail(x)*12-peaks.reduce((sum,p)=>{const d=(x-p.x)/(p.width*(x<p.x?1:p.lean));return sum+p.height*Math.exp(-d*d);},0);
  }else if(kind==='plateaus'){
   const shelves=[{x:0,y:between(210,420),edge:0}];let x=0;
   while(x<W){x+=between(100,230);const previous=shelves.at(-1).y;let y=between(200,430);if(Math.abs(y-previous)<55)y=previous<315?between(365,430):between(200,255);shelves.push({x,y,edge:between(20,60)});}
   profile=x=>{let i=1;while(i<shelves.length-1&&x>shelves[i].x)i++;const next=shelves[i],previous=shelves[i-1],t=smooth(clamp((x-next.x+next.edge)/next.edge,0,1));return previous.y*(1-t)+next.y*t+detail(x)*4;};
  }else if(kind==='flat'){
   const floor=between(350,405),slope=between(-6,6);
   profile=x=>floor+broad(x)*8+detail(x)*2+slope*(x/W-.5);
  }else{
   profile=x=>base+broad(x)*relief+detail(x)*9+tilt*(x/W-.5);
  }
  for(let x=0;x<=W;x++)heights[x]=profile(x);
  const low=Math.min(...heights),high=Math.max(...heights),span=high-low;
  // Preserve the profile instead of clipping peaks into identical flat ceilings/floors.
  if(kind==='crags'){
   const range=between(185,260),top=between(170,450-range);
   for(let x=0;x<=W;x++)heights[x]=top+(heights[x]-low)*range/Math.max(1,span);
  }else if(span>280){for(let x=0;x<=W;x++)heights[x]=170+(heights[x]-low)*280/span;}
  else{const shift=low<170?170-low:high>450?450-high:0;for(let x=0;x<=W;x++)heights[x]+=shift;}
  return heights;
 }
 class Battle{
  constructor({bots=4,skill=1,random=Math.random,history=[],chaos='mixed'}={}){
   this.history=history.slice(-3);this.damageLedger=Array.from({length:6},()=>Array(6).fill(0));this.lastTarget=null;
   this.random=random;this.bots=clamp(Math.round(bots)||4,3,5);this.skill=clamp(Math.round(skill)||0,0,3);
   this.conditions=rollConditions(chaos,random);
   this.terrain=generateTerrain(this.conditions.terrain,random);
   const slots=Array.from({length:this.bots+1},(_,i)=>70+i*860/this.bots);
   const playerSlot=Math.floor(random()*slots.length);
   this.tanks=slots.map((x,i)=>({id:i===playerSlot?0:i<playerSlot?i+1:i,name:i===playerSlot?'YOU':BOT_NAMES[i<playerSlot?i:i-1],x,y:this.ground(x)-8,hp:100,mirvs:3,damage:0,kills:0,shots:0,angle:x<W/2?55:125,power:50,color:COLORS[i===playerSlot?0:i<playerSlot?i+1:i]})).sort((a,b)=>a.id-b.id);
   // Flat spawn pads blend back into the slope instead of cutting vertical ledges.
   for(const tank of this.tanks)for(let x=Math.round(tank.x)-42;x<=tank.x+42;x++){
    const distance=Math.abs(x-Math.round(tank.x)),blend=smooth(clamp((distance-18)/24,0,1));
    this.terrain[x]=(tank.y+8)*(1-blend)+this.terrain[x]*blend;
   }
   this.turn=0;this.round=1;this.shots=0;this.kills=0;this.damage=0;this.phase='aim';this.projectiles=[];this.blasts=[];this.lastTrails=[];this.wind=this.newWind();this.delay=0;this.result=null;
   this.message='Your turn. Pick an angle and power.';
  }
  get active(){return this.tanks[this.turn];}
  ground(x){return this.terrain[clamp(Math.round(x),0,W)];}
  newWind(){
   // Mostly playable breezes, frequent hard crosswinds, occasional ridiculous gusts.
   // Off rolls once per battle; chaos modes reroll each turn. All shots share that wind.
   const roll=this.random(),[low,high]=roll<.6?[0,30]:roll<.9?[31,75]:[76,150];
   const strength=low+Math.floor(this.random()*(high-low+1));
   return strength===0?0:strength*(this.random()<.5?-1:1);
  }
  get multiplier(){return SKILLS[this.skill].multiplier*(1+(this.bots-3)*.15);}
  get damage(){return this.tanks[0].damage;}set damage(value){this.tanks[0].damage=value;}
  get kills(){return this.tanks[0].kills;}set kills(value){this.tanks[0].kills=value;}
  get shots(){return this.tanks[0].shots;}set shots(value){this.tanks[0].shots=value;}
  scoreFor(tank){return Math.round((tank.damage*10+tank.kills*250+(this.phase==='over'&&tank.hp>0?1000+tank.hp*5:0))*this.multiplier);}
  get score(){return this.scoreFor(this.tanks[0]);}
  projectile(tank,angle,power,weapon){const r=angle*Math.PI/180,speed=launchSpeed(power);return {x:tank.x+Math.cos(r)*18,y:tank.y-Math.sin(r)*18,vx:Math.cos(r)*speed,vy:-Math.sin(r)*speed,weapon,owner:tank.id,time:0,trail:[]};}
  fire(angle,power,weapon='shell'){
   if(this.phase!=='aim'||this.active.hp<=0||!Number.isFinite(angle)||!Number.isFinite(power)||!['shell','mirv'].includes(weapon))return false;
   if(weapon==='mirv'&&this.active.mirvs<=0)return false;
   this.active.angle=clamp(angle,5,175);this.active.power=clamp(power,1,100);
   if(weapon==='mirv')this.active.mirvs--;
   this.active.shots++;
   this.projectiles=[this.projectile(this.active,this.active.angle,this.active.power,weapon)];this.lastTrails=[];this.phase='flight';this.message=this.active.name+' fired '+(weapon==='mirv'?'a MIRV.':'a shell.');return true;
  }
  move(p,dt){
   p.vx+=this.wind*dt;p.vy+=GRAVITY[this.conditions.gravity]*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.time+=dt;p.trailBreak=false;
   if(p.x<0||p.x>W){
    if(this.conditions.walls==='wrap'){p.x=((p.x%W)+W)%W;p.trailBreak=true;}
    else if(this.conditions.walls==='ricochet'){
     // Reflect overshoot as well as velocity; no energy gain and no sticky edge.
     while(p.x<0||p.x>W){if(p.x<0){p.x=-p.x;p.vx=Math.abs(p.vx);}else{p.x=2*W-p.x;p.vx=-Math.abs(p.vx);}}
    }
   }
  }
  contact(p){return this.tanks.find(t=>t.hp>0&&(p.time>.12||t.id!==p.owner)&&Math.hypot(p.x-t.x,p.y-t.y)<13);}
  impact(p){return p.x<0||p.x>W||p.y>=this.ground(p.x)||p.time>FLIGHT_LIMIT||!!this.contact(p);}
  predict(tank,angle,power){
   const p=this.projectile(tank,angle,power,'shell');
   for(let i=0;i<=Math.ceil(FLIGHT_LIMIT/DT);i++){this.move(p,DT);if(this.impact(p))return p;}
   return p;
  }
  targetChoices(){
   const tank=this.active;
   return this.tanks.filter(t=>t.hp>0&&t!==tank).map(target=>{
    let grudge=0,wins=0;
    this.history.forEach((match,i)=>{
     const age=this.history.length-1-i;
     grudge+=(match.damage?.[target.id]?.[tank.id]||0)*[1,.7,.4][age];
     if(match.winner===target.id)wins++;
    });
    const revenge=grudge>=15?Math.min(3.5,grudge/45):0,leader=wins>=2?2.5:0;
    // Respond to actual damage in this battle, including splash and falls.
    // Smarter bots place more weight on a live threat; every rival keeps a chance.
    const retaliation=Math.min(4,this.damageLedger[target.id][tank.id]/20*SKILLS[this.skill].retaliation);
    const reason=retaliation>=.5&&retaliation>=Math.max(revenge,leader)?'retaliation':revenge>=leader&&revenge>0?'grudge':leader>0?'leader':null;
    return {tank:target,weight:Math.min(8,Math.min(5,1+revenge+leader)+retaliation),reason};
   });
  }
  chooseTarget(){
   const choices=this.targetChoices();let pick=this.random()*choices.reduce((sum,c)=>sum+c.weight,0);
   const choice=choices.find(c=>(pick-=c.weight)<0)||choices.at(-1);
   this.lastTarget={id:choice.tank.id,reason:choice.reason};return choice.tank;
  }
  botAim(){
   // Reputation changes target odds equally for human and bot identities, never accuracy.
   const tank=this.active,target=this.chooseTarget(),skill=SKILLS[this.skill];
   const targetX=clamp(target.x+(this.random()-.5)*2*skill.error,15,W-15);
   let best={angle:55,power:50,cost:Infinity};
   for(let i=0;i<skill.samples;i++){
    // Special boundaries make firing away from the target a valid bank/portal shot.
    const right=(targetX>tank.x)!==(this.conditions.walls!=='open'&&i%3===0);
    const angle=right?10+this.random()*75:95+this.random()*75,power=1+this.random()*99;
    const p=this.predict(tank,angle,power),cost=Math.hypot(p.x-targetX,p.y-target.y)+(Math.abs(p.x-tank.x)<55?180:0);
    if(cost<best.cost)best={angle,power,cost};
   }
   return {angle:best.angle,power:best.power,weapon:tank.mirvs>0&&this.random()<.35?'mirv':'shell'};
  }
  creditDamage(owner,tank,before){
   const attacker=this.tanks.find(t=>t.id===owner);if(!attacker||owner===tank.id)return;
   const damage=before-tank.hp;this.damageLedger[owner][tank.id]+=damage;attacker.damage+=damage;
   if(before>0&&tank.hp===0)attacker.kills++;
  }
  explode(p){
   if(p.x<0||p.x>W)return;
   const radius=p.weapon==='child'?42:62,damage=(p.weapon==='child'?46:78)*(this.round>12?1.5:1);
   this.blasts.push({x:p.x,y:p.y,radius,age:0});
   for(const tank of this.tanks){
    if(tank.hp<=0)continue;
    const before=tank.hp,d=Math.hypot(tank.x-p.x,tank.y-p.y);
    tank.hp=Math.max(0,tank.hp-Math.round(d<radius?damage*(1-d/radius):0));
    this.creditDamage(p.owner,tank,before);
   }
   for(let x=Math.max(0,Math.floor(p.x-radius));x<=Math.min(W,Math.ceil(p.x+radius));x++){
    const depth=Math.sqrt(Math.max(0,radius*radius-(x-p.x)**2));
    if(p.y+depth>=this.terrain[x]&&p.y-depth<=this.terrain[x])this.terrain[x]=Math.min(H-15,Math.max(this.terrain[x],p.y+depth));
   }
   for(const tank of this.tanks){
    const drop=Math.max(0,this.ground(tank.x)-8-tank.y),before=tank.hp;
    tank.y=this.ground(tank.x)-8;
    if(before>0){tank.hp=Math.max(0,tank.hp-Math.round(Math.max(0,drop-18)*.65));this.creditDamage(p.owner,tank,before);}
   }
  }
  nextTurn(){
   const alive=this.tanks.filter(t=>t.hp>0);
   if(alive.length<=1){this.phase='over';this.result=alive.length===0?'draw':this.tanks[0].hp>0?'win':'loss';this.message=this.result==='win'?'Victory. The ridge is yours.':this.result==='draw'?'Mutual destruction.':alive[0].name+' took the ridge. Your tank is out.';return;}
   do{this.turn=(this.turn+1)%this.tanks.length;if(this.turn===0)this.round++;}while(this.active.hp<=0);
   if(this.conditions.chaos!=='off')this.wind=this.newWind();
   this.phase='aim';this.delay=0;this.message=this.active.id===0?'Your turn. Adjust from your last shot.':this.active.name+' is lining up a shot…';
  }
  step(dt){
   if(this.phase==='over')return;
   dt=clamp(dt,0,.05);
   this.blasts=this.blasts.map(b=>({...b,age:b.age+dt})).filter(b=>b.age<.65);
   if(this.phase==='aim'&&this.active.id!==0){this.delay+=dt;if(this.delay>.65){const aim=this.botAim();this.fire(aim.angle,aim.power,aim.weapon);}return;}
   if(this.phase==='settle'){this.delay-=dt;if(this.delay<=0)this.nextTurn();return;}
   if(this.phase!=='flight')return;
   // Fixed substeps prevent fast shells passing through a narrow tank or ridge.
   for(let left=dt*2.3;left>0;left-=DT){
    const next=[];
    for(const p of this.projectiles){
     this.move(p,Math.min(DT,left));
     if(p.trailBreak||p.trail.length===0||Math.hypot(p.x-p.trail.at(-1).x,p.y-p.trail.at(-1).y)>6){p.trail.push({x:p.x,y:p.y,moveTo:p.trailBreak});if(p.trail.length>160)p.trail.shift();}
     if(this.impact(p)){this.lastTrails.push(p.trail);if(p.time<=FLIGHT_LIMIT)this.explode(p);continue;}
     if(p.weapon==='mirv'&&p.vy>=0){this.lastTrails.push(p.trail);for(let j=-2;j<=2;j++)next.push({...p,weapon:'child',vx:p.vx+j*42,vy:15+Math.abs(j)*8,trail:[]});}
     else next.push(p);
    }
    this.projectiles=next;
    if(!next.length){this.phase='settle';this.delay=.7;break;}
   }
  }
  memory(){const alive=this.tanks.filter(t=>t.hp>0);return {winner:alive.length===1?alive[0].id:null,damage:this.damageLedger.map(row=>[...row])};}
  record(initials,id){
   if(this.phase!=='over')return null;
   const botScores=this.tanks.slice(1).map(t=>({tankId:t.id,score:this.scoreFor(t),kills:t.kills,shots:t.shots,win:t.hp>0,result:t.hp>0?'win':this.result==='draw'?'draw':'loss'}));
   return {id,initials,score:this.score,win:this.result==='win',result:this.result,bots:this.bots,skill:this.skill,kills:this.kills,shots:this.shots,conditions:{...this.conditions},memory:this.memory(),botScores};
  }
 }
 const api={Battle,launchSpeed,generateTerrain,SKILLS,COLORS,BOT_NAMES,W,H,CHAOS,TERRAINS,GRAVITY,WALLS,rollConditions,validateConditions,describeConditions};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.MattArtillery=api;
})(typeof window==='object'?window:globalThis);
