// Cross-platform counters for Windows and macOS; Linux keeps its /proc sampler.
const os=require('node:os');
function memoryStats(total,available){
 if(!Number.isFinite(total)||total<=0||!Number.isFinite(available))return null;
 const used=Math.max(0,Math.min(total,total-available));return {total,used,percent:100*used/total};
}
function pingArgs(host,platform=process.platform){
 if(platform==='win32')return ['-n','1','-w','2000',host];
 return ['-n','-c','1','-W',platform==='darwin'?'2000':'2',host];
}
async function portableStats(si=require('systeminformation')){
 const [mem,iface,gateway]=await Promise.allSettled([si.mem(),si.networkInterfaceDefault(),si.networkGatewayDefault()]);
 const memory=mem.status==='fulfilled'?memoryStats(mem.value.total,mem.value.available):memoryStats(os.totalmem(),os.freemem());
 const name=iface.status==='fulfilled'?iface.value:'';
 const route=name?{iface:name,gateway:gateway.status==='fulfilled'?gateway.value||null:null}:null;
 let counters=null;
 if(name){try{const rows=await si.networkStats(name);const n=rows.find(r=>r.iface===name);if(n&&Number.isFinite(n.rx_bytes)&&n.rx_bytes>=0&&Number.isFinite(n.tx_bytes)&&n.tx_bytes>=0)counters={rx:n.rx_bytes,tx:n.tx_bytes};}catch{}}
 return {memory,route,counters};
}
module.exports={portableStats,memoryStats,pingArgs};
