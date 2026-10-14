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
 const opened=[],messages=[],views=[],navigations=[],styles=[];let currentUrl='https://x.com/i/flow/login';
 class View{
  constructor(options){this.options=options;this.webContents=new EventEmitter();Object.assign(this.webContents,{setAudioMuted(){},setWindowOpenHandler(fn){this.popup=fn;},getURL:()=>currentUrl,loadURL:async url=>{navigations.push(url);currentUrl=url;},insertCSS:async css=>{styles.push(css);return 'style';},isDestroyed:()=>false,close(){}});views.push(this);}
  setBackgroundColor(){}setVisible(){}setBounds(){}
 }
 const ses={setPermissionRequestHandler(){},setPermissionCheckHandler(){},on(){}};
 const shell={openExternal:async url=>{opened.push(url);}};
 const mod={exports:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/x-feed.cjs'),'utf8'),{module:mod,URL,URLSearchParams,require:name=>{assert.equal(name,'electron');return {WebContentsView:View,session:{fromPartition:()=>ses},shell};}});
 const win=new EventEmitter();win.contentView={addChildView(){},removeChildView(){}};win.getContentSize=()=>[710,800];
 const feed=mod.exports.createXFeed({win,send:(_channel,message)=>messages.push(message),getConfig:()=>({accounts:['chamath'],aiOnly:false})});
 feed.bounds({visible:true,x:0,y:0,width:400,height:500});
 return {feed,wc:views[0].webContents,opened,messages,shell,navigations,styles,setUrl:url=>{currentUrl=url;}};
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

test('one provider handoff per login attempt even across duplicate popup and navigation events',async()=>{
 const {feed,wc,opened}=mockFeed();
 const google='https://accounts.google.com/gsi/select?state=first';
 wc.popup({url:google});
 wc.popup({url:'https://accounts.google.com/v3/signin/accountchooser?state=second'});
 wc.emit('will-navigate',{preventDefault(){}},google);
 wc.emit('will-redirect',{preventDefault(){}},google);
 await new Promise(resolve=>setImmediate(resolve));
 wc.popup({url:google});
 assert.equal(opened.length,1);
 // Explicit retries and the Browser button remain available.
 await feed.action('browser');assert.equal(opened.length,2);
 await feed.action('login');wc.popup({url:google});assert.equal(opened.length,3);
});
test('failed provider launch can be retried without restarting the feed',async()=>{
 const {wc,shell}=mockFeed();let calls=0;
 shell.openExternal=async()=>{calls++;if(calls===1)throw new Error('failed');};
 const url='https://accounts.google.com/gsi/select';
 wc.popup({url});await new Promise(resolve=>setImmediate(resolve));
 wc.popup({url});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(calls,2);
 wc.popup({url});assert.equal(calls,2);
});

test('direct sign-in restores selected filter for full and same-document navigation',async()=>{
 for(const event of ['did-navigate','did-navigate-in-page']){
  const {feed,wc,navigations,messages,setUrl}=mockFeed();
  await feed.action('login','giggles');
  wc.popup({url:'https://accounts.google.com/gsi/select'});
  setUrl('https://x.com/home');wc.emit(event,{},'https://x.com/home',true);
  assert.equal(navigations.at(-1),searchUrl({},'giggles'));
  wc.emit('did-stop-loading');assert.ok(!messages.at(-1).includes('does not sign in this pane'));
  const count=navigations.length;
  wc.emit(event,{},searchUrl({},'giggles'),true);assert.equal(navigations.length,count);
 }
});
test('automatic login redirects are tracked without navigating away from auth or subframes',()=>{
 const {wc,navigations,setUrl}=mockFeed();const count=navigations.length;
 wc.emit('did-navigate',{},'https://x.com/i/flow/login');
 wc.emit('did-navigate-in-page',{},'https://x.com/home',false);assert.equal(navigations.length,count);
 wc.emit('did-navigate',{},'https://x.com/i/flow/two-factor');assert.equal(navigations.length,count);
 setUrl('https://x.com/home');wc.emit('did-navigate',{},'https://x.com/home');assert.equal(navigations.length,count+1);
});
test('timeline stylesheet is injected on X documents only',()=>{
 const {wc,styles,setUrl}=mockFeed();
 wc.emit('dom-ready');assert.equal(styles.length,1);
 setUrl('https://example.com/');wc.emit('dom-ready');assert.equal(styles.length,1);
});
