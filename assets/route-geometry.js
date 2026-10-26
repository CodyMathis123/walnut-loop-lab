'use strict';
// Geometry and route-clearance helpers. No Three.js dependency.
// AABB clearance is intentionally conservative: not CAD, but the automatic
// router will never silently declare a known component intersection safe.
(function(){
 const add=(a,b)=>a.map((v,i)=>v+b[i]);
 const sub=(a,b)=>a.map((v,i)=>v-b[i]);
 const dist=(a,b)=>Math.hypot(...sub(a,b));
 const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
 const unit=v=>{const d=Math.hypot(...v);return d>1e-8?v.map(x=>x/d):[0,1,0]};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
 function normal(part,port){
  if(part.type==='res')return unit(part.orientation==='horizontal'
    ?[0,0,Math.sign(port.off[2])||1]:[0,Math.sign(port.off[1])||1,0]);
  if(part.type==='radiator')return [0,0,Math.sign(port.off[2])||1];
  if(part.type==='cpu')return [0,1,0];
  // The horizontal Reaper terminal presents both hose ports on its right
  // long edge (+X); do not route tubing vertically from this block.
  if(part.type==='gpu')return [Math.sign(port.off[0])||1,0,0];
  const ratios=port.off.map((x,i)=>Math.abs(x)/Math.max(1,part.size[i]/2));
  const i=ratios.indexOf(Math.max(...ratios));
  return [0,1,2].map(j=>j===i?(Math.sign(port.off[i])||1):0);
 }
 function fitting(part,port,tubeOD=16){
  const base=add(part.pos,port.off),face=normal(part,port);
  const choice=part.fittings?.[port.id]||{};
  const type=['straight','45','90'].includes(choice.type)?choice.type:'straight';
  const angle=Number.isFinite(+choice.rotation)?+choice.rotation:0;
  const reference=Math.abs(dot(face,[0,1,0]))>.85?[1,0,0]:[0,1,0];
  const axis1=unit(cross(face,reference)),axis2=unit(cross(face,axis1));
  const rad=angle*Math.PI/180;
  const side=add(axis1.map(x=>x*Math.cos(rad)),axis2.map(x=>x*Math.sin(rad)));
  const theta=type==='90'?Math.PI/2:type==='45'?Math.PI/4:0;
  const outward=unit(add(face.map(x=>x*Math.cos(theta)),side.map(x=>x*Math.sin(theta))));
  const step=type==='straight'?13:15;
  const reach=type==='straight'?13:type==='45'?31:34;
  const pts=[base,add(base,face.map(v=>v*step))];
  if(type!=='straight'){
   const n=6,r=reach-step;
   for(let i=1;i<=n;i++){
    const t=i/n;
    const mid=unit(add(face.map(x=>x*Math.cos(theta*t)),side.map(x=>x*Math.sin(theta*t))));
    const delta=add(face.map(v=>v*step),mid.map(v=>v*r*t));
    pts.push(add(base,delta));
   }
  }
  const tip=pts[pts.length-1];
  return {type,rotation:angle,base,tip,normal:face,outward,points:pts,
   radius:Math.max(6,tubeOD/2+2.5)};
 }
 function boxes(parts,skip=[],extra=12){
  const ignore=new Set(skip);
  return parts.filter(p=>p.visible!==false&&!ignore.has(p.id)&&
    ['mobo','tray','cpu','gpu','radiator','pump','res','drain'].includes(p.type))
    .map(p=>{
      const inflate=extra+(p.type==='mobo'||p.type==='tray'?9:0);
      return {id:p.id,min:p.pos.map((v,i)=>v-p.size[i]/2-inflate),
        max:p.pos.map((v,i)=>v+p.size[i]/2+inflate)};
    });
 }
 function segmentIntersects(a,b,box){
  let lo=0,hi=1;
  for(let i=0;i<3;i++){
   const d=b[i]-a[i];
   if(Math.abs(d)<1e-9){if(a[i]<=box.min[i]||a[i]>=box.max[i])return false;continue}
   let t1=(box.min[i]-a[i])/d,t2=(box.max[i]-a[i])/d;
   if(t1>t2)[t1,t2]=[t2,t1];
   lo=Math.max(lo,t1);hi=Math.min(hi,t2);
   if(lo>=hi)return false;
  }
  return hi>0&&lo<1;
 }
 function collisions(points,obstacles){
  const hits=new Set();
  for(let i=1;i<points.length;i++)
   for(const box of obstacles)if(segmentIntersects(points[i-1],points[i],box))hits.add(box.id);
  return [...hits];
 }
 function simplify(points,obstacles){
  if(points.length<3)return points;
  const reduced=[points[0]];let i=0;
  while(i<points.length-1){
   let far=i+1;
   for(let j=points.length-1;j>i+1;j--){
    if(!collisions([points[i],points[j]],obstacles).length){far=j;break}
   }
   reduced.push(points[far]);i=far;
  }
  return reduced;
 }
 // Bounded 3D lattice A*: axis neighbors preserve useful hard-tube runs.
 // Node count and obstacle checks are capped to avoid freezing the editor.
 function plan(a,b,obstacles,{step=28,margin=105,maxVisited=18000}={}){
  if(!collisions([a,b],obstacles).length)return {points:[a,b],blocked:[]};
  const lo=[0,1,2].map(i=>Math.min(a[i],b[i])-margin);
  const hi=[0,1,2].map(i=>Math.max(a[i],b[i])+margin);
  // Give the planner room to get around large parts near the direct line.
  for(const box of obstacles){
   let relevant=true;
   for(let i=0;i<3;i++)if(box.min[i]>hi[i]||box.max[i]<lo[i])relevant=false;
   if(!relevant)continue;
   for(let i=0;i<3;i++){
    lo[i]=Math.min(lo[i],box.min[i]-step*2);
    hi[i]=Math.max(hi[i],box.max[i]+step*2);
   }
  }
  const N=lo.map((v,i)=>Math.max(2,Math.ceil((hi[i]-v)/step)+1));
  const count=N.reduce((v,x)=>v*x,1);
  if(count>110000)return {points:null,blocked:collisions([a,b],obstacles),reason:'bounds'};
  const index=p=>p[0]+N[0]*(p[1]+N[1]*p[2]);
  const coord=n=>{const i=n%N[0],j=Math.floor(n/N[0])%N[1],k=Math.floor(n/(N[0]*N[1]));return [lo[0]+i*step,lo[1]+j*step,lo[2]+k*step]};
  const at=p=>p.map((v,i)=>clamp(Math.round((v-lo[i])/step),0,N[i]-1));
  const start=at(a),goal=at(b);
  const nearest=(p,position)=>{
   const options=[];
   for(let radius=0;radius<=3;radius++){
    for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++)for(let dz=-radius;dz<=radius;dz++){
     const q=[p[0]+dx,p[1]+dy,p[2]+dz];
     if(q.some((v,i)=>v<0||v>=N[i]))continue;
     const xyz=coord(index(q));
     if(collisions([position,xyz],obstacles).length)continue;
     options.push({q,d:dist(position,xyz)});
    }
    if(options.length)break;
   }
   return options.sort((x,y)=>x.d-y.d)[0]?.q||null;
  };
  const startQ=nearest(start,a),endQ=nearest(goal,b);
  if(!startQ||!endQ)return {points:null,blocked:collisions([a,b],obstacles),reason:'endpoints'};
  const startId=index(startQ),goalId=index(endQ);
  const came=new Int32Array(count).fill(-1),g=new Float64Array(count).fill(Infinity),closed=new Uint8Array(count);
  const heap=[];
  const push=(id,f)=>{let n=heap.length;heap.push({id,f});while(n>0){const p=(n-1)>>1;if(heap[p].f<=f)break;heap[n]=heap[p];n=p}heap[n]={id,f}};
  const pop=()=>{const root=heap[0],last=heap.pop();if(heap.length){let n=0;while(n*2+1<heap.length){let j=n*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[n]=heap[j];n=j}heap[n]=last}return root.id};
  g[startId]=0;push(startId,dist(coord(startId),b));
  let visited=0,finished=false;
  const directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  while(heap.length&&visited++<maxVisited){
   const id=pop();if(closed[id])continue;closed[id]=1;
   if(id===goalId){finished=true;break}
   const xyz=coord(id),ii=[id%N[0],Math.floor(id/N[0])%N[1],Math.floor(id/(N[0]*N[1]))];
   for(const d of directions){
    const q=ii.map((v,i)=>v+d[i]);
    if(q.some((v,i)=>v<0||v>=N[i]))continue;
    const nb=index(q);if(closed[nb])continue;
    const next=coord(nb);
    if(collisions([xyz,next],obstacles).length)continue;
    const tentative=g[id]+step;
    if(tentative<g[nb]){
     came[nb]=id;g[nb]=tentative;
     push(nb,tentative+dist(next,b));
    }
   }
  }
  if(!finished)return {points:null,blocked:collisions([a,b],obstacles),reason:'search'};
  const chain=[];
  for(let n=goalId;n!==-1;n=came[n])chain.push(coord(n));
  chain.reverse();
  const candidate=simplify([a,...chain,b],obstacles);
  const blocked=collisions(candidate,obstacles);
  return {points:blocked.length?null:candidate,blocked,reason:blocked.length?'verification':null,visited};
 }
 window.WalnutLoopRouting={fitting,boxes,collisions,plan,segmentIntersects,simplify};
})();