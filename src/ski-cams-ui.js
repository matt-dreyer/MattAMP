/* Local camera favorites; remote pages stay in the isolated main-process view. */
class MattSkiCams {
 constructor({cameras,cameraId,cycle=false,cycleMinutes=15,resize,icons,openSettings}){
  this.cameras=cameras;this.selected=cameraId;this.resize=resize;this.icons=icons;this.openSettings=openSettings;this.visible=false;this.busy=false;this.editing=null;this.removed=null;
  this.cycle=cycle;this.cycleMinutes=cycleMinutes;this.cycleTimer=null;
  this.$=id=>document.getElementById(id);
  this.$('camera-select').onchange=e=>void this.selectCamera(e.target.value);
  this.$('camera-cycle').onclick=()=>void this.configureCycle(!this.cycle,this.cycleMinutes);
  this.$('camera-cycle-minutes').onchange=e=>void this.configureCycle(this.cycle,Number(e.target.value));
  this.$('camera-refresh').onclick=()=>void this.action('refresh');this.$('camera-browser').onclick=()=>void this.action('browser');
  this.$('camera-manage').onclick=()=>{this.openSettings();this.$('cameras-heading').scrollIntoView({block:'start'});this.$('camera-add').focus();};
  this.$('camera-add').onclick=()=>this.edit();this.$('camera-cancel').onclick=()=>{this.$('camera-form').hidden=true;this.editing=null;this.resize();this.$('camera-add').focus();};
  this.$('camera-form').onsubmit=e=>{e.preventDefault();const item={id:this.editing||crypto.randomUUID(),name:this.$('camera-name').value,resort:this.$('camera-resort').value,url:this.$('camera-url').value};void this.save(this.editing?this.cameras.map(c=>c.id===item.id?item:c):[...this.cameras,item],'Camera saved.').then(ok=>{if(ok){this.$('camera-form').hidden=true;this.editing=null;this.$('camera-add').focus();this.resize();}});};
  this.$('camera-undo').onclick=()=>{if(!this.removed)return;const {camera,index}=this.removed;void this.save([...this.cameras.slice(0,index),camera,...this.cameras.slice(index)],'Camera restored.').then(ok=>{if(ok){this.removed=null;this.$('camera-undo').hidden=true;}});};
  window.deck.onCameraStatus(message=>{this.$('camera-status').textContent=message;this.resize();});
  this.render();
 }
 async unwrap(promise){const result=await promise;if(!result.ok)throw new Error(result.error);return result.data;}
 message(text,error=false){this.$('camera-settings-status').textContent=text;this.$('camera-settings-status').dataset.error=String(error);this.resize();}
 async selectCamera(id){
  this.selected=id;this.render();this.syncBounds();this.resetCycle();
  try{await this.unwrap(window.deck.save({cameraId:id}));}catch(err){this.$('camera-status').textContent=err.message;}
 }
 async configureCycle(enabled,minutes){
  this.cycle=enabled;this.cycleMinutes=minutes;this.render();this.resetCycle();
  try{await this.unwrap(window.deck.save({cameraCycle:enabled,cameraCycleMinutes:minutes}));}catch(err){this.$('camera-status').textContent=err.message;}
 }
 resetCycle(){
  clearTimeout(this.cycleTimer);this.cycleTimer=null;
  if(!this.visible||!this.cycle||this.cameras.length<2)return;
  this.cycleTimer=setTimeout(()=>{
   this.cycleTimer=null;
   const index=this.cameras.findIndex(c=>c.id===this.selected);
   void this.selectCamera(this.cameras[(index+1)%this.cameras.length].id);
  },this.cycleMinutes*60000);
 }
 render(){
  this.$('camera-cycle').setAttribute('aria-pressed',String(this.cycle));
  this.$('camera-cycle').disabled=this.cameras.length<2;
  this.$('camera-cycle').title=this.cameras.length<2?'Add at least two cameras to auto-cycle':'Cycle through your cameras while SkiCams is open';
  this.$('camera-cycle-minutes').value=String(this.cycleMinutes);
  const select=this.$('camera-select');select.replaceChildren(...this.cameras.map(c=>new Option((c.resort?c.resort+' · ':'')+c.name,c.id)));select.value=this.selected;select.disabled=!this.cameras.length;
  if(!this.cameras.length)select.append(new Option('Add your first camera',''));
  this.$('camera-refresh').disabled=this.$('camera-browser').disabled=!this.cameras.length;
  this.$('camera-empty').hidden=!!this.cameras.length;
  this.$('camera-viewport').hidden=!this.cameras.length;
  const list=this.$('camera-library');list.replaceChildren();
  for(const [index,camera]of this.cameras.entries()){
   const row=document.createElement('li');row.className='podcast-library-row';
   const copy=document.createElement('div');copy.className='podcast-library-copy';const title=document.createElement('strong');title.textContent=camera.name;const resort=document.createElement('small');resort.textContent=camera.resort||new URL(camera.url).hostname;copy.append(title,resort);
   const actions=document.createElement('div');actions.className='podcast-library-actions';
   const action=(label,glyph,fn,disabled=false)=>{const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);const icon=document.createElement('i');icon.dataset.lucide=glyph;b.append(icon);b.disabled=disabled;b.onclick=fn;actions.append(b);};
   for(const [delta,glyph,label] of [[-1,'chevron-up','Move up camera'],[1,'chevron-down','Move down camera']])action(label+' '+camera.name,glyph,()=>{const next=[...this.cameras];[next[index],next[index+delta]]=[next[index+delta],next[index]];void this.save(next,'Camera order saved.').then(ok=>{if(ok)list.children[index+delta]?.querySelector('button:not(:disabled)')?.focus();});},index+delta<0||index+delta>=this.cameras.length);
   action('Edit camera '+camera.name,'pencil',()=>this.edit(camera));
   action('Remove camera '+camera.name,'trash-2',()=>void this.save(this.cameras.filter(c=>c.id!==camera.id),'Removed '+camera.name+'.').then(ok=>{if(ok){this.removed={camera,index};this.$('camera-undo').hidden=false;if(this.editing===camera.id){this.$('camera-form').hidden=true;this.editing=null;}this.$('camera-undo').focus();this.resize();}}));
   row.append(copy,actions);list.append(row);
  }
  if(!this.cameras.length){const li=document.createElement('li');li.className='hint';li.textContent='No cameras yet. Add a favorite mountain view.';list.append(li);}
  this.icons();this.resize();
 }
 edit(camera){
  this.editing=camera?.id||null;this.$('camera-form-title').textContent=camera?'Edit camera':'Add a camera';
  this.$('camera-name').value=camera?.name||'';this.$('camera-resort').value=camera?.resort||'';this.$('camera-url').value=camera?.url||'';
  this.$('camera-form').hidden=false;this.message('');this.$('camera-name').focus();
 }
 async save(next,message){
  if(this.busy)return false;this.busy=true;
  const controls=[...this.$('camera-settings').querySelectorAll('button,input')].map(el=>[el,el.disabled]);for(const [el]of controls)el.disabled=true;
  try{const result=await this.unwrap(window.deck.camerasSave(next));this.cameras=result.cameras;this.selected=result.cameraId;this.message(message);return true;}
  catch(err){this.message(err.message,true);return false;}
  finally{this.busy=false;for(const [el,disabled]of controls)el.disabled=disabled;this.render();this.syncBounds();this.resetCycle();}
 }
 async action(action){try{await this.unwrap(window.deck.cameraAction(action,this.selected));if(action==='refresh')this.syncBounds();}catch(err){this.$('camera-status').textContent=err.message;}}
 setVisible(visible){const changed=this.visible!==visible;this.visible=visible;this.$('camera-panel').hidden=!visible;if(changed)this.resetCycle();this.syncBounds();}
 syncBounds(){
  const rect=this.$('camera-viewport').getBoundingClientRect();
  void this.unwrap(window.deck.cameraBounds({visible:this.visible&&!!this.cameras.length,id:this.selected,x:rect.x,y:rect.y,width:rect.width,height:rect.height})).catch(err=>{this.$('camera-status').textContent=err.message;});
 }
}
window.MattSkiCams=MattSkiCams;
