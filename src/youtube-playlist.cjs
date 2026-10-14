/* Read public playlist metadata as JSON; never execute provider page scripts. */
function durationSeconds(value){
 if(typeof value!=='string'||!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(value))return 0;
 return value.split(':').reduce((total,n)=>total*60+Number(n),0);
}
function parsePlaylistPage(html,playlistId){
 const match=html.match(/(?:var\s+ytInitialData|window\["ytInitialData"\])\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
 if(!match)throw new Error('YouTube playlist metadata is unavailable.');
 let data;try{data=JSON.parse(match[1]);}catch{throw new Error('YouTube playlist metadata could not be read.');}
 const items=[],seen=new Set();
 function add(id,title,length,endpoint){
  if(!/^[\w-]{11}$/.test(id||'')||!title||endpoint?.playlistId!==playlistId||endpoint?.videoId!==id||length<=180||seen.has(id))return;
  seen.add(id);items.push({id,title,date:'',duration:length,url:'https://www.youtube.com/watch?v='+id,type:'youtube'});
 }
 function walk(node){
  if(!node||typeof node!=='object')return;
  if(node.lockupViewModel){
   const v=node.lockupViewModel;
   if(v.contentType!=='LOCKUP_CONTENT_TYPE_VIDEO')return;
   const overlays=v.contentImage?.thumbnailViewModel?.overlays||[];
   const length=Math.max(0,...overlays.flatMap(o=>(o.thumbnailBottomOverlayViewModel?.badges||[]).map(b=>durationSeconds(b.thumbnailBadgeViewModel?.text))));
   add(v.contentId,v.metadata?.lockupMetadataViewModel?.title?.content,length,v.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint);
   return;
  }
  if(node.playlistVideoRenderer){
   const v=node.playlistVideoRenderer;
   add(v.videoId,v.title?.simpleText||v.title?.runs?.map(r=>r.text).join(''),Number(v.lengthSeconds)||durationSeconds(v.lengthText?.simpleText),v.navigationEndpoint?.watchEndpoint);
   return;
  }
  for(const value of Object.values(node))if(typeof value==='object')walk(value);
 }
 // Ignore page header, recommendations, menus and continuation tokens.
 walk(data.contents);
 if(!items.length)throw new Error('No full episodes found on the YouTube playlist.');
 return items;
}
module.exports={parsePlaylistPage,durationSeconds};
