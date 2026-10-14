/* Low-contrast local canvas: no network, input handling, or media coupling. */
class MattAmbient {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mode='off';this.paused=false;this.timer=0;this.frame=0;this.time=0;this.last=0;this.width=0;this.height=0;this.particles=[];
  this.motion=matchMedia('(prefers-reduced-motion: reduce)');
  this.motion.addEventListener('change',()=>this.sync());
  document.addEventListener('visibilitychange',()=>this.sync());
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
 }
 resize(){
  const w=this.canvas.parentElement.clientWidth,h=this.canvas.parentElement.clientHeight;
  if(w===this.width&&h===this.height)return;
  this.width=w;this.height=h;const scale=Math.min(devicePixelRatio||1,1.5);
  this.canvas.width=Math.round(w*scale);this.canvas.height=Math.round(h*scale);this.ctx?.setTransform(scale,0,0,scale,0,0);
  this.particles=Array.from({length:Math.min(90,Math.max(36,Math.round(w*h/6500)))},(_,i)=>({x:((i*.61803398875)%1)*w,y:((i*.41421356237)%1)*h,trail:[],mint:i%4===0}));
  this.draw(0);
 }
 configure(mode,paused=false){
  const next=['flow','waves'].includes(mode)?mode:'off';
  if(next===this.mode&&paused===this.paused)return;
  this.mode=next;this.paused=paused;this.sync();
 }
 sync(){
  clearTimeout(this.timer);cancelAnimationFrame(this.frame);this.timer=0;this.frame=0;this.last=0;
  const active=this.ctx&&this.mode!=='off'&&!this.paused&&!document.hidden&&!this.motion.matches;
  this.canvas.hidden=!active;
  if(!active){this.ctx?.clearRect(0,0,this.width,this.height);return;}
  this.resize();this.draw(0);this.schedule();
 }
 schedule(){this.timer=setTimeout(()=>{this.timer=0;this.frame=requestAnimationFrame(now=>{this.frame=0;const dt=this.last?Math.min((now-this.last)/1000,.08):1/24;this.last=now;this.time+=dt;this.draw(dt);this.schedule();});},1000/24);}
 draw(dt){
  const c=this.ctx,w=this.width,h=this.height;if(!c||!w||!h)return;c.clearRect(0,0,w,h);
  if(this.mode==='off'||this.paused||this.motion.matches||document.hidden)return;
  if(this.mode==='waves'){
   for(let row=0;row<10;row++){
    c.beginPath();for(let x=-20;x<=w+20;x+=12){const y=h*(row+.5)/10+Math.sin(x/w*5+this.time*.22+row*.45)*17+Math.sin(x/w*9-this.time*.12+row*.7)*8;x===-20?c.moveTo(x,y):c.lineTo(x,y);}
    c.strokeStyle=row%3===0?'rgba(130,181,164,.18)':'rgba(120,171,198,.22)';c.lineWidth=row%3===0?1.2:.8;c.stroke();
   }
  }else{
   for(const p of this.particles){
    const angle=Math.sin(p.y/h*5+this.time*.08)*.65+Math.cos(p.x/w*4-this.time*.06)*.35;
    p.x+=Math.cos(angle)*dt*15;p.y+=Math.sin(angle)*dt*15;
    if(p.x>w+12||p.y>h+12||p.y< -12){p.x=-10;p.y=((p.y%h)+h)%h;p.trail=[];}
    if(dt)p.trail.push({x:p.x,y:p.y});if(p.trail.length>22)p.trail.shift();
    c.strokeStyle=p.mint?'rgba(145,190,171,.25)':'rgba(123,177,204,.28)';c.lineWidth=1;c.beginPath();p.trail.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();
    c.fillStyle=p.mint?'rgba(160,202,180,.36)':'rgba(139,187,207,.38)';c.beginPath();c.arc(p.x,p.y,p.mint?1.2:.9,0,Math.PI*2);c.fill();
   }
  }
 }
}
window.MattAmbient=MattAmbient;
