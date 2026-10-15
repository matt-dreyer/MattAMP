const os = require('node:os');
const {portableStats,pingArgs}=require('./platform-stats.cjs');
const {parsePlaylistPage}=require('./youtube-playlist.cjs');
const fs = require('node:fs/promises');
const {execFile} = require('node:child_process');
const {promisify} = require('node:util');
const {XMLParser} = require('fast-xml-parser');
const run = promisify(execFile);
const STATIONS = [
 ['futuresynthpop','Future Synthpop'], ['classictrance','Classic Trance'],
 ['deephouse','Deep House'], ['synthwave','Synthwave'], ['progressive','Progressive'],
 ['liquiddnb','Liquid DnB'], ['chillout','Chillout'], ['psychill','PsyChill']
].map(([id,name])=>({id,name}));
const {SHOWS}=require('./podcast-library.cjs');
const list = value => value ? (Array.isArray(value)?value:[value]):[];
const string = value => typeof value==='object' ? String(value?.['#text']||'') : String(value||'');
const xml = new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@',processEntities:true,htmlEntities:true});
function publicUrl(value) {
 try {const u=new URL(value);return u.protocol==='https:' && !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(u.hostname) ? u.href:null;} catch{return null;}
}
function parseFeed(text, type) {
 const doc=xml.parse(text);
 if(type==='youtube') return list(doc.feed?.entry).map(e=>({
  id:string(e['yt:videoId']),title:string(e.title),date:string(e.published),
  url:'https://www.youtube.com/watch?v='+string(e['yt:videoId']),type:'youtube'
 })).filter(e=>/^[\w-]{11}$/.test(e.id)).slice(0,25);
 return list(doc.rss?.channel?.item).flatMap(e=>{
  const url=publicUrl(e.enclosure?.['@url']);
  if(!url)return [];
  return [{id:string(e.guid)||url,title:string(e.title)||'Untitled episode',date:string(e.pubDate),url,type:'audio',duration:string(e['itunes:duration'])}];
 }).slice(0,30);
}
async function fetchText(url,maxBytes=12*1024*1024) {
 const response=await fetch(url,{signal:AbortSignal.timeout(16000),headers:{'User-Agent':'MattAMP/0.1 (+https://fshbwl.ai)','Accept':'application/xml,text/xml,text/plain,*/*'}});
 if(!response.ok)throw new Error('Feed returned HTTP '+response.status);
 let size=0;const chunks=[];
 for await(const chunk of response.body){size+=chunk.length;if(size>maxBytes)throw new Error('Response exceeded size limit');chunks.push(chunk);}
 return Buffer.concat(chunks).toString('utf8');
}
// AI for Humans' full-show playlist is ordered oldest first. Match its
// non-Short uploads against the actual podcast feed, excluding standalone videos.
function matchPodcastEpisodes(videos,audioEpisodes){
 const words=title=>new Set(title.toLowerCase().replace(/open\s*ai/g,'openai').match(/[a-z0-9]+/g)||[]);
 return videos.flatMap(video=>{
  const a=words(video.title);
  const match=audioEpisodes.find(episode=>{const b=words(episode.title),common=[...a].filter(word=>b.has(word)).length;
   return common>=5&&2*common/(a.size+b.size)>=0.8;
  });
  return match?[{...video,date:video.date||match.date||''}]:[];
 });
}
function youtubeEpisodeFeed(show){return 'https://www.youtube.com/feeds/videos.xml?playlist_id='+encodeURIComponent(show.playlist);}
const feedCache=new Map();
async function episodes(showId,type,refresh=false,library=SHOWS) {
 const show=library.find(s=>s.id===showId);if(!show||!['youtube','audio'].includes(type))throw new Error('Unknown podcast source');
 if(type==='audio'&&!show.feed||type==='youtube'&&!show.playlist)throw new Error('This show has no '+(type==='audio'?'audio feed':'YouTube source')+'. Edit it in Settings.');
 const key=JSON.stringify([showId,type,show.feed,show.playlist,show.filterShorts,show.matchAudioTitles]), previous=feedCache.get(key);
 if(!refresh&&previous&&Date.now()-previous.updated<900000)return previous;
 try{
  let items;
  if(type==='youtube'){
   try{if(show.filterShorts)throw new Error('Check video durations');items=parseFeed(await fetchText(youtubeEpisodeFeed(show)),type);if(!items.length)throw new Error('Empty YouTube feed');}
   catch{items=parsePlaylistPage(await fetchText('https://www.youtube.com/playlist?list='+encodeURIComponent(show.playlist)),show.playlist);}
  }else items=parseFeed(await fetchText(show.feed),type);
  if(type==='youtube'&&show.matchAudioTitles){const audio=await episodes(showId,'audio',refresh,library);items=matchPodcastEpisodes(items,audio.items);}
  items.sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
  if(!items.length)throw new Error('No full episodes available in this feed. Try Audio feed.');
  const result={items:type==='youtube'?items.slice(0,25):items,updated:Date.now(),stale:false};feedCache.set(key,result);if(feedCache.size>100)feedCache.delete(feedCache.keys().next().value);return result;
 }catch(error){if(previous)return {...previous,stale:true};throw error;}
}
function parseArtwork(channels){
 const art={};
 for(const station of STATIONS){
  const channel=channels.find(c=>c.key===station.id);
  const value=channel?.images?.square||channel?.asset_url;
  if(typeof value!=='string')continue;
  try{const url=new URL(value.replace(/\{[^}]*\}/g,''),'https://cdn-images.audioaddict.com');
   if(url.protocol!=='https:'||url.hostname!=='cdn-images.audioaddict.com'||url.username||url.password)continue;
   url.searchParams.set('width','256');url.searchParams.set('height','256');url.searchParams.set('quality','80');art[station.id]=url.href;
  }catch{}
 }
 return art;
}
let artworkCache=null;
async function stationArtwork(){
 if(artworkCache&&Date.now()-artworkCache.updated<86400000)return artworkCache.art;
 try{const channels=JSON.parse(await fetchText('https://api.audioaddict.com/v1/di/channels.json'));
  if(!Array.isArray(channels))throw new Error('Channel artwork unavailable');
  const art=parseArtwork(channels);artworkCache={art,updated:Date.now()};return art;
 }catch{return artworkCache?.art||{};}
}
function parsePlaylist(text) {
 return text.split(/\r?\n/).filter(line=>/^File\d+=https?:\/\//i.test(line)).map(line=>line.slice(line.indexOf('=')+1).trim()).flatMap(value=>{
  try{const u=new URL(value);if(['http:','https:'].includes(u.protocol)&&(u.hostname==='di.fm'||u.hostname.endsWith('.di.fm'))&&!u.username&&!u.password){return [u.href];}}catch{}
  return [];
 });
}
async function radioUrls(station,key) {
 if(!STATIONS.some(s=>s.id===station))throw new Error('Unknown station');
 if(!key)throw new Error('Add your DI.FM listen key in Settings to play radio.');
 const url='https://listen.di.fm/premium_high/'+station+'.pls?listen_key='+encodeURIComponent(key);
 const urls=parsePlaylist(await fetchText(url,256*1024));
 if(!urls.length)throw new Error('DI.FM did not return a stream. Check your Premium listen key in Settings.');
 return urls;
}
function memoryFromProc(text) {
 const fields={};for(const m of text.matchAll(/^(\w+):\s+(\d+)/gm))fields[m[1]]=Number(m[2])*1024;
 if(!fields.MemTotal||fields.MemAvailable==null)return null;
 return {total:fields.MemTotal,used:fields.MemTotal-fields.MemAvailable,percent:100*(1-fields.MemAvailable/fields.MemTotal)};
}
function defaultRoute(text) {
 const routes=text.trim().split('\n').slice(1).map(l=>l.trim().split(/\s+/)).filter(c=>c[1]==='00000000'&&(parseInt(c[3],16)&1)).sort((a,b)=>Number(a[6])-Number(b[6]));
 if(!routes.length)return null;
 const [iface,,hex]=routes[0];return {iface,gateway:hex.match(/../g).reverse().map(h=>parseInt(h,16)).join('.')};
}
function netCounters(text,iface) {
 const line=text.split('\n').find(l=>l.trim().startsWith(iface+':'));if(!line)return null;
 const c=line.split(':')[1].trim().split(/\s+/).map(Number);return {rx:c[0],tx:c[8]};
}
function parseGpus(text) {
 const num=s=>Number.isFinite(Number(s))?Number(s):null;
 return text.trim().split('\n').filter(Boolean).map(line=>{
  const [index,uuid,name,load,used,total,temp]=line.split(',').map(s=>s.trim());
  return {index:num(index),uuid,name,load:num(load),used:num(used),total:num(total),temp:num(temp)};
 });
}
async function ping(host) {
 try {const {stdout}=await run('ping',pingArgs(host),{timeout:3500,maxBuffer:8192});const m=stdout.match(/time[=<]([\d.]+)/);return {reachable:true,ms:m?Number(m[1]):null};}
 catch{return {reachable:false,ms:null};}
}
class Monitor {
 constructor(){this.previousCpu=null;this.previousNet=null;this.reach={status:'checking',router:null,internet:null,checked:null};this.checking=false;this.snapshot=null;}
 async reachability(route){
  if(this.checking)return;this.checking=true;
  try{
   if(!route){this.reach={status:'disconnected',router:null,internet:null,checked:Date.now()};return;}
   const [router,a,b]=await Promise.all([route.gateway?ping(route.gateway):Promise.resolve({reachable:false,ms:null}),ping('1.1.1.1'),ping('8.8.8.8')]);
   let internet=a.reachable?a:b;
   if(!internet.reachable){try{const start=performance.now();const r=await fetch('https://connectivitycheck.gstatic.com/generate_204',{signal:AbortSignal.timeout(4000),redirect:'error'});if(r.status===204)internet={reachable:true,ms:Math.round(performance.now()-start),via:'HTTPS'};}catch{}}
   this.reach={status:internet.reachable?'online':router.reachable?'upstream-unreachable':'unreachable',router,internet,checked:Date.now()};
  }finally{this.checking=false;}
 }
 async sample(){
  const now=Date.now(),cpus=os.cpus();const cpu=cpus.reduce((a,c)=>({idle:a.idle+c.times.idle,total:a.total+Object.values(c.times).reduce((x,y)=>x+y,0)}),{idle:0,total:0});
  let percent=null;if(this.previousCpu&&cpu.total>this.previousCpu.total)percent=Math.max(0,Math.min(100,100*(1-(cpu.idle-this.previousCpu.idle)/(cpu.total-this.previousCpu.total))));this.previousCpu=cpu;
  const portable=process.platform==='linux'?null:await portableStats();
  const [mem,routeText,net,gpus]=await Promise.allSettled([
   ...(portable?[null,null,null]:[fs.readFile('/proc/meminfo','utf8'),fs.readFile('/proc/net/route','utf8'),fs.readFile('/proc/net/dev','utf8')]),
   run('nvidia-smi',['--query-gpu=index,uuid,name,utilization.gpu,memory.used,memory.total,temperature.gpu','--format=csv,noheader,nounits'],{timeout:1800,maxBuffer:32768})
  ]);
  const route=portable?portable.route:routeText.status==='fulfilled'?defaultRoute(routeText.value):null;
  const counters=portable?portable.counters:route&&net.status==='fulfilled'?netCounters(net.value,route.iface):null;let down=null,up=null;
  if(counters&&this.previousNet?.iface===route.iface){const seconds=(now-this.previousNet.time)/1000;if(seconds>0&&counters.rx>=this.previousNet.rx&&counters.tx>=this.previousNet.tx){down=(counters.rx-this.previousNet.rx)*8/seconds/1e6;up=(counters.tx-this.previousNet.tx)*8/seconds/1e6;}}
  this.previousNet=counters?{...counters,iface:route.iface,time:now}:null;
  if(!this.reach.checked||now-this.reach.checked>10000||this.lastIface!==route?.iface){void this.reachability(route);this.lastIface=route?.iface;}
  this.snapshot={time:now,cpu:percent,memory:portable?portable.memory:mem.status==='fulfilled'?memoryFromProc(mem.value):null,network:{...this.reach,iface:route?.iface||null,gateway:route?.gateway||null,down,up},gpus:gpus.status==='fulfilled'?parseGpus(gpus.value.stdout):[],gpuError:gpus.status!=='fulfilled'};
  return this.snapshot;
 }
}
function videoId(value){try{const u=new URL(value);if(!['youtube.com','www.youtube.com','youtu.be','m.youtube.com'].includes(u.hostname))return null;const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1];return /^[\w-]{11}$/.test(id||'')?id:null;}catch{return /^[\w-]{11}$/.test(value||'')?value:null;}}
module.exports={fetchText,STATIONS,SHOWS,matchPodcastEpisodes,youtubeEpisodeFeed,stationArtwork,parseArtwork,Monitor,parseFeed,parsePlaylist,radioUrls,episodes,memoryFromProc,defaultRoute,netCounters,parseGpus,videoId,publicUrl};
