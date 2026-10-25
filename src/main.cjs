const {app,BrowserWindow,ipcMain,session,Tray,Menu,nativeImage,shell,safeStorage,screen,nativeTheme,dialog}=require('electron');
const {skyAt,location:skyLocation}=require('./night-sky.cjs');
const {Starlink,networkLocation}=require('./sky-services.cjs');
let locationUntil=0,locationPrompt=false,skyCache=null,starlink;
const {APPEARANCES,appearance}=require('./appearance.cjs');
const {createStationImages}=require('./station-image.cjs');
const path=require('node:path');
const fs=require('node:fs');
const http=require('node:http');
const {STATIONS,Monitor,radioUrls,episodes,videoId,stationArtwork,fetchText}=require('./services.cjs');
const stationImage=createStationImages({stations:STATIONS,lookup:stationArtwork});
const {normalizeLibrary,resolveShow,selection,youtubeUrl}=require('./podcast-library.cjs');
const {createRadioRelay}=require('./radio-relay.cjs');
const radioRelay=createRadioRelay();
const {createArcadeStore}=require('./arcade-store.cjs');
const {DEFAULT_ACCOUNTS,accounts,createXFeed}=require('./x-feed.cjs');
const {normalizeCameras,createSkiCams}=require('./ski-cams.cjs');
let xFeed,skiCams;
// Keep the internal identity stable so existing settings, keyring and dock pins survive the rename.
app.setName('workstation-deck');
nativeTheme.themeSource='dark';
if(process.platform==='linux')app.setDesktopName('ai.fshbwl.deck.desktop');
if(process.platform==='win32')app.setAppUserModelId('ai.fshbwl.deck');
if(process.env.DECK_TEST_DIR)app.setPath('userData',process.env.DECK_TEST_DIR);
const primaryInstance=app.requestSingleInstanceLock();
if(!primaryInstance){app.quit();}else{app.on('second-instance',()=>{win?.show();win?.focus();});}
let lastResizeArgs,maximizeRestore,restoredWindowKey;
let win,tray,server,origin,timer,fullBounds,gameBounds,gameSession,mode='full',busy=false,secret='',quitting=false,startupClaimed=false;
const stateFile=()=>path.join(app.getPath('userData'),'state.json');
let state={appearance:'modern',scanlines:false,retro:false,tabSounds:true,gameShotReadouts:true,cameraCycle:false,cameraCycleMinutes:15,cameras:normalizeCameras(),cameraId:'sierra-grandview',podcasts:normalizeLibrary(),layout:'sidecar',source:'radio',station:'futuresynthpop',show:'lastweek',podcastType:'youtube',volume:35,speed:1,alwaysOnTop:false,details:false,ambient:'flow',skyLocation:null,skySatellites:false,skyTime:'live',skyScan:true,chaos:'mixed',xAccounts:DEFAULT_ACCOUNTS,xAiOnly:true,positions:{},selected:{}};
function save(){fs.mkdirSync(app.getPath('userData'),{recursive:true,mode:0o700});const target=stateFile();fs.writeFileSync(target+'.tmp',JSON.stringify(state,null,2),{mode:0o600});fs.renameSync(target+'.tmp',target);}
let keyringAvailable=false,keyringPending=false,keyringTask=null,keyRevision=0;
function keyring(){return keyringAvailable;}
function keyTimeout(promise){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Unlock your desktop keyring in Passwords and Keys, then retry.')),8000);})]).finally(()=>clearTimeout(timer));}
function unlockSavedKey(){
 if(keyringTask)return keyringTask;
 const revision=keyRevision,cipher=state.diKeyCipher;keyringPending=true;
 keyringTask=(async()=>{
  try{
   keyringAvailable=await safeStorage.isAsyncEncryptionAvailable();
   if(cipher&&keyringAvailable){const decrypted=await safeStorage.decryptStringAsync(Buffer.from(cipher,'base64'));if(revision===keyRevision&&cipher===state.diKeyCipher)secret=decrypted.result;}
  }catch{keyringAvailable=false;}
  finally{keyringPending=false;keyringTask=null;send('deck:key-status',publicState());}
  return publicState();
 })();return keyringTask;
}
function publicState(){const {diKeyCipher,...visible}=state;return {...visible,hasDiKey:!!secret,keyring:keyring(),hasSavedDiKey:!!state.diKeyCipher,keyringPending};}
function update(patch){
 if(!patch||typeof patch!=='object')return;
 if(typeof patch.cameraCycle==='boolean')state.cameraCycle=patch.cameraCycle;
 if([1,5,15,30,60].includes(patch.cameraCycleMinutes))state.cameraCycleMinutes=patch.cameraCycleMinutes;
 if(state.cameras.some(c=>c.id===patch.cameraId))state.cameraId=patch.cameraId;
 if(patch.xAccounts!==undefined)state.xAccounts=accounts(patch.xAccounts);
 if(['off','flow','windy','waves','stars','night-sky','mandelbrot','trench'].includes(patch.ambient))state.ambient=patch.ambient;
 if(patch.skyLocation!==undefined){state.skyLocation=skyLocation(patch.skyLocation);skyCache=null;if(!state.skyLocation)locationUntil=0;}
 if(typeof patch.skyScan==='boolean')state.skyScan=patch.skyScan;
 if(['live','tour'].includes(patch.skyTime)){state.skyTime=patch.skyTime;skyCache=null;}
 if(typeof patch.skySatellites==='boolean')state.skySatellites=patch.skySatellites;
 if(['off','mixed','unhinged'].includes(patch.chaos))state.chaos=patch.chaos;
 if(typeof patch.xAiOnly==='boolean')state.xAiOnly=patch.xAiOnly;
 if(['sidecar','stack'].includes(patch.layout))state.layout=patch.layout;
 if(['radio','podcast'].includes(patch.source))state.source=patch.source;
 if(STATIONS.some(s=>s.id===patch.station))state.station=patch.station;
 if(state.podcasts.some(s=>s.id===patch.show))state.show=patch.show;
 if(['youtube','audio'].includes(patch.podcastType))state.podcastType=patch.podcastType;
 if(Number.isFinite(patch.volume))state.volume=Math.min(100,Math.max(0,patch.volume));
 if([1,1.25,1.5,1.75,2].includes(patch.speed))state.speed=patch.speed;
 if(APPEARANCES.includes(patch.appearance))state.appearance=patch.appearance;
 else if(typeof patch.retro==='boolean')state.appearance=patch.retro?'retro':'modern';
 state.retro=state.appearance==='retro';
 for(const key of ['alwaysOnTop','details','tabSounds','gameShotReadouts','scanlines'])if(typeof patch[key]==='boolean')state[key]=patch[key];
 if(patch.selected&&typeof patch.selected==='object')for(const [key,value]of Object.entries(patch.selected)){if(state.podcasts.some(s=>key===s.id+':youtube'||key===s.id+':audio')&&typeof value==='string'&&value.length<2048)state.selected[key]=value;}
 if(patch.positions&&typeof patch.positions==='object'){
  for(const [key,value]of Object.entries(patch.positions)){if(key.length<2048&&Number.isFinite(value)&&value>=0&&value<86400)state.positions[key]=value;}
  state.positions=Object.fromEntries(Object.entries(state.positions).slice(-300));
 }
 Object.assign(state,selection(state.podcasts,state.show,state.podcastType));
 save();if(win&&win.isAlwaysOnTop()!==state.alwaysOnTop)win.setAlwaysOnTop(state.alwaysOnTop);
}
function send(channel,data){if(win&&!win.isDestroyed())win.webContents.send(channel,data);}
function trusted(event){return event.sender===win?.webContents && event.senderFrame===win.webContents.mainFrame && event.senderFrame.url.startsWith(origin+'/');}
function handle(name,fn){ipcMain.handle(name,async(event,...args)=>{if(!trusted(event))throw new Error('Unavailable');try{return {ok:true,data:await fn(...args)};}catch(e){return {ok:false,error:String(e.message).replace(/https?:\/\/\S+/g,'[service]').slice(0,250)};}});}
function windowSizeKey(view,expanded,game){return [view,state.layout,game==='sky'?'sky':!!game,expanded].join(':');}
function resize(view,height,expanded=false,game=''){
 if(!win||!['full','compact','bug'].includes(view))return;
 lastResizeArgs=[view,height,expanded,game];const key=windowSizeKey(view,expanded,game);
 if(win.isFullScreen())return;
 // Native maximize owns the bounds; content updates must not shrink it.
 // An explicit layout change or leaving Game returns to normal widget sizing.
 if(win.isMaximized()){if(maximizeRestore&&maximizeRestore.key!==key)win.unmaximize();return;}
 if(restoredWindowKey===key)return;
 restoredWindowKey=null;
 const area=screen.getDisplayMatching(win.getBounds()).workArea;
 const playing=['play','sky'].includes(game)&&view==='full';
 if(!['play','sky','settings','bug'].includes(game))gameSession=null;
 else if(!playing&&gameSession&&!gameSession.suspended){gameSession.bounds=win.getBounds();gameSession.suspended=true;}
 // Content changes (replay, scores, heckles) must not resize a game window.
 // Temporary settings/bug views restore the latest user-chosen bounds on return.
 if(playing&&gameSession&&gameSession.kind===game&&gameSession.layout===state.layout&&gameSession.expanded===expanded){
  if(gameSession.suspended){win.setResizable(true);win.setMinimumSize(expanded?Math.min(640,area.width):340,expanded?Math.min(480,area.height):260);win.setBounds(gameSession.bounds);gameSession.suspended=false;}
  mode='full';return;
 }
 const rememberGame=()=>{if(playing)gameSession={kind:game,layout:state.layout,expanded,bounds:win.getBounds(),suspended:false};};
 if(expanded===true&&view==='full'&&game!=='settings'){
  if(!gameBounds){gameBounds=win.getBounds();const h=Math.round(area.height*.9),w=Math.min(area.width-32,Math.max(900,Math.round(h*1.8)));win.setResizable(true);win.setMinimumSize(Math.min(640,area.width),Math.min(480,area.height));win.setBounds({x:area.x+Math.round((area.width-w)/2),y:area.y+Math.round((area.height-h)/2),width:w,height:h});}
  mode='full';rememberGame();return;
 }
 if(gameBounds&&(!game||playing)){win.setMinimumSize(340,260);win.setBounds(gameBounds);gameBounds=null;}
 if(view!=='full'){xFeed?.hide();skiCams?.hide();}
 if(view==='bug'){
  if(mode!=='bug')fullBounds=win.getBounds();
  mode=view;win.setMinimumSize(56,56);win.setResizable(false);
  const old=fullBounds||win.getBounds();win.setBounds({x:Math.min(area.x+area.width-56,old.x+old.width-56),y:old.y,width:56,height:56});
 }else{
  const width=state.layout==='sidecar'&&view==='full'?710:430;
  const bounds=mode==='bug'&&fullBounds?fullBounds:win.getBounds();mode=view;
  win.setResizable(true);win.setMinimumSize(340,260);
  const h=Math.min(area.height,Math.max(260,Math.ceil(Number(height)||500)));
  win.setBounds({x:Math.max(area.x,Math.min(bounds.x,area.x+area.width-width)),y:Math.max(area.y,Math.min(bounds.y,area.y+area.height-h)),width,height:h});
 }
 rememberGame();
}
function quit(){if(quitting)return;quitting=true;send('deck:quit');setTimeout(()=>app.quit(),350);}
async function startServer(){
 const routes={ '/':'index.html','/app.js':'app.js','/ski-cams-ui.js':'ski-cams-ui.js','/apple2.js':'apple2.js','/apple2.css':'apple2.css','/apple2-font.ttf':'../assets/fonts/VT323-Regular.ttf','/tab-sounds/apple2.wav':'../assets/tab-sounds/apple2.wav','/retro.js':'retro.js','/retro.css':'retro.css','/ambient.js':'ambient.js','/night-sky.js':'night-sky.js','/sky-clock.js':'sky-clock.js','/sky-ui.js':'sky-ui.js','/victory.js':'victory.js','/three.module.js':'../node_modules/three/build/three.module.js','/three.core.js':'../node_modules/three/build/three.core.js','/victory-font.ttf':'../assets/arcade/victory-font.ttf','/artillery.js':'artillery.js','/artillery-ui.js':'artillery-ui.js','/artillery.css':'artillery.css','/style.css':'style.css','/tab-sounds/modem.wav':'../assets/tab-sounds/modem.wav','/startup.mp3':'../assets/startup.mp3','/lucide.js':'../node_modules/lucide/dist/umd/lucide.js' };
 for(const name of ['tank.png','tracks.png','blast.png','fire.ogg','blast.ogg','split.ogg','win.ogg','loss.ogg','metal-slug-tank.png','metal-slug-blasts.png','worms-fire.ogg','worms-split.ogg',...Array.from({length:3},(_,i)=>'worms-blast-'+(i+1)+'.ogg'),...Array.from({length:12},(_,i)=>'blast-'+(i+1)+'.png')])routes['/arcade/'+name]='../assets/arcade/'+name;
 for(const name of ['hell-yeah','send-it','meh','yeah'])routes['/tab-sounds/'+name+'.mp3']='../assets/tab-sounds/'+name+'.mp3';
 server=http.createServer((req,res)=>{
  const artId=/^\/station-art\/([a-z0-9]+)$/.exec(req.url||'')?.[1];
  if(artId&&req.method==='GET'){void stationImage(artId).then(({buffer,type})=>{res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff'});res.end(buffer);}).catch(()=>{res.writeHead(404);res.end();});return;}
  if(req.url?.startsWith('/radio/')){void radioRelay.handle(req,res);return;}
  const file=routes[req.url?.split('?')[0]];if(!file||req.method!=='GET'){res.writeHead(404);res.end();return;}
  const ext=path.extname(file);res.setHeader('Content-Type',ext==='.html'?'text/html; charset=utf-8':ext==='.css'?'text/css':ext==='.mp3'?'audio/mpeg':ext==='.wav'?'audio/wav':ext==='.ogg'?'audio/ogg':ext==='.png'?'image/png':ext==='.ttf'?'font/ttf':'text/javascript');
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https: blob:; connect-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  fs.createReadStream(path.resolve(__dirname,file)).on('error',()=>res.end()).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
}
if(primaryInstance)app.whenReady().then(async()=>{
 try{const loaded=JSON.parse(fs.readFileSync(stateFile(),'utf8'));if(loaded&&typeof loaded==='object')state={...state,...loaded,appearance:appearance(loaded)};}catch{}
 if(!['off','mixed','unhinged'].includes(state.chaos))state.chaos='mixed';
 try{state.podcasts=normalizeLibrary(state.podcasts);}catch{state.podcasts=normalizeLibrary();}
 Object.assign(state,selection(state.podcasts,state.show,state.podcastType));
 state.appearance=appearance(state);state.retro=state.appearance==='retro';state.scanlines=state.scanlines===true;
 state.skyTime=state.skyTime==='tour'?'tour':'live';
 state.skyScan=state.skyScan!==false;
 state.skyLocation=skyLocation(state.skyLocation);state.skySatellites=state.skySatellites===true;
 starlink=new Starlink(path.join(app.getPath('userData'),'sky-orbits.json'));
 state.alwaysOnTop=state.alwaysOnTop===true;
 state.tabSounds=state.tabSounds!==false;
 state.gameShotReadouts=state.gameShotReadouts!==false;
 state.cameraCycle=state.cameraCycle===true;
 if(![1,5,15,30,60].includes(state.cameraCycleMinutes))state.cameraCycleMinutes=15;
 try{state.cameras=normalizeCameras(state.cameras);}catch{state.cameras=normalizeCameras();}
 if(!state.cameras.some(c=>c.id===state.cameraId))state.cameraId=state.cameras[0]?.id||'';
 state.positions ||= {};state.selected ||= {};
 await startServer();
 // Only our own main frame can enter fullscreen; remote players stay denied.
 const allowMainPermission=(wc,permission,url,main)=>!!(wc===win?.webContents&&main&&url?.startsWith(origin+'/')&&(permission==='fullscreen'||permission==='geolocation'&&Date.now()<locationUntil));
 session.defaultSession.setPermissionRequestHandler((wc,permission,callback,details)=>callback(allowMainPermission(wc,permission,details.requestingUrl,details.isMainFrame)));
 session.defaultSession.setPermissionCheckHandler((wc,permission,_origin,details)=>allowMainPermission(wc,permission,details.requestingUrl,details.isMainFrame));
 session.defaultSession.webRequest.onBeforeSendHeaders({urls:['https://www.youtube.com/embed/*','https://www.youtube-nocookie.com/embed/*']},(details,callback)=>{
  details.requestHeaders.Referer='https://ai.fshbwl.deck/';callback({requestHeaders:details.requestHeaders});
 });
 const work=screen.getPrimaryDisplay().workArea;
 const initial=state.bounds||{x:work.x+work.width-750,y:work.y+60,width:710,height:560};
 win=new BrowserWindow({x:Math.max(work.x,Math.min(initial.x,work.x+work.width-710)),y:Math.max(work.y,Math.min(initial.y,work.y+work.height-560)),width:710,height:560,minWidth:340,minHeight:260,frame:false,transparent:true,backgroundColor:'#00000000',show:false,alwaysOnTop:state.alwaysOnTop,icon:path.join(__dirname,'../assets/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\/(www\.)?(youtube\.com|di\.fm)\//.test(url))shell.openExternal(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(origin+'/'))event.preventDefault();});
 win.on('close',()=>{if(gameBounds)state.bounds=gameBounds;else if(mode!=='bug')state.bounds=maximizeRestore?.bounds||win.getBounds();else if(fullBounds)state.bounds=fullBounds;save();});
 win.on('maximize',()=>{
  if(!maximizeRestore){const [view,,expanded,game]=lastResizeArgs||['full',0,false,''];maximizeRestore={bounds:win.getNormalBounds(),key:windowSizeKey(view,expanded,game)};}
  send('deck:window-state',{maximized:true});
 });
 win.on('unmaximize',()=>{
  const restore=maximizeRestore;restoredWindowKey=restore?.key;maximizeRestore=null;
  if(restore)win.setBounds(restore.bounds);
  send('deck:window-state',{maximized:false});
  if(lastResizeArgs)resize(...lastResizeArgs);
 });
 win.on('leave-full-screen',()=>{if(lastResizeArgs)resize(...lastResizeArgs);});
 win.on('minimize',()=>{xFeed?.hide();skiCams?.hide();send('deck:hidden');});
 win.on('hide',()=>{xFeed?.hide();skiCams?.hide();send('deck:hidden');});
 win.on('show',()=>send('deck:shown'));
 win.on('restore',()=>send('deck:shown'));
 xFeed=createXFeed({win,send,getConfig:()=>({accounts:state.xAccounts,aiOnly:state.xAiOnly})});
 skiCams=createSkiCams({win,send,getCameras:()=>state.cameras,fetchText});
 handle('deck:camera-bounds',rect=>skiCams.bounds(rect));
 handle('deck:camera-action',(action,id)=>skiCams.action(action,id));
 handle('deck:cameras-save',value=>{
  const cameras=normalizeCameras(value);skiCams.hide();state.cameras=cameras;
  if(!cameras.some(c=>c.id===state.cameraId))state.cameraId=cameras[0]?.id||'';
  save();return {cameras,cameraId:state.cameraId};
 });
 handle('deck:x-bounds',rect=>xFeed.bounds(rect));
 handle('deck:x-action',(action,lane)=>xFeed.action(action,lane));
 handle('deck:artwork',async()=>Object.fromEntries(Object.keys(await stationArtwork()).filter(id=>STATIONS.some(station=>station.id===id)).map(id=>[id,'/station-art/'+id])));
 handle('deck:sky-location',async action=>{
  if(action==='cancel'){locationUntil=0;return false;}
  if(action==='network'){
   if(Date.now()>=locationUntil)throw new Error('Allow location first.');locationUntil=0;
   return networkLocation();
  }
  if(action!=='request'||locationPrompt)return false;
  locationPrompt=true;
  try{const answer=await dialog.showMessageBox(win,{type:'question',title:'Night Sky location',message:'Use your approximate location for Night Sky?',detail:'MattAMP will ask your device for location. If that is unavailable, it will send your IP address to ipwho.is for a city-level estimate (VPNs may point elsewhere). Only coordinates rounded to 0.1° are saved on this device. They are never sent to the satellite service. You can forget them in Settings.',buttons:['Cancel','Allow location'],defaultId:0,cancelId:0});locationUntil=answer.response===1?Date.now()+60000:0;return answer.response===1;}finally{locationPrompt=false;}
 });
 handle('deck:sky',offset=>{
  if(!state.skyLocation)return null;
  const now=Date.now(),tour=state.skyTime==='tour',date=now+(tour&&Number.isFinite(offset)?Math.max(-604800000,Math.min(604800000,offset)):0);
  if(!skyCache||Math.abs(date-skyCache.at)>=(tour?1000:10000))skyCache=skyAt(state.skyLocation,new Date(date));
  if(tour)return {...skyCache,satellites:[],satelliteStatus:'Starlink paused during time travel'};
  if(state.skySatellites){if(!starlink.library||now>=starlink.next)void starlink.refresh();return {...skyCache,satellites:starlink.tracks(state.skyLocation,new Date(skyCache.at)),satelliteStatus:starlink.status};}
  return {...skyCache,satellites:[],satelliteStatus:'Starlink off'};
 });
 handle('deck:init',()=>{const playStartup=!startupClaimed;startupClaimed=true;return {state:publicState(),stations:STATIONS,shows:state.podcasts,origin,playStartup,maximized:win.isMaximized()};});
 const arcade=createArcadeStore(path.join(app.getPath('userData'),'arcade-scores.json'));
 handle('deck:arcade-read',()=>arcade.read());
 handle('deck:arcade-record',record=>arcade.record(record));
 handle('deck:save',patch=>{update(patch);return publicState();});
 handle('deck:resize',(view,height,expanded,game)=>resize(view,height,expanded,game));
 handle('deck:radio',async station=>radioRelay.issue(await radioUrls(station,secret)).map(route=>origin+route));
 handle('deck:episodes',(show,type,refresh)=>episodes(show,type,!!refresh,state.podcasts));
 handle('deck:podcast-resolve',input=>{
  const previous=state.podcasts.find(s=>s.id===input?.id);
  if(input?.id&&!previous)throw new Error('That show was removed. Add it again.');
  return resolveShow(input,previous,fetchText);
 });
 handle('deck:podcasts-save',library=>{
  const next=normalizeLibrary(library);
  state.podcasts=next;Object.assign(state,selection(next,state.show,state.podcastType));
  state.selected=Object.fromEntries(Object.entries(state.selected).filter(([key])=>next.some(s=>key===s.id+':audio'||key===s.id+':youtube')));
  save();return {shows:state.podcasts,show:state.show,podcastType:state.podcastType};
 });
 handle('deck:key-retry',()=>keyTimeout(unlockSavedKey()));
 handle('deck:key',async value=>{
  if(typeof value!=='string'||value.length>512||/[\r\n]/.test(value))throw new Error('Invalid listen key');
  const key=value.trim();if(key&&!/^[A-Za-z0-9_-]+$/.test(key))throw new Error('Paste the listen key only, from DI.FM Player Settings.');
  const revision=++keyRevision;radioRelay.revoke();secret=key;delete state.diKeyCipher;save();
  if(key){try{keyringAvailable=await keyTimeout(safeStorage.isAsyncEncryptionAvailable());if(keyringAvailable){const cipher=await keyTimeout(safeStorage.encryptStringAsync(key));if(revision===keyRevision)state.diKeyCipher=cipher.toString('base64');}}catch{keyringAvailable=false;}}
  save();return publicState();
 });
 handle('deck:video-id',value=>{const id=videoId(String(value).slice(0,2048));if(!id)throw new Error('Use a YouTube video URL.');return id;});
 handle('deck:external',async(kind,id)=>{
  let url;if(kind==='di-settings')url='https://www.di.fm/settings';
  if(kind==='di-station'&&STATIONS.some(s=>s.id===id))url='https://www.di.fm/'+id;
  if(kind==='youtube'&&/^[\w-]{11}$/.test(id))url='https://www.youtube.com/watch?v='+id;
  if(kind==='channel'){const show=state.podcasts.find(s=>s.id===id);if(show?.playlist)url=youtubeUrl(show);}
  if(!url)throw new Error('Unknown link');await shell.openExternal(url);
 });
 handle('deck:maximize',()=>{
  if(mode==='bug')return;
  if(win.isMaximized())win.unmaximize();
  else{const [view,,expanded,game]=lastResizeArgs||['full',0,false,''];maximizeRestore={bounds:win.getBounds(),key:windowSizeKey(view,expanded,game)};win.maximize();}
 });
 handle('deck:hide',()=>win.hide());handle('deck:quit',quit);
 handle('deck:move',(dx,dy)=>{if(mode!=='bug'||!Number.isFinite(dx)||!Number.isFinite(dy))return;const [x,y]=win.getPosition();const nx=x+Math.max(-100,Math.min(100,Math.round(dx))),ny=y+Math.max(-100,Math.min(100,Math.round(dy)));win.setPosition(nx,ny);if(fullBounds){fullBounds.x+=nx-x;fullBounds.y+=ny-y;}});
 const icon=nativeImage.createFromPath(path.join(__dirname,'../assets/icon.png'));
 tray=new Tray(icon.resize({width:22,height:22}));tray.setToolTip('MattAMP — workstation player');tray.setContextMenu(Menu.buildFromTemplate([{label:'Show MattAMP',click:()=>{win.show();win.focus();}},{label:'Pause playback',click:()=>send('deck:pause')},{type:'separator'},{label:'Quit MattAMP',click:quit}]));tray.on('click',()=>{win.show();win.focus();});
 await win.loadURL(origin+'/');win.show();
 void unlockSavedKey();
 const monitor=new Monitor();const tick=async()=>{if(busy)return;busy=true;try{send('deck:metrics',await monitor.sample());}catch{send('deck:metrics',{error:'Metrics unavailable',time:Date.now()});}finally{busy=false;}};void tick();timer=setInterval(tick,2000);
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{clearInterval(timer);radioRelay.revoke();server?.close();tray?.destroy();});
