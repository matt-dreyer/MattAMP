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
