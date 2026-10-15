const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.resolve(process.argv[2]||'dist');
const files=fs.readdirSync(dir).filter(n=>/^MattAMP-.*\.(?:AppImage|deb|exe|zip|dmg|tar\.gz)$/.test(n)).sort();
if(!files.length)throw new Error('No release packages found in '+dir);
(async()=>{const lines=[];for(const file of files){const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(path.join(dir,file)))hash.update(chunk);lines.push(hash.digest('hex')+'  '+file);}fs.writeFileSync(path.join(dir,'SHA256SUMS.txt'),lines.join('\n')+'\n');console.log('Checksummed '+files.length+' packages.');})().catch(e=>{console.error(e);process.exitCode=1;});
