// Optional compatibility smoke test; see README for the pinned JSBASIC checkout.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const runtime=process.argv[2];
if(!runtime)throw new Error('Usage: node extras/apple-iie/check.cjs /path/to/jsbasic/basic.js');
const testMath=Object.create(Math);testMath.random=()=>.42;
const context=vm.createContext({console,Math:testMath});vm.runInContext(fs.readFileSync(runtime,'utf8'),context);
const basic=context.basic,source=fs.readFileSync(path.join(__dirname,'MATTAMP.bas'),'utf8');
let previous=-1;
for(const line of source.trim().split('\n')){
 assert.match(line,/^[0-9]+ /);assert.ok(line.length<239,'Apple input buffer: '+line);
 assert.ok(/^[\x20-\x7e]+$/.test(line),'ASCII only');
 const number=Number(line.split(' ')[0]);assert.ok(number>previous);previous=number;
}
function machine(){
 let screen='',transcript='',pending=null,keys=[],ended=false,plots=0,xc=0,yc=0;
 const pixels=new Uint8Array(40*48);let color=0;
 const point=(x,y)=>{assert.ok(x>=0&&x<40&&y>=0&&y<48,`plot ${x},${y}`);pixels[Math.floor(y)*40+Math.floor(x)]=color;plots++;};
 const tty={textWindow:{left:0,top:0,width:40,height:24},
  getScreenSize:()=>({width:40,height:24}),getCursorPosition:()=>({x:xc,y:yc}),
  setCursorPosition:(x,y)=>{if(x!==undefined)xc=x;if(y!==undefined)yc=y;},
  writeString:s=>{screen+=s;transcript+=s;},clearScreen:()=>{screen='';xc=0;yc=0;},setTextStyle:()=>{},
  readLine:cb=>cb('MAT'),readChar:cb=>{pending=cb;},
  getKeyboardRegister:()=>keys.length?128:0,clearKeyboardStrobe:()=>0};
 const lores={getScreenSize:()=>({width:40,height:48}),clear:()=>pixels.fill(0),setColor:n=>{assert.ok(n>=0&&n<=15);color=n;},plot:point,
  hlin:(a,b,y)=>{for(let x=a;x<=b;x++)point(x,y);},vlin:(a,b,x)=>{for(let y=a;y<=b;y++)point(x,y);}};
 const p=basic.compile(source);p.init({tty,lores,display:{setState:()=>{}}});
 return {
  feed(s){keys.push(...s);},get screen(){return screen;},get transcript(){return transcript;},get ended(){return ended;},get plots(){return plots;},
  run(limit=100000){for(let i=0;i<limit&&!ended;i++){
   if(pending){if(!keys.length)return 'input';const cb=pending;pending=null;cb(keys.shift());}
   const result=p.step();if(result===basic.STATE_STOPPED)ended=true;
  }return ended?'ended':'budget';}
 };
}
const menu=machine();menu.feed('3xQ');assert.equal(menu.run(),'ended');assert.match(menu.transcript,/NO SERIAL CARD OR ECHO DRIVER/);
const radio=machine();radio.feed('18++++++++++++------------Q');radio.run();assert.match(radio.transcript,/DEMO: PSYCHILL/);assert.match(radio.transcript,/VOL 10/);assert.match(radio.transcript,/VOL 0/);assert.ok(radio.plots>200);radio.feed('Q');assert.equal(radio.run(),'ended');
const controls=machine();controls.feed('2'+'A'.repeat(40)+'W'.repeat(60));controls.run();assert.match(controls.screen,/ANG 175\s+PWR 100/);controls.feed('D'.repeat(40)+'S'.repeat(60));controls.run();assert.match(controls.screen,/ANG 5\s+PWR 2/);controls.feed('Q2');controls.run();assert.match(controls.screen,/ANG 45\s+PWR 30/);
let rounds=0;
for(let i=0;i<500&&!rounds;i++){
 controls.feed(' ');controls.run(200000);
 if(controls.screen.includes('N NEW BATTLE'))rounds++;
}
assert.equal(rounds,1,'battle finishes even if the player loses');
assert.match(controls.transcript,/TAKES A SHOT/);assert.match(controls.transcript,/SCORE/);assert.ok(controls.plots>1000);
controls.feed('N');controls.run();assert.match(controls.screen,/HP 100/);controls.feed('QQ');assert.equal(controls.run(),'ended');
const spectator=machine();spectator.feed('2'+'A'.repeat(9)+'S'.repeat(30));spectator.run();for(let i=0;i<100&&!spectator.screen.includes('N NEW BATTLE');i++){spectator.feed(' ');spectator.run(1000000);}assert.match(spectator.transcript,/YOU ARE OUT/);assert.match(spectator.screen,/N NEW BATTLE/);
const dialogue=machine();dialogue.feed('1');dialogue.run(100000);assert.match(dialogue.transcript,/MOM, I'M ONLINE/);assert.match(dialogue.transcript,/HAVRE, MONTANA -> BOSTON/);assert.match(dialogue.transcript,/THE PHONE BILL IS NOT/);dialogue.feed('QQ');assert.equal(dialogue.run(),'ended');
console.log('PASS: Applesoft compile, input limits, menu/about/quit, station selection, volume bounds, aim/power bounds, full battle, bot turns, replay, graphics bounds.');
