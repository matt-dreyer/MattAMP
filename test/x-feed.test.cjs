const test=require('node:test'),assert=require('node:assert/strict');
const {accounts,searchUrl,isXUrl,safeExternal}=require('../src/x-feed.cjs');
test('X accounts normalize handles and reject query injection',()=>{
 assert.deepEqual(accounts('@BCHERNY, steipete bcherny'),['bcherny','steipete']);
 for(const input of ['', 'bcherny OR from:spam','https://x.com/test',Array(13).fill('a')])assert.throws(()=>accounts(input));
});
test('AI search is author constrained, chronological and excludes replies/reposts',()=>{
 const u=new URL(searchUrl());assert.equal(u.origin,'https://x.com');assert.equal(u.searchParams.get('f'),'live');
 const q=u.searchParams.get('q');for(const h of ['bcherny','steipete','karpathy','simonw','chamath'])assert.ok(q.includes('from:'+h));
 assert.ok(q.includes('"artificial intelligence"'));assert.ok(q.endsWith('-filter:replies -filter:retweets'));assert.ok(!q.includes('elonmusk'));
 assert.ok(!new URL(searchUrl({accounts:['chamath'],aiOnly:false})).searchParams.get('q').includes(' OR '));
});
test('Elon lane stays separate from the AI circle',()=>{
 const q=new URL(searchUrl({},'giggles')).searchParams.get('q');assert.equal(q,'(from:elonmusk) -filter:replies -filter:retweets');
});
test('remote navigation only permits HTTPS X hosts without credentials',()=>{
 for(const url of ['https://x.com/i/flow/login','https://twitter.com/search?q=AI'])assert.equal(isXUrl(url),true);
 for(const url of ['file:///etc/passwd','javascript:alert(1)','http://x.com','https://x.com.evil.org','https://evil@x.com','https://x.com:9999'])assert.equal(isXUrl(url),false);
 assert.equal(safeExternal('https://example.com/article'),true);assert.equal(safeExternal('file:///etc/passwd'),false);
});
test('sign-in provider detection matches only trusted HTTPS provider hosts',()=>{
 const {isSignInProvider}=require('../src/x-feed.cjs');
 for(const url of ['https://accounts.google.com/o/oauth2/auth?state=private','https://accounts.google.com/gsi/select','https://appleid.apple.com/auth/authorize'])assert.equal(isSignInProvider(url),true);
 for(const url of ['https://accounts.google.com.evil.org','http://accounts.google.com','https://user@accounts.google.com','https://accounts.google.com:9999','https://example.com','javascript:alert(1)'])assert.equal(isSignInProvider(url),false);
});
function mockFeed(){
 const {EventEmitter}=require('node:events'),vm=require('node:vm'),fs=require('node:fs');
 const opened=[],messages=[],views=[];
 class View{
  constructor(options){this.options=options;this.webContents=new EventEmitter();Object.assign(this.webContents,{setAudioMuted(){},setWindowOpenHandler(fn){this.popup=fn;},getURL:()=> 'https://x.com/i/flow/login',loadURL:async()=>{},isDestroyed:()=>false,close(){}});views.push(this);}
  setBackgroundColor(){}setVisible(){}setBounds(){}
 }
 const ses={setPermissionRequestHandler(){},setPermissionCheckHandler(){},on(){}};
 const shell={openExternal:async url=>{opened.push(url);}};
 const mod={exports:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/x-feed.cjs'),'utf8'),{module:mod,URL,URLSearchParams,require:name=>{assert.equal(name,'electron');return {WebContentsView:View,session:{fromPartition:()=>ses},shell};}});
 const win=new EventEmitter();win.contentView={addChildView(){},removeChildView(){}};win.getContentSize=()=>[710,800];
 const feed=mod.exports.createXFeed({win,send:(_channel,message)=>messages.push(message),getConfig:()=>({accounts:['chamath'],aiOnly:false})});
 feed.bounds({visible:true,x:0,y:0,width:400,height:500});
 return {feed,wc:views[0].webContents,opened,messages,shell};
}
test('provider popups, navigations and redirects restart from X instead of forwarding OAuth state',async()=>{
 for(const trigger of ['popup','will-navigate','will-redirect']){
  const {feed,wc,opened,messages}=mockFeed();
  await feed.action('feed','giggles');
  const url='https://accounts.google.com/o/oauth2/auth?state=private-state&redirect_uri=https://x.com/callback';
  if(trigger==='popup')assert.equal(wc.popup({url}).action,'deny');
  else{let prevented=false;wc.emit(trigger,{preventDefault(){prevented=true;}},url);assert.equal(prevented,true);}
  assert.equal(opened.length,1);assert.equal(opened[0],searchUrl({},'giggles'));
  assert.ok(!opened[0].includes('private-state'));
  wc.emit('did-stop-loading');assert.match(messages.at(-1),/does not sign in this pane/);
  await feed.action('login');wc.emit('did-stop-loading');assert.match(messages.at(-1),/Sign in to X/);
 }
});
test('ordinary external links still open and failed browser launches are reported',async()=>{
 const {wc,opened,messages,shell}=mockFeed();
 wc.popup({url:'https://example.com/article'});assert.deepEqual(opened,['https://example.com/article']);
 wc.popup({url:'file:///etc/passwd'});assert.equal(opened.length,1);
 shell.openExternal=async()=>{throw new Error('launch failed');};
 wc.popup({url:'https://accounts.google.com/gsi/select'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(messages.at(-1),/browser could not open/);
});
