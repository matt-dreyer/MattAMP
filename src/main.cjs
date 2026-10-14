const {app,BrowserWindow,ipcMain,session,Tray,Menu,nativeImage,shell,safeStorage,screen,nativeTheme}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const http=require('node:http');
const {STATIONS,SHOWS,Monitor,radioUrls,episodes,videoId,stationArtwork}=require('./services.cjs');
const {createRadioRelay}=require('./radio-relay.cjs');
const radioRelay=createRadioRelay();
const {DEFAULT_ACCOUNTS,accounts,createXFeed}=require('./x-feed.cjs');
let xFeed;
// Keep the internal identity stable so existing settings, keyring and dock pins survive the rename.
app.setName('workstation-deck');
nativeTheme.themeSource='dark';
app.setDesktopName('ai.fshbwl.deck.desktop');
if(process.env.DECK_TEST_DIR)app.setPath('userData',process.env.DECK_TEST_DIR);
const primaryInstance=app.requestSingleInstanceLock();
if(!primaryInstance){app.quit();}else{app.on('second-instance',()=>{win?.show();win?.focus();});}
let win,tray,server,origin,timer,fullBounds,mode='full',busy=false,secret='',quitting=false,startupClaimed=false;
const stateFile=()=>path.join(app.getPath('userData'),'state.json');
let state={layout:'sidecar',source:'radio',station:'futuresynthpop',show:'lastweek',podcastType:'youtube',volume:35,speed:1,alwaysOnTop:true,details:false,ambient:'flow',xAccounts:DEFAULT_ACCOUNTS,xAiOnly:true,positions:{},selected:{}};
function save(){fs.mkdirSync(app.getPath('userData'),{recursive:true,mode:0o700});const target=stateFile();fs.writeFileSync(target+'.tmp',JSON.stringify(state,null,2),{mode:0o600});fs.renameSync(target+'.tmp',target);}
function keyring(){return safeStorage.isEncryptionAvailable()&&safeStorage.getSelectedStorageBackend()!=='basic_text';}
function publicState(){const {diKeyCipher,...visible}=state;return {...visible,hasDiKey:!!secret,keyring:keyring()};}
function update(patch){
 if(!patch||typeof patch!=='object')return;
 if(patch.xAccounts!==undefined)state.xAccounts=accounts(patch.xAccounts);
 if(['off','flow','waves','stars'].includes(patch.ambient))state.ambient=patch.ambient;
 if(typeof patch.xAiOnly==='boolean')state.xAiOnly=patch.xAiOnly;
 if(['sidecar','stack'].includes(patch.layout))state.layout=patch.layout;
 if(['radio','podcast'].includes(patch.source))state.source=patch.source;
 if(STATIONS.some(s=>s.id===patch.station))state.station=patch.station;
 if(SHOWS.some(s=>s.id===patch.show))state.show=patch.show;
 if(['youtube','audio'].includes(patch.podcastType))state.podcastType=patch.podcastType;
 if(Number.isFinite(patch.volume))state.volume=Math.min(100,Math.max(0,patch.volume));
 if([1,1.25,1.5,1.75,2].includes(patch.speed))state.speed=patch.speed;
 for(const key of ['alwaysOnTop','details'])if(typeof patch[key]==='boolean')state[key]=patch[key];
 if(patch.selected&&typeof patch.selected==='object')for(const [key,value]of Object.entries(patch.selected)){if(/^(lastweek|humans|allin|dwarkesh|a16z):(youtube|audio)$/.test(key)&&typeof value==='string'&&value.length<2048)state.selected[key]=value;}
 if(patch.positions&&typeof patch.positions==='object'){
  for(const [key,value]of Object.entries(patch.positions)){if(key.length<2048&&Number.isFinite(value)&&value>=0&&value<86400)state.positions[key]=value;}
  state.positions=Object.fromEntries(Object.entries(state.positions).slice(-300));
 }
 save();if(win&&win.isAlwaysOnTop()!==state.alwaysOnTop)win.setAlwaysOnTop(state.alwaysOnTop);
}
function send(channel,data){if(win&&!win.isDestroyed())win.webContents.send(channel,data);}
function trusted(event){return event.sender===win?.webContents && event.senderFrame===win.webContents.mainFrame && event.senderFrame.url.startsWith(origin+'/');}
function handle(name,fn){ipcMain.handle(name,async(event,...args)=>{if(!trusted(event))throw new Error('Unavailable');try{return {ok:true,data:await fn(...args)};}catch(e){return {ok:false,error:String(e.message).replace(/https?:\/\/\S+/g,'[service]').slice(0,250)};}});}
function resize(view,height){
 if(!win||!['full','compact','bug'].includes(view))return;
 const area=screen.getDisplayMatching(win.getBounds()).workArea;
 if(view!=='full')xFeed?.hide();
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
}
function quit(){if(quitting)return;quitting=true;send('deck:quit');setTimeout(()=>app.quit(),350);}
async function startServer(){
 const routes={ '/':'index.html','/app.js':'app.js','/ambient.js':'ambient.js','/style.css':'style.css','/startup.mp3':'../assets/startup.mp3','/lucide.js':'../node_modules/lucide/dist/umd/lucide.js' };
 server=http.createServer((req,res)=>{
  if(req.url?.startsWith('/radio/')){void radioRelay.handle(req,res);return;}
  const file=routes[req.url?.split('?')[0]];if(!file||req.method!=='GET'){res.writeHead(404);res.end();return;}
  const ext=path.extname(file);res.setHeader('Content-Type',ext==='.html'?'text/html; charset=utf-8':ext==='.css'?'text/css':ext==='.mp3'?'audio/mpeg':'text/javascript');
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https: blob:; connect-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  fs.createReadStream(path.resolve(__dirname,file)).on('error',()=>res.end()).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
}
if(primaryInstance)app.whenReady().then(async()=>{
 try{const loaded=JSON.parse(fs.readFileSync(stateFile(),'utf8'));if(loaded&&typeof loaded==='object')state={...state,...loaded};}catch{}
 state.positions ||= {};state.selected ||= {};
 if(state.diKeyCipher&&keyring()){try{secret=safeStorage.decryptString(Buffer.from(state.diKeyCipher,'base64'));}catch{}}
 await startServer();
 session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 session.defaultSession.webRequest.onBeforeSendHeaders({urls:['https://www.youtube.com/embed/*','https://www.youtube-nocookie.com/embed/*']},(details,callback)=>{
  details.requestHeaders.Referer='https://ai.fshbwl.deck/';callback({requestHeaders:details.requestHeaders});
 });
 const work=screen.getPrimaryDisplay().workArea;
 const initial=state.bounds||{x:work.x+work.width-750,y:work.y+60,width:710,height:560};
 win=new BrowserWindow({x:Math.max(work.x,Math.min(initial.x,work.x+work.width-710)),y:Math.max(work.y,Math.min(initial.y,work.y+work.height-560)),width:710,height:560,minWidth:340,minHeight:260,frame:false,transparent:true,backgroundColor:'#00000000',show:false,alwaysOnTop:state.alwaysOnTop,icon:path.join(__dirname,'../assets/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
 win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\/(www\.)?(youtube\.com|di\.fm)\//.test(url))shell.openExternal(url);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(origin+'/'))event.preventDefault();});
 win.on('close',()=>{if(mode!=='bug')state.bounds=win.getBounds();else if(fullBounds)state.bounds=fullBounds;save();});
 win.on('minimize',()=>{xFeed?.hide();send('deck:hidden');});
 win.on('hide',()=>{xFeed?.hide();send('deck:hidden');});
 win.on('show',()=>send('deck:shown'));
 win.on('restore',()=>send('deck:shown'));
 xFeed=createXFeed({win,send,getConfig:()=>({accounts:state.xAccounts,aiOnly:state.xAiOnly})});
 handle('deck:x-bounds',rect=>xFeed.bounds(rect));
 handle('deck:x-action',(action,lane)=>xFeed.action(action,lane));
 handle('deck:artwork',stationArtwork);
 handle('deck:init',()=>{const playStartup=!startupClaimed;startupClaimed=true;return {state:publicState(),stations:STATIONS,shows:SHOWS,origin,playStartup};});
 handle('deck:save',patch=>{update(patch);return publicState();});
 handle('deck:resize',(view,height)=>resize(view,height));
 handle('deck:radio',async station=>radioRelay.issue(await radioUrls(station,secret)).map(route=>origin+route));
 handle('deck:episodes',(show,type,refresh)=>episodes(show,type,!!refresh));
 handle('deck:key',value=>{
  if(typeof value!=='string'||value.length>512||/[\r\n]/.test(value))throw new Error('Invalid listen key');
  const key=value.trim();if(key&&!/^[A-Za-z0-9_-]+$/.test(key))throw new Error('Paste the listen key only, from DI.FM Player Settings.');
  radioRelay.revoke();secret=key;delete state.diKeyCipher;
  if(key&&keyring())state.diKeyCipher=safeStorage.encryptString(key).toString('base64');save();return publicState();
 });
 handle('deck:video-id',value=>{const id=videoId(String(value).slice(0,2048));if(!id)throw new Error('Use a YouTube video URL.');return id;});
 handle('deck:external',async(kind,id)=>{
  let url;if(kind==='di-settings')url='https://www.di.fm/settings';
  if(kind==='di-station'&&STATIONS.some(s=>s.id===id))url='https://www.di.fm/'+id;
  if(kind==='youtube'&&/^[\w-]{11}$/.test(id))url='https://www.youtube.com/watch?v='+id;
  if(kind==='channel'){const show=SHOWS.find(s=>s.id===id);if(show)url='https://www.youtube.com/channel/'+show.channel;}
  if(!url)throw new Error('Unknown link');await shell.openExternal(url);
 });
 handle('deck:hide',()=>win.hide());handle('deck:quit',quit);
 handle('deck:move',(dx,dy)=>{if(mode!=='bug'||!Number.isFinite(dx)||!Number.isFinite(dy))return;const [x,y]=win.getPosition();const nx=x+Math.max(-100,Math.min(100,Math.round(dx))),ny=y+Math.max(-100,Math.min(100,Math.round(dy)));win.setPosition(nx,ny);if(fullBounds){fullBounds.x+=nx-x;fullBounds.y+=ny-y;}});
 const icon=nativeImage.createFromPath(path.join(__dirname,'../assets/icon.png'));
 tray=new Tray(icon.resize({width:22,height:22}));tray.setToolTip('MattAMP — workstation player');tray.setContextMenu(Menu.buildFromTemplate([{label:'Show MattAMP',click:()=>{win.show();win.focus();}},{label:'Pause playback',click:()=>send('deck:pause')},{type:'separator'},{label:'Quit MattAMP',click:quit}]));tray.on('click',()=>{win.show();win.focus();});
 await win.loadURL(origin+'/');win.show();
 const monitor=new Monitor();const tick=async()=>{if(busy)return;busy=true;try{send('deck:metrics',await monitor.sample());}catch{send('deck:metrics',{error:'Metrics unavailable',time:Date.now()});}finally{busy=false;}};void tick();timer=setInterval(tick,2000);
});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{clearInterval(timer);radioRelay.revoke();server?.close();tray?.destroy();});
