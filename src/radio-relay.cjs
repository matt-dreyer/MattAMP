const {randomUUID}=require('node:crypto');
const {Readable}=require('node:stream');
const {pipeline}=require('node:stream/promises');

// DI's external-player servers include HTTP-only endpoints. Keep their listen
// keys in the main process and expose only opaque, revocable loopback URLs.
function createRadioRelay(fetchStream=fetch){
 const routes=new Map(),active=new Set();
 function revoke(){routes.clear();for(const controller of active)controller.abort();active.clear();}
 function issue(urls){revoke();return urls.map(url=>{const route='/radio/'+randomUUID();routes.set(route,url);return route;});}
 async function handle(req,res){
  const url=routes.get(req.url);
  if(!url||req.method!=='GET'){res.writeHead(404);res.end();return;}
  const controller=new AbortController();active.add(controller);
  const closed=()=>controller.abort();res.once('close',closed);
  const timeout=setTimeout(()=>controller.abort(),10000);
  try{
   const upstream=await fetchStream(url,{signal:controller.signal,redirect:'error'});
   clearTimeout(timeout);
   if(!upstream.ok||!upstream.body)throw new Error('Stream unavailable');
   res.writeHead(200,{'Content-Type':upstream.headers.get('content-type')||'audio/mpeg','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   await pipeline(Readable.fromWeb(upstream.body),res,{signal:controller.signal});
  }catch{
   if(!res.headersSent&&!res.destroyed){res.writeHead(502);res.end('Radio stream unavailable');}else res.destroy();
  }finally{clearTimeout(timeout);active.delete(controller);res.off('close',closed);}
 }
 return {issue,handle,revoke};
}
module.exports={createRadioRelay};
