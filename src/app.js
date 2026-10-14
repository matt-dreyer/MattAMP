/* MattAMP renderer: all privileged work goes through the narrow preload API. */
const $=id=>document.getElementById(id);
const root=$('deck'),audio=$('audio');
const ambient=new MattAmbient($('ambient'));
let appHidden=false;
function syncAmbient(){if(state)ambient.configure(state.ambient,appHidden||mode==='bug');}
const startupAudio=new Audio('/startup.mp3');
startupAudio.preload='auto';
function stopStartup(){startupAudio.pause();startupAudio.currentTime=0;}
let artwork={};
let readingX=false,playingGame=false,xLane='ai';
const arcade=new MattArcade($('game-panel'),()=>resize());
function syncGame(){arcade.setVisible(playingGame&&!settings&&mode==='full'&&!appHidden&&!document.hidden);}
function syncXBounds(){
 const rect=$('x-viewport').getBoundingClientRect(),visible=readingX&&!settings&&mode==='full'&&!document.hidden;
 void window.deck.xBounds({visible,x:rect.x,y:rect.y,width:rect.width,height:rect.height});
}
function toggleX(open){playingGame=false;readingX=open;if(open){mode='full';settings=false;if(isVideo())pause();}render();}
async function xAction(action,lane=xLane){try{await unwrap(window.deck.xAction(action,lane));}catch(err){$('x-status').textContent=err.message;}}
function renderX(){
 const visible=readingX&&mode==='full';
 $('x-panel').hidden=!visible;document.querySelector('.media').hidden=visible||playingGame;
 $('x-ai').setAttribute('aria-pressed',String(xLane==='ai'));$('x-giggles').setAttribute('aria-pressed',String(xLane==='giggles'));
 $('x-summary').textContent=xLane==='giggles'?'@elonmusk · a little chaos on the side':state.xAccounts.map(name=>'@'+name).join(' · ')+(state.xAiOnly?' · AI topics':' · all topics');
}
let state,stations=[],shows=[],metrics=null,mode='full',restoreMode='full',settings=false;
let playing=false,status='Stopped',current=null,items=[],epoch=0,yt=null,ytReady=null,ytApi=null,ytLoadedId=null,muted=false;
let radioServers=[],radioIndex=0,radioEpoch=0,saveTimer,lastSize='',resizeQueued=false,episodeBusy=false;
const catalogs=new Map();
const formatTime=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return (n>=3600?Math.floor(n/3600)+':':'')+String(Math.floor(n/60)%60).padStart(n>=3600?2:1,'0')+':'+String(n%60).padStart(2,'0');};
const pct=value=>Number.isFinite(value)?Math.round(value)+'%':'—';
const gib=value=>(value/1024**3).toFixed(1);
function icons(){lucide.createIcons({attrs:{width:16,height:16,'aria-hidden':'true'}});}
function icon(name){return '<i data-lucide="'+name+'" aria-hidden="true"></i>';}
async function unwrap(promise){const result=await promise;if(!result.ok)throw new Error(result.error);return result.data;}
function error(message=''){$('error').textContent=message;$('error').hidden=!message;resize();}
function report(err){error(err?.message||'Unable to complete this action. Try again.');}
function activeShow(){return shows.find(s=>s.id===state.show);}
function activeStation(){return stations.find(s=>s.id===state.station);}
function applyArtwork(){
 const url=state.source==='radio'?artwork[state.station]:null,img=$('station-art');
 img.hidden=!url||img.dataset.failed===url;if(url&&img.getAttribute('src')!==url)img.src=url;
 for(const button of document.querySelectorAll('[data-station]')){
  const thumb=button.querySelector('img'),src=artwork[button.dataset.station];
  thumb.hidden=!src||thumb.dataset.failed===src;if(src&&thumb.getAttribute('src')!==src)thumb.src=src;
 }
}

function isVideo(){return state.source==='podcast'&&state.podcastType==='youtube';}
function positionKey(){return current?current.type+':'+current.id:null;}
function snapshot(){
 const key=positionKey();if(!key||state.source!=='podcast')return;
 const n=isVideo()&&yt?yt.getCurrentTime?.():audio.currentTime;
 if(Number.isFinite(n)&&n>=0)state.positions[key]=n;
}
async function persist(){if(!state)return;try{await unwrap(window.deck.save({layout:state.layout,source:state.source,station:state.station,show:state.show,podcastType:state.podcastType,volume:state.volume,speed:state.speed,alwaysOnTop:state.alwaysOnTop,details:state.details,ambient:state.ambient,xAccounts:state.xAccounts,xAiOnly:state.xAiOnly,positions:state.positions,selected:state.selected}));}catch(err){console.warn('Preferences could not be saved.');}}
function queueSave(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{snapshot();void persist();},300);}
function setStatus(value,isPlaying=false){status=value;playing=isPlaying;$('play-status').textContent=value;$('play').innerHTML=icon(isPlaying?'pause':'play')+'<span>'+(isPlaying?'Pause':'Play')+'</span>';$('play').setAttribute('aria-label',isPlaying?'Pause playback':'Play');updateBug();icons();}
function updateBug(){if(!state)return;const online=metrics?.network?.status==='online';const color=online?'#9ccab0':metrics?.network?.status==='checking'?'#a8b9c7':'#dfb574';document.querySelector('.bug-led').style.background=color;const name=state.source==='radio'?activeStation()?.name:activeShow()?.name;const description='Open MattAMP · '+name+' · '+status+' · '+(online?'Online':'Network '+(metrics?.network?.status||'checking'));$('bug').title=description;$('bug').setAttribute('aria-label',description);const old=document.querySelector('.bug-playback');const replacement=document.createElement('i');replacement.className='bug-playback';replacement.dataset.lucide=playing?'play':'pause';old.replaceWith(replacement);}
function resize(){if(resizeQueued)return;resizeQueued=true;requestAnimationFrame(()=>{resizeQueued=false;if(!state)return;const full=document.querySelector('.full');const h=mode==='bug'?56:Math.ceil(document.querySelector('.titlebar').offsetHeight+(settings?$('settings').scrollHeight:full.scrollHeight)+2);const expanded=arcade.expanded&&playingGame&&!settings&&mode==='full';const key=[mode,state.layout,h,settings,expanded].join(':');if(lastSize===key){syncXBounds();return;}lastSize=key;void window.deck.resize(mode,h,expanded).then(syncXBounds);});}
function render(){
 const podcast=state.source==='podcast',video=isVideo();
 renderX();syncAmbient();syncGame();
 root.classList.toggle('game-mode',playingGame&&mode==='full');$('game-panel').hidden=!playingGame||mode!=='full';$('source-game').setAttribute('aria-pressed',String(playingGame));
 root.classList.toggle('sidecar',state.layout==='sidecar');root.classList.toggle('stack',state.layout==='stack');root.classList.toggle('compact',mode==='compact');root.classList.toggle('bug-mode',mode==='bug');root.classList.toggle('youtube',video);root.classList.toggle('details',state.details);root.classList.toggle('settings-mode',settings);
 $('source-radio').setAttribute('aria-pressed',String(!readingX&&!playingGame&&!podcast));$('source-podcast').setAttribute('aria-pressed',String(!readingX&&!playingGame&&podcast));$('source-x').setAttribute('aria-pressed',String(readingX));
 $('radio-display').hidden=video;$('youtube-box').hidden=!video;$('transport').hidden=video;$('podcast-tools').hidden=!podcast;$('stations').hidden=podcast;$('shows').hidden=!podcast;$('settings').hidden=!settings;
 $('provider').textContent=podcast?'PODCAST / AUDIO':'DI.FM / RADIO';
 $('now-title').textContent=podcast?activeShow()?.name:activeStation()?.name;
 $('now-detail').textContent=podcast?(current?.title||'Select an episode.'):state.hasDiKey?'Live radio · Premium':'Add your Premium listen key in Settings.';
 $('volume').value=state.volume;$('volume-value').textContent=muted?'0':state.volume;$('mute').setAttribute('aria-pressed',String(muted));$('mute').setAttribute('aria-label',muted?'Unmute':'Mute');$('mute').innerHTML=icon(muted?'volume-x':'volume-2');
 $('speed').value=String(state.speed);$('podcast-type').value=state.podcastType;$('audio-timeline').hidden=video;$('open-video').hidden=!video;
 $('ambient-mode').value=state.ambient;$('always-top').checked=state.alwaysOnTop;$('details').setAttribute('aria-expanded',String(state.details));$('details').innerHTML=(state.details?'Less':'Details')+icon(state.details?'chevron-up':'chevron-down');
 $('layout').setAttribute('aria-label',state.layout==='sidecar'?'Switch to stacked layout':'Switch to Sidecar layout');
 document.querySelectorAll('[data-station]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.station===state.station)));
 document.querySelectorAll('[data-show]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.show===state.show)));
 $('key-status').textContent=state.hasDiKey?(state.keyring?'Listen key saved in the desktop keyring.':'Listen key available for this session. The desktop keyring is unavailable.'):'Your Premium listen key is in DI.FM → Player Settings.';
 applyArtwork();updateBug();icons();resize();
}
function stopAll(stopIntro=true){
 if(stopIntro)stopStartup();
 snapshot();++epoch;radioServers=[];radioIndex=0;audio.pause();audio.removeAttribute('src');audio.load();
 if(yt){try{yt.pauseVideo();}catch{}}
 setStatus('Stopped');return epoch;
}
function pause(){stopStartup();if(isVideo()){yt?.pauseVideo();}else audio.pause();snapshot();setStatus('Paused');queueSave();}
async function apiReady(){
 if(window.YT?.Player)return;
 if(!ytApi)ytApi=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{ytApi=null;reject(new Error('YouTube could not load. Try Audio feed or open the episode on YouTube.'));},12000);window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);resolve();};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{clearTimeout(timeout);ytApi=null;reject(new Error('YouTube is unreachable. Try Audio feed.'));};document.head.append(script);});
 await ytApi;
}
async function ensureYoutube(){
 await apiReady();if(ytReady)return ytReady;
 ytReady=new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{ytReady=null;reject(new Error('The YouTube player did not become ready. Reload the app or use Audio feed.'));},15000);
  yt=new YT.Player('youtube-player',{height:'220',width:'100%',playerVars:{origin:state.origin,controls:1,playsinline:1,autoplay:0,rel:0},events:{
   onReady:()=>{clearTimeout(timeout);yt.setVolume(state.volume);$('youtube-placeholder').hidden=true;resolve(yt);resize();},
   onStateChange:e=>{
    if(!isVideo()||mode==='bug'||readingX||playingGame){if(e.data===1)yt.pauseVideo();return;}
    if(e.data===1){stopStartup();setStatus('Playing',true);error();}
    if(e.data===2){setStatus('Paused');snapshot();queueSave();}
    if(e.data===3)setStatus('Buffering');
    if(e.data===0){setStatus('Ended');snapshot();queueSave();}
    if(e.data===5)setStatus('Ready');
   },
   onError:e=>{if(!isVideo())return;setStatus('Unavailable');const messages={101:'This video cannot be embedded. Open it on YouTube, or choose Audio feed.',150:'This video cannot be embedded. Open it on YouTube, or choose Audio feed.',100:'This video is private or unavailable. Choose another episode.',153:'YouTube could not identify this app. Open the episode on YouTube or use Audio feed.',5:'YouTube could not play this video. Try another episode or Audio feed.'};error(messages[e.data]||'YouTube could not play this episode. Try Audio feed or open YouTube.');},
   onAutoplayBlocked:()=>{if(isVideo()){setStatus('Ready');error('Click Play inside the YouTube player to start.');}}
  }});
 });return ytReady;
}
async function playRadio(){
 const token=stopAll();current=null;error();setStatus('Connecting');
 try{const servers=await unwrap(window.deck.radio(state.station));if(token!==epoch||state.source!=='radio')return;radioServers=servers;radioEpoch=token;radioIndex=0;audio.src=radioServers[0];audio.playbackRate=1;audio.volume=state.volume/100;audio.muted=muted;await audio.play();}
 catch(err){if(token!==epoch)return;setStatus('Stopped');report(err);}
}
async function loadEpisode(item,autoplay=false){
 const token=stopAll(autoplay);current=item;error();state.selected[state.show+':'+state.podcastType]=item.id;render();queueSave();
 if(item.type==='youtube'){
  setStatus('Loading video');
  try{const player=await ensureYoutube();if(token!==epoch||!isVideo())return;ytLoadedId=item.id;const start=state.positions[positionKey()]||0;const request={videoId:item.id,startSeconds:start};autoplay?player.loadVideoById(request):player.cueVideoById(request);player.setVolume(state.volume);player.setPlaybackRate(state.speed);if(muted)player.mute();else player.unMute();}
  catch(err){if(token===epoch){setStatus('Unavailable');report(err);}}
 }else{
  audio.src=item.url;audio.volume=state.volume/100;audio.muted=muted;audio.playbackRate=state.speed;audio.load();setStatus('Ready');
  if(autoplay)try{await audio.play();}catch(err){if(token===epoch){setStatus('Stopped');error('Audio could not start. Try another episode or switch to YouTube.');}}
 }
}
async function loadEpisodes(autoplay=false,refresh=false){
 const requestEpoch=epoch,show=state.show,type=state.podcastType,key=show+':'+type;
 episodeBusy=true;$('feed-status').textContent='Loading…';$('episode').disabled=true;$('refresh').disabled=true;error();
 try{
  const result=!refresh&&catalogs.has(key)?catalogs.get(key):await unwrap(window.deck.episodes(show,type,refresh));
  if(requestEpoch!==epoch||show!==state.show||type!==state.podcastType||state.source!=='podcast')return;
  catalogs.set(key,result);items=result.items;
  $('episode').replaceChildren(...items.map(item=>{const option=document.createElement('option');option.value=item.id;const date=new Date(item.date);option.textContent=(Number.isNaN(+date)?'':date.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · ')+item.title;return option;}));
  const chosen=items.find(e=>e.id===state.selected[key])||items[0];$('episode').value=chosen.id;$('episode').title=chosen.title;
  $('feed-status').textContent=result.stale?'Cached · refresh failed':type==='youtube'?'Full episodes':'Latest episodes';
  await loadEpisode(chosen,autoplay);
 }catch(err){if(requestEpoch===epoch){items=[];$('episode').replaceChildren(new Option('Feed unavailable — try Refresh',''));$('feed-status').textContent='Unavailable';setStatus('Stopped');report(err);}}
 finally{episodeBusy=false;$('episode').disabled=!items.length;$('refresh').disabled=false;resize();}
}
async function switchSource(source){if(source===state.source)return;const continuePlaying=playing;stopAll();current=null;state.source=source;error();render();queueSave();if(source==='podcast')await loadEpisodes(continuePlaying);else if(continuePlaying)await playRadio();}
async function play(){stopStartup();error();if(playing){pause();return;}if(state.source==='radio'){if(audio.src&&radioServers.length){try{await audio.play();}catch{await playRadio();}}else await playRadio();return;}if(!current){await loadEpisodes(true);return;}if(isVideo()){try{await ensureYoutube();yt.playVideo();}catch(err){report(err);}}else try{await audio.play();}catch{error('Audio could not start. Try another episode.');}}
function seekBy(delta){if(state.source!=='podcast'||!current)return;error();if(isVideo()&&yt){yt.seekTo(Math.max(0,(yt.getCurrentTime()||0)+delta),true);}else if(Number.isFinite(audio.duration)){audio.currentTime=Math.max(0,Math.min(audio.duration,audio.currentTime+delta));}snapshot();queueSave();}
function setMode(next){if(next==='compact'){readingX=false;playingGame=false;}if(next==='bug'){restoreMode=mode;if(isVideo())pause();settings=false;}mode=next;render();}
function setMeter(element,value,detail){const track=element.querySelector('.track');element.querySelector('b').textContent=pct(value);track.firstElementChild.style.width=Number.isFinite(value)?Math.min(100,Math.max(0,value))+'%':'0%';if(Number.isFinite(value))track.setAttribute('aria-valuenow',String(Math.round(value)));else track.removeAttribute('aria-valuenow');track.setAttribute('aria-valuetext',Number.isFinite(value)?pct(value):'Unavailable');element.querySelector('small').textContent=detail||'Unavailable';}
function renderMetrics(data){
 metrics=data;if(data.error){$('sample-status').textContent=data.error;return;}
 const n=data.network,online=n.status==='online';const labels={online:'Internet online',checking:'Checking network',disconnected:'Disconnected','upstream-unreachable':'Internet unreachable',unreachable:'Network unreachable'};
 $('network-status').textContent=labels[n.status]||'Status unavailable';$('network-toggle').style.color=online?'#9ccab0':n.status==='checking'?'#a8b9c7':'#dfb574';$('network-latency').textContent=n.internet?.reachable&&n.internet.ms!=null?Math.round(n.internet.ms)+' ms':'—';
 $('interface').textContent=n.iface||'No default route';$('router').textContent=n.router?(n.router.reachable?'Reachable · '+(n.router.ms??'—')+' ms':'No ping response'):'—';$('internet').textContent=n.internet?(n.internet.reachable?'Reachable'+(n.internet.via?' · '+n.internet.via:''):'No probe response'):'—';$('checked').textContent=n.checked?new Date(n.checked).toLocaleTimeString():'Checking…';
 $('down').textContent=Number.isFinite(n.down)?n.down.toFixed(1):'—';$('up').textContent=Number.isFinite(n.up)?n.up.toFixed(1):'—';
 setMeter($('cpu-meter'),data.cpu,'Total CPU utilization');setMeter($('memory-meter'),data.memory?.percent,data.memory?gib(data.memory.used)+' / '+gib(data.memory.total)+' GiB in use':null);
 const signature=data.gpus.map(g=>g.uuid).join(',');
 if($('gpus').dataset.signature!==signature||!$('gpus').children.length){$('gpus').dataset.signature=signature;$('gpus').replaceChildren();for(const gpu of data.gpus){const el=document.createElement('div');el.className='meter gpu';const name=document.createElement('span');name.textContent=gpu.name.replace('NVIDIA GeForce ','').replace('NVIDIA ','');name.title=gpu.name;const track=document.createElement('div');track.className='track';track.role='meter';track.setAttribute('aria-label',gpu.name+' utilization');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.append(document.createElement('span'));el.append(name,track,document.createElement('b'),document.createElement('small'));$('gpus').append(el);}}
 [...$('gpus').children].forEach((el,i)=>{const g=data.gpus[i];setMeter(el,g.load,'VRAM '+(g.used==null?'—':(g.used/1024).toFixed(1))+' / '+(g.total==null?'—':(g.total/1024).toFixed(1))+' GiB · '+(g.temp??'—')+'°C');});
 if(data.gpuError)$('gpus').textContent='GPU readings unavailable';
 $('sample-status').textContent=data.gpuError?'GPU probe unavailable':'Live · every 2 seconds';
 $('compact-status').textContent=(online?'Online':labels[n.status]||'Unknown')+' · ↓'+$('down').textContent+' ↑'+$('up').textContent+' Mbps\nCPU '+pct(data.cpu)+' · RAM '+pct(data.memory?.percent)+' · GPUs '+data.gpus.map(g=>pct(g.load)).join(' / ');
 updateBug();icons();resize();
}
async function init(){
 const boot=await unwrap(window.deck.init());state={...boot.state,origin:boot.origin};stations=boot.stations;shows=boot.shows;
 for(const station of stations){const button=document.createElement('button');button.dataset.station=station.id;const thumb=document.createElement('img');thumb.alt='';thumb.hidden=true;thumb.decoding='async';thumb.onerror=()=>{thumb.dataset.failed=thumb.src;thumb.hidden=true;};const label=document.createElement('span');label.textContent=station.name;button.append(thumb,label);button.addEventListener('click',()=>{stopAll();state.station=station.id;state.source='radio';current=null;render();queueSave();void playRadio();});$('stations').append(button);}
 for(const show of shows){const button=document.createElement('button');button.dataset.show=show.id;const name=document.createElement('span');name.textContent=show.name;button.append(name);button.addEventListener('click',()=>{stopAll();state.source='podcast';state.show=show.id;current=null;render();queueSave();void loadEpisodes(false);});$('shows').append(button);}
 $('x-back').onclick=()=>toggleX(false);
 for(const lane of ['ai','giggles'])$('x-'+lane).onclick=()=>{xLane=lane;renderX();void xAction('feed');};
 $('x-refresh').onclick=()=>void xAction('refresh');$('x-login').onclick=()=>void xAction('login');$('x-browser').onclick=()=>void xAction('browser');
 $('x-filters').onclick=()=>{settings=true;render();$('x-accounts').focus();};
 $('x-accounts').value=state.xAccounts.join(', ');$('x-ai-only').checked=state.xAiOnly;
 $('x-form').onsubmit=async e=>{e.preventDefault();try{const result=await unwrap(window.deck.save({xAccounts:$('x-accounts').value,xAiOnly:$('x-ai-only').checked}));state.xAccounts=result.xAccounts;state.xAiOnly=result.xAiOnly;$('x-accounts').value=state.xAccounts.join(', ');$('x-settings-status').textContent='Feed saved.';xLane='ai';toggleX(true);void xAction('feed');}catch(err){$('x-settings-status').textContent=err.message;resize();}};
 $('x-forget').onclick=async()=>{try{await unwrap(window.deck.xAction('forget'));$('x-settings-status').textContent='X sign-in removed from MattAMP.';}catch(err){$('x-settings-status').textContent=err.message;}resize();};
 window.deck.onXStatus(message=>{$('x-status').textContent=message;resize();});
 window.deck.onShown(()=>{appHidden=false;syncAmbient();syncGame();requestAnimationFrame(syncXBounds);});
 window.addEventListener('resize',syncXBounds);window.addEventListener('scroll',syncXBounds);
 document.addEventListener('visibilitychange',()=>{syncXBounds();syncGame();});
 $('source-game').onclick=()=>{playingGame=true;readingX=false;mode='full';settings=false;if(isVideo())pause();render();};
 $('source-x').onclick=()=>toggleX(true);$('source-radio').onclick=()=>{toggleX(false);void switchSource('radio');};$('source-podcast').onclick=()=>{toggleX(false);void switchSource('podcast');};$('play').onclick=()=>void play();$('stop').onclick=()=>{stopAll();queueSave();};
 $('volume').oninput=e=>{state.volume=Number(e.target.value);muted=false;startupAudio.volume=state.volume/100;startupAudio.muted=false;audio.volume=state.volume/100;audio.muted=false;if(yt){yt.setVolume(state.volume);yt.unMute();}render();queueSave();};
 $('mute').onclick=()=>{muted=!muted;startupAudio.muted=muted;audio.muted=muted;if(yt)muted?yt.mute():yt.unMute();render();};
 $('rewind').onclick=()=>seekBy(-15);$('forward').onclick=()=>seekBy(30);$('speed').onchange=e=>{state.speed=Number(e.target.value);audio.playbackRate=state.speed;yt?.setPlaybackRate(state.speed);queueSave();};
 $('seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(e.target.value);snapshot();queueSave();};
 $('episode').onchange=e=>{const item=items.find(i=>i.id===e.target.value);if(item){$('episode').title=item.title;void loadEpisode(item,true);}};
 $('refresh').onclick=()=>{stopAll();void loadEpisodes(false,true);};
 $('podcast-type').onchange=e=>{stopAll();state.podcastType=e.target.value;current=null;render();queueSave();void loadEpisodes(false);};
 $('open-video').onclick=()=>void window.deck.external(current?.type==='youtube'?'youtube':'channel',current?.type==='youtube'?current.id:state.show);
 $('network-toggle').onclick=()=>{$('network-detail').hidden=!$('network-detail').hidden;$('network-toggle').setAttribute('aria-expanded',String(!$('network-detail').hidden));resize();};
 $('details').onclick=()=>{state.details=!state.details;render();queueSave();};
 $('layout').onclick=()=>{if(settings)return;state.layout=state.layout==='sidecar'?'stack':'sidecar';lastSize='';void persist().then(()=>render());};
 $('compact').onclick=()=>{if(!settings)setMode(mode==='compact'?'full':'compact');};$('bug-toggle').onclick=()=>setMode('bug');
 let drag=null;
 $('bug').onpointerdown=e=>{drag={x:e.screenX,y:e.screenY,startX:e.screenX,startY:e.screenY,moved:false};$('bug').setPointerCapture(e.pointerId);};
 $('bug').onpointermove=e=>{if(!drag)return;const dx=e.screenX-drag.x,dy=e.screenY-drag.y;if(Math.abs(e.screenX-drag.startX)+Math.abs(e.screenY-drag.startY)>5)drag.moved=true;if(drag.moved){void window.deck.move(dx,dy);drag.x=e.screenX;drag.y=e.screenY;}};
 $('bug').onpointerup=()=>{const moved=drag?.moved;drag=null;if(!moved)setMode(restoreMode);};
 $('bug').onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();setMode(restoreMode);}};
 $('settings-open').onclick=()=>{if(isVideo())pause();settings=!settings;render();};$('settings-close').onclick=()=>{settings=false;render();};
 $('ambient-mode').onchange=e=>{state.ambient=e.target.value;syncAmbient();queueSave();};
 $('always-top').onchange=e=>{state.alwaysOnTop=e.target.checked;queueSave();};
 $('key-help').onclick=()=>void window.deck.external('di-settings');
 $('key-form').onsubmit=async e=>{e.preventDefault();try{const value=$('listen-key').value;if(!value.trim())throw new Error('Paste your Premium listen key first.');const result=await unwrap(window.deck.setKey(value));state.hasDiKey=result.hasDiKey;state.keyring=result.keyring;$('listen-key').value='';$('settings-message').textContent='Listen key saved. Choose a station to start.';render();}catch(err){$('settings-message').textContent=err.message;resize();}};
 $('clear-key').onclick=async()=>{stopAll();const result=await unwrap(window.deck.setKey(''));state.hasDiKey=result.hasDiKey;$('listen-key').value='';$('settings-message').textContent='Listen key removed.';render();};
 $('video-form').onsubmit=async e=>{e.preventDefault();try{const id=await unwrap(window.deck.videoId($('video-url').value));stopAll();state.source='podcast';state.podcastType='youtube';settings=false;playingGame=false;readingX=false;render();await loadEpisode({id,title:'Custom YouTube video',type:'youtube',url:'https://www.youtube.com/watch?v='+id},true);$('video-url').value='';}catch(err){$('settings-message').textContent=err.message;resize();}};
 $('hide').onclick=()=>{if(isVideo())pause();void window.deck.hide();};$('quit-top').onclick=$('quit').onclick=()=>{stopAll();void persist().then(()=>window.deck.quit());};
 window.deck.onPause(pause);window.deck.onHidden(()=>{appHidden=true;syncAmbient();syncGame();if(isVideo())pause();});window.deck.onQuit(()=>{stopAll();void persist();});
 window.addEventListener('beforeunload',()=>{snapshot();void persist();});
 audio.onplaying=()=>{stopStartup();if(isVideo()){audio.pause();return;}setStatus('Playing',true);error();};
 audio.onpause=()=>{if(!isVideo()&&playing)setStatus('Paused');};
 audio.onwaiting=()=>{if(!isVideo())setStatus('Buffering');};
 audio.onended=()=>{if(!isVideo()){setStatus('Ended');snapshot();queueSave();}};
 audio.onloadedmetadata=()=>{if(state.source==='podcast'&&state.podcastType==='audio'&&current){const n=state.positions[positionKey()]||0;if(n>0&&Number.isFinite(audio.duration))audio.currentTime=Math.min(n,Math.max(0,audio.duration-1));}};
 audio.onerror=()=>{
  if(!audio.getAttribute('src')||isVideo())return;
  if(state.source==='radio'&&radioEpoch===epoch&&++radioIndex<radioServers.length){audio.src=radioServers[radioIndex];void audio.play().catch(()=>{});return;}
  setStatus('Unavailable');error(state.source==='radio'?'The radio stream could not play. Check your listen key or try another station.':'This audio episode could not play. Try another episode or switch to YouTube.');
 };
 audio.ontimeupdate=()=>{if(state.source!=='podcast'||isVideo())return;$('elapsed').textContent=formatTime(audio.currentTime);$('duration').textContent=Number.isFinite(audio.duration)?formatTime(audio.duration):'—';$('seek').disabled=!Number.isFinite(audio.duration);$('seek').max=Number.isFinite(audio.duration)?audio.duration:1;$('seek').value=audio.currentTime;};
 setInterval(()=>{if(playing){snapshot();void persist();}},5000);
 new ResizeObserver(resize).observe(document.querySelector('.full'));new ResizeObserver(resize).observe($('settings'));
 $('station-art').onerror=()=>{$('station-art').dataset.failed=$('station-art').src;$('station-art').hidden=true;};
 void unwrap(window.deck.artwork()).then(result=>{artwork=result;applyArtwork();resize();}).catch(()=>{});
 render();setStatus('Stopped');
 if(boot.playStartup){startupAudio.volume=state.volume/100;void startupAudio.play().catch(()=>console.warn('Startup sound unavailable.'));}
 if(state.source==='podcast')void loadEpisodes(false);
}
window.deck.onMetrics(renderMetrics);
init().catch(err=>{error(err.message);});
