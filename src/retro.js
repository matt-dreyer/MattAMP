/* Optional classic skin. Capture observes playback; it never replaces the audio output. */
class MattRetro {
 constructor(root,audio){
  this.root=root;this.audio=audio;this.history=[];this.enabled=false;this.visible=false;
  this.spectrum=document.querySelector('#retro-spectrum canvas');this.caption=document.querySelector('#retro-spectrum figcaption');
  this.chart=document.querySelector('#retro-history canvas');this.motion=matchMedia('(prefers-reduced-motion: reduce)');
  for(const event of ['playing','pause','ended','emptied'])audio.addEventListener(event,()=>this.refresh());
  this.motion.addEventListener('change',()=>this.refresh());
  this.observer=new ResizeObserver(()=>{this.drawHistory();if(!this.timer)this.drawSpectrum();});
  this.observer.observe(this.spectrum);this.observer.observe(this.chart);
 }
 configure(enabled,visible,radio){
  if(this.enabled===enabled&&this.visible===visible&&this.radio===radio)return;
  this.enabled=enabled;this.visible=visible;this.radio=radio;this.refresh();
  if(!enabled)this.closeMenus();
 }
 disconnect(){
  this.source?.disconnect();this.source=null;
  this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;
  if(this.context?.state==='running')void this.context.suspend().catch(()=>{});
 }
 refresh(){
  clearTimeout(this.timer);this.timer=null;this.disconnect();
  const active=this.enabled&&this.visible&&this.radio&&!this.audio.paused&&this.audio.readyState>=2;
  this.caption.textContent=!this.radio?'Audio spectrum · radio only':this.motion.matches?'Audio spectrum · motion reduced':'Audio spectrum · idle';
  if(active&&!this.motion.matches){
   try{
    // Only capture our same-origin radio relay. Cross-origin podcasts keep their normal output.
    if(new URL(this.audio.currentSrc).origin!==location.origin)throw new Error('Remote audio');
    this.context??=new AudioContext();this.analyser??=this.context.createAnalyser();this.analyser.fftSize=1024;this.analyser.smoothingTimeConstant=.75;
    this.bins??=new Uint8Array(this.analyser.frequencyBinCount);
    this.stream=this.audio.captureStream();
    if(!this.stream.getAudioTracks().length)throw new Error('No audio track');
    this.source=this.context.createMediaStreamSource(this.stream);this.source.connect(this.analyser);
    void this.context.resume().catch(()=>{this.disconnect();this.caption.textContent='Audio spectrum unavailable';});
    this.caption.textContent='Live audio spectrum';
   }catch{this.disconnect();this.caption.textContent='Audio spectrum unavailable';}
  }
  this.drawSpectrum();this.drawHistory();
 }
 surface(canvas){
  const width=Math.max(1,Math.round(canvas.clientWidth)),height=Math.max(1,Math.round(canvas.clientHeight));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,width,height);return {ctx,width,height};
 }
 bars(canvas,values){
  const {ctx,width,height}=this.surface(canvas),step=width/values.length,rows=Math.floor(height/4);
  for(let i=0;i<values.length;i++)for(let j=0;j<rows;j++){
   const lit=values[i]!=null&&j<Math.round(values[i]*rows);
   ctx.fillStyle=lit?(j/rows>.84?'#efa84d':j/rows>.65?'#d3db46':'#8ede42'):'#14231b';
   ctx.fillRect(Math.floor(i*step),height-(j+1)*4,Math.max(1,Math.floor(step)-2),2);
  }
 }
 drawSpectrum(){
  const values=Array(40).fill(0);
  if(this.source&&this.context.state==='running'){
   this.analyser.getByteFrequencyData(this.bins);
   for(let i=0;i<values.length;i++){
    const lo=Math.floor(1*(220**(i/40))),hi=Math.max(lo+1,Math.floor(220**((i+1)/40)));
    let peak=0;for(let j=lo;j<hi;j++)peak=Math.max(peak,this.bins[j]);values[i]=peak/255;
   }
  }
  if(this.enabled&&this.visible)this.bars(this.spectrum,values);
  if(this.source&&this.enabled&&this.visible&&!this.motion.matches)this.timer=setTimeout(()=>this.drawSpectrum(),50);
 }
 sample(value){this.history.push(Number.isFinite(value)?Math.min(1,Math.max(0,value/100)):null);if(this.history.length>60)this.history.shift();this.drawHistory();}
 drawHistory(){if(this.enabled&&this.visible)this.bars(this.chart,[...Array(60-this.history.length).fill(null),...this.history]);}
 closeMenus(focus=false){
  for(const item of document.querySelectorAll('#retro-menus details[open]')){item.open=false;if(focus)item.querySelector('summary').focus();}
 }
 setupMenus(){
  const nav=document.getElementById('retro-menus');
  const click=id=>()=>document.getElementById(id)?.click();
  const menus={File:[['Settings…',click('settings-open')],['Hide to tray',click('hide')],['Quit MattAMP',click('quit-top')]],View:[['Switch layout',click('layout')],['Compact / full',click('compact')],['Desktop bug',click('bug-toggle')]],Options:[['Playback / pause',click('play')],['Stop playback',click('stop')],['Return to modern',()=>{const check=document.getElementById('retro-mode');check.checked=false;check.dispatchEvent(new Event('change'));}]],Presets:[['Previous station',click('retro-prev')],['Next station',click('retro-next')]],Help:[['Where is my MP3 folder?',()=>{document.getElementById('retro-joke').textContent='Still on that 80 GB hard drive. Next to final_mix_FINAL_v7.mp3.';}]]};
  for(const [name,commands] of Object.entries(menus)){
   const details=document.createElement('details'),summary=document.createElement('summary'),panel=document.createElement('div');summary.textContent=name;panel.className='retro-menu-panel';
   for(const [label,action] of commands){const button=document.createElement('button');button.textContent=label;button.type='button';button.onclick=()=>{if(name!=='Help')this.closeMenus(true);action();};panel.append(button);}
   if(name==='Help'){const joke=document.createElement('p');joke.id='retro-joke';joke.role='status';joke.textContent='MattAMP. No registration wizard. No free AOL hours.';panel.append(joke);}
   summary.onclick=()=>{for(const sibling of nav.children)if(sibling!==details)sibling.open=false;};details.append(summary,panel);nav.append(details);
  }
  document.addEventListener('pointerdown',e=>{if(!nav.contains(e.target))this.closeMenus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.querySelector('[open]')){e.preventDefault();e.stopImmediatePropagation();this.closeMenus(true);}},{capture:true});
 }
}
