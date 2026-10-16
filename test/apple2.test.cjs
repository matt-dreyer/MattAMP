const {test}=require('node:test'),assert=require('node:assert/strict');
const {appearance}=require('../src/appearance.cjs'),{palette,quantize,jokes}=require('../src/apple2.js');
const {createStationImages}=require('../src/station-image.cjs');
test('appearance migrates legacy preferences and explicit modern wins',()=>{
 assert.equal(appearance({}), 'modern');assert.equal(appearance({retro:true}), 'retro');
 assert.equal(appearance({appearance:'apple2',retro:true}), 'apple2');
 assert.equal(appearance({appearance:'modern',retro:true}), 'modern');
 assert.equal(appearance({appearance:'unknown',retro:true}), 'retro');
});
test('dithered artwork uses only the display palette and preserves alpha',()=>{
 const pixels=new Uint8ClampedArray([200,120,80,255,2,3,4,0,10,200,140,128,220,30,190,255]);quantize(pixels,2);
 for(let i=0;i<pixels.length;i+=4){const hex='#'+Array.from(pixels.slice(i,i+3),n=>n.toString(16).padStart(2,'0')).join('');assert.ok(palette.includes(hex));}
 assert.deepEqual([pixels[3],pixels[7],pixels[11],pixels[15]],[255,0,128,255]);assert.ok(jokes.some(s=>s.includes('HAVRE')));
});
const valid='https://cdn-images.audioaddict.com/test.png';
const make=(url=valid,fetchImage=async()=>new Response(Buffer.from('image'),{headers:{'content-type':'image/png'}}))=>createStationImages({stations:[{id:'synthwave'}],lookup:async()=>({synthwave:url}),fetchImage});
test('artwork relay bounds IDs, origin, redirects and caches only valid image responses',async()=>{
 let calls=0;const relay=make(valid,async(url,options)=>{calls++;assert.equal(url.hostname,'cdn-images.audioaddict.com');assert.equal(options.redirect,'error');assert.ok(options.signal);return new Response('png',{headers:{'content-type':'image/png'}});});
 await assert.rejects(relay('arbitrary'),/Unknown station/);await relay('synthwave');await relay('synthwave');assert.equal(calls,1);
 for(const url of ['http://cdn-images.audioaddict.com/a','https://evil.example/a','https://cdn-images.audioaddict.com:8443/a','https://u:p@cdn-images.audioaddict.com/a'])await assert.rejects(make(url)('synthwave'),/Invalid artwork/);
 await assert.rejects(make(valid,async()=>new Response('<html>',{headers:{'content-type':'text/html'}}))('synthwave'),/unavailable/);
 await assert.rejects(make(valid,async()=>new Response(Buffer.alloc(1024*1024+1),{headers:{'content-type':'image/png'}}))('synthwave'),/too large/);
});
