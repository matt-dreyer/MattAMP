/* The arcade owns no media state; hiding it freezes simulation and sound. */
class MattArcade{
 constructor(panel,onResize){
  this.panel=panel;this.onResize=onResize;this.$=id=>panel.querySelector('#game-'+id);this.canvas=this.$('canvas');this.ctx=this.canvas.getContext('2d');
  this.visible=false;this.expanded=false;this.maximized=false;this.paused=false;this.sound=true;this.battle=null;this.preview=this.createPreview();this.raf=0;this.last=0;this.lastState='';this.record=null;this.saving=false;this.audio=[];this.assets={};
  this.shotReadouts=true;this.shotTimer=0;this.bubbleTimer=0;this.lastQuip='';this.volley=null;this.dance=null;this.tintedTanks=new WeakMap();
  this.victory=new MattVictory(this.$('victory'),()=>{if(this.visible)(this.$('again').disabled?this.canvas:this.$('again')).focus({preventScroll:true});});
  this.victory.motion.addEventListener('change',()=>{if(this.dance&&this.victory.motion.matches)this.finishDance();});
  this.quipResize=new ResizeObserver(()=>this.positionQuip());this.quipResize.observe(this.canvas);
  this.$('expand').onclick=()=>this.setExpanded(!this.expanded);
  this.$('setup').onsubmit=e=>{e.preventDefault();this.start();};
  for(const id of ['bots','skill','chaos'])this.$(id).addEventListener('change',()=>this.refreshPreview());
  this.$('fire').onclick=()=>this.fire();
  for(const key of ['angle','power'])this.$(key).oninput=()=>{this.updateAim();this.draw();};
  this.$('pause').onclick=()=>{this.paused=!this.paused;this.sync();};
  this.$('sound').onclick=()=>{this.sound=!this.sound;this.$('sound').textContent=this.sound?'Sound on':'Sound off';this.$('sound').setAttribute('aria-pressed',String(this.sound));if(!this.sound)this.silence();};
  this.$('new').onclick=()=>{this.paused=true;this.$('abandon').hidden=false;this.sync();};
  this.$('abandon-no').onclick=()=>{this.$('abandon').hidden=true;this.paused=false;this.sync();};
  this.$('abandon-yes').onclick=()=>this.reset();this.$('again').onclick=()=>{if(!this.visible)return;if(!this.battle)this.$('setup').requestSubmit();else if(this.battle.phase==='over'&&!this.saving&&!this.victory.active)this.reset();};
  this.$('save-retry').onclick=()=>void this.saveScore();
  this.$('initials').oninput=e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);this.updatePreviewName();};
  for(const details of panel.querySelectorAll('details'))details.addEventListener('toggle',onResize);
  this.canvas.onpointerdown=e=>{
   const b=this.battle;if(!b||b.phase!=='aim'||b.active.id!==0||this.paused)return;
   this.canvas.focus({preventScroll:true});
   const r=this.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1000/r.width,y=(e.clientY-r.top)*540/r.height,t=b.active;
   this.$('angle').value=Math.round(Math.max(5,Math.min(175,Math.atan2(Math.max(0,t.y-y),x-t.x)*180/Math.PI)));this.updateAim();this.draw();
  };
  const wheelAim=(control,e)=>{
   const b=this.battle;if(!this.visible||this.paused||!b||b.phase!=='aim'||b.active.id!==0||e.ctrlKey||e.metaKey||!e.deltaY)return;
   e.preventDefault();this.adjustAim(control,-Math.sign(e.deltaY));
  };
  for(const control of ['angle','power'])this.$(control).closest('label').addEventListener('wheel',e=>wheelAim(control,e),{passive:false});
  this.canvas.addEventListener('wheel',e=>wheelAim('power',e),{passive:false});
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&!e.defaultPrevented&&this.visible&&this.expanded){e.preventDefault();this.setExpanded(false);return;}
   const b=this.battle;if(e.defaultPrevented||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||!this.visible||this.paused||!b||b.phase!=='aim'||b.active.id!==0)return;
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].includes(e.key))return;
   const target=e.target;
   if(target.isContentEditable||target.closest('select,textarea')||(target.closest('input')&&!['game-angle','game-power','game-weapon-shell','game-weapon-mirv'].includes(target.id)))return;
   if(!this.panel.contains(target)&&target!==document.body&&target.id!=='source-game')return;
   // Keep Enter's normal activation for focused navigation and other buttons.
   if(e.key==='Enter'&&target.closest('button,a,summary')&&target.id!=='game-fire')return;
   e.preventDefault();
   if(e.key==='Enter'){if(!e.repeat)this.fire();}
   else if(e.key==='ArrowLeft'||e.key==='ArrowRight')this.adjustAim('angle',e.key==='ArrowLeft'?1:-1);
   else this.adjustAim('power',e.key==='ArrowUp'?1:-1);
  });
  // Load optional artwork without making a missing asset a game-breaking error.
  for(const name of ['tank','tracks','blast',...Array.from({length:12},(_,i)=>'blast-'+(i+1))]){const img=new Image();img.onload=()=>{this.assets[name]=img;this.draw();};img.src='/arcade/'+name+'.png';}
  // Preserve the original sheets; remove their flat key colors once on load.
  for(const [name,key] of [['metal-slug-tank',[255,255,255]],['metal-slug-blasts',[0,248,0]]]){
   const img=new Image();img.onload=()=>{
    const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;
    const ctx=sheet.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,img.width,img.height),d=pixels.data;
    for(let i=0;i<d.length;i+=4)if(d[i]===key[0]&&d[i+1]===key[1]&&d[i+2]===key[2])d[i+3]=0;
    ctx.putImageData(pixels,0,0);this.assets[name]=sheet;this.draw();
   };img.src='/arcade/'+name+'.png';
  }
  this.blastFrames=[...Array.from({length:10},(_,i)=>[104+i*48,84,48,64]),...[[2,47],[49,47],[96,47],[143,45],[188,44],[232,44],[276,42],[318,41],[359,38],[397,38],[435,36],[471,34],[505,35],[540,36]].map(([x,w])=>[x,148,w,64])];
  void this.loadScores();this.draw();
 }
 createPreview(){const preview=new MattArtillery.Battle({bots:Number(this.$('bots').value),skill:Number(this.$('skill').value),chaos:this.$('chaos').value});preview.tanks[0].name=this.$('initials').value.toUpperCase()||'MAT';return preview;}
 updatePreviewName(){if(this.battle)return;this.preview.tanks[0].name=this.$('initials').value.toUpperCase()||'MAT';this.draw();}
 refreshPreview(){if(this.battle)return;this.preview=this.createPreview();this.render();this.draw();this.onResize();}
 async loadScores(){try{const res=await window.deck.arcadeRead();if(!res.ok)throw new Error(res.error);this.scores=res.data;this.$('initials').value=res.data.initials||'MAT';this.updatePreviewName();this.renderScores();}catch(e){this.$('score-empty').textContent=e.message;}}
 start(){
  this.victory.stop();this.clearQuip();this.clearShot();this.volley=null;this.dance=null;
  this.battle=this.preview;this.battle.history=(this.scores?.rivalry||[]).slice(-3);this.initials=this.$('initials').value.toUpperCase()||'MAT';this.battle.tanks[0].name=this.initials;this.id=crypto.randomUUID();this.record=null;this.paused=false;this.lastState='';
  this.$('setup').hidden=true;this.$('end').hidden=true;this.$('abandon').hidden=true;this.$('save-retry').hidden=true;this.$('new').hidden=false;
  this.$('angle').value=this.battle.tanks[0].angle;this.$('power').value=50;this.$('weapon-shell').checked=true;this.updateAim();this.sync();this.$('angle').focus();
 }
 reset(){this.victory.stop();this.clearQuip();this.clearShot();this.volley=null;this.dance=null;this.battle=null;this.preview=this.createPreview();this.record=null;this.paused=false;this.$('setup').hidden=false;this.$('end').hidden=true;this.$('abandon').hidden=true;this.$('new').hidden=true;this.$('roster').replaceChildren();this.sync();this.$('start').focus();}
 updateAim(){
  const angle=Number(this.$('angle').value),power=Number(this.$('power').value);this.$('angle-value').textContent=angle+'°';this.$('power-value').textContent=power+'%';this.$('power').setAttribute('aria-valuetext',power+' percent');
  if(this.battle?.phase==='aim'&&this.battle.active.id===0){this.battle.active.angle=angle;this.battle.active.power=power;}
 }
 adjustAim(control,delta){const input=this.$(control);input.value=Math.max(Number(input.min),Math.min(Number(input.max),Number(input.value)+delta));this.updateAim();this.draw();}
 captureVolley(){return {owner:this.battle.active.id,tanks:this.battle.tanks.map(({id,x,y,hp})=>({id,x,y,hp}))};}
 fire(){if(this.paused||!this.visible||!this.battle)return;const volley=this.captureVolley();if(this.battle.active.id===0&&this.battle.fire(Number(this.$('angle').value),Number(this.$('power').value),(this.$('weapon-mirv').checked?'mirv':'shell'))){this.volley=volley;this.playSound('fire');this.sync();}}
 setShotReadouts(enabled){this.shotReadouts=enabled;if(!enabled)this.clearShot();}
 clearShot(){clearTimeout(this.shotTimer);this.$('shot').hidden=true;}
 showBotShot(tank){
  this.clearShot();if(!this.shotReadouts||tank.id===0)return;
  this.$('shot').textContent=tank.name+' · '+Math.round(tank.angle)+'° · '+Math.round(tank.power)+'% power';
  this.$('shot').hidden=false;this.shotTimer=setTimeout(()=>this.clearShot(),3000);
 }
 clearQuip(){clearTimeout(this.bubbleTimer);this.$('quip').hidden=true;}
 positionQuip(){const bubble=this.$('quip');if(bubble.hidden||!this.quipSpeaker)return;const x=this.quipSpeaker.x/1000*this.canvas.clientWidth-bubble.offsetLeft;bubble.style.setProperty('--tail-x',Math.max(14,Math.min(bubble.clientWidth-14,x))+'px');}
 reactToVolley(){
  const shot=this.volley;this.volley=null;if(!shot)return;
  const b=this.battle,shooter=b.tanks.find(t=>t.id===shot.owner),others=b.tanks.filter(t=>t.id!==shot.owner&&t.hp>0);
  const hits=shot.tanks.filter(t=>t.id!==shot.owner&&t.hp>0).map(t=>({tank:b.tanks.find(now=>now.id===t.id),damage:t.hp-b.tanks.find(now=>now.id===t.id).hp}));
  const damage=hits.reduce((n,h)=>n+h.damage,0),kills=hits.filter(h=>h.tank.hp===0).length,self=shot.tanks.find(t=>t.id===shot.owner).hp-shooter.hp;
  const nearest=Math.min(...b.lastTrails.flatMap(trail=>{const end=trail.at(-1);return end?shot.tanks.filter(t=>t.id!==shot.owner&&t.hp>0).map(t=>Math.hypot(end.x-t.x,end.y-t.y)):[];}));
  let speaker,lines;
  if(self>damage&&self>=15){speaker=others[Math.floor(Math.random()*others.length)];lines=['Friendly fire. Very friendly.','Self-care. With explosives.','You found the enemy within.','An inside job. Impressive.','Your aim has trust issues.','One tank, two opposing sides.'];}
  else if(kills||damage>=45){
   const victim=hits.filter(h=>h.damage>0&&h.tank.hp>0).sort((a,z)=>z.damage-a.damage)[0]?.tank;
   if(victim&&Math.random()<.5){speaker=victim;lines=['I preferred your earlier work.','Oh, NOW you learn to aim.','That was load-bearing armor.','My warranty just resigned.','A dent in my retirement plan.'];}
   else{speaker=shooter.hp>0?shooter:null;lines=kills?['You’ve been promoted to terrain.','Your refund is in the crater.','Thanks for the parking space.','Your tank is now open-plan.','Alt-F4, but with landscaping.','A brief but moving departure.']:['Calculated. Please don’t check.','I meant to do that this time.','Right in the motherboard.','A rare victory for geometry.','I’m as surprised as you are.','Please hold your applause.'];}
  }else if(damage===0&&self===0&&nearest>100){speaker=others[Math.floor(Math.random()*others.length)];lines=['Lovely shot. Shame about the war.','Bold of you to attack the horizon.','That hill had a family.','A warning shot to another county.','Are we invoicing by the crater?','The scenery has surrendered.','Excellent range. No relevance.','Your targeting runs on dial-up.','Have you tried aiming it off and on?','We’ll call that abstract artillery.'];}
  if(speaker===shooter&&damage>=45&&shot.target?.reason){const target=b.tanks.find(t=>t.id===shot.target.id);if(hits.some(h=>h.tank===target&&h.damage>0))lines=shot.target.reason==='retaliation'?[target.name+', a reply to your earlier point.','Return to sender. Postage paid.']:shot.target.reason==='grudge'?[target.name+', I kept the receipt.','That crater has accrued interest.']:['A modest leaderboard correction.',target.name+', your reign had a good run.'];}
  this.showQuip(speaker,lines);
 }
 showQuip(speaker,lines){
  if(!speaker||!lines)return;
  const choices=lines.filter(line=>line!==this.lastQuip),text=choices[Math.floor(Math.random()*choices.length)];this.lastQuip=text;this.clearQuip();
  this.$('quip-name').textContent=speaker.name;this.$('quip-text').textContent=text;
  const bubble=this.$('quip');this.quipSpeaker=speaker;bubble.style.setProperty('--speaker-x',speaker.x/10+'%');bubble.style.setProperty('--speaker-y',speaker.y/540*100+'%');
  bubble.hidden=false;this.positionQuip();this.bubbleTimer=setTimeout(()=>this.clearQuip(),3200);
 }
 tauntRival(){
  const b=this.battle,choice=b.lastTarget;if(!choice?.reason||Math.random()>.55)return;
  const target=b.tanks.find(t=>t.id===choice.id);if(!target)return;
  this.showQuip(b.active,choice.reason==='retaliation'?[target.name+', I have a follow-up question.',target.name+', let’s keep this reciprocal.','Your feedback has been escalated.']:choice.reason==='grudge'?[target.name+', nothing personal. Still lying.','I hold grudges, not high ground.',target.name+', remember me? I certainly do.']:[target.name+', the podium needs a new tenant.','We’ve reviewed '+target.name+'’s monopoly.',target.name+', time for a balance patch.']);
 }
 setMaximized(maximized){this.maximized=maximized;this.$('expand').hidden=maximized;this.setExpanded(this.expanded);}
 setExpanded(expanded){this.expanded=expanded;this.panel.classList.toggle('game-expanded',expanded||this.maximized);document.getElementById('deck').classList.toggle('arcade-expanded',expanded||this.maximized);window.scrollTo(0,0);this.$('expand').textContent=expanded?'Restore':'Expand';this.$('expand').setAttribute('aria-pressed',String(expanded));this.onResize();}
 setVisible(visible){if(this.visible===visible)return;this.visible=visible;if(!visible)this.silence();this.sync();}
 sync(){
  if(!this.visible||this.paused){this.clearQuip();this.clearShot();this.victory.stop();this.dance=null;}
  cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.render();this.draw();
  if(this.visible&&!this.paused&&this.battle&&(this.battle.phase!=='over'||this.dance))this.raf=requestAnimationFrame(t=>this.tick(t));
  if(this.paused)this.silence();this.onResize();
 }
 tick(time){
  const b=this.battle;if(!this.visible||this.paused||!b)return;
  const dt=this.last?Math.min(.05,(time-this.last)/1000):0;this.last=time;
  if(this.dance){
   this.dance.elapsed+=dt;
   if(this.dance.elapsed>=3){this.finishDance();return;}
   this.draw();this.raf=requestAnimationFrame(t=>this.tick(t));return;
  }
  const phase=b.phase,blasts=b.blasts.length,children=b.projectiles.length,volley=phase==='aim'?this.captureVolley():null;b.step(dt);
  if(phase==='aim'&&b.phase==='flight'){this.volley={...volley,target:b.lastTarget};this.playSound('fire');this.showBotShot(b.active);this.tauntRival();}
  if(phase==='flight'&&b.phase==='settle')this.reactToVolley();
  if(b.blasts.length>blasts)this.playSound('blast');
  if(children===1&&b.projectiles.length===5)this.playSound('split');
  const key=[b.phase,b.turn,b.round,b.score,b.tanks.map(t=>t.hp).join(',')].join(':');
  if(key!==this.lastState){this.lastState=key;this.render();}
  this.draw();
  if(b.phase==='over'){
   b.blasts=[];this.draw();
   if(!this.record){
    this.record=b.record(this.initials,this.id);this.clearQuip();this.clearShot();
    const winner=b.tanks.find(t=>t.hp>0);
    if(winner&&!this.victory.motion.matches)this.dance={id:winner.id,elapsed:0,wheelie:Math.random()<1/3};
    if(b.result==='win')this.silence();else this.playSound('loss');
    this.render();this.draw();void this.saveScore();
    if(this.dance)this.raf=requestAnimationFrame(t=>this.tick(t));else this.finishDance();
   }
   this.onResize();return;
  }
  this.raf=requestAnimationFrame(t=>this.tick(t));
 }
 finishDance(){
  this.dance=null;cancelAnimationFrame(this.raf);this.raf=0;this.last=0;this.render();this.draw();
  if(this.record?.win&&this.visible&&!this.paused)void this.victory.start(this.record,this.sound);
 }
 async saveScore(){
  if(this.saving||!this.record)return;this.saving=true;this.$('save-retry').hidden=true;this.$('again').disabled=true;this.$('replay-hint').textContent='Saving your score…';this.$('save-status').textContent='Saving your score…';
  try{const res=await window.deck.arcadeRecord(this.record);if(!res.ok)throw new Error(res.error);this.scores=res.data;this.renderScores();const rank=this.scores.scores.findIndex(s=>s.id===this.record.id);this.$('save-status').textContent=rank>=0?'Saved. #'+(rank+1)+' on your high-score table!':'Score saved. Your top ten are still standing.';}
  catch(e){this.$('save-status').textContent='Score not saved: '+e.message;this.$('save-retry').hidden=false;}
  finally{this.saving=false;this.$('again').disabled=false;this.$('replay-hint').textContent='Click the battlefield for a new skirmish.';this.onResize();}
 }
 renderScores(){
  const data=this.scores;if(!data)return;
  this.$('record-summary').textContent=data.scores.length?'Best '+data.scores[0].score.toLocaleString():'Local arcade records';
  this.$('totals').textContent=data.wins+' wins / '+data.played+' completed battles';this.$('score-empty').hidden=!!data.scores.length;this.$('score-rows').replaceChildren();
  data.scores.forEach((s,i)=>{const tr=document.createElement('tr');for(const text of [i+1,s.initials,s.score.toLocaleString(),s.bots+' · '+MattArtillery.SKILLS[s.skill].name,s.win?'WIN':s.result==='draw'?'DRAW':'OUT',MattArtillery.describeConditions(s.conditions)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}if(s.id===this.id)tr.className='game-record-current';this.$('score-rows').append(tr);});
 }
 render(){
  const b=this.battle,over=b?.phase==='over',spectating=!!b&&b.tanks[0].hp<=0&&!over,mine=b?.active.id===0&&b.active.hp>0&&b.phase==='aim'&&!this.paused;
  this.$('conditions').textContent=MattArtillery.describeConditions((b||this.preview).conditions);
  this.$('conditions').title='Arena rules stay fixed for this battle. Ricochet reflects side-wall shots; wraparound sends them through the opposite side.';
  this.$('controls').disabled=!mine;this.$('controls').hidden=!b||over||spectating;this.$('pause').disabled=!b||over;this.$('pause').textContent=this.paused?'Resume':'Pause';
  this.$('round').textContent=b?'Round '+b.round+' · '+MattArtillery.SKILLS[b.skill].name+' · '+b.multiplier.toFixed(2)+'×':'Last tank standing';
  const wind=Math.abs(b?.wind||0);this.$('wind').textContent=b?'Wind '+(b.wind<0?'← ':b.wind>0?'→ ':'· ')+wind+(wind>=76?' · WILD GUST':wind>=31?' · Strong':''):'Wind —';this.$('wind').classList.toggle('wild-gust',!!b&&wind>=76);
  this.$('score').textContent=String(b?.score||0).padStart(6,'0');
  this.$('status').textContent=this.paused?'Paused. Take your time.':spectating?'You’re out. Spectating · '+b.message:b?.message||'Choose your rivals, then start a battle.';
  this.$('overlay').hidden=!!b&&!this.paused&&(!over||!!this.dance);
  this.$('overlay-title').textContent=this.paused?'Taking five.':over?(b.result==='win'?'RIDGE CHAMPION':b.result==='draw'?'EVERYBODY LOSES':'ONE MORE ROUND?'):'A little scorched nostalgia.';
  this.$('overlay-detail').textContent=this.paused?'Resume when you’re ready.':over?this.initials+' / '+b.score.toLocaleString()+' POINTS':'One ridge. You and 3–5 bots. Three MIRVs each.';
  this.$('end').hidden=!over;this.$('again').hidden=!!b&&!over;this.$('replay-hint').hidden=!over;this.$('new').hidden=!b||over;
  const fieldAction=b?'New skirmish':'Start battle';this.$('again').setAttribute('aria-label',fieldAction);this.$('again').firstElementChild.textContent=fieldAction;
  if(!b)return;
  this.$('result').textContent=over?b.message+' '+b.kills+' knockouts · '+b.shots+(b.shots===1?' shot.':' shots.'):'';
  const remaining=b.tanks[0].mirvs;this.$('mirv-count').textContent=remaining;this.$('weapon-mirv').setAttribute('aria-label','MIRV, '+remaining+' left');this.$('weapon-mirv').disabled=remaining===0;if(!remaining)this.$('weapon-shell').checked=true;
  this.$('roster').replaceChildren();
  for(const tank of b.tanks){const el=document.createElement('span');el.className='game-tank-stat'+(tank.hp<=0?' eliminated':'')+(b.active===tank&&!over?' active':'');el.style.setProperty('--tank-color',tank.color);el.textContent=tank.name+' '+(tank.hp?Math.ceil(tank.hp)+' HP':'OUT');this.$('roster').append(el);}
  this.canvas.setAttribute('aria-label','Battlefield. '+this.$('status').textContent+' '+this.$('wind').textContent+'. '+b.tanks.map(t=>t.name+' '+t.hp+' health').join(', '));
 }
 playSound(name){
  if(!this.sound||!this.visible||this.paused)return;
  this.audio=this.audio.filter(a=>!a.ended&&!a.paused);if(this.audio.length>=4)return;
  const clip=name==='blast'?'worms-blast-'+(1+Math.floor(Math.random()*3)):name==='fire'?'worms-fire':name==='split'?'worms-split':name;
  const a=new Audio('/arcade/'+clip+'.ogg');a.volume=name==='blast'?.16:.2;this.audio.push(a);void a.play().catch(()=>{});
 }
 silence(){this.victory.mute();for(const a of this.audio)a.pause();this.audio=[];}
 tankSprite(name,color){
  const source=this.assets[name];if(!source)return null;
  let variants=this.tintedTanks.get(source);if(!variants){variants=new Map();this.tintedTanks.set(source,variants);}
  if(variants.has(color))return variants.get(color);
  const sprite=document.createElement('canvas'),metal=name==='metal-slug-tank';sprite.width=metal?60:source.width;sprite.height=metal?58:source.height;
  const ctx=sprite.getContext('2d');if(metal)ctx.drawImage(source,4,4,60,58,0,0,60,58);else ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,sprite.width,sprite.height),data=pixels.data,rgb=color.slice(1).match(/../g).map(channel=>parseInt(channel,16));
  // Palette-swap the shaded metal once per team; retain alpha, dark outlines and bright glints.
  for(let i=0;i<data.length;i+=4){
   if(!data[i+3])continue;
   const light=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;
   for(let channel=0;channel<3;channel++)data[i+channel]=light<=.75?rgb[channel]*light/.75:rgb[channel]+(255-rgb[channel])*(light-.75)/.25;
  }
  ctx.putImageData(pixels,0,0);variants.set(color,sprite);return sprite;
 }
 draw(){
  const c=this.ctx,b=this.battle||this.preview;if(!c)return;
  c.clearRect(0,0,1000,540);c.fillStyle='#101c2a';c.fillRect(0,0,1000,540);
  // Quiet stars and distant foothills keep the battlefield legible on OLED.
  c.fillStyle='#496174';for(let i=0;i<48;i++)c.fillRect((i*137+31)%1000,(i*61+12)%260,i%4===0?2:1,2);
  c.fillStyle='#233442';c.beginPath();c.moveTo(0,540);for(let x=0;x<=1000;x+=8)c.lineTo(x,250+60*Math.sin(x/160)+25*Math.cos(x/51));c.lineTo(1000,540);c.fill();
  c.fillStyle='#344b50';c.strokeStyle='#76968c';c.lineWidth=2;c.beginPath();c.moveTo(0,540);for(let x=0;x<=1000;x++)c.lineTo(x,b.terrain[x]);c.lineTo(1000,540);c.fill();c.stroke();
  // Translucent scenery lets the ambient background through; gameplay stays opaque.
  c.save();c.globalCompositeOperation='destination-in';c.globalAlpha=.82;c.fillRect(0,0,1000,540);c.restore();
  c.save();c.globalAlpha=.3;c.strokeStyle='#8aaba7';c.setLineDash([2,8]);for(const trail of [...b.lastTrails,...b.projectiles.map(p=>p.trail)]){c.beginPath();trail.forEach((p,i)=>i&&!p.moveTo?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}c.restore();
  if(b.conditions.walls!=='open'){
   c.save();c.strokeStyle=b.conditions.walls==='wrap'?'#b9a4cf':'#cbb580';c.lineWidth=4;
   if(b.conditions.walls==='wrap')c.setLineDash([12,10]);
   c.beginPath();c.moveTo(2,0);c.lineTo(2,540);c.moveTo(998,0);c.lineTo(998,540);c.stroke();c.restore();
  }
  for(const t of b.tanks){
   c.save();c.translate(t.x,t.y);c.globalAlpha=t.hp>0?1:.3;
   if(t.hp>0&&b.active===t&&this.battle&&b.phase!=='over'){c.strokeStyle=t.color;c.lineWidth=2;c.beginPath();c.ellipse(0,9,29,8,0,0,Math.PI*2);c.stroke();}
   // Victory choreography is visual only: never move the tank in the simulation.
   c.save();
   if(this.dance?.id===t.id){
    const time=this.dance.elapsed,beat=time*Math.PI*4,ease=Math.min(1,time*5,(3-time)*5);
    const lift=this.dance.wheelie?Math.sin(Math.PI*Math.max(0,Math.min(1,(time-.55)/1.9)))**2:0;
    c.translate(Math.sin(beat/2)*14*ease*(1-lift*.75),-Math.abs(Math.sin(beat))*9*ease*(1-lift));
    // Tip around the rear tread so either facing lifts its nose, then lands smoothly.
    const facing=t.angle>90?-1:1,rear=-facing*22;
    c.translate(rear,8);c.rotate(-facing*.68*lift);c.translate(-rear,-8);
    c.rotate(Math.sin(beat)*.2*ease*(1-lift));c.scale(1+Math.sin(beat)*.08*ease*(1-lift),1-Math.sin(beat)*.06*ease*(1-lift));
   }
   const r=t.angle*Math.PI/180;
   if(this.assets['metal-slug-tank']){
    c.save();c.imageSmoothingEnabled=false;if(t.angle>90)c.scale(-1,1);
    c.drawImage(this.tankSprite('metal-slug-tank',t.color),-30,-50,60,58);c.restore();
    // The artwork keeps its original gun; a team-colored sight shows the exact shot angle.
    if(t.hp>0&&b.active===t){c.save();c.strokeStyle=t.color;c.lineWidth=2;c.setLineDash([3,4]);c.beginPath();c.moveTo(Math.cos(r)*28,-5-Math.sin(r)*28);c.lineTo(Math.cos(r)*55,-5-Math.sin(r)*55);c.stroke();c.restore();}
   }else{
    if(this.assets.tracks)c.drawImage(this.assets.tracks,-20,-2,40,14);else{c.fillStyle='#101820';c.fillRect(-18,0,36,12);}
    if(this.assets.tank)c.drawImage(this.tankSprite('tank',t.color),-18,-17,36,25);else{c.fillStyle=t.color;c.fillRect(-15,-10,30,15);}
    c.strokeStyle=t.color;c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(0,-4);c.lineTo(Math.cos(r)*27,-4-Math.sin(r)*27);c.stroke();
   }
   c.restore();
   c.fillStyle=t.color;c.font='bold 22px ui-monospace,monospace';c.textAlign='center';c.fillText(t.name,0,-63);
   c.fillStyle='#13212b';c.fillRect(-20,20,40,5);c.fillStyle=t.color;c.fillRect(-20,20,40*t.hp/100,5);c.restore();
  }
  for(const p of b.projectiles){c.fillStyle=p.weapon==='mirv'?'#c4add8':'#e0c993';if(p.y<4){c.font='24px monospace';c.textAlign='center';c.fillText('↑',p.x,27);}else{c.beginPath();c.arc(p.x,p.y,p.weapon==='mirv'?5:3.5,0,Math.PI*2);c.fill();}}
  for(const blast of b.blasts){
   c.save();const progress=Math.min(1,blast.age/.65);
   if(this.assets['metal-slug-blasts']){
    const [sx,sy,w,h]=this.blastFrames[Math.min(23,Math.floor(progress*24))],scale=blast.radius*2/48;
    c.imageSmoothingEnabled=false;c.globalAlpha=.9*Math.min(1,(1-progress)*4);
    c.drawImage(this.assets['metal-slug-blasts'],sx,sy,w,h,blast.x-w*scale/2,blast.y-32*scale,w*scale,h*scale);
   }else{
    c.globalAlpha=(1-progress)*.7;const size=blast.radius*(.6+blast.age),frame=this.assets['blast-'+Math.min(12,1+Math.floor(progress*12))]||this.assets.blast;
    if(frame)c.drawImage(frame,blast.x-size,blast.y-size,size*2,size*2);else{c.fillStyle='#d3b282';c.beginPath();c.arc(blast.x,blast.y,size,0,Math.PI*2);c.fill();}
   }c.restore();
  }
 }
}
