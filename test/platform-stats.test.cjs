const {test}=require('node:test'),assert=require('node:assert/strict');
const {portableStats,memoryStats,pingArgs}=require('../src/platform-stats.cjs');
test('memory availability and OS-specific ping timeouts',()=>{
 assert.deepEqual(memoryStats(1000,600),{total:1000,used:400,percent:40});assert.equal(memoryStats(0,0),null);
 assert.deepEqual(pingArgs('1.1.1.1','win32'),['-n','1','-w','2000','1.1.1.1']);assert.equal(pingArgs('1.1.1.1','darwin')[4],'2000');assert.equal(pingArgs('1.1.1.1','linux')[4],'2');
});
test('portable counters select default adapter without double counting VPNs',async()=>{
 const si={mem:async()=>({total:1000,available:600}),networkInterfaceDefault:async()=>'Wi-Fi',networkGatewayDefault:async()=>'192.168.1.1',networkStats:async()=>[{iface:'vpn',rx_bytes:999,tx_bytes:999},{iface:'Wi-Fi',rx_bytes:100,tx_bytes:40}]};
 assert.deepEqual(await portableStats(si),{memory:{total:1000,used:400,percent:40},route:{iface:'Wi-Fi',gateway:'192.168.1.1'},counters:{rx:100,tx:40}});
});
test('missing gateway or counters does not invent readings',async()=>{
 const r=await portableStats({mem:async()=>{throw Error();},networkInterfaceDefault:async()=>'en0',networkGatewayDefault:async()=>'',networkStats:async()=>[{iface:'en0',rx_bytes:-1,tx_bytes:-1}]});
 assert.equal(r.route.gateway,null);assert.equal(r.counters,null);assert.ok(r.memory.total>0);
});
