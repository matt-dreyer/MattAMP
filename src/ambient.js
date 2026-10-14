/* Low-contrast local canvas: no network, input handling, or media coupling. */
class MattAmbient {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.mode='off';this.paused=false;this.timer=0;this.frame=0;this.time=0;this.last=0;this.width=0;this.height=0;this.particles=[];this.stars=[];this.fractal=null;this.fractalFailed=false;this.fractalStill=null;
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
  this.particles=Array.from({length:Math.min(220,Math.max(80,Math.round(w*h/2800)))},(_,i)=>({x:((i*.61803398875)%1)*w,y:((i*.41421356237)%1)*h,trail:[],mint:i%4===0}));
  this.stars=Array.from({length:Math.min(300,Math.max(110,Math.round(w*h/1900)))},(_,i)=>({
   x:((i*.61803398875+.17)%1)*w,y:((i*.41421356237+.31)%1)*h,
   depth:.2+((i*.754877666)%1)*.8,phase:i*2.39996323
  }));
  this.draw(0);
 }
 configure(mode,paused=false){
  const next=['flow','waves','stars','mandelbrot'].includes(mode)?mode:'off';
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
 fps(){return this.mode==='mandelbrot'?18:24;}
 schedule(){this.timer=setTimeout(()=>{this.timer=0;this.frame=requestAnimationFrame(now=>{this.frame=0;const dt=this.last?Math.min((now-this.last)/1000,.08):1/this.fps();this.last=now;this.time+=dt;this.draw(dt);this.schedule();});},1000/this.fps());}
 draw(dt){
  const c=this.ctx,w=this.width,h=this.height;if(!c||!w||!h)return;c.clearRect(0,0,w,h);
  if(this.mode==='off'||this.paused||this.motion.matches||document.hidden)return;
  if(this.mode==='mandelbrot'){this.drawFractal();}
  else if(this.mode==='waves'){
   const rows=Math.max(18,Math.min(32,Math.round(h/25)));
   for(let row=0;row<rows;row++){
    c.beginPath();for(let x=-20;x<=w+20;x+=12){const y=h*(row+.5)/rows+Math.sin(x/w*5+this.time*.22+row*.45)*17+Math.sin(x/w*9-this.time*.12+row*.7)*8;x===-20?c.moveTo(x,y):c.lineTo(x,y);}
    c.strokeStyle=row%3===0?'rgba(130,181,164,.18)':'rgba(120,171,198,.22)';c.lineWidth=row%3===0?1.2:.8;c.stroke();
   }
  }else if(this.mode==='stars'){
   // Three-dimensional feel through size and drift, without bright warp trails.
   for(const star of this.stars){
    const speed=.7+star.depth*2.2;
    star.x=(star.x+dt*speed)%w;star.y=(star.y+dt*speed*.15)%h;
    const shimmer=.88+Math.sin(this.time*.35+star.phase)*.12;
    c.fillStyle=`rgba(151,184,207,${(.13+star.depth*.22)*shimmer})`;
    c.beginPath();c.arc(star.x,star.y,.45+star.depth*.7,0,Math.PI*2);c.fill();
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
 initFractal(){
  if(this.fractal||this.fractalFailed)return;
  const surface=document.createElement('canvas');
  const gl=surface.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false,premultipliedAlpha:false});
  if(!gl){this.fractalFailed=true;return;}
  const shaders=[];let program,buffer;
  try{
   const compile=(type,source)=>{const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Shader unavailable');return shader;};
   program=gl.createProgram();
   gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 point; varying vec2 uv; void main(){uv=point*.5+.5;gl_Position=vec4(point,0.,1.);}'));
   gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`
    precision highp float;
    varying vec2 uv; uniform vec2 aspect; uniform float span;
    void main(){
     vec2 target=vec2(-.743643887,.131825904);
     vec2 center=mix(target,vec2(-.5,0.),span/3.2);
     vec2 c=center+(uv-.5)*aspect*span;
     vec2 z=vec2(0.); float n=0.; bool escaped=false;
     for(int i=0;i<360;i++){
      z=vec2(z.x*z.x-z.y*z.y,2.*z.x*z.y)+c;
      if(dot(z,z)>256.){n=float(i)+1.-log2(log2(dot(z,z))*.5);escaped=true;break;}
     }
     if(!escaped){gl_FragColor=vec4(.035,.065,.085,.45);return;}
     float band=.5+.5*cos(n*.32);
     vec3 ink=mix(vec3(.10,.22,.30),vec3(.25,.39,.35),band);
     gl_FragColor=vec4(ink,.48);
    }`));
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader unavailable');
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   gl.useProgram(program);const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);
   this.fractal={surface,gl,program,span:gl.getUniformLocation(program,'span'),aspect:gl.getUniformLocation(program,'aspect')};
   surface.addEventListener('webglcontextlost',event=>{event.preventDefault();this.fractal=null;this.fractalFailed=true;});
   surface.addEventListener('webglcontextrestored',()=>{this.fractalFailed=false;});
  }catch{if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);this.fractalFailed=true;}
  finally{for(const shader of shaders)gl.deleteShader(shader);}
 }
 drawFractal(){
  this.initFractal();const f=this.fractal;
  if(!f){
   // One quiet still if GPU rendering is unavailable; never spin a CPU fractal loop.
   if(!this.fractalStill){
    const surface=document.createElement('canvas');surface.width=160;surface.height=160;
    const c=surface.getContext('2d'),image=c.createImageData(160,160);
    for(let y=0;y<160;y++)for(let x=0;x<160;x++){
     const cr=(x/160-.5)*3.2-.5,ci=(y/160-.5)*3.2;let a=0,b=0,n=0;
     while(a*a+b*b<256&&n<100){const next=a*a-b*b+cr;b=2*a*b+ci;a=next;n++;}
     const band=n===100?0:(.5+.5*Math.cos(n*.32)),i=(y*160+x)*4;
     image.data.set([25+band*39,56+band*43,76+band*13,90],i);
    }
    c.putImageData(image,0,0);this.fractalStill=surface;
   }
   const size=Math.max(this.width,this.height);this.ctx.drawImage(this.fractalStill,(this.width-size)/2,(this.height-size)/2,size,size);return;
  }
  const scale=Math.min(1,640/Math.max(this.width,this.height));
  const w=Math.max(1,Math.round(this.width*scale)),h=Math.max(1,Math.round(this.height*scale));
  if(f.surface.width!==w||f.surface.height!==h){f.surface.width=w;f.surface.height=h;}
  const gl=f.gl;gl.viewport(0,0,w,h);gl.useProgram(f.program);
  // A three-minute in/out cycle, with soft turns and a bounded precision range.
  const depth=(1-Math.cos(this.time*Math.PI/90))*.5;
  gl.uniform1f(f.span,3.2*Math.exp(-9.5*depth));gl.uniform2f(f.aspect,w/Math.min(w,h),h/Math.min(w,h));
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);this.ctx.drawImage(f.surface,0,0,this.width,this.height);
 }

}
window.MattAmbient=MattAmbient;
