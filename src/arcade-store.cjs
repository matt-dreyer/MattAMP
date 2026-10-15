const fs=require('node:fs');
const path=require('node:path');
const {validateConditions}=require('./artillery.js');
const empty=()=>({version:1,initials:'MAT',played:0,wins:0,scores:[],recent:[],rivalry:[]});
function validateMemory(memory){
 if(memory===undefined)return {winner:null,damage:Array.from({length:6},()=>Array(6).fill(0))};
 if(!memory||!(memory.winner===null||(Number.isInteger(memory.winner)&&memory.winner>=0&&memory.winner<=5))||!Array.isArray(memory.damage)||memory.damage.length!==6)throw new Error('Invalid rivalry memory');
 const damage=memory.damage.map((row,attacker)=>{
  if(!Array.isArray(row)||row.length!==6||row.some((n,victim)=>!Number.isInteger(n)||n<0||n>100||(attacker===victim&&n!==0)))throw new Error('Invalid rivalry damage');
  return [...row];
 });
 for(let victim=0;victim<6;victim++)if(damage.reduce((sum,row)=>sum+row[victim],0)>100)throw new Error('Invalid rivalry total');
 return {winner:memory.winner,damage};
}
function validate(row){
 if(!row||!/^[a-zA-Z0-9-]{16,64}$/.test(row.id)||!/^[A-Z0-9]{1,3}$/.test(row.initials)||![3,4,5].includes(row.bots)||![0,1,2,3].includes(row.skill)||!['win','loss','draw'].includes(row.result)||row.win!==(row.result==='win'))throw new Error('Invalid battle record');
 for(const [key,max] of Object.entries({score:50000,kills:5,shots:10000}))if(!Number.isInteger(row[key])||row[key]<0||row[key]>max)throw new Error('Invalid battle score');
 return {...Object.fromEntries(['id','initials','score','win','result','bots','skill','kills','shots'].map(key=>[key,row[key]])),conditions:validateConditions(row.conditions)};
}
function createArcadeStore(file){
 function read(){try{const value=JSON.parse(fs.readFileSync(file,'utf8'));if(value.version!==1||!Array.isArray(value.scores)||!Array.isArray(value.recent)||!Number.isInteger(value.played)||!Number.isInteger(value.wins)||(value.rivalry!==undefined&&!Array.isArray(value.rivalry)))throw new Error();return {...value,rivalry:(Array.isArray(value.rivalry)?value.rivalry:[]).slice(-3).map(validateMemory),scores:value.scores.slice(0,10).map(row=>({...validate(row),date:row.date}))};}catch(err){if(err.code==='ENOENT')return empty();throw new Error('Arcade scores could not be read. Your existing file has been kept.');}}
 function record(input){
  const row=validate(input),data=read();if(data.recent.includes(row.id))return data;
  const memory=validateMemory(input.memory);if(input.memory&&(memory.winner>row.bots||(row.result==='win'&&memory.winner!==0)||(row.result==='loss'&&memory.winner===0)||(row.result==='draw'&&memory.winner!==null)))throw new Error('Invalid rivalry winner');data.rivalry=[...data.rivalry,memory].slice(-3);
  row.date=new Date().toISOString();data.initials=row.initials;data.played++;if(row.win)data.wins++;
  data.recent=[...data.recent,row.id].slice(-100);data.scores=[...data.scores,row].sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date)).slice(0,10);
  fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2),{mode:0o600});fs.renameSync(file+'.tmp',file);return data;
 }
 return {read,record};
}
module.exports={createArcadeStore,validate};
