const {_electron}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
(async()=>{
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'mattamp-locked-keyring-'));
 const hook=path.join(profile,'locked.cjs');
 fs.writeFileSync(hook,"const storage=require('electron').safeStorage;storage.isAsyncEncryptionAvailable=()=>new Promise(resolve=>{global.releaseTestKeyring=resolve;});storage.decryptStringAsync=async()=>({result:'test-key',shouldReEncrypt:false});");
 fs.writeFileSync(path.join(profile,'state.json'),JSON.stringify({volume:0,ambient:'off',diKeyCipher:'dGVzdA=='}));
 const launcher=path.join(profile,'electron-sandboxed');
 fs.writeFileSync(launcher,'#!/bin/bash\nargs=()\nfor arg in "$@"; do [[ "$arg" == "--no-sandbox" ]] || args+=("$arg"); done\nexec "$MATTAMP_TEST_ELECTRON" "${args[@]}"\n',{mode:0o700});
 let app;
 try{
  app=await _electron.launch({executablePath:launcher,args:['-r',hook,path.resolve(__dirname,'..')],env:{...process.env,MATTAMP_TEST_ELECTRON:require('electron'),DECK_TEST_DIR:profile}});
  const p=await app.firstWindow();
  await p.locator('#settings-open').click();
  await p.locator('#retry-key').waitFor({state:'visible'});
  assert.match(await p.locator('#key-status').innerText(),/keyring/);
  const boot=await p.evaluate(()=>window.deck.init());
  assert.equal(boot.data.state.keyringPending,true);
  assert.equal(boot.data.state.hasDiKey,false);
  assert.equal(boot.data.state.hasSavedDiKey,true);
  assert.equal(boot.data.state.diKeyCipher,undefined);
  await p.locator('#clear-key').click();
  await p.locator('#retry-key').waitFor({state:'hidden'});
  assert.equal(JSON.parse(fs.readFileSync(path.join(profile,'state.json'))).diKeyCipher,undefined);
  await app.evaluate(()=>global.releaseTestKeyring(true));
  await p.waitForFunction(async()=>!(await window.deck.init()).data.state.keyringPending);
  assert.equal((await p.evaluate(()=>window.deck.init())).data.state.hasDiKey,false);
  console.log('PASS: unresponsive keyring does not block startup, Settings, or forgetting a saved key; ciphertext stays private.');
 }finally{if(app)await app.close();fs.rmSync(profile,{recursive:true,force:true,maxRetries:3});}
})().catch(e=>{console.error(e);process.exitCode=1;});
