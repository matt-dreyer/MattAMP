const DEFAULT_ACCOUNTS=['bcherny','steipete','karpathy','simonw','chamath'];
const AI_TERMS='(AI OR "artificial intelligence" OR LLM OR LLMs OR Claude OR Codex OR OpenAI OR Anthropic OR Gemini OR Grok OR "machine learning" OR "coding agent" OR agents OR inference)';
function accounts(value){
 const names=(Array.isArray(value)?value:String(value||'').split(/[\s,]+/)).map(v=>String(v).trim().replace(/^@/,'')).filter(Boolean);
 if(!names.length||names.length>12||names.some(v=>!/^\w{1,15}$/.test(v)))throw new Error('Enter 1–12 X handles, separated by commas or spaces.');
 return [...new Set(names.map(v=>v.toLowerCase()))];
}
function searchUrl(config={},lane='ai'){
 const authors=lane==='giggles'?['elonmusk']:accounts(config.accounts||DEFAULT_ACCOUNTS);
 let query='('+authors.map(name=>'from:'+name).join(' OR ')+')';
 if(lane!=='giggles'&&config.aiOnly!==false)query+=' '+AI_TERMS;
 query+=' -filter:replies -filter:retweets';
 return 'https://x.com/search?'+new URLSearchParams({q:query,src:'typed_query',f:'live'});
}
function isXUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['x.com','www.x.com','twitter.com','www.twitter.com'].includes(u.hostname);}catch{return false;}}
function safeExternal(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
function createXFeed({win,send,getConfig}){
 const {WebContentsView,session,shell}=require('electron');
 let view=null,lane='ai',loaded=false,failed=false;
 function status(message){send('deck:x-status',message);}
 function ensure(){
  if(view)return view;
  const ses=session.fromPartition('persist:mattamp-x');
  ses.setPermissionRequestHandler((_wc,_permission,cb)=>cb(false));ses.setPermissionCheckHandler(()=>false);
  ses.on('will-download',event=>event.preventDefault());
  view=new WebContentsView({webPreferences:{session:ses,contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,allowRunningInsecureContent:false}});
  view.setBackgroundColor('#15202b');view.setVisible(false);win.contentView.addChildView(view);
  const wc=view.webContents;wc.setAudioMuted(true);
  wc.on('will-attach-webview',event=>event.preventDefault());
  wc.setWindowOpenHandler(({url})=>{if(safeExternal(url))void shell.openExternal(url);return {action:'deny'};});
  wc.on('will-navigate',(event,url)=>{if(!isXUrl(url)){event.preventDefault();if(safeExternal(url))void shell.openExternal(url);}});
  wc.on('will-redirect',(event,url)=>{if(!isXUrl(url)){event.preventDefault();status('Use your X username and password here. Browser sign-in is also available.');}});
  wc.on('did-start-loading',()=>{failed=false;status('Loading X…');});
  wc.on('did-stop-loading',()=>{if(!failed)status(/\/(login|i\/(flow|jf)\/)/.test(wc.getURL())?'Sign in to X, then choose AI circle.':'X.com · videos muted · AI circle returns to your filter');});
  wc.on('did-fail-load',(_event,code,_description,_url,main)=>{if(main&&code!==-3){failed=true;status('X could not load. Retry or open the filtered feed in your browser.');}});
  wc.on('render-process-gone',()=>{loaded=false;status('X stopped responding. Press Refresh to reconnect.');});
  win.once('closed',()=>{if(!wc.isDestroyed())wc.close();});
  return view;
 }
 function navigate(url){const v=ensure();loaded=true;void v.webContents.loadURL(url).catch(()=>status('X could not load. Retry or use Open in browser.'));}
 function bounds(rect){
  const visible=!!rect?.visible;
  if(!visible){view?.setVisible(false);return;}
  if(![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite))throw new Error('Invalid feed bounds');
  const [width,height]=win.getContentSize(),x=Math.max(0,Math.round(rect.x)),y=Math.max(0,Math.round(rect.y));
  const w=Math.min(Math.round(rect.width),width-x),h=Math.min(Math.round(rect.height),height-y);
  if(w<100||h<100){view?.setVisible(false);return;}
  const v=ensure();v.setBounds({x,y,width:w,height:h});v.setVisible(true);
  if(!loaded)navigate(searchUrl(getConfig(),lane));
 }
 async function action(name,nextLane){
  if(['ai','giggles'].includes(nextLane))lane=nextLane;
  if(name==='browser'){await shell.openExternal(searchUrl(getConfig(),lane));return;}
  if(name==='forget'){if(view){view.setVisible(false);view.webContents.close();win.contentView.removeChildView(view);view=null;}loaded=false;await session.fromPartition('persist:mattamp-x').clearStorageData();status('X session removed. Open the feed to sign in again.');return;}
  if(name==='login')navigate('https://x.com/i/flow/login');
  else if(name==='feed'||name==='refresh')navigate(searchUrl(getConfig(),lane));
  else throw new Error('Unknown X action');
 }
 return {bounds,action,hide:()=>view?.setVisible(false)};
}
module.exports={DEFAULT_ACCOUNTS,accounts,searchUrl,isXUrl,safeExternal,createXFeed};
