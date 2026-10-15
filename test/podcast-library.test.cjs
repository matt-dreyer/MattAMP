const {test}=require('node:test');
const assert=require('node:assert/strict');
const {SHOWS,normalizeLibrary,resolveShow,selection}=require('../src/podcast-library.cjs');
const channel='UCghJTNTO9kcDeUFXMuSDGLQ';
test('existing favorites migrate unchanged; an intentionally empty library stays empty',()=>{
 assert.deepEqual(normalizeLibrary().map(s=>s.id),SHOWS.map(s=>s.id));
 assert.equal(normalizeLibrary().find(s=>s.id==='humans').matchAudioTitles,true);
 assert.deepEqual(normalizeLibrary([]),[]);
 assert.throws(()=>normalizeLibrary([SHOWS[0],SHOWS[0]]),/unique/);
});
test('custom shows accept either source, resolve channel handles, and canonicalize playlists',async()=>{
 const audio=await resolveShow({name:' Audio show ',feed:'https://example.org/rss'},null);
 assert.equal(audio.name,'Audio show');assert.equal(audio.playlist,'');
 const video=await resolveShow({name:'Video',youtube:'https://www.youtube.com/watch?v=abcdefghijk&list=PL1234567890'},null);
 assert.equal(video.youtubeUrl,'https://www.youtube.com/playlist?list=PL1234567890');assert.equal(video.filterShorts,true);
 const direct=await resolveShow({name:'Channel',youtube:'https://www.youtube.com/channel/'+channel+'/videos'},null);
 const handle=await resolveShow({name:'Handle',youtube:'https://www.youtube.com/@AIForHumansShow/videos'},null,async url=>{
  assert.equal(url,'https://www.youtube.com/@AIForHumansShow');return JSON.stringify({externalId:channel});
 });
 assert.equal(direct.playlist,'UULF'+channel.slice(2));assert.equal(handle.playlist,direct.playlist);
});
test('invalid sources are rejected without requesting arbitrary hosts',async()=>{
 for(const youtube of ['https://youtube.com.evil.test/@show','file:///tmp/podcast','https://www.youtube.com/watch?v=abcdefghijk'])await assert.rejects(resolveShow({name:'Bad',youtube},null),/YouTube|playlist|video/);
 for(const feed of ['http://example.org/rss','https://user:password@example.org/rss','https://127.0.0.1/rss','https://[::1]/rss','file:///etc/passwd'])await assert.rejects(resolveShow({name:'Bad',feed},null),/HTTPS/);
 await assert.rejects(resolveShow({name:'Empty'},null),/Add a YouTube/);
 await assert.rejects(resolveShow({name:'Missing',youtube:'https://youtube.com/@missing'},null,async()=>'<html/>'),/Could not find/);
});
test('editing preserves IDs and original full-episode matching until the source changes',async()=>{
 const old=normalizeLibrary().find(s=>s.id==='humans');
 const renamed=await resolveShow({name:'Humans!',youtube:old.youtubeUrl,feed:old.feed},old);
 assert.equal(renamed.id,old.id);assert.equal(renamed.matchAudioTitles,true);
 const changed=await resolveShow({name:old.name,youtube:'https://youtube.com/playlist?list=PLdifferent123',feed:old.feed},old);
 assert.equal(changed.matchAudioTitles,undefined);assert.equal(changed.filterShorts,true);
});
test('selection falls back after removal and chooses the available player',async()=>{
 const audio=await resolveShow({name:'Audio',feed:'https://example.org/rss'},null);
 const video=await resolveShow({name:'Video',youtube:'https://youtube.com/playlist?list=PL1234567890'},null);
 assert.deepEqual(selection([audio],'removed','youtube'),{show:audio.id,podcastType:'audio'});
 assert.equal(selection([video],video.id,'audio').podcastType,'youtube');
 assert.deepEqual(selection([],'removed','audio'),{show:'',podcastType:'audio'});
});
test('episode cache keys include custom sources, and custom YouTube skips short videos',async()=>{
 const {episodes}=require('../src/services.cjs');
 const original=global.fetch;
 global.fetch=async url=>{
  if(url.includes('youtube.com'))return new Response('<script>var ytInitialData = '+JSON.stringify({contents:{videos:[['abcdefghijk',1200],['shortvideo1',60]].map(([id,duration])=>({playlistVideoRenderer:{videoId:id,title:{simpleText:id},lengthSeconds:String(duration),navigationEndpoint:{watchEndpoint:{playlistId:'PL1234567890',videoId:id}}}}))}})+';</script>');
  return new Response('<rss><channel><item><guid>'+url+'</guid><title>Episode</title><enclosure url="https://example.org/episode.mp3"/></item></channel></rss>');
 };
 try{
  const audio={id:'custom-cache',name:'Custom',feed:'https://example.org/first'};
  assert.equal((await episodes(audio.id,'audio',false,[audio])).items[0].id,audio.feed);
  audio.feed='https://example.org/changed';
  assert.equal((await episodes(audio.id,'audio',false,[audio])).items[0].id,audio.feed);
  const video={id:'custom-video',name:'Video',playlist:'PL1234567890',filterShorts:true};
  assert.deepEqual((await episodes(video.id,'youtube',false,[video])).items.map(i=>i.id),['abcdefghijk']);
 }finally{global.fetch=original;}
});
