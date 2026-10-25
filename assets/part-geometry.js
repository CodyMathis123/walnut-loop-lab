'use strict';
// World-space component meshes shared by Canvas/SVG fallback and WebGL.
// Coordinates are millimetres. No dependencies, geometry stays editable via part data.
(function(){
 const palette={
  tray:['#252f3a','#1c2731','#15212b','#35414c','#3b4650','#101924'],
  edge:['#32414c','#202d37','#1b2832','#44515c','#36434e','#16222e'],
  rad:['#2b3742','#1f2b34','#17242e','#3c4852','#34424c','#1a2730'],
  tank:['#353e47','#25313b','#1d2831','#47525c','#39434d','#1a252d']
 };
 // Derive the rear bracket from the tray's right edge (not a free X offset).
 // Physical-photo approximation: ~25 mm left overhang and ~8 mm right.
 const rearPanelWidth=310, rearRightOverhang=8, rearFanSectionWidth=138;
 function rearPanelAlignment(part){
  const [x]=part.pos,[w]=part.size;
  const right=x+w/2+rearRightOverhang,left=right-rearPanelWidth;
  const center=(left+right)/2,split=left+rearFanSectionWidth;
  return {left,right,center,split,fanX:(left+split)/2,width:rearPanelWidth};
 }
 function trayXForRearPanelCenter(center,trayWidth){
  return center+rearPanelWidth/2-rearRightOverhang-trayWidth/2;
 }
 function renderTray(part,geo){
  const {box,polygon,stroke,circle3,add}=geo;
  const [x,y,z]=part.pos, [w,t,d]=part.size;
  const top=y+t/2, L=-w/2,R=w/2,B=-d/2,F=d/2;
  const piece=(px,py,pz,sw,sh,sd,color=palette.tray)=>
   box({pos:[x+px,y+py,z+pz],size:[sw,sh,sd]},color);
  // Main tray plate has an actual rectangular CPU/backplate access cutout.
  // Reference photo: opening is near the I/O-facing rear edge and right-hand
  // ITX location in this horizontal, rotated installation.
  // Keep offsets on the part so users can refine its real dimensions.
  const cfg=part.cutout||{x:46,z:-96,width:120,depth:100};
  const cw=Math.max(20,Math.min(cfg.width,w-18)),cd=Math.max(20,Math.min(cfg.depth,d-18));
  const cx=Math.max(L+cw/2+9,Math.min(R-cw/2-9,cfg.x));
  const cz=Math.max(B+cd/2+9,Math.min(F-cd/2-9,cfg.z));
  const x0=cx-cw/2,x1=cx+cw/2,z0=cz-cd/2,z1=cz+cd/2;
  const plate=(xa,xb,za,zb)=>{
   if(xb>xa&&zb>za)piece((xa+xb)/2,0,(za+zb)/2,xb-xa,t,zb-za);
  };
  plate(L,x0,B,F);plate(x1,R,B,F);
  plate(x0,x1,B,z0);plate(x0,x1,z1,F);
  const holeOutline=[[x+x0,top+.6,z+z0],[x+x1,top+.6,z+z0],
    [x+x1,top+.6,z+z1],[x+x0,top+.6,z+z1]];
  stroke([...holeOutline,holeOutline[0]],'#667785',1.3,.9);
  // Sheet-metal returns along sides + forward edge.
  for(const side of [-1,1]){
   piece(side*(w/2-2.1),4.8,0,4.2,9.6,d-8,palette.edge);
   for(const zz of [B+21,F-21]){
    piece(side*(w/2+6),-1.5,zz,17,3,20,palette.edge);
    stroke(circle3([x+side*(w/2+6),y+.1,z+zz],2.7,'y',12),'#a0abb6',1,.85);
   }
  }
  piece(0,4,F-2.4,w-7,8,4.8,palette.edge);
  // Only the future ITX motherboard mounts in the rear/right corner.
  // The rest of the tray remains free for the GPU and later walnut surface.
  // Holes are schematic until the physical standoff pattern is measured.
  for(const xx of [-26,117])for(const zz of [-132,9]){
   const loc=[x+xx,top+4,z+zz];
   box({pos:loc,size:[7,7,7]},['#6b7884','#56636e','#53606b','#8c9aa4','#80909b','#42515e']);
   stroke(circle3([loc[0],loc[1]+4,loc[2]],3.2,'y',12),'#c9d3dc',.9);
  }
  // Four mount/fold details make this a removable assembly rather than a slab.
  for(const xx of [-w/2+18,w/2-18])for(const zz of [B+15,F-15]){
   stroke(circle3([x+xx,top+.7,z+zz],2.2,'y',12),'#8c9ca8',1,.8);
  }

  // The manufacturer rear panel has a 120 fan hole + I/O shield + PCI slots.
  // The whole rear panel is rotated to put the wide dimension horizontally
  // beneath the walnut rear window (13 in wide, 8.25 in tall).
  const zBack=z+B+2.5;
  const {left:panelL,right:panelR,center:panelCenter,split,fanX}=rearPanelAlignment(part);
  const y0=top,y1=top+183,fanY=y0+92,fanRadius=55;
  // Geometrically cover the rectangular fan sheet outside its circular hole.
  // At each ray the outer endpoint is the intersection with panel bounds.
  let angles=[];
  for(let i=0;i<64;i++)angles.push(i*2*Math.PI/64);
  for(const [xx,yy] of [[panelL,y0],[split,y0],[split,y1],[panelL,y1]]){
   let a=Math.atan2(yy-fanY,xx-fanX);if(a<0)a+=2*Math.PI;angles.push(a);
  }
  angles.sort((a,b)=>a-b);
  const outer=a=>{
   const vx=Math.cos(a),vy=Math.sin(a),ts=[];
   if(vx>0)ts.push((split-fanX)/vx);
   else if(vx<0)ts.push((panelL-fanX)/vx);
   if(vy>0)ts.push((y1-fanY)/vy);
   else if(vy<0)ts.push((y0-fanY)/vy);
   const t=Math.min(...ts.filter(n=>n>0));
   return [fanX+vx*t,fanY+vy*t,zBack];
  };
  const inner=a=>[fanX+fanRadius*Math.cos(a),fanY+fanRadius*Math.sin(a),zBack];
  for(let i=0;i<angles.length;i++){
   const a=angles[i],b=i===angles.length-1?angles[0]+2*Math.PI:angles[i+1];
   // Front face is double sided in WebGL, and has no fake solid disk.
   polygon([inner(a),outer(a),outer(b),inner(b)],'#1b2731');
  }
  // Right section: a long ATX I/O window above seven distinct PCI slots.
  const cutouts=[{x0:panelCenter-6,x1:panelCenter+143,y0:y0+121,y1:y0+166}];
  for(let i=0;i<7;i++){
   const xx=panelCenter-7+20.7*i;
   cutouts.push({x0:xx,x1:xx+10,y0:y0+20,y1:y0+103});
  }
  const ys=[y0,y1,...cutouts.flatMap(v=>[v.y0,v.y1])].sort((a,b)=>a-b)
    .filter((v,i,arr)=>i===0||v-arr[i-1]>.001);
  const fillRegion=(xa,xb,ya,yb)=>{
   if(xb-xa<.1||yb-ya<.1)return;
   polygon([[xa,ya,zBack],[xb,ya,zBack],[xb,yb,zBack],[xa,yb,zBack]],'#1b2731');
  };
  for(let k=1;k<ys.length;k++){
   const ya=ys[k-1],yb=ys[k],mid=(ya+yb)/2;
   const cuts=cutouts.filter(v=>v.y0<=mid&&v.y1>=mid)
     .map(v=>[v.x0,v.x1]).sort((a,b)=>a[0]-b[0]);
   let start=split;
   for(const [xa,xb] of cuts){fillRegion(start,xa,ya,yb);start=Math.max(start,xb)}
   fillRegion(start,panelR,ya,yb);
  }
  const rim=[[panelL,y0,zBack],[panelR,y0,zBack],
             [panelR,y1,zBack],[panelL,y1,zBack]];
  stroke([...rim,rim[0]],'#748694',1.25,.92);
  for(const h of cutouts){
   const pts=[[h.x0,h.y0,zBack+.65],[h.x1,h.y0,zBack+.65],
              [h.x1,h.y1,zBack+.65],[h.x0,h.y1,zBack+.65]];
   stroke([...pts,pts[0]],'#8395a2',1.1,.89);
  }
  stroke(circle3([fanX,fanY,zBack+.7],fanRadius,'z',48),'#8194a0',1.8);
  for(const dx of [-52,52])for(const dy of [-52,52]){
   polygon(circle3([fanX+dx,fanY+dy,zBack+1],3,'z',12).slice(0,-1),'#0a141d');
   stroke(circle3([fanX+dx,fanY+dy,zBack+1.2],3,'z',12),'#a3b2be',.85);
  }
  piece(0,4,B+2,w-10,8,4.5,palette.edge);
  box({pos:[panelCenter,y1-2.7,zBack+2],size:[rearPanelWidth-1,5.4,4]},palette.edge);
  box({pos:[panelR-2.2,(y0+y1)/2,zBack+2],size:[4.4,y1-y0,4]},palette.edge);
 }
 function renderRadiator(part,geo){
  const {box,polygon,stroke,circle3,add}=geo;
  const [x,y,z]=part.pos,[w,h,d]=part.size;
  const halfW=w/2,halfH=h/2,halfD=d/2,rail=9,tank=18;
  // Metal side frame and dark coolant end tanks. The center is left open.
  for(const sign of [-1,1]){
   box({pos:[x+sign*(halfW-rail/2),y,z],size:[rail,h,d]},palette.rad);
   box({pos:[x,y+sign*(halfH-tank/2),z],size:[w-rail*2,tank,d]},palette.tank);
  }
  // Recessed black fin core on both fan-facing surfaces.
  const finW=w-rail*2-2,finH=h-tank*2-2;
  for(const sign of [-1,1]){
   const face=z+sign*(halfD-3);
   polygon([[x-finW/2,y-finH/2,face],[x+finW/2,y-finH/2,face],
            [x+finW/2,y+finH/2,face],[x-finW/2,y+finH/2,face]],'#111b25');
   const rows=Math.max(1,Math.floor(finH/5.5));
   for(let i=0;i<=rows;i++){
    const yy=y-finH/2+i*finH/rows;
    stroke([[x-finW/2+2,yy,face+sign*.8],
            [x+finW/2-2,yy,face+sign*.8]],
            i%2?'#405360':'#2a3c48',.8,.82);
   }
   for(const n of [-1,0,1]){
    const xx=x+n*(finW/3);
    stroke([[xx,y-finH/2,face+sign*.85],
            [xx,y+finH/2,face+sign*.85]],'#576b77',1,.67);
   }
  }
  // Mounting screw holes run alongside each 120 mm fan station.
  for(const sx of [-1,1])for(const fy of [-120,0,120])
   for(const dz of [-halfD+7,halfD-7])
    stroke(circle3([x+sx*(halfW+.8),y+fy+51,z+dz],2.7,'x',12),
      '#8797a2',1,.75);
  // G1/4-style port collars sit on top end tank, using editable port offsets.
  for(const port of part.ports||[]){
   const [px,py,pz]=add(part.pos,port.off),yy=Math.min(py,y+halfH)+1.2;
   polygon(circle3([px,yy,pz],10.2,'y',24).slice(0,-1),'#6e7d88');
   polygon(circle3([px,yy+.75,pz],6.7,'y',24).slice(0,-1),'#0b151d');
   stroke(circle3([px,yy+1.15,pz],10.2,'y',24),'#bbc8d2',1.1,.95);
  }
 }
 window.WalnutLoopPartGeometry={renderTray,renderRadiator,rearPanelAlignment,trayXForRearPanelCenter};
})();
