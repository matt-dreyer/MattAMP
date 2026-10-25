class MattSkyUI {
 constructor({ambient,getState,save,onToggle=()=>{}}){
  this.onToggle=onToggle;this.ambient=ambient;this.getState=getState;this.save=save;this.active=false;this.timer=0;this.frame=0;this.busy=false;this.generation=0;this.pointer={x:.5,y:.5,inside:false};
  this.$=id=>document.getElementById(id);this.dialog=this.$('sky-view');this.map=this.$('sky-map');this.scene=ambient.nightSky;this.motion=matchMedia('(prefers-reduced-motion: reduce)');
  for(const id of ['sky-time','sky-view-clock'])this.$(id).onchange=async e=>{await this.save({skyTime:e.target.value});this.scene.clock.configure(e.target.value);this.scene.data=null;this.render();await this.refresh();};
  for(const id of ['sky-scan','sky-view-scan'])this.$(id).onchange=async e=>{await this.save({skyScan:e.target.checked});this.render();this.draw();};
  this.$('sky-find').onchange=e=>{this.scene.focus=e.target.value;this.found();this.draw();};
  for(const [id,key] of [['sky-lines','constellations'],['sky-labels','labels'],['sky-milkyway','milkyWay']])this.$(id).onchange=e=>{this.scene.layers[key]=e.target.checked;this.draw();};
  this.$('sky-locate').onclick=()=>this.locate();
  this.$('sky-forget').onclick=async()=>{this.generation++;await window.deck.skyLocation('cancel');await this.setLocation(null);};
  this.$('sky-location-form').onsubmit=async e=>{e.preventDefault();this.generation++;await this.setLocation({latitude:Number(this.$('sky-lat').value),longitude:Number(this.$('sky-lon').value),source:'manual'});};
  this.$('sky-satellites').onchange=async e=>{await this.save({skySatellites:e.target.checked});await this.refresh();};
  this.$('sky-open').onclick=this.$('sky-quick-open').onclick=()=>this.open();
  const deck=this.$('deck');let down=null;
  deck.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};},{passive:true});
  deck.addEventListener('click',e=>{
   if(!this.active||this.blocked||e.defaultPrevented||e.button!==0||!this.getState()?.skyLocation||!window.getSelection()?.isCollapsed)return;
   if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;
   // Use the original event path: a control can replace its icon during its click handler.
   if(e.composedPath().some(node=>node instanceof Element&&node.matches('button,a,input,select,textarea,label,summary,details,[role=button],[contenteditable],.titlebar,.sourcebar,#settings,#bug,#transport,#podcast-tools,#game-panel,#youtube-box,#x-panel,#camera-panel')))return;
   this.open();
  });
  this.$('sky-view-close').onclick=()=>this.dialog.close();
  this.dialog.addEventListener('close',()=>{cancelAnimationFrame(this.frame);this.frame=0;this.sync(this.active);this.onToggle(false);});
  this.dialog.addEventListener('pointermove',e=>{const r=this.map.getBoundingClientRect();this.pointer={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,inside:true};if(this.motion.matches)this.draw();});
  this.dialog.addEventListener('pointerleave',()=>{this.pointer.inside=false;});
  this.motion.addEventListener('change',()=>{cancelAnimationFrame(this.frame);this.frame=0;this.sync(this.active);});
  document.addEventListener('visibilitychange',()=>this.sync(this.active));
  this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(this.map);
 }
 open(){
  if(this.dialog.open||this.blocked||!this.getState()?.skyLocation)return;
  this.dialog.showModal();this.onToggle(true);this.sync(this.active);this.refresh();this.animate();
 }
 async unwrap(promise){const r=await promise;if(!r.ok)throw new Error(r.error);return r.data;}
 render(){
  const s=this.getState();if(!s)return;
  this.$('sky-settings').hidden=s.ambient!=='night-sky';this.$('sky-satellites').checked=s.skySatellites;this.$('sky-satellites').disabled=s.skyTime==='tour';this.scene.clock.configure(s.skyTime);this.$('sky-time').value=this.$('sky-view-clock').value=s.skyTime||'live';this.$('sky-clock-readout').hidden=!(s.ambient==='night-sky'&&s.appearance==='modern'&&s.skyTime==='tour'&&s.skyLocation);
  this.scene.scan=s.skyScan!==false;this.$('sky-scan').checked=this.$('sky-view-scan').checked=this.scene.scan;
  const loc=s.skyLocation;this.$('sky-quick-open').hidden=!this.active||!loc;this.$('deck').classList.toggle('sky-clickable',this.active&&!!loc);
  this.$('sky-open').disabled=!loc;this.$('sky-forget').disabled=!loc;
  this.$('sky-location-status').textContent=loc?`${loc.latitude.toFixed(1)}°, ${loc.longitude.toFixed(1)}° — ${loc.source==='network'?'network estimate; check if using a VPN':loc.source==='device'?'device location':'chosen coordinates'}. Saved only on this device.`:'No location saved. Allow location or enter coordinates to light up your sky.';
 }
 sync(active,blocked=this.blocked){
  this.active=active;this.blocked=blocked;this.scene.reducedMotion=this.motion.matches;this.scene.clock.paused=this.motion.matches||blocked||document.hidden||((!active||this.motion.matches)&&!this.dialog.open);clearTimeout(this.timer);this.timer=0;
  if(!this.getState()?.skyLocation||document.hidden||this.blocked||((!active||this.motion.matches)&&!this.dialog.open)){cancelAnimationFrame(this.frame);this.frame=0;return;}
  void this.refresh();this.animate();
 }
 async refresh(){
  if(this.busy)return;
  const loc=this.getState()?.skyLocation;if(!loc||document.hidden||this.blocked||((!this.active||this.motion.matches)&&!this.dialog.open))return;
  const key=JSON.stringify(loc);this.busy=true;
  try{
   const data=await this.unwrap(window.deck.sky(this.scene.clock.offset()));
   if(key!==JSON.stringify(this.getState()?.skyLocation))return;
   this.scene.data=data;
   if(data){
    if(!this.findBuilt){for(const kind of ['Planet','Moon','Constellation','Star']){const group=document.createElement('optgroup');group.label=kind;for(const t of data.targets.filter(t=>t.kind===kind).sort((a,b)=>a.name.localeCompare(b.name))){const option=document.createElement('option');option.value=t.name;option.textContent=t.name;group.append(option);}this.$('sky-find').append(group);}this.findBuilt=true;}
    this.found();
    const phase=data.moon.illumination,moon=`Moon ${Math.round(phase*100)}% lit${data.moon.alt>0?'':' • below the horizon'}`;
    this.$('sky-status').textContent=moon+'. '+data.satelliteStatus;
    this.$('sky-view-heading').textContent=data.daylight?'Your sky right now':'Your sky tonight';
    const simulated=this.scene.clock.mode==='tour';this.$('sky-clock-readout').textContent='Tour '+new Date(data.at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    this.$('sky-view-time').textContent=(simulated?'Simulated • ':'')+new Date(data.at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})+' • local clock';
    this.$('sky-view-moon').textContent=moon+' • '+(data.moon.phase<180?'waxing':'waning');
    this.$('sky-view-status').textContent=(data.daylight?'Daylight chart • ':'')+data.satelliteStatus;
   }
   this.draw();
  }catch{this.$('sky-status').textContent='Sky unavailable. Try selecting Night Sky again.';}
  finally{this.busy=false;clearTimeout(this.timer);this.timer=0;if(!document.hidden&&!this.blocked&&this.getState()?.skyLocation&&((this.active&&!this.motion.matches)||this.dialog.open))this.timer=setTimeout(()=>this.refresh(),this.scene.clock.mode==='tour'&&!this.scene.clock.paused?1000:5000);}
 }
 found(){const t=this.scene.view()?.targets?.find(t=>t.name===this.scene.focus);this.$('sky-found').textContent=t?`${t.name}: ${t.alt<0?'below the horizon':Math.round(t.alt)+'° above the horizon'}, bearing ${Math.round(t.az)}° from north.`:'Hover over a star or choose something to find.';}
 async setLocation(loc){
  try{await this.save({skyLocation:loc});this.scene.data=null;this.render();this.sync(this.active);}
  catch(e){this.$('sky-location-status').textContent=e.message;}
 }
 async locate(){
  const button=this.$('sky-locate'),generation=++this.generation;button.disabled=true;
  try{
   if(!await this.unwrap(window.deck.skyLocation('request')))return;
   this.$('sky-location-status').textContent='Finding your approximate location…';
   let loc;
   try{const p=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:10000,maximumAge:300000}));loc={latitude:p.coords.latitude,longitude:p.coords.longitude,source:'device'};}
   catch{if(generation!==this.generation)return;loc=await this.unwrap(window.deck.skyLocation('network'));}
   if(generation===this.generation)await this.setLocation(loc);
  }catch{if(generation===this.generation)this.$('sky-location-status').textContent='Could not locate this device. Enter coordinates instead.';}
  finally{await window.deck.skyLocation('cancel');button.disabled=false;}
 }
 draw(){
  if(!this.dialog.open||!this.scene.data)return;
  const w=this.map.clientWidth,h=this.map.clientHeight,dpr=Math.min(devicePixelRatio||1,1.5),c=this.map.getContext('2d');if(!w||!h)return;
  if(this.map.width!==Math.round(w*dpr)||this.map.height!==Math.round(h*dpr)){this.map.width=Math.round(w*dpr);this.map.height=Math.round(h*dpr);}
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);this.scene.draw(c,w,h,performance.now()/1000,this.pointer,true);
 }
 animate(){if(this.frame||!this.dialog.open||document.hidden||this.blocked)return;this.draw();if(this.motion.matches)return;let last=0;const tick=now=>{this.frame=0;if(!this.dialog.open||document.hidden||this.blocked)return;if(now-last>1000/24){last=now;this.draw();}this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}
}
window.MattSkyUI=MattSkyUI;
