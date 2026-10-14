const {test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');
const {createRadioRelay}=require('../src/radio-relay.cjs');
async function withRelay(upstream,check){
 const relay=createRadioRelay(upstream),server=http.createServer((req,res)=>void relay.handle(req,res));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{await check(relay,'http://127.0.0.1:'+server.address().port);}finally{relay.revoke();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
test('radio relay streams HTTP provider audio with no key in its local URL',async()=>{
 const provider='http://prem1.di.fm/futuresynthpop_hi?test-key';let seen;
 await withRelay(async(url)=>{seen=url;return new Response('audio-bytes',{headers:{'Content-Type':'audio/mpeg'}});},async(relay,origin)=>{
  const [route]=relay.issue([provider]);assert.match(route,/^\/radio\/[a-f0-9-]+$/);assert.ok(!route.includes('test-key'));
  const r=await fetch(origin+route);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/mpeg');assert.equal(await r.text(),'audio-bytes');assert.equal(seen,provider);
  relay.issue([provider]);assert.equal((await fetch(origin+route)).status,404);
 });
});
test('radio relay does not expose upstream errors or permit arbitrary fetches',async()=>{
 let requests=0;
 await withRelay(async()=>{requests++;throw new Error('http://prem1.di.fm/?private-key');},async(relay,origin)=>{
  const [route]=relay.issue(['http://prem1.di.fm/?private-key']);
  assert.equal((await fetch(origin+route,{method:'POST'})).status,404);assert.equal(requests,0);
  assert.equal((await fetch(origin+'/radio/unknown')).status,404);assert.equal(requests,0);
  const r=await fetch(origin+route);assert.equal(r.status,502);assert.equal(await r.text(),'Radio stream unavailable');assert.equal(requests,1);
 });
});
