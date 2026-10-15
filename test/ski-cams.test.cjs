const {test}=require('node:test'),assert=require('node:assert/strict');
const {DEFAULT_CAMERAS,cameraUrl,normalizeCameras,playerUrl,sierraVideo,resolveCamera}=require('../src/ski-cams.cjs');
test('four requested defaults migrate, remain editable, and allow an empty library',()=>{
 const cams=normalizeCameras();assert.deepEqual(cams.map(c=>c.name),['Grandview','West Bowl','Top of Tram','Cornice Cam']);assert.deepEqual(normalizeCameras([]),[]);
 assert.equal(normalizeCameras([{...cams[0],name:'My Grandview'}])[0].page,cams[0].page);
 assert.equal(normalizeCameras([{...cams[0],url:'https://example.org/camera'}])[0].page,'https://example.org/camera');
 assert.throws(()=>normalizeCameras([cams[0],cams[0]]),/identifier/);
 assert.throws(()=>normalizeCameras([{name:'',url:'https://example.org'}]),/name/);
});
test('camera links reject scripts, credentials, local and non-HTTPS navigation',()=>{
 for(const url of ['javascript:alert(1)','file:///etc/passwd','http://example.org/cam','https://127.0.0.1/cam','https://[::1]/','https://user:pass@example.org/cam'])assert.throws(()=>cameraUrl(url),/HTTPS/);
 assert.equal(cameraUrl('https://example.org/cam'),'https://example.org/cam');
});
test('YouTube live and watch links use muted embeds without passing arbitrary query parameters',()=>{
 for(const url of ['https://www.youtube.com/watch?v=abcdefghijk&t=5','https://youtube.com/live/abcdefghijk','https://youtu.be/abcdefghijk'])assert.equal(playerUrl(url),'https://www.youtube.com/embed/abcdefghijk?autoplay=1&mute=1&playsinline=1&rel=0');
 assert.equal(playerUrl(DEFAULT_CAMERAS[2].url),DEFAULT_CAMERAS[2].url);
});
test('Sierra refresh follows the resort config, falls back offline, and respects user edits',async()=>{
 const html='<script type="application/json" id="sierra-live-webcams-cfg-14">'+JSON.stringify({cams:{grandview:{youtube_video_id:'abcdefghijk'}}})+'</script>';
 assert.equal(sierraVideo(html,'grandview'),'https://www.youtube.com/watch?v=abcdefghijk');
 const live=await resolveCamera(DEFAULT_CAMERAS[0],async()=>html);assert.ok(live.url.includes('abcdefghijk'));assert.equal(live.fallback,false);
 assert.equal((await resolveCamera(DEFAULT_CAMERAS[0],async()=>{throw new Error('offline');})).fallback,true);
 const custom=await resolveCamera({...DEFAULT_CAMERAS[0],url:'https://example.org/cam'},()=>assert.fail('must not resolve edited source'));
 assert.equal(custom.url,'https://example.org/cam');
});
