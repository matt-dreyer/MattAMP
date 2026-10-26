/* One simulated day per real minute, with gentle 2% ramps at each turn. */
class MattSkyClock {
 constructor(){this.mode='live';this.elapsed=0;this.last=0;}
 configure(mode){mode=mode==='tour'?'tour':'live';if(mode!==this.mode){this.mode=mode;this.elapsed=0;this.last=0;}}
 step(now){if(this.last&&this.mode==='tour'&&!this.paused)this.elapsed+=Math.max(0,Math.min(.08,(now-this.last)/1000));this.last=now;}
 offset(){return this.mode==='tour'?MattSkyClock.offsetAt(this.elapsed):0;}
 static offsetAt(elapsed){const phase=((elapsed/840)%2+2)%2,t=phase<=1?phase:2-phase,r=.02,p=t<r?t*t/(2*r*(1-r)):t>1-r?1-(1-t)**2/(2*r*(1-r)):(t-r/2)/(1-r);return (p*14-7)*86400000;}
 static rotate(point,latitude,seconds){
  const D=Math.PI/180,a=-seconds*2*Math.PI*1.00273790935/86400,c=Math.cos(a),s=Math.sin(a),ny=Math.cos(latitude*D),nz=Math.sin(latitude*D),x=Math.cos(point[1]*D)*Math.sin(point[0]*D),y=Math.cos(point[1]*D)*Math.cos(point[0]*D),z=Math.sin(point[1]*D),dot=ny*y+nz*z;
  const X=x*c+(ny*z-nz*y)*s,Y=y*c+nz*x*s+ny*dot*(1-c),Z=z*c-ny*x*s+nz*dot*(1-c);
  return [(Math.atan2(X,Y)/D+360)%360,Math.asin(Math.max(-1,Math.min(1,Z)))/D,...point.slice(2)];
 }
}
if(typeof window!=='undefined')window.MattSkyClock=MattSkyClock;
if(typeof module!=='undefined')module.exports=MattSkyClock;
