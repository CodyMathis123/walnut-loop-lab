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
  const center=(left+right)/2,split=right-rearFanSectionWidth;
  // Left = PCI expansion slots. Right = fan above motherboard I/O.
  return {left,right,center,split,fanX:(split+right)/2,width:rearPanelWidth};
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


  // Facing the case from above (same as the reference photo):
  // PCI slots LEFT, fan TOP RIGHT, motherboard I/O BELOW the fan.
  // The two right-hand apertures must be carved out of separate parts
  // of the sheet. Otherwise radial fill polygons would mask the I/O hole.
  const zBack=z+B+2.5;
  const {left:panelL,right:panelR,center:panelCenter,split,fanX}=rearPanelAlignment(part);
  const y0=top,y1=top+183;
  const fanY=y0+119,fanRadius=55;
  const fanRegionBottom=y0+56; // fan's low edge is y0+64
  const io={x0:split+20,x1:panelR-20,y0:y0+10,y1:y0+49};
  const pciSlots=Array.from({length:7},(_,i)=>{
   const xx=panelL+14+21*i;
   return {x0:xx,x1:xx+10,y0:y0+22,y1:y0+104};
  });
  const cutouts=[io,...pciSlots];

  // Fan's sheet region extends only above the I/O opening, keeping its
  // circular 110 mm through-hole genuinely open.
  const angles=[];
  for(let i=0;i<64;i++)angles.push(i*2*Math.PI/64);
  for(const [xx,yy] of [[split,fanRegionBottom],[panelR,fanRegionBottom],
                         [panelR,y1],[split,y1]]){
   let a=Math.atan2(yy-fanY,xx-fanX);
   if(a<0)a+=2*Math.PI;
   angles.push(a);
  }
  angles.sort((a,b)=>a-b);
  const outer=a=>{
   const vx=Math.cos(a),vy=Math.sin(a),ts=[];
   if(vx>0)ts.push((panelR-fanX)/vx);
   else if(vx<0)ts.push((split-fanX)/vx);
   if(vy>0)ts.push((y1-fanY)/vy);
   else if(vy<0)ts.push((fanRegionBottom-fanY)/vy);
   const distance=Math.min(...ts.filter(n=>n>0));
   return [fanX+vx*distance,fanY+vy*distance,zBack];
  };
  const inner=a=>[fanX+fanRadius*Math.cos(a),fanY+fanRadius*Math.sin(a),zBack];
  for(let i=0;i<angles.length;i++){
   const a=angles[i],b=i===angles.length-1?angles[0]+2*Math.PI:angles[i+1];
   polygon([inner(a),outer(a),outer(b),inner(b)],'#1b2731');
  }

  const fillRegion=(xa,xb,ya,yb)=>{
   if(xb-xa<.1||yb-ya<.1)return;
   polygon([[xa,ya,zBack],[xb,ya,zBack],[xb,yb,zBack],[xa,yb,zBack]],'#1b2731');
  };
  // Separate bottom-right I/O section: solid strips on all four sides.
  fillRegion(split,io.x0,y0,fanRegionBottom);
  fillRegion(io.x1,panelR,y0,fanRegionBottom);
  fillRegion(io.x0,io.x1,y0,io.y0);
  fillRegion(io.x0,io.x1,io.y1,fanRegionBottom);

  // Left-hand sheet around all seven PCI slots.
  const ys=[y0,y1,...pciSlots.flatMap(v=>[v.y0,v.y1])].sort((a,b)=>a-b)
   .filter((v,i,arr)=>i===0||v-arr[i-1]>.001);
  for(let k=1;k<ys.length;k++){
   const ya=ys[k-1],yb=ys[k],mid=(ya+yb)/2;
   const cuts=pciSlots.filter(v=>v.y0<=mid&&v.y1>=mid)
    .map(v=>[v.x0,v.x1]).sort((a,b)=>a[0]-b[0]);
   let cursor=panelL;
   for(const [xa,xb] of cuts){fillRegion(cursor,xa,ya,yb);cursor=Math.max(cursor,xb)}
   fillRegion(cursor,split,ya,yb);
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
  // TFC X-Changer-style G1/4 female ports face INWARD through the large
  // vertical surface of the end tank, not through its top cap.
  for(const port of part.ports||[]){
   const [px,py,pz]=add(part.pos,port.off);
   const inward=Math.sign(port.off[2])||1;
   const outer=[px,py,pz],lip=[px,py,pz+inward*.8];
   polygon(circle3(outer,9.5,'z',24).slice(0,-1),'#778995');
   polygon(circle3(lip,6.3,'z',24).slice(0,-1),'#0b151d');
   stroke(circle3(lip,9.5,'z',24),'#bac9d1',1.1,.95);
   stroke(circle3(lip,6.3,'z',24),'#758a97',.9,.85);
  }
 }
 function renderMotherboard(part,geo){
  const {box,polygon,stroke,circle3}=geo;
  const [x,y,z]=part.pos,[w,t,d]=part.size;
  const top=y+t/2, rear=z-d/2,front=z+d/2,left=x-w/2,right=x+w/2;
  const board=['#183332','#102724','#0e2220','#28504a','#30584d','#0c201f'];
  const metal=['#5d6973','#485560','#3d4954','#8494a1','#6d7b87','#35414b'];
  const chip=['#2c3039','#1c232d','#141b25','#41464c','#323b44','#131c25'];
  const place=(dx,dz,wid,height,deep,colors=chip,off=0)=>
   box({pos:[x+dx,top+off+height/2,z+dz],size:[wid,height,deep]},colors);
  // Scale-correct 170 x 170 mm matte-green PCB with gold mounting holes.
  box(part,board);
  for(const sx of [-1,1])for(const sz of [-1,1]){
   const hole=[x+sx*(w/2-6),top+.8,z+sz*(d/2-6)];
   stroke(circle3(hole,3.4,'y',16),'#bcae75',1.3,.9);
  }
  // Rear I/O housing (negative Z); connectors all face the rear bracket.
  place(0,-d/2+11,w-14,21,21,metal);
  for(const xx of [-61,-40,-20,3,25,49]){
   place(xx,-d/2+3,12,6,8,chip,6);
   stroke([[x+xx-4,top+11,rear-.25],[x+xx+4,top+11,rear-.25]],'#96a6b0',1.25);
  }
  // VRM heatsink runs at the back-right, near the AM4 socket.
  place(62,-40,20,18,62,metal);
  for(let i=0;i<5;i++)place(56+i*3,-40,1.6,20,53,chip);
  // Two DDR4 DIMM sockets toward the front (+Z) after 90-degree rotation.
  for(const zz of [49,64]){
   place(2,zz,120,7,8,chip);
   for(const xx of [-53,53])place(xx,zz,6,9,10,metal);
   stroke([[x-48,top+8,z+zz],[x+48,top+8,z+zz]],'#748d8c',1.1,.9);
  }
  // Full PCIe x16 slot on the left/outer edge of the horizontal motherboard.
  place(-72,0,10,12,120,chip);
  stroke([[x-72,top+13,z-47],[x-72,top+13,z+47]],'#d7d4b7',1.4,.85);
  // M.2/heatsink and small active X570 chipset-fan enclosure left/front.
  place(-39,34,49,10,45,metal);
  const fanCenter=[x-40,top+10,z+30];
  stroke(circle3(fanCenter,18,'y',28),'#8c9ba3',1.5);
  stroke(circle3(fanCenter,6,'y',28),'#38464c',1.1);
  for(let k=0;k<6;k++){
   const a=k*Math.PI/3,b=a+.45;
   stroke([[fanCenter[0]+7*Math.cos(a),fanCenter[1],fanCenter[2]+7*Math.sin(a)],
           [fanCenter[0]+16*Math.cos(b),fanCenter[1],fanCenter[2]+16*Math.sin(b)]],
           '#758891',1.5);
  }
  // AM4 socket at measured-from-reference approximate coordinate. 
  // Socket is intentionally BELOW the CPU water block.
  const offset=part.socketOffset||[18,0,-6];
  const cx=x+offset[0],cz=z+offset[2];
  box({pos:[cx,top+3.4,cz],size:[42,6.8,44]},
      ['#777a72','#555f5c','#424b49','#94988d','#8e968f','#374440']);
  stroke([[cx-24,top+7.5,cz-24],[cx+24,top+7.5,cz-24],
          [cx+24,top+7.5,cz+24],[cx-24,top+7.5,cz+24],
          [cx-24,top+7.5,cz-24]],'#bbc4b3',1.6);
  // AM4 block retaining clamp positions, consistent with socket orientation.
  for(const dx of [-27,27])for(const dz of [-28,28])
   stroke(circle3([cx+dx,top+3,cz+dz],2.6,'y',12),'#b8ae91',.95);
  // Gold pad/edge traces and SATA/header indicators near right edge.
  for(let i=0;i<8;i++){
   const yy=z-30+i*8;
   stroke([[right-19,top+.7,yy],[right-5,top+.7,yy]],'#b4a466',.7,.85);
  }
  place(w/2-9,22,12,12,33,chip);
  place(-13,77,20,9,10,chip);
 }

 function renderGPU(part,geo){
  const {box,polygon,stroke,circle3}=geo;
  const [x,y,z]=part.pos,[fullWidth,fullHeight,fullLength]=part.size;
  const pcbW=part.pcbSize?.[0]||98.8;
  const pcbL=part.pcbSize?.[2]||197;
  const left=x-fullWidth/2,pcbCenterX=left+pcbW/2;
  const blockBottom=y-fullHeight/2;
  const pcbBottom=blockBottom+5.2,pcbTop=pcbBottom+1.6;
  const rear=z-fullLength/2,front=z+fullLength/2;
  const walnut=['#835331','#6b422b','#603a26','#ac7446','#a36c41','#573521'];
  const graphite=['#262d33','#20262e','#1a222b','#39414a','#3b4751','#19232b'];
  const copper=['#998a75','#847361','#635b52','#b4a58b','#a99b85','#5d5550'];
  // Planned walnut cover/platform extends slightly left of the aluminum tray.
  // The platform is a structural design placeholder, not proof of mounting.
  const support=part.platformThickness||8;
  box({pos:[pcbCenterX,blockBottom-6-support/2,z],
       size:[pcbW+8,support,pcbL+5]},walnut);
  for(const dx of [-pcbW*.43,pcbW*.43]){
   stroke([[pcbCenterX+dx,blockBottom-6,z-pcbL/2+5],
           [pcbCenterX+dx,blockBottom-6,z+pcbL/2-5]],'#c18c55',.65,.5);
  }
  // PCB envelope is 197 x ~99 mm, inferred from Alphacool backplate,
  // rather than the much longer original air cooler/shroud.
  box({pos:[pcbCenterX,pcbBottom+.8,z],size:[pcbW,1.6,pcbL]},
      ['#22392e','#172a24','#182c25','#345c44','#294d3b','#152820']);
  // Left PCIe edge / gold fingers, alongside the motherboard's x16 socket.
  for(let i=0;i<17;i++){
   const zz=z-52+i*6.2;
   polygon([[left-1,pcbTop+.25,zz],[left+8,pcbTop+.25,zz],
    [left+8,pcbTop+.25,zz+3.8],[left-1,pcbTop+.25,zz+3.8]],'#d4ad57');
  }
  stroke([[left,pcbTop+.3,z-59],[left,pcbTop+.3,z+61]],'#ddbb72',1.4);
  // Aluminum backplate, copper cooling plate and tinted acrylic cover.
  box({pos:[pcbCenterX,blockBottom+2.6,z],size:[pcbW,5.2,pcbL]},
     graphite);
  box({pos:[pcbCenterX,blockBottom+11.5,z],size:[pcbW,10,pcbL]},
     copper);
  box({pos:[pcbCenterX,blockBottom+23,z],size:[pcbW-7,13,pcbL-9]},
     ['#314b56','#27444f','#19353f','#456876','#385966','#17313d']);
  // GPU die and block channels near the middle: schematic, not CAD internals.
  const top=blockBottom+29.5;
  for(let i=-5;i<=5;i++){
   const xx=pcbCenterX+i*5.7;
   stroke([[xx,top+.3,z-43],[xx,top+.3,z+45]],'#78a9b8',.8,.72);
  }
  const core=[[pcbCenterX-17,top+.7,z-17],
   [pcbCenterX+17,top+.7,z-17],[pcbCenterX+17,top+.7,z+17],
   [pcbCenterX-17,top+.7,z+17]];
  stroke([...core,core[0]],'#b7d1d6',2,.9);
  for(const dx of [-39,39])for(const dz of [-88,0,88])
   stroke(circle3([pcbCenterX+dx,top+.4,z+dz],2.3,'y',12),
     '#c5bca6',1.1,.85);
  // Terminal on the right (+X) long edge, holding two accessible G1/4 ports.
  const terminalW=fullWidth-pcbW;
  const terminalCenterX=left+pcbW+terminalW/2;
  box({pos:[terminalCenterX,blockBottom+20,z],size:[terminalW,25,69]},
      graphite);
  // The two modeled working ports have 34 mm separation along Z.
  // Other physical ports are treated as capped in this planning model.
  for(const port of part.ports||[]){
   const at=[x+port.off[0],y+port.off[1],z+port.off[2]];
   polygon(circle3(at,9,'x',24).slice(0,-1),'#899aa1');
   stroke(circle3(at,9,'x',24),'#c6d4d6',1.7);
   stroke(circle3(at,5.5,'x',24),'#0b1821',1.3);
  }
  // Rear metal bracket, display connectors all facing -Z.
  const bracketZ=rear-2;
  box({pos:[pcbCenterX,blockBottom+20,bracketZ],
       size:[pcbW+2,28,3]},graphite);
  for(let i=0;i<4;i++){
   const xx=pcbCenterX-36+i*23.8;
   const yPort=blockBottom+21;
   stroke([[xx-7,yPort-3,bracketZ-2],[xx+7,yPort-3,bracketZ-2],
     [xx+7,yPort+3,bracketZ-2],[xx-7,yPort+3,bracketZ-2],
     [xx-7,yPort-3,bracketZ-2]],'#b6c1c7',1.25);
  }
  // Platform / PCI bracket fastener proxies along rear side.
  for(const dx of [-pcbW*.41,pcbW*.41])for(const dz of [-pcbL*.44,pcbL*.44])
   stroke(circle3([pcbCenterX+dx,blockBottom-6,z+dz],2,'y',10),
     '#cfb078',1);
 }

 function renderReservoir(p,geo){
  const {box,polygon,stroke,circle3}=geo;
  const horizontal=p.orientation==='horizontal';
  const axis=horizontal?'z':'y';
  const length=p.size[horizontal?2:1],radius=p.size[0]*.45;
  const [x,y,z]=p.pos;
  const span=horizontal?[0,0,1]:[0,1,0];
  const at=v=>[x+span[0]*v,y+span[1]*v,z+span[2]*v];
  const center=at(0),from=at(-length/2),to=at(length/2);
  const ring=(v,n=32)=>circle3(at(v),radius,axis,n).slice(0,-1);
  const start=ring(-length/2+9),end=ring(length/2-9);
  // Matte dark-tinted tube with 32 faceted sides for consistent GPU/Canvas rendering.
  // Avoid alpha-blended polygons intersecting the center divider.
  for(let i=0;i<start.length;i++){
   const j=(i+1)%start.length;
   polygon([start[i],start[j],end[j],end[i]],i%2?'#354d60':'#3b556a');
  }
  for(const v of [-length/2+5,length/2-5]){
   polygon(ring(v),'#8394a2');
   stroke(circle3(at(v),radius,axis,36),'#b9c8d2',1.7,.94);
  }
  // FrozenQ-style internal helix; simplified but follows reservoir orientation.
  const helix=[];
  const steps=96;
  for(let k=0;k<=steps;k++){
   const t=k/steps,a=t*Math.PI*8;
   const base=at((t-.5)*(length-28));
   const rr=radius*.48;
   helix.push(horizontal?[base[0]+rr*Math.cos(a),base[1]+rr*Math.sin(a),base[2]]:
                        [base[0]+rr*Math.cos(a),base[1],base[2]+rr*Math.sin(a)]);
  }
  stroke(helix,'#74bacd',2.1,.85);
  stroke(circle3(from,radius*.9,axis,32),'#a3b0b7',1.6,.92);
  stroke(circle3(to,radius*.9,axis,32),'#a3b0b7',1.6,.92);
  // Body ports are axial: two separately placed on the bottom end-cap and
  // one on the upper cap (fill/vent). Rotation changes their facing planes.
  for(const port of p.ports||[]){
   const point=p.pos.map((v,i)=>v+port.off[i]);
   stroke(circle3(point,7,axis,20),'#9fc1d0',1.2,.93);
  }
 }

 window.WalnutLoopPartGeometry={renderTray,renderRadiator,renderMotherboard,renderGPU,renderReservoir,rearPanelAlignment,trayXForRearPanelCenter};
})();
