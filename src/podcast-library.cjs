const {randomUUID}=require('node:crypto');
const SHOWS = [
 {id:'lastweek',playlist:'PLM-oLAM5uh0nDfcweJYejeAdGzPCuh8KP',name:'Last Week in AI',channel:'UCKARTq-t5SPMzwtft8FWwnA',feed:'https://rss.art19.com/last-week-in-ai'},
 {id:'humans',playlist:'UULFghJTNTO9kcDeUFXMuSDGLQ',matchAudioTitles:true,name:'AI for Humans',channel:'UCghJTNTO9kcDeUFXMuSDGLQ',feed:'https://feeds.libsyn.com/469701/rss'},
 {id:'allin',playlist:'PLn5MTSAqaf8peDZQ57QkJBzewJU1aUokl',name:'All-In',channel:'UCESLZhusAkFfsNsApnjF_Cg',feed:'https://allinchamathjason.libsyn.com/rss'},
 {id:'dwarkesh',playlist:'PLd7-bHaQwnthaNDpZ32TtYONGVk95-fhF',name:'Dwarkesh Podcast',channel:'UCXl4i9dYBrFOabk0xGmbkRA',feed:'https://apple.dwarkesh-podcast.workers.dev/feed.rss'},
 {id:'a16z',playlist:'PLM4u6XbiXf5rnUvH5NLdV_It2QLgbHBDZ',name:'The a16z Show',channel:'UC9cn0TuPq4dnbTY-CBsm8XA',feed:'https://feeds.simplecast.com/JGE3yC0V'}
];
const CHANNEL=/^UC[\w-]{22}$/;
const PLAYLIST=/^[\w-]{10,100}$/;
function feedUrl(value){
 if(!value)return '';
 try{
  const u=new URL(value);
  if(value.length>2048||u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(u.hostname)||u.hostname.endsWith('.local'))throw new Error();
  return u.href;
 }catch{throw new Error('Use a public HTTPS link for the audio RSS feed.');}
}
function youtubeUrl(show){return show.youtubeUrl||(show.playlist?'https://www.youtube.com/playlist?list='+show.playlist:'');}
function normalizeShow(raw){
 if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!/^[-a-zA-Z0-9]{1,64}$/.test(raw.id||''))throw new Error('Invalid podcast identifier.');
 const name=typeof raw.name==='string'?raw.name.trim():'';
 if(!name||name.length>80)throw new Error('Give the show a name of 1–80 characters.');
 const feed=feedUrl(typeof raw.feed==='string'?raw.feed.trim():'');
 const playlist=raw.playlist||'',channel=raw.channel||'';
 if(typeof playlist!=='string'||typeof channel!=='string'||playlist&&!PLAYLIST.test(playlist)||channel&&!CHANNEL.test(channel))throw new Error('Invalid YouTube playlist or channel.');
 if(!feed&&!playlist)throw new Error('Add a YouTube link, an audio RSS feed, or both.');
 const show={id:raw.id,name,feed,playlist,channel};
 // Save only canonical provider URLs, never renderer-supplied navigation targets.
 if(playlist)show.youtubeUrl=channel&&playlist==='UULF'+channel.slice(2)?'https://www.youtube.com/channel/'+channel:'https://www.youtube.com/playlist?list='+playlist;
 if(raw.matchAudioTitles===true&&feed&&playlist)show.matchAudioTitles=true;
 if(raw.filterShorts===true)show.filterShorts=true;
 return show;
}
function normalizeLibrary(value){
 if(value===undefined)return SHOWS.map(normalizeShow);
 if(!Array.isArray(value)||value.length>50)throw new Error('Keep up to 50 podcasts in your library.');
 const result=value.map(normalizeShow);
 if(new Set(result.map(s=>s.id)).size!==result.length)throw new Error('Each podcast needs a unique identifier.');
 return result;
}
async function resolveShow(input,previous,fetchText){
 if(!input||typeof input!=='object')throw new Error('Enter a show name and a source link.');
 const name=typeof input.name==='string'?input.name.trim():'';
 const feed=feedUrl(typeof input.feed==='string'?input.feed.trim():'');
 const link=typeof input.youtube==='string'?input.youtube.trim():'';
 let playlist='',channel='';
 if(link){
  let u;try{u=new URL(link);}catch{throw new Error('Paste a YouTube playlist or channel URL.');}
  if(link.length>2048||u.protocol!=='https:'||u.username||u.password||!['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))throw new Error('Use an HTTPS YouTube playlist or channel link.');
  playlist=u.searchParams.get('list')||'';
  if(!playlist){
   channel=u.pathname.match(/^\/channel\/(UC[\w-]{22})(?:\/|$)/)?.[1]||'';
   if(!channel){
    const handle=u.pathname.match(/^\/(@[\w.%-]+)(?:\/|$)/)?.[1];
    if(!handle)throw new Error('Use a playlist or channel link, not an individual video.');
    const html=await fetchText('https://www.youtube.com/'+handle);
    channel=html.match(/"externalId"\s*:\s*"(UC[\w-]{22})"/)?.[1]||html.match(/<meta[^>]+itemprop="channelId"[^>]+content="(UC[\w-]{22})"/)?.[1]||'';
    if(!channel)throw new Error('Could not find that YouTube channel. Try its playlist link instead.');
   }
   playlist='UULF'+channel.slice(2);
  }
 }
 const same=previous&&previous.playlist===playlist&&previous.feed===feed;
 return normalizeShow({id:previous?.id||randomUUID(),name,feed,playlist,channel:channel||(same?previous.channel:''),matchAudioTitles:same&&previous.matchAudioTitles,filterShorts:same?previous.filterShorts:true});
}
function selection(library,show,type){
 const chosen=library.find(s=>s.id===show)||library[0];
 return {show:chosen?.id||'',podcastType:chosen?(type==='audio'&&chosen.feed?'audio':chosen.playlist?'youtube':'audio'):type};
}
module.exports={SHOWS,normalizeLibrary,resolveShow,selection,youtubeUrl};
