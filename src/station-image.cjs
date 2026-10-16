// Only known station artwork from the existing AudioAddict CDN can be relayed.
function createStationImages({stations,lookup,fetchImage=fetch}){
 const cache=new Map();
 return async function stationImage(id){
  if(!stations.some(s=>s.id===id))throw new Error('Unknown station');
  const previous=cache.get(id);if(previous&&Date.now()-previous.time<86400000)return previous;
  const art=await lookup(),url=new URL(art[id]);
  if(url.protocol!=='https:'||url.hostname!=='cdn-images.audioaddict.com'||url.port||url.username||url.password)throw new Error('Invalid artwork');
  const response=await fetchImage(url,{redirect:'error',signal:AbortSignal.timeout(8000)});
  const type=response.headers.get('content-type')?.split(';')[0];
  if(!response.ok||!['image/png','image/jpeg','image/webp'].includes(type))throw new Error('Artwork unavailable');
  let size=0;const chunks=[];
  for await(const chunk of response.body){size+=chunk.length;if(size>1024*1024)throw new Error('Artwork too large');chunks.push(chunk);}
  const item={buffer:Buffer.concat(chunks),type,time:Date.now()};cache.set(id,item);return item;
 };
}
module.exports={createStationImages};
