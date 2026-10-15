const {randomUUID}=require('node:crypto');
const DEFAULT_CAMERAS=[
 {id:'sierra-grandview',name:'Grandview',resort:'Sierra-at-Tahoe',url:'https://www.youtube.com/watch?v=adxDs4z-y34',page:'https://sierraattahoe.com/live-cams/'},
 {id:'sierra-westbowl',name:'West Bowl',resort:'Sierra-at-Tahoe',url:'https://www.youtube.com/watch?v=-l5RJMV40N0',page:'https://sierraattahoe.com/live-cams/'},
 {id:'heavenly-tram',name:'Top of Tram',resort:'Heavenly',url:'https://player.brownrice.com/embed/heavenlytram',page:'https://www.skiheavenly.com/the-mountain/mountain-conditions/mountain-cams.aspx'},
 {id:'kirkwood-cornice',name:'Cornice Cam',resort:'Kirkwood',url:'https://player.brownrice.com/embed/kirkwoodcornice',page:'https://www.kirkwood.com/the-mountain/mountain-conditions/mountain-cams.aspx'}
];
function cameraUrl(value){
 try{
  if(typeof value!=='string'||value.length>2048)throw new Error();
  const u=new URL(value.trim());
  if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(u.hostname)||u.hostname.endsWith('.local'))throw new Error();
  return u.href;
 }catch{throw new Error('Use a public HTTPS camera or resort-page link.');}
}
function normalizeCameras(value=DEFAULT_CAMERAS){
 if(!Array.isArray(value)||value.length>40)throw new Error('Keep up to 40 cameras in your lineup.');
 const result=value.map(raw=>{
  if(!raw||typeof raw!=='object')throw new Error('Enter a camera name and link.');
  const id=raw.id||randomUUID(),name=typeof raw.name==='string'?raw.name.trim():'',resort=typeof raw.resort==='string'?raw.resort.trim():'';
  if(typeof id!=='string'||!/^[-\w]{1,64}$/.test(id)||!name||name.length>80||resort.length>80)throw new Error('Give the camera a name of 1–80 characters. Resort names may be up to 80 characters.');
  const url=cameraUrl(raw.url),original=DEFAULT_CAMERAS.find(c=>c.id===id&&c.url===url);
  return {id,name,resort,url,page:original?.page||url};
 });
 if(new Set(result.map(c=>c.id)).size!==result.length)throw new Error('Each camera needs its own identifier.');
 return result;
}
function playerUrl(value){
 const u=new URL(cameraUrl(value));
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname)){
  const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|live)\/([\w-]{11})/)?.[1];
  if(/^[\w-]{11}$/.test(id||''))return 'https://www.youtube.com/embed/'+id+'?autoplay=1&mute=1&playsinline=1&rel=0';
 }
 return u.href;
}
function sierraVideo(html,key){
 const config=html.match(/<script[^>]+id="sierra-live-webcams-cfg-[^"]+"[^>]*>([\s\S]*?)<\/script>/);
 if(!config)throw new Error('Sierra camera list unavailable');
 const id=JSON.parse(config[1]).cams?.[key]?.youtube_video_id;
 if(!/^[\w-]{11}$/.test(id||''))throw new Error('Sierra camera unavailable');
 return 'https://www.youtube.com/watch?v='+id;
}
async function resolveCamera(camera,fetchText){
 const original=DEFAULT_CAMERAS.find(c=>c.id===camera.id&&c.url===camera.url);
 if(original?.id.startsWith('sierra-')){
  try{return {url:playerUrl(sierraVideo(await fetchText(original.page),original.id.slice(7))),fallback:false};}
  catch{return {url:playerUrl(camera.url),fallback:true};}
 }
 return {url:playerUrl(camera.url),fallback:false};
}
function createSkiCams({win,send,getCameras,fetchText}){
 const {WebContentsView,session,shell}=require('electron');
 const ses=session.fromPartition('mattamp-ski-cams');
 ses.setPermissionRequestHandler((_wc,_permission,cb)=>cb(false));ses.setPermissionCheckHandler(()=>false);
 ses.on('will-download',e=>e.preventDefault());
 ses.webRequest.onBeforeSendHeaders({urls:['https://www.youtube.com/embed/*']},(details,callback)=>{details.requestHeaders.Referer='https://ai.fshbwl.deck/';callback({requestHeaders:details.requestHeaders});});
 let view=null,activeId='',generation=0,failed=false;
 function status(message){send('deck:camera-status',message);}
 function hide(){
  ++generation;activeId='';
  if(view){const old=view;view=null;old.setVisible(false);if(!win.isDestroyed())win.contentView.removeChildView(old);if(!old.webContents.isDestroyed())old.webContents.close();}
 }
 function ensure(){
  if(view)return view;
  const v=new WebContentsView({webPreferences:{session:ses,contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,allowRunningInsecureContent:false,autoplayPolicy:'no-user-gesture-required'}});
  view=v;v.setBackgroundColor('#111b23');v.setVisible(false);win.contentView.addChildView(v);
  const wc=v.webContents;wc.setAudioMuted(true);
  wc.setWindowOpenHandler(()=>{status('Open this camera in Browser to follow that link.');return {action:'deny'};});
  for(const event of ['will-navigate','will-redirect'])wc.on(event,(e,url)=>{try{cameraUrl(url);}catch{e.preventDefault();status('That camera link cannot open here. Try Browser.');}});
  wc.on('will-attach-webview',e=>e.preventDefault());
  wc.on('did-fail-load',(_e,code,_description,_url,main)=>{if(view===v&&main&&code!==-3){failed=true;status('Camera could not load. Try Refresh or Browser.');}});
  wc.on('did-stop-loading',()=>{if(view===v&&!failed&&wc.getURL().startsWith('https://'))status('Camera audio muted · availability is managed by the resort');});
  wc.on('render-process-gone',()=>{if(view===v){failed=true;status('Camera stopped responding. Press Refresh to reconnect.');}});
  return v;
 }
 async function navigate(camera){
  const token=++generation,v=ensure();activeId=camera.id;failed=false;status('Loading '+camera.name+'…');
  try{
   const resolved=await resolveCamera(camera,fetchText);
   if(token!==generation||view!==v)return;
   await v.webContents.loadURL(resolved.url);
   if(token===generation&&resolved.fallback)status('Using saved Sierra camera link. Refresh to check for an updated stream.');
  }catch{if(token===generation){failed=true;status('Camera could not load. Try Refresh or Browser.');}}
 }
 function bounds(rect){
  if(!rect?.visible){if(view)hide();return;}
  const camera=getCameras().find(c=>c.id===rect.id);if(!camera){hide();return;}
  if(![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite))throw new Error('Invalid camera bounds');
  const [width,height]=win.getContentSize();
  // Hide a partly offscreen native view rather than letting it cover other controls.
  if(rect.x<0||rect.y<0||rect.x+rect.width>width+1||rect.y+rect.height>height+1){hide();return;}
  if(activeId&&activeId!==camera.id)hide();
  const v=ensure();v.setBounds({x:Math.round(rect.x),y:Math.round(rect.y),width:Math.max(1,Math.floor(rect.width)),height:Math.max(1,Math.floor(rect.height))});v.setVisible(true);
  if(activeId!==camera.id)void navigate(camera);
 }
 async function action(name,id){
  const camera=getCameras().find(c=>c.id===id);if(!camera)throw new Error('Add a camera in Settings first.');
  if(name==='browser'){await shell.openExternal(camera.page);return;}
  if(name==='refresh'){hide();status('Reconnecting…');return;}
  throw new Error('Unknown camera action');
 }
 win.once('closed',hide);
 return {bounds,action,hide};
}
module.exports={DEFAULT_CAMERAS,cameraUrl,normalizeCameras,playerUrl,sierraVideo,resolveCamera,createSkiCams};
