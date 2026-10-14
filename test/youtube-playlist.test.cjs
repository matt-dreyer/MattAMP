const {test}=require('node:test'),assert=require('node:assert/strict');
const {parsePlaylistPage,durationSeconds}=require('../src/youtube-playlist.cjs');
const playlist='test-full-episodes';
function video(id,title='A full podcast episode',length='48:15',list=playlist){return {lockupViewModel:{contentId:id,contentType:'LOCKUP_CONTENT_TYPE_VIDEO',metadata:{lockupMetadataViewModel:{title:{content:title}}},contentImage:{thumbnailViewModel:{overlays:[{thumbnailBottomOverlayViewModel:{badges:[{thumbnailBadgeViewModel:{text:length}}]}}]}},rendererContext:{commandContext:{onTap:{innertubeCommand:{watchEndpoint:{videoId:id,playlistId:list}}}}}}};}
function page(contents,extra={}){return '<script>var ytInitialData = '+JSON.stringify({contents,...extra})+';</script>';}
test('public playlist parser accepts current and classic items and ignores recommendations',()=>{
 const classic={playlistVideoRenderer:{videoId:'classic0001',title:{runs:[{text:'Classic full episode'}]},lengthSeconds:'3600',navigationEndpoint:{watchEndpoint:{videoId:'classic0001',playlistId:playlist}}}};
 const items=parsePlaylistPage(page([video('current0001'),classic],{recommendations:video('recommend01')}),playlist);
 assert.deepEqual(items.map(i=>i.id),['current0001','classic0001']);assert.equal(items[0].duration,2895);assert.equal(items[0].date,'');
});
test('playlist parser rejects Shorts, unavailable duration, wrong playlist and duplicates',()=>{
 const items=parsePlaylistPage(page([video('current0001'),video('current0001'),video('shorts00001','Short','0:45'),video('shorts00002','Short','3:00'),video('unknown0001','Live','LIVE'),video('wrong000001','Wrong','50:00','another-list')]),playlist);
 assert.deepEqual(items.map(i=>i.id),['current0001']);
 assert.equal(durationSeconds('1:23:46'),5026);assert.equal(durationSeconds('LIVE'),0);
});
test('missing or invalid playlist JSON fails closed without evaluating scripts',()=>{
 assert.throws(()=>parsePlaylistPage('<script>globalThis.bad=true;</script>',playlist),/metadata/);
 assert.throws(()=>parsePlaylistPage('<script>var ytInitialData = {oops};</script>',playlist),/could not be read/);
 assert.throws(()=>parsePlaylistPage(page([video('shorts00001','Short','0:45')]),playlist),/No full episodes/);
});
test('YouTube feed 404 recovers from the same playlist and keeps podcast matching',async()=>{
 const {episodes,SHOWS,youtubeEpisodeFeed}=require('../src/services.cjs'),show=SHOWS.find(s=>s.id==='humans');
 const title='AI Is Breaking Software And Games What Happens Next',calls=[],original=global.fetch;
 global.fetch=async url=>{calls.push(url);
  if(url===youtubeEpisodeFeed(show))return new Response('Not Found',{status:404});
  if(url===show.feed)return new Response('<rss><channel><item><title>'+title+'</title><pubDate>Thu, 08 Oct 2026 00:00:00 GMT</pubDate><enclosure url="https://example.org/full.mp3"/></item></channel></rss>');
  assert.equal(url,'https://www.youtube.com/playlist?list='+show.playlist);
  return new Response(page([video('fullshow001',title,'55:53',show.playlist),video('shorts00001',title,'0:45',show.playlist),video('standalone1','An AI Made This Entire Documentary','29:15',show.playlist)]));
 };
 try{const result=await episodes('humans','youtube',true);assert.deepEqual(result.items.map(i=>i.id),['fullshow001']);assert.equal(result.stale,false);assert.equal(result.items[0].date,'Thu, 08 Oct 2026 00:00:00 GMT');assert.equal(calls.length,3);
  global.fetch=async()=>new Response('Unavailable',{status:503});const cached=await episodes('humans','youtube',true);assert.equal(cached.stale,true);assert.equal(cached.items[0].id,'fullshow001');
 }finally{global.fetch=original;}
});
