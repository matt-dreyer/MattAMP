/* A deliberately excessive, bounded awards ceremony. No game or media ownership. */
class MattVictory {
 constructor(host,onDismiss){
  this.host=host;this.onDismiss=onDismiss;this.active=false;this.generation=0;this.raf=0;this.audio=null;
  host.innerHTML='<canvas aria-hidden="true"></canvas><div class="victory-copy"><h2>Glorious<br>overkill.</h2><p class="victory-score" role="status"></p><p class="victory-caption">Tiny tank. Massive fucking legend.</p></div><button type="button" class="victory-dismiss">Back to scores <span>Esc</span></button>';
  this.canvas=host.querySelector('canvas');this.button=host.querySelector('button');this.button.onclick=()=>this.stop(true);
  this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.motion.addEventListener('change',()=>{if(this.active&&this.motion.matches){cancelAnimationFrame(this.raf);this.raf=0;}});
  document.addEventListener('keydown',e=>{if(this.active&&e.key==='Escape'){e.preventDefault();this.stop(true);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
 }
 async start(record,sound){
  this.stop();this.active=true;const generation=++this.generation;this.host.hidden=false;
  this.host.querySelector('.victory-score').textContent=record.initials+' · '+record.score.toLocaleString()+' POINTS';
  this.inertSiblings=[...this.host.parentElement.children].filter(el=>el!==this.host).map(el=>[el,el.inert]);this.inertSiblings.forEach(([el])=>{el.inert=true;});
  this.host.dataset.renderer='loading';this.button.focus({preventScroll:true});
  this.timer=setTimeout(()=>this.stop(true),9000);
  if(sound)this.fanfare();
  try{
   const T=await import('/three.module.js');if(!this.active||generation!==this.generation)return;
   this.build(T);
   const started=performance.now();
   const frame=now=>{if(!this.active)return;const t=this.motion.matches?2:(now-started)/1000;
    this.tank.rotation.y=-.5+t*.36;this.tank.position.y=.15+Math.sin(t*1.5)*.1;
    this.camera.position.set(Math.sin(t*.25)*1.2,3.4,8.4-Math.min(t,4)*.18);this.camera.lookAt(0,.6,0);
    this.lights.forEach((light,i)=>{light.position.x=Math.cos(t*.6+i*2)*5;light.position.z=Math.sin(t*.6+i*2)*5;});
    this.rings.forEach((ring,i)=>{ring.rotation.z=t*(i%2?-.2:.2);});
    this.beams.forEach((beam,i)=>{beam.rotation.z=Math.sin(t*.8+i*2)*.26;});
    this.confetti.material.uniforms.time.value=t;
    this.renderer.render(this.scene,this.camera);this.frames=(this.frames||0)+1;
    if(!this.motion.matches)this.raf=requestAnimationFrame(frame);
   };
   this.resize=new ResizeObserver(()=>{if(!this.renderer)return;const w=this.host.clientWidth,h=this.host.clientHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.motion.matches)this.renderer.render(this.scene,this.camera);});this.resize.observe(this.host);
   this.host.dataset.renderer='webgl';frame(started);
  }catch(e){this.disposeGPU();this.host.dataset.renderer='fallback';/* The score and dismissal remain usable without WebGL. */}
 }
 build(T){
  const fresh=this.canvas.cloneNode(false);this.canvas.replaceWith(fresh);this.canvas=fresh;this.frames=0;
  this.renderer=new T.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(this.host.clientWidth,this.host.clientHeight,false);
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.scene=new T.Scene();this.scene.background=new T.Color('#080e18');this.scene.fog=new T.FogExp2('#080e18',.035);
  this.camera=new T.PerspectiveCamera(42,this.host.clientWidth/this.host.clientHeight,.1,60);
  this.scene.add(new T.HemisphereLight(0xd0e9ff,0x302012,2));
  this.lights=[];
  for(const [color,intensity,x,y,z] of [[0xffd697,7,4,5,4],[0x8baeff,6,-4,2,-1],[0xffffff,4,0,4,-4]]){const l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);this.scene.add(l);this.lights.push(l);}
  const gold=new T.MeshStandardMaterial({color:0xd4a64a,metalness:.72,roughness:.23});
  const darkGold=new T.MeshStandardMaterial({color:0x866027,metalness:.62,roughness:.35});
  const black=new T.MeshStandardMaterial({color:0x152333,metalness:.8,roughness:.26});
  const mesh=(geometry,material,parent,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;};
  const box=(w,h,d,mat,parent,x,y,z)=>mesh(new T.BoxGeometry(w,h,d,3,3,3),mat,parent,x,y,z);
  this.tank=new T.Group();this.scene.add(this.tank);
  box(2.05,.48,1.3,gold,this.tank,0,.43,0);
  const turret=mesh(new T.CylinderGeometry(.51,.66,.48,32),gold,this.tank,0,.87,0);turret.rotation.y=.2;
  mesh(new T.CylinderGeometry(.3,.3,.08,32),darkGold,this.tank,0,1.15,0);
  const barrel=mesh(new T.CylinderGeometry(.095,.12,1.65,24),gold,this.tank,1,.94,0);barrel.rotation.z=-Math.PI/2+.1;
  const muzzle=mesh(new T.CylinderGeometry(.15,.15,.2,24),darkGold,this.tank,1.82,1.02,0);muzzle.rotation.z=Math.PI/2;
  for(const z of [-.7,.7]){
   box(2.25,.42,.32,darkGold,this.tank,0,.2,z);
   for(let i=0;i<6;i++){const w=mesh(new T.CylinderGeometry(.2,.2,.36,24),gold,this.tank,-.91+i*.36,.22,z);w.rotation.x=Math.PI/2;}
   for(let i=0;i<16;i++)box(.075,.06,.36,gold,this.tank,-1.08+i*.144,.45,z);
  }
  mesh(new T.CylinderGeometry(1.65,1.85,.22,96),black,this.scene,0,-.32,0);
  mesh(new T.CylinderGeometry(1.84,1.9,.07,96),gold,this.scene,0,-.47,0);
  mesh(new T.CylinderGeometry(2.05,2.2,.12,96),black,this.scene,0,-.57,0);
  this.rings=[];
  for(let i=0;i<3;i++){const ring=mesh(new T.TorusGeometry(2.3+i*.3,.012,8,160),new T.MeshBasicMaterial({color:i===1?0x577fb1:0xbe9655}),this.scene,0,.55,-1.6-i*.15);ring.rotation.x=.3+i*.27;ring.rotation.y=.2+i*.18;this.rings.push(ring);}
  this.beams=[];
  for(let i=0;i<4;i++){
   const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{tint:{value:new T.Color(i%2?0x668ac9:0xd0a150)}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform vec3 tint;void main(){float a=pow(sin(vUv.x*3.14159),3.)*pow(1.-vUv.y,1.6)*.14;gl_FragColor=vec4(tint,a);}'});
   const beam=mesh(new T.ConeGeometry(1.8,9,48,1,true),material,this.scene,(i-1.5)*2,3,-3);this.beams.push(beam);
  }
  // All confetti trajectories and tumbling run in the vertex shader in one instanced draw.
  const base=new T.PlaneGeometry(.045,.095),geo=new T.InstancedBufferGeometry();geo.index=base.index;geo.attributes=base.attributes;geo.instanceCount=2400;
  const seeds=new Float32Array(2400*4);for(let i=0;i<seeds.length;i++)seeds[i]=Math.random();geo.setAttribute('seed',new T.InstancedBufferAttribute(seeds,4));
  const mat=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:`attribute vec4 seed;uniform float time;varying vec3 tint;
   void main(){float t=time*(.65+seed.w*.8);float a=seed.z*6.283+t*3.;vec3 p=position;
   p.xy=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xy;p.z+=sin(a*1.7)*p.x*2.;
   p+=vec3((seed.x-.5)*12.+sin(t+seed.z*20.)*.65,7.-mod(seed.y*12.+t*1.5,12.),(seed.z-.5)*10.);
   tint=mix(vec3(.24,.45,.69),vec3(.95,.65,.23),step(.32,seed.w))*(.65+.35*abs(sin(a)));
   gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:'varying vec3 tint;void main(){gl_FragColor=vec4(tint,1.);}'});
  this.confetti=new T.Mesh(geo,mat);this.confetti.frustumCulled=false;this.scene.add(this.confetti);
  this.contextLost=e=>{e.preventDefault();cancelAnimationFrame(this.raf);this.raf=0;this.host.dataset.renderer='fallback';};this.canvas.addEventListener('webglcontextlost',this.contextLost);
 }
 fanfare(){
  try{const ctx=this.audio=new AudioContext();const out=ctx.createGain();out.gain.value=.11;out.connect(ctx.destination);
   // Original five-second brass-like chord climb with a sub-bass landing.
   const chords=[[130.81,164.81,196],[146.83,185,220],[164.81,196,246.94],[174.61,220,261.63],[196,246.94,293.66],[130.81,196,261.63,329.63]];
   chords.forEach((notes,i)=>notes.forEach((f,j)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type=j===0?'triangle':'sawtooth';osc.frequency.value=f*(j?2:1);filter.type='lowpass';filter.frequency.value=1300;const at=ctx.currentTime+i*.55,len=i===5?2:.48;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.13,at+.04);gain.gain.exponentialRampToValueAtTime(.001,at+len);osc.connect(filter);filter.connect(gain);gain.connect(out);osc.start(at);osc.stop(at+len+.01);}));
   void ctx.resume().catch(()=>{});this.audioTimer=setTimeout(()=>this.mute(),5500);
  }catch{this.mute();}
 }
 mute(){clearTimeout(this.audioTimer);if(this.audio){void this.audio.close().catch(()=>{});this.audio=null;}}
 disposeGPU(){
  this.resize?.disconnect();this.resize=null;
  if(this.contextLost){this.canvas.removeEventListener('webglcontextlost',this.contextLost);this.contextLost=null;}
  if(this.scene){const geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.scene=null;}
  this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer=null;this.tank=null;this.confetti=null;this.rings=[];this.beams=[];this.lights=[];this.camera=null;
 }
 stop(focus=false){const wasActive=this.active,restoreFocus=focus&&this.host.contains(document.activeElement);this.active=false;++this.generation;clearTimeout(this.timer);cancelAnimationFrame(this.raf);this.raf=0;this.mute();this.disposeGPU();this.host.hidden=true;this.inertSiblings?.forEach(([el,inert])=>{el.inert=inert;});this.inertSiblings=null;if(wasActive&&restoreFocus)this.onDismiss();}
}
