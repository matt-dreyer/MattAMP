/* Display-inspired palette; not a composite-video or Echo hardware emulator. */
(function(scope){
 const palette=['#000000','#a82c58','#45368c','#b84ec4','#176744','#8a8a8a','#329ad1','#a6a0e2','#655323','#dd723b','#8a8a8a','#df94b0','#63c563','#d5cb77','#74c7ae','#e6e6da'];
 const rgb=palette.map(c=>[1,3,5].map(n=>parseInt(c.slice(n,n+2),16)));
 const matrix=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
 function quantize(data,width){
  for(let i=0;i<data.length;i+=4){const pixel=i/4,x=pixel%width,y=Math.floor(pixel/width),offset=(matrix[(y%4)*4+x%4]-7.5)*3;
   let best=0,distance=Infinity;
   for(let p=0;p<rgb.length;p++){const d=rgb[p].reduce((sum,c,k)=>sum+(data[i+k]+offset-c)**2,0);if(d<distance){distance=d;best=p;}}
   data[i]=rgb[best][0];data[i+1]=rgb[best][1];data[i+2]=rgb[best][2];
  }return data;
 }
 const jokes=["LET'S GET SERIAL.","MOM, I'M ONLINE!",'HAVRE, MONTANA → BOSTON.','A LONG-DISTANCE CALL TO A PIRATE BBS.','THAT’S NOT A PROBLEM… RIGHT?','THE SOFTWARE IS FREE. THE PHONE BILL IS NOT.','RADIOSHACK SOLD THE PARTS. MOM PAID THE PHONE BILL.','CHECK YOUR PIN CONNECTIONS.','300 BITS OF PURE ATTRACTION.'];
 class MattApple2{
  constructor(){this.cache=new Map();this.joke=0;}
  image(url){
   if(!this.cache.has(url)){const promise=new Promise(resolve=>{const img=new Image();img.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,64,64);const pixels=ctx.getImageData(0,0,64,64);quantize(pixels.data,64);ctx.putImageData(pixels,0,0);resolve(canvas.toDataURL());}catch{resolve(url);}};img.onerror=()=>resolve(url);img.src=url;});this.cache.set(url,promise);if(this.cache.size>16)this.cache.delete(this.cache.keys().next().value);}
   return this.cache.get(url);
  }
  next(){this.joke=(this.joke+1)%jokes.length;return jokes[this.joke];}
 }
 scope.MattApple2=MattApple2;
 if(typeof module!=='undefined')module.exports={palette,quantize,jokes};
})(typeof window==='undefined'?globalThis:window);
