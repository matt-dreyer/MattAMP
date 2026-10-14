/* Original pocket artillery simulation. Shared by the renderer and Node tests. */
(function(root){
 'use strict';
 const W=1000,H=540,DT=1/120;
 const SKILLS=[{name:'Very dumb',error:200,samples:8,multiplier:1},{name:'Casual',error:110,samples:28,multiplier:1.35},{name:'Sharp',error:55,samples:90,multiplier:1.8},{name:'Human-ish',error:28,samples:160,multiplier:2.2}];
 const COLORS=['#b6ddbd','#d5ac82','#94b7da','#c7a3cf','#d4cd87','#83c5c2'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 class Battle{
  constructor({bots=4,skill=1,random=Math.random,history=[]}={}){
   this.history=history.slice(-3);this.damageLedger=Array.from({length:6},()=>Array(6).fill(0));this.lastTarget=null;
   this.random=random;this.bots=clamp(Math.round(bots)||4,3,5);this.skill=clamp(Math.round(skill)||0,0,3);
   this.terrain=new Float64Array(W+1);const a=random()*7,b=random()*7;
   for(let x=0;x<=W;x++)this.terrain[x]=325+55*Math.sin(x/190+a)+28*Math.sin(x/76+b);
   const slots=Array.from({length:this.bots+1},(_,i)=>70+i*860/this.bots);
   const playerSlot=Math.floor(random()*slots.length);
   this.tanks=slots.map((x,i)=>({id:i===playerSlot?0:i<playerSlot?i+1:i,name:i===playerSlot?'YOU':['Byte','Floppy','Modem','Turbo','DOS'][i<playerSlot?i:i-1],x,y:this.ground(x)-8,hp:100,mirvs:3,angle:x<W/2?55:125,power:55,color:COLORS[i===playerSlot?0:i<playerSlot?i+1:i]})).sort((a,b)=>a.id-b.id);
   for(const tank of this.tanks)for(let x=Math.round(tank.x)-18;x<=tank.x+18;x++)this.terrain[x]=tank.y+8;
   this.turn=0;this.round=1;this.shots=0;this.kills=0;this.damage=0;this.phase='aim';this.projectiles=[];this.blasts=[];this.lastTrails=[];this.wind=this.newWind();this.delay=0;this.result=null;
   this.message='Your turn. Pick an angle and power.';
  }
  get active(){return this.tanks[this.turn];}
  ground(x){return this.terrain[clamp(Math.round(x),0,W)];}
  newWind(){return Math.round((this.random()-.5)*36);}
  get multiplier(){return SKILLS[this.skill].multiplier*(1+(this.bots-3)*.15);}
  get score(){return Math.round((this.damage*10+this.kills*250+(this.result==='win'?1000+this.tanks[0].hp*5:0))*this.multiplier);}
  projectile(tank,angle,power,weapon){const r=angle*Math.PI/180,speed=100+power*4.7;return {x:tank.x+Math.cos(r)*18,y:tank.y-Math.sin(r)*18,vx:Math.cos(r)*speed,vy:-Math.sin(r)*speed,weapon,owner:tank.id,time:0,trail:[]};}
  fire(angle,power,weapon='shell'){
   if(this.phase!=='aim'||!Number.isFinite(angle)||!Number.isFinite(power)||!['shell','mirv'].includes(weapon))return false;
   if(weapon==='mirv'&&this.active.mirvs<=0)return false;
   this.active.angle=clamp(angle,5,175);this.active.power=clamp(power,10,100);
   if(weapon==='mirv')this.active.mirvs--;
   if(this.active.id===0)this.shots++;
   this.projectiles=[this.projectile(this.active,this.active.angle,this.active.power,weapon)];this.lastTrails=[];this.phase='flight';this.message=this.active.name+' fired '+(weapon==='mirv'?'a MIRV.':'a shell.');return true;
  }
  move(p,dt){p.vx+=this.wind*dt;p.vy+=125*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.time+=dt;}
  contact(p){return this.tanks.find(t=>t.hp>0&&(p.time>.12||t.id!==p.owner)&&Math.hypot(p.x-t.x,p.y-t.y)<13);}
  impact(p){return p.x<0||p.x>W||p.y>=this.ground(p.x)||p.time>16||!!this.contact(p);}
  predict(tank,angle,power){
   const p=this.projectile(tank,angle,power,'shell');
   for(let i=0;i<1920;i++){this.move(p,DT);if(this.impact(p))return p;}
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
    return {tank:target,weight:Math.min(5,1+revenge+leader),reason:revenge>=leader&&revenge>0?'grudge':leader>0?'leader':null};
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
   let best={angle:55,power:55,cost:Infinity};
   for(let i=0;i<skill.samples;i++){
    const angle=targetX>tank.x?20+this.random()*65:95+this.random()*65,power=20+this.random()*80;
    const p=this.predict(tank,angle,power),cost=Math.hypot(p.x-targetX,p.y-target.y)+(Math.abs(p.x-tank.x)<55?180:0);
    if(cost<best.cost)best={angle,power,cost};
   }
   return {angle:best.angle,power:best.power,weapon:tank.mirvs>0&&this.random()<.35?'mirv':'shell'};
  }
  explode(p){
   if(p.x<0||p.x>W)return;
   const radius=p.weapon==='child'?42:62,damage=(p.weapon==='child'?46:78)*(this.round>12?1.5:1);
   this.blasts.push({x:p.x,y:p.y,radius,age:0});
   for(const tank of this.tanks){
    if(tank.hp<=0)continue;
    const before=tank.hp,d=Math.hypot(tank.x-p.x,tank.y-p.y);
    tank.hp=Math.max(0,tank.hp-Math.round(d<radius?damage*(1-d/radius):0));
    if(p.owner!==tank.id&&this.damageLedger[p.owner])this.damageLedger[p.owner][tank.id]+=before-tank.hp;
    if(p.owner===0&&tank.id!==0){this.damage+=before-tank.hp;if(before>0&&tank.hp===0)this.kills++;}
   }
   for(let x=Math.max(0,Math.floor(p.x-radius));x<=Math.min(W,Math.ceil(p.x+radius));x++){
    const depth=Math.sqrt(Math.max(0,radius*radius-(x-p.x)**2));
    if(p.y+depth>=this.terrain[x]&&p.y-depth<=this.terrain[x])this.terrain[x]=Math.min(H-15,Math.max(this.terrain[x],p.y+depth));
   }
   for(const tank of this.tanks){
    const drop=Math.max(0,this.ground(tank.x)-8-tank.y),before=tank.hp;
    tank.y=this.ground(tank.x)-8;
    if(before>0){tank.hp=Math.max(0,tank.hp-Math.round(Math.max(0,drop-18)*.65));if(p.owner!==tank.id&&this.damageLedger[p.owner])this.damageLedger[p.owner][tank.id]+=before-tank.hp;if(p.owner===0&&tank.id!==0){this.damage+=before-tank.hp;if(tank.hp===0)this.kills++;}}
   }
  }
  nextTurn(){
   const alive=this.tanks.filter(t=>t.hp>0);
   if(alive.length<=1||(!this.spectator&&this.tanks[0].hp<=0)){this.phase='over';this.result=alive.length===0?'draw':this.tanks[0].hp>0?'win':'loss';this.message=this.result==='win'?'Victory. The ridge is yours.':this.result==='draw'?'Mutual destruction.':'Your tank is out. Give it another shot.';return;}
   do{this.turn=(this.turn+1)%this.tanks.length;if(this.turn===0)this.round++;}while(this.active.hp<=0);
   this.wind=this.newWind();this.phase='aim';this.delay=0;this.message=this.active.id===0?'Your turn. Adjust from your last shot.':this.active.name+' is lining up a shot…';
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
     if(p.trail.length===0||Math.hypot(p.x-p.trail.at(-1).x,p.y-p.trail.at(-1).y)>6){p.trail.push({x:p.x,y:p.y});if(p.trail.length>160)p.trail.shift();}
     if(this.impact(p)){this.lastTrails.push(p.trail);this.explode(p);continue;}
     if(p.weapon==='mirv'&&p.vy>=0){this.lastTrails.push(p.trail);for(let j=-2;j<=2;j++)next.push({...p,weapon:'child',vx:p.vx+j*42,vy:15+Math.abs(j)*8,trail:[]});}
     else next.push(p);
    }
    this.projectiles=next;
    if(!next.length){this.phase='settle';this.delay=.7;break;}
   }
  }
  memory(){const alive=this.tanks.filter(t=>t.hp>0);return {winner:alive.length===1?alive[0].id:null,damage:this.damageLedger.map(row=>[...row])};}
  async finishRivals(){
   if(this.result!=='loss'||this.tanks.filter(t=>t.hp>0).length<=1)return this.memory();
   // Finish surviving bots offscreen so a bot's win is earned, not guessed from HP.
   // Work in small batches to leave playback and the desktop responsive.
   const rest=Object.assign(Object.create(Battle.prototype),this,{spectator:true,phase:'settle',delay:0,result:null,
    tanks:this.tanks.map(t=>({...t})),terrain:this.terrain.slice(),projectiles:[],blasts:[],lastTrails:[],damageLedger:this.damageLedger.map(row=>[...row])});
   for(let step=0;step<20000&&rest.phase!=='over';step++){
    rest.step(.05);
    if(step%100===99)await new Promise(resolve=>setTimeout(resolve,0));
   }
   // A pathological stalemate records no winner; no synthetic championship.
   return rest.memory();
  }
  record(initials,id){if(this.phase!=='over')return null;return {id,initials,score:this.score,win:this.result==='win',result:this.result,bots:this.bots,skill:this.skill,kills:this.kills,shots:this.shots,memory:this.memory()};}
 }
 const api={Battle,SKILLS,COLORS,W,H};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.MattArtillery=api;
})(typeof window==='object'?window:globalThis);
