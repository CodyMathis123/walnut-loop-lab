'use strict';
const $=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), r2=n=>Math.round(n*100)/100;
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,s)=>a.map(x=>x*s),len=a=>Math.hypot(...a),dist=(a,b)=>len(sub(a,b)),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const initial=()=>({
  case:{width:546.1,height:736.6,depth:508,wood:19.05,doors:19.05,openW:406.4,openD:469.9,railWidth:50.8,railThickness:19.05,divider:488.95,lowerRailTop:19.05,portY:463.55,portFrontA:76.2,portFrontB:139.7,steelWidth:254,steelZ:0,fanOpeningWidth:122,fanOpeningHeight:362,fanOpeningBottom:82.55,fanOpeningSide:44.45,windowSide:88.9,windowTop:38.1,windowHeight:209.55,fanThickness:25.4},
  parts:[
    {id:'rad1',name:'Radiator 1',type:'radiator',fans:{panel:3,inner:3},slot:'front-right',pos:[146,273.55,180],size:[135,380,60],ports:[{id:'in',name:'Near side',off:[31.75,190,-33]},{id:'out',name:'Far side',off:[-31.75,190,-33]}],note:'Radiator 1 starts on the front/right opening with three fans on each face. Port height and offsets follow provisional supplied measurements.'},
    {id:'rad2',name:'Radiator 2',type:'radiator',fans:{panel:3,inner:3},slot:'rear-right',pos:[-146,273.55,180],size:[135,380,60],ports:[{id:'in',name:'Near side',off:[-31.75,190,-33]},{id:'out',name:'Far side',off:[31.75,190,-33]}],note:'Radiator 2 starts on the rear/right opening with three fans on each face. Radiator depth and mounting can be calibrated later.'},
    {id:'rad3',name:'Radiator 3',type:'radiator',fans:{panel:3,inner:3},slot:'front-left',pos:[-146,273.55,180],size:[135,380,60],ports:[{id:'in',name:'Port A',off:[-31.75,190,-33]},{id:'out',name:'Port B',off:[31.75,190,-33]}],note:'Front-left radiator with three 120 mm fans on each side.'},
    {id:'rad4',name:'Radiator 4',type:'radiator',fans:{panel:3,inner:3},slot:'rear-left',pos:[-146,273.55,-180],size:[135,380,60],ports:[{id:'in',name:'Port A',off:[-31.75,190,33]},{id:'out',name:'Port B',off:[31.75,190,33]}],note:'Rear-left radiator with three 120 mm fans on each side.'},
    {id:'tray',name:'Mountain Mods ATX tray + 120 rear panel',type:'tray',pos:[76,489.775,-69.525],size:[276.86,1.65,323.85],cutout:{x:46,z:-96,width:120,depth:100},ports:[],note:'Mountain Mods ATXTOAB tray (10.9 × 12.75 in) and 120MOTRAY-BW rear I/O/PCI/fan panel. 1.65 mm aluminum. Rear panel geometry is an informed visual approximation.'},
    {id:'cpu',name:'CPU water block (draft)',type:'cpu',pos:[93,525,-110],size:[65,23,65],ports:[{id:'in',name:'In',off:[-16,17,0]},{id:'out',name:'Out',off:[16,17,0]}],note:'CPU/AM4 block location follows schematic motherboard positioning; no measurements yet.'},
    {id:'gpu',name:'RX 9070 XT / water block (draft)',type:'gpu',pos:[-151,527,-45],size:[112,29,290],ports:[{id:'in',name:'In',off:[48,11,-25]},{id:'out',name:'Out',off:[48,11,25]}],note:'Separate horizontal GPU location is only a planning placeholder.'},
    {id:'res',name:'FrozenQ reservoir (draft)',type:'res',pos:[-125,300,55],size:[72,238,72],ports:[{id:'in',name:'Top return',off:[0,119,0]},{id:'out',name:'Bottom supply',off:[0,-119,0]}],note:'Left lower chamber, completely clear of the X=0 steel divider. Position and dimensions are provisional.'},
    {id:'pump',name:'Laing DDC / XSPC top (draft)',type:'pump',pos:[-125,104,70],size:[76,65,76],ports:[{id:'in',name:'In',off:[0,37,0]},{id:'out',name:'Out',off:[39,5,0]}],note:'Pump location, inlet and outlet orientation are provisional. Maintain a reliable flooded pump inlet.'},
    {id:'drain',name:'Drain T + valve (draft)',type:'drain',pos:[55,80,75],size:[55,26,36],ports:[{id:'in',name:'In',off:[-28,0,0]},{id:'out',name:'Out',off:[28,0,0]}],note:'Low inline drain is shown provisionally; change location and orientation as needed.'}
  ], routes:[],prices:{fit:4.95,elbow:10.95,soft:7,hard:13.33,waste:25,other:20},display:{wood:true,steel:true,labels:false,ports:false,fans:false,doors:false,caseOnly:false,internals:false,dimensions:false},fanOnly:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0},mountVersion:1,tubeOD:16,bendRadius:35});
let project=initial(); let selection='rad1',selectedRoute=null,portClicks=0;
let sceneQueue=null;
let sceneRevision=0; // Increment only for model/edit changes, not camera orbit gestures.
let view={yaw:.58,pitch:.24,zoom:.90,target:[0,355,0],pan:[0,0]};let canvas=$('scene'),nativeCtx=canvas.getContext('2d'),ctx=nativeCtx,isSvgMode=false;let hitPorts=[],hitParts=[],isDragging=false,dragMoved=false,last=[0,0],dpr=1,W=100,H=100;

// Minimal standards-based SVG adapter for the drawing commands used by this planner.
// Preserves geometry, routes, hit zones and orbit gestures on WebKit-based mobile browsers.
function makeSvgCtx(svg){
 const NS='http://www.w3.org/2000/svg';
 let path='',dash=[];
 const st={fillStyle:'#ffffff',strokeStyle:'#000000',lineWidth:1,globalAlpha:1,font:'12px system-ui',lineCap:'butt',lineJoin:'miter'};
 const mk=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));svg.appendChild(n);return n};
 const num=v=>Number.isFinite(v)?(+v).toFixed(2):0;
 const add=(v)=>{path+=v+' '};
 const ellipsePath=(x,y,rx,ry,rot,start,end)=>{
   const div=48,angle=end-start;
   for(let i=0;i<=div;i++){
      let a=start+angle*i/div,c=Math.cos(a),s=Math.sin(a),cr=Math.cos(rot),sr=Math.sin(rot);
      let px=x+rx*c*cr-ry*s*sr,py=y+rx*c*sr+ry*s*cr;
      add((i?'L':'M')+num(px)+' '+num(py));
   }
 };
 const proxy={
   beginPath(){path=''},moveTo(x,y){add('M'+num(x)+' '+num(y))},lineTo(x,y){add('L'+num(x)+' '+num(y))},closePath(){add('Z')},
   arc(x,y,r,start,end){ellipsePath(x,y,r,r,0,start,end)},
   ellipse(x,y,rx,ry,rot,start,end){ellipsePath(x,y,rx,ry,rot,start,end)},
   fill(rule){mk('path',{d:path,fill:st.fillStyle,'fill-rule':rule==='evenodd'?'evenodd':'nonzero',opacity:st.globalAlpha})},
   stroke(){mk('path',{d:path,fill:'none',stroke:st.strokeStyle,'stroke-width':st.lineWidth,'stroke-linecap':st.lineCap,'stroke-linejoin':st.lineJoin,'stroke-dasharray':dash.length?dash.join(' '):'none',opacity:st.globalAlpha})},
   setLineDash(a){dash=a.slice()},
   setTransform(){},
   clearRect(){svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${Math.max(1,W)} ${Math.max(1,H)}`);svg.setAttribute('width',num(W));svg.setAttribute('height',num(H))},
   fillRect(x,y,w,h){mk('rect',{x:num(x),y:num(y),width:num(w),height:num(h),fill:st.fillStyle,opacity:st.globalAlpha})},
   measureText(v){const sz=parseFloat(st.font.match(/([0-9.]+)px/)?.[1]||'12');return{width:String(v).length*sz*.59}},
   fillText(v,x,y){const size=parseFloat(st.font.match(/([0-9.]+)px/)?.[1]||'12');const n=mk('text',{x:num(x),y:num(y),fill:st.fillStyle,opacity:st.globalAlpha,'font-family':'system-ui, sans-serif','font-size':num(size),'font-weight':st.font.includes('600')?600:400});n.textContent=String(v)}
 };
 for(const prop of Object.keys(st))Object.defineProperty(proxy,prop,{get(){return st[prop]},set(v){st[prop]=v}});
 return proxy;
}
function enableRenderer(mode){
 isSvgMode=mode==='svg'||!nativeCtx;
 ctx=isSvgMode?makeSvgCtx($('sceneSvg')):nativeCtx;
 if(!isSvgMode){$('sceneSvg').replaceChildren()}else{nativeCtx?.clearRect(0,0,canvas.width,canvas.height)}
 $('rendererBtn').textContent='Renderer: '+(isSvgMode?'SVG':'Canvas');
 $('rendererBtn').classList.toggle('active',isSvgMode);
 draw();
}

function cpart(id){return project.parts.find(p=>p.id===id)}
function key(p,id){return p.id+'.'+id}
function portPos(k){let [id,pid]=k.split('.');let p=cpart(id),q=p&&p.ports.find(x=>x.id===pid);return p&&p.visible!==false&&q?add(p.pos,q.off):null}
function portLabel(k){let [id,pid]=k.split('.');let p=cpart(id),q=p&&p.ports.find(x=>x.id===pid);return p&&q?p.name+' · '+q.name:k}
function portKeys(){return project.parts.filter(p=>p.visible!==false).flatMap(p=>p.ports.map(x=>key(p,x.id)))}
function toast(msg){const el=$('toast');el.textContent=msg;el.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display='none',2700)}
function screen(p){let v=sub(p,view.target),cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),cp=Math.cos(view.pitch),sp=Math.sin(view.pitch);let x=v[0]*cy-v[2]*sy,z=v[0]*sy+v[2]*cy,y=v[1]*cp-z*sp,d=v[1]*sp+z*cp;let sf=Math.min(W/800,H/880)*view.zoom;return {x:W*.5+x*sf+view.pan[0],y:H*.52-y*sf+view.pan[1],d,sf}}
function depth(p){return screen(p).d}
function sceneDepth(pts){
 return depth(pts.reduce((a,p)=>add(a,p),[0,0,0]).map(v=>v/Math.max(1,pts.length)));
}
function polygon(pts,fill,edge='#0000',line=1){
 if(sceneQueue){sceneQueue.push({kind:'face',pts,fill,edge,line,depth:sceneDepth(pts)});return}
 ctx.beginPath();pts.forEach((p,i)=>{const v=screen(p);i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y)});
 ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(edge!=='#0000'){ctx.lineWidth=line;ctx.strokeStyle=edge;ctx.stroke()}
}
function stroke(pts,color,width=3,alpha=1,dashes=null){
 if(sceneQueue){sceneQueue.push({kind:'line',pts,color,lw:width,alpha,dashes,depth:sceneDepth(pts)});return}
 ctx.beginPath();pts.forEach((p,i)=>{const v=screen(p);i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y)});
 ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;
 ctx.lineCap='round';ctx.lineJoin='round';ctx.setLineDash(dashes||[]);
 ctx.stroke();ctx.globalAlpha=1;ctx.setLineDash([]);
}
function flushScene(){
 const layers=sceneQueue||[];
 sceneQueue=null;
 layers.sort((a,b)=>a.depth-b.depth);
 for(const it of layers){
  if(it.kind==='panel'){
   ctx.beginPath();
   const trace=verts=>verts.forEach((p,i)=>{const v=screen(p);i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y)});
   trace(it.pts);ctx.closePath();
   for(const hole of it.holes){trace(hole);ctx.closePath()}
   ctx.fillStyle=it.fill;ctx.fill('evenodd');
   ctx.strokeStyle='#b78254';ctx.lineWidth=.85;ctx.stroke();
  }else if(it.kind==='face')polygon(it.pts,it.fill,it.edge||'#0000',it.line||0);
  else if(it.kind==='line')stroke(it.pts,it.color,it.lw,it.alpha??1,it.dashes);
 }
}
function renderedParts(){
 return project.display.caseOnly?[]:project.parts.filter(p=>p.visible!==false&&(p.type==='radiator'||p.type==='tray'||project.display.internals));
}
function showInternals(enabled){
 project.display.internals=enabled;
 $('internalsBtn').classList.toggle('active',enabled);
}
function boxFaces(p){let [sx,sy,sz]=p.size.map(n=>n/2),[x,y,z]=p.pos;let corners=[[-sx,-sy,-sz],[sx,-sy,-sz],[sx,sy,-sz],[-sx,sy,-sz],[-sx,-sy,sz],[sx,-sy,sz],[sx,sy,sz],[-sx,sy,sz]].map(o=>add([x,y,z],o));let faceIdx=[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7],[0,1,5,4]];return faceIdx.map((f,i)=>({pts:f.map(j=>corners[j]),shade:i,dep:depth(f.reduce((v,j)=>add(v,corners[j]),[0,0,0]).map(n=>n/4))})).sort((a,b)=>a.dep-b.dep)}
function box(p,colors){boxFaces(p).forEach(f=>polygon(f.pts,colors[f.shade%colors.length]||colors[0],'#111a2380',.75))}
function circle3(center,r,axis='x',n=40){let pts=[];for(let i=0;i<=n;i++){let a=2*Math.PI*i/n;pts.push(axis==='x'?add(center,[0,Math.cos(a)*r,Math.sin(a)*r]):axis==='y'?add(center,[Math.cos(a)*r,0,Math.sin(a)*r]):add(center,[Math.cos(a)*r,Math.sin(a)*r,0]))}return pts}
// Each radiator may carry 0–3 physical 120 mm fans on either Z-facing side.
const fanRows=n=>n===1?[0]:n===2?[-1,1]:n===3?[-1,0,1]:[];
function renderPhysicalFan(fan){
 const thickness=project.case.fanThickness||25.4;
 // Four structural rails leave the rotor physically open.
 const colors=['#24313d','#17232f','#1c2834','#334252','#2b3b49','#14212a'];
 for(const sign of [-1,1]){
  box({pos:add(fan.pos,[sign*56,0,0]),size:[8,120,thickness]},colors);
  box({pos:add(fan.pos,[0,sign*56,0]),size:[104,8,thickness]},colors);
 }
 // Draw the visible fan frames and rotor on both faces for orbiting views.
 for(const dir of [-1,1]){
  const base=add(fan.pos,[0,0,dir*(thickness/2+.75)]);
  stroke(circle3(base,55,'z',32),'#839bad',1.5,.90);
  stroke(circle3(base,47,'z',32),'#3d586c',2.5,.96);
  stroke(circle3(base,13,'z',24),'#aab6c0',2,.90);
  for(let j=0;j<7;j++){
   const a=j*2*Math.PI/7;
   stroke([
    add(base,[Math.cos(a)*14,Math.sin(a)*14,0]),
    add(base,[Math.cos(a+.42)*34,Math.sin(a+.42)*34,0]),
    add(base,[Math.cos(a+.62)*45,Math.sin(a+.62)*45,0])
   ],'#617b90',2.6,.83);
  }
  for(const dx of [-51,51])for(const dy of [-51,51])
   stroke(circle3(add(base,[dx,dy,0]),3,'z',10),'#91a3b0',1,.8);
 }
 if(fan.radiatorId)hitParts.push({id:fan.radiatorId,...screen(fan.pos)});
}
function attachedFans(r){
 const slot=FAN_SLOTS.find(s=>s.id===r.slot);
 if(!slot||r.visible===false)return [];
 const b=bayGeometry(slot),spec=r.fans||{panel:3,inner:0};
 const x=r.pos[0]+(b.centX-b.radX);
 const y=r.pos[1]+(b.cy-(project.case.portY-r.size[1]/2));
 const t=project.case.fanThickness||25.4;
 const result=[];
 for(const face of ['panel','inner']){
  const count=clamp(Math.round(Number(spec[face])||0),0,3);
  const z=r.pos[2]+slot.end*(face==='panel'?1:-1)*(r.size[2]/2+t/2);
  for(const row of fanRows(count))
   result.push({radiatorId:r.id,pos:[x,y+row*120,z]});
 }
 return result;
}
function freeBayFans(){
 const result=[],t=project.case.fanThickness||25.4;
 for(const slot of FAN_SLOTS){
  // Bare fans are suppressed while a radiator occupies the same opening.
  if(project.parts.some(p=>p.type==='radiator'&&p.slot===slot.id&&p.visible!==false))continue;
  const count=clamp(Math.round(Number(project.fanOnly?.[slot.id])||0),0,3);
  const b=bayGeometry(slot);
  for(const row of fanRows(count))
   result.push({pos:[b.centX,b.cy+row*120,b.fanZ]});
 }
 return result;
}
function repositionRadiatorDepth(r){
 const slot=FAN_SLOTS.find(s=>s.id===r.slot);
 if(!slot)return;
 const b=bayGeometry(slot),panelCount=Number(r.fans?.panel)||0;
 const c=project.case,t=c.fanThickness||25.4;
 // Panel fan outside face flush with the cabinet outside; radiator behind it.
 const offset=Math.max(c.wood,panelCount>0?t:0);
 r.pos[2]=b.panelOuter-slot.end*(offset+r.size[2]/2);
}
function showCoolingModel(){
 project.display.caseOnly=false;
 $('caseOnlyBtn').classList.remove('active');
 showInternals(false);
}
function renderPart(p){
 const ps=p.size,sel=p.id===selection;
 const drawParts=window.WalnutLoopPartGeometry;
 const geometryAPI={box,polygon,stroke,circle3,add};
 if(p.type==='tray'&&drawParts?.renderTray)drawParts.renderTray(p,geometryAPI);
 else if(p.type==='radiator'&&drawParts?.renderRadiator)
  drawParts.renderRadiator(p,geometryAPI);
 else {
  const colors=p.type==='gpu'?['#30353e','#212933','#2c3641','#383f49','#41464c','#18232d']
  :p.type==='cpu'?['#b09a7d','#b4a080','#9a7e61','#d2b68a','#e4bc83','#7d6a52']
  :p.type==='pump'?['#30363b','#252e37','#1b242f','#3e4c57','#485463','#1a2530']
  :p.type==='res'?['#45536a88','#283748aa','#253349aa','#465d7288','#354c6088','#2e3e5488']
  :p.type==='radiator'?['#273340','#1b2834','#1b2630','#364350','#303a44','#131d27']
  :['#384552','#283541','#273541','#434e57','#4a5761','#253541'];
  box(p,colors);
 }
 if(p.type==='res'){let top=add(p.pos,[0,ps[1]/2,0]);let low=add(p.pos,[0,-ps[1]/2,0]);stroke([low,top],'#70a7bc',4,.75);stroke(circle3(top,ps[0]*.35,'y'),'#b9c3cc',1.8);stroke(circle3(low,ps[0]*.35,'y'),'#b9c3cc',1.8)}
 if(p.type==='drain'){let q=add(p.pos,[0,0,0]);stroke([q,add(q,[0,-65,0])],'#b3a38c',6);stroke(circle3(add(q,[0,-55,0]),11,'y'),'#c39464',3)}
 if(sel&&p.type==='radiator'){
  const facing=FAN_SLOTS.find(slot=>slot.id===p.slot)?.end||1;
  const z=p.pos[2]+facing*(p.size[2]/2+1);
  const [x,y]=p.pos,[w,h]=p.size;
  stroke([[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],
          [x-w/2,y+h/2,z],[x-w/2,y-h/2,z]],'#f1c995',1.2,.75,[5,5]);
 }
  hitParts.push({id:p.id,...screen(p.pos)});
 }
const FAN_SLOTS=[
 {id:'front-left',short:'F·L',name:'Front panel · left',side:-1,end:1},
 {id:'front-right',short:'F·R',name:'Front panel · right',side:1,end:1},
 {id:'rear-left',short:'B·L',name:'Back panel · left',side:-1,end:-1},
 {id:'rear-right',short:'B·R',name:'Back panel · right',side:1,end:-1}
];
function bayGeometry(slot){
 const c=project.case,t=c.wood,mainW=c.width-2*c.doors; const centX=slot.side*(mainW/2-c.fanOpeningSide-c.fanOpeningWidth/2);
 const radX=slot.side*(mainW/2-(c.portFrontA+c.portFrontB)/2);
 const cy=c.fanOpeningBottom+c.fanOpeningHeight/2;
 const panelInside=slot.end*(c.depth/2-t);
 const panelOuter=slot.end*c.depth/2;
 return {centX,radX,cy,panelInside,panelOuter,
  fanZ:panelOuter-slot.end*(c.fanThickness||25.4)/2};
}
// Draw the two fan apertures per end panel in the actual frontal plane.
// Rings are a switchable reference layer, not a substitute for geometric holes.
function renderFanOpenings(){
 const c=project.case,t=c.wood;
 for(const slot of FAN_SLOTS){
  const b=bayGeometry(slot),z=b.panelInside-slot.end*1.5;
  for(let i=-1;i<=1;i++){
   const cent=[b.centX,b.cy+i*120,z];
   stroke(circle3(cent,59,'z'),'#86acc0',2,.80);
   stroke(circle3(cent,51,'z'),'#576c7e',1,.76);
   stroke(circle3(cent,11,'z'),'#b6cad4',1.4,.82);
   for(let j=0;j<4;j++){
    const a=(j+.5)*Math.PI/2;
    stroke([add(cent,[Math.cos(a)*45,Math.sin(a)*45,0]),add(cent,[Math.cos(a+Math.PI)*45,Math.sin(a+Math.PI)*45,0])],'#658598',.8,.65);
   }
  }
  if(project.display.labels)labelAt([b.centX,b.cy+(c.fanOpeningHeight||362)/2+13,z],slot.short+' cutout','#dbe7ef');
 }
}
// Primitive mesh for the wood and steel case, depth-sorted by face so that both
// front/back panels genuinely occlude the internal structure where they are solid.
function renderCabinetShell(){
 const c=project.case,t=c.wood,h=c.height,d=c.depth,mainW=c.width-2*c.doors,halfW=mainW/2;
 const rw=c.railWidth||50.8,rt=c.railThickness||t,q=c.divider; const holeW=c.fanOpeningWidth,holeH=c.fanOpeningHeight;
 const bottom=clamp(c.fanOpeningBottom,0,Math.max(0,h-holeH)),top=bottom+holeH;
 const hx=mainW/2-c.fanOpeningSide-holeW/2;
 const winW=Math.max(0,mainW-2*c.windowSide),winTop=h-c.windowTop;
 const winBottom=winTop-c.windowHeight,hasWindow=winW>0&&winTop>winBottom;
 const woodShades=['#613b24','#9f6d44','#6e442a','#a77850','#bd885a','#70452b'];
 const trimShades=['#71462a','#ae784d','#795033','#b5865e','#c38c5b','#75482d'];
 const items=[];
 function addBox(pos,size,palette=woodShades){
   const faces=boxFaces({pos,size});
   for(const f of faces){items.push({kind:'face',pts:f.pts,fill:palette[f.shade],depth:f.dep});}
 }
 function line(pts,col='#c99765',lw=1.6){items.push({kind:'line',pts,color:col,lw,depth:depth(pts.reduce((a,p)=>add(a,p),[0,0,0]).map(v=>v/pts.length))})}
 if(project.display.wood){
  // Exactly two SINGLE-SHEET panels. Each broad face is a Boolean
  // rectangle MINUS two apertures; the edge/tunnel faces represent thickness.
  const outerRect=z=>[[-halfW,0,z],[halfW,0,z],[halfW,h,z],[-halfW,h,z]];
 const holeRect=(xc,z)=>[[xc-holeW/2,bottom,z],[xc+holeW/2,bottom,z],
                         [xc+holeW/2,top,z],[xc-holeW/2,top,z]];
 const windowRect=z=>[[-winW/2,winBottom,z],[winW/2,winBottom,z],
                       [winW/2,winTop,z],[-winW/2,winTop,z]];
 // Solid walnut is divided into strips adjacent to openings, rather than
 // depth-sorting a single huge surface whose center is far from any fan.
 function panelFace(z,fill){
  const regions=[
   {x0:-hx-holeW/2,x1:-hx+holeW/2,y0:bottom,y1:top},
   {x0:hx-holeW/2,x1:hx+holeW/2,y0:bottom,y1:top}
  ];
  if(hasWindow)regions.push({x0:-winW/2,x1:winW/2,y0:winBottom,y1:winTop});
  const breaks=[0,h,...regions.flatMap(region=>[
   clamp(region.y0,0,h),clamp(region.y1,0,h)])]
   .sort((a,b)=>a-b).filter((v,i,arr)=>i===0||v-arr[i-1]>.001);
  const tile=(x0,x1,y0,y1)=>{
   if(x1-x0<=.001||y1-y0<=.001)return;
   const pts=[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]];
   items.push({kind:'face',pts,fill,depth:sceneDepth(pts)});
  };
  for(let i=1;i<breaks.length;i++){
   const y0=breaks[i-1],y1=breaks[i],midY=(y0+y1)/2;
   const cuts=regions.filter(region=>midY>=region.y0&&midY<=region.y1)
    .map(region=>[clamp(region.x0,-halfW,halfW),clamp(region.x1,-halfW,halfW)])
    .sort((a,b)=>a[0]-b[0]);
   let cursor=-halfW;
   for(const [x0,x1] of cuts){tile(cursor,x0,y0,y1);cursor=Math.max(cursor,x1)}
   tile(cursor,halfW,y0,y1);
  }
  const outlines=[outerRect(z),holeRect(-hx,z),holeRect(hx,z)];
  if(hasWindow)outlines.push(windowRect(z));
  for(const vertices of outlines){
   const pts=vertices.concat([vertices[0]]);
   items.push({kind:'line',pts,color:'#a97951',lw:.75,alpha:.82,depth:sceneDepth(pts)});
  }
 }
 function wall(aa,bb,cc,dd){const pts=[aa,bb,cc,dd];items.push({kind:'face',pts,fill:'#805031',depth:depth(pts.reduce((a,p)=>add(a,p),[0,0,0]).map(v=>v/4))})}
  for(const end of [-1,1]){
   const zInner=end*(d/2-t),zOuter=end*d/2;
   for(const z of [zInner,zOuter])panelFace(z,z===zOuter?'#9f7049':'#825a3e');
   for(const pair of [[[-halfW,0],[-halfW,h]],[[halfW,0],[halfW,h]],
                      [[-halfW,0],[halfW,0]],[[-halfW,h],[halfW,h]]]){
    const [[x0,y0],[x1,y1]]=pair;
    wall([x0,y0,zInner],[x1,y1,zInner],[x1,y1,zOuter],[x0,y0,zOuter]);
   }    for(const xc of [-hx,hx]){
     const x0=xc-holeW/2,x1=xc+holeW/2;
     for(const pair of [[[x0,bottom],[x0,top]],[[x1,bottom],[x1,top]],
                        [[x0,bottom],[x1,bottom]],[[x0,top],[x1,top]]]){
      const [[a,b],[e,f]]=pair;
      wall([a,b,zInner],[e,f,zInner],[e,f,zOuter],[a,b,zOuter]);
     }
    }
    if(hasWindow){
     const x0=-winW/2,x1=winW/2;
     for(const pair of [[[x0,winBottom],[x0,winTop]],[[x1,winBottom],[x1,winTop]],
                        [[x0,winBottom],[x1,winBottom]],[[x0,winTop],[x1,winTop]]]){
      const [[a,b],[e,f]]=pair;
      wall([a,b,zInner],[e,f,zInner],[e,f,zOuter],[a,b,zOuter]);
     }
    }
   }
   // SIX supports, ALL of them along the front-to-back Z axis:
  // x = left/center/right at bottom; x=center at divider; x=left/right at top.
  // Cross-section = 2" along X x 3/4" along vertical Y.
  const sideX=halfW-rw/2, length=d-2*t, z=0;
  const rails=[
   {x:-sideX,y:(c.lowerRailTop||rt)-rt/2},
   {x:0,y:(c.lowerRailTop||rt)-rt/2},
   {x:sideX,y:(c.lowerRailTop||rt)-rt/2},
   {x:0,y:q-rt/2},
   {x:-sideX,y:h-rt/2},
   {x:sideX,y:h-rt/2},
  ];
  for(const r of rails)addBox([r.x,r.y,z],[rw,rt,length],trimShades);
 }
 if(project.display.steel){
  // Steel partitions LEFT and RIGHT, not front and rear: the plane is X = 0.
  // It is captured in the bottom-center and middle-center 2" rails.
  const x=(c.steelZ||0), y0=c.lowerRailTop||rt,y1=q-rt,
    z0=-d/2+t,z1=d/2-t;
  if(y1>y0){
   for(const faceX of [x-1,x+1]){
    const points=[[faceX,y0,z0],[faceX,y0,z1],[faceX,y1,z1],[faceX,y1,z0]];
    items.push({kind:'face',pts:points,fill:'#344452',depth:depth([faceX,(y0+y1)/2,0])});
   }
   line([[x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0],[x,y0,z0]],'#637b86',1.4);
  }
 }
 // Queue front and back panels, exposed cutout edges, structural supports and divider.
 for(const it of items)sceneQueue.push(it);

}
function drawDoorOutlines(){
 const c=project.case,mainW=c.width-2*c.doors,halfW=mainW/2,t=c.doors;
 // Optional glazed side doors, shown open at approx. 90 degrees. Not load-bearing.
 for(const side of [-1,1]){
  const anchor=[side*(halfW+t/2),0,-c.depth/2],tip=[side*(halfW+t/2+c.depth),0,-c.depth/2];
  polygon([anchor,tip,add(tip,[0,c.height,0]),add(anchor,[0,c.height,0])],'#87b6cb12','#c6955d',2);
  if(project.display.labels)labelAt([side*(halfW+c.depth/2),c.height*.5,-c.depth/2],side===1?'Right door (open)':'Left door (open)','#e4c29b');
 }
}
function drawDimensions(){
 const c=project.case,w=c.width-2*c.doors,h=c.height,d=c.depth,q=c.divider;
 const dimension=(a,b,text)=>{stroke([a,b],'#e3ce9d',1.25,.95,[5,4]);labelAt(mix(a,b,.5),text,'#fce7ae')};
 dimension([-w/2,0,d/2+30],[w/2,0,d/2+30],`${(w/25.4).toFixed(1)}\" panels + two ${(c.doors/25.4).toFixed(2)}\" doors`);
 dimension([w/2+34,0,d/2],[w/2+34,h,d/2],`${(h/25.4).toFixed(1)}\" high`);
 dimension([w/2+62,0,-d/2],[w/2+62,0,d/2],`${(d/25.4).toFixed(1)}\" deep`);
 dimension([0,0,-d/2-28],[0,q,-d/2-28],`middle support top ${(q/25.4).toFixed(2)}\"`);
 dimension([-c.openW/2,h+13,0],[c.openW/2,h+13,0],`top opening ${(c.openW/25.4).toFixed(1)}\" × ${(c.openD/25.4).toFixed(1)}\"`);
}
function drawCase(){
 if(project.display.doors)drawDoorOutlines();
 renderCabinetShell();
 if(project.display.fans)renderFanOpenings();
}

function routePoints(rt){let a=portPos(rt.from),b=portPos(rt.to);if(!a||!b)return [];let way=[a];let current=a.slice();for(let axis of (rt.axis||'xzy')){let i={x:0,y:1,z:2}[axis];if(Math.abs(b[i]-current[i])>.01){current=current.slice();current[i]=b[i];way.push(current)}}if(dist(way[way.length-1],b)>.01)way.push(b);return way}
function roundPolyline(pts,R){if(pts.length<3)return pts;let out=[pts[0]];for(let i=1;i<pts.length-1;i++){let a=pts[i-1],b=pts[i],c=pts[i+1],u=sub(a,b),v=sub(c,b),L1=len(u),L2=len(v);if(L1<.1||L2<.1){out.push(b);continue}let radius=Math.min(R,L1*.44,L2*.44),p=mix(b,a,radius/L1),q=mix(b,c,radius/L2);out.push(p);for(let j=1;j<=11;j++){let t=j/12;out.push(add(add(scale(p,(1-t)*(1-t)),scale(b,2*(1-t)*t)),scale(q,t*t)))}out.push(q)}out.push(pts[pts.length-1]);return out}
function softPolyline(pts){if(pts.length<2)return pts;let out=[];for(let i=0;i<pts.length-1;i++){let a=pts[Math.max(0,i-1)],b=pts[i],c=pts[i+1],d=pts[Math.min(pts.length-1,i+2)];let L=dist(b,c),sag=Math.min(28,L*.095);for(let j=0;j<=16;j++){if(i>0&&j===0)continue;let t=j/16,t2=t*t,t3=t2*t;let p=[0,1,2].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3));p[1]-=sag*Math.sin(Math.PI*t);out.push(p)}}return out}
function lengthOf(pts){let v=0;for(let i=1;i<pts.length;i++)v+=dist(pts[i],pts[i-1]);return v}
function routeGeom(rt){let pts=routePoints(rt),smooth=rt.style==='soft'?softPolyline(pts):rt.style==='bend'?roundPolyline(pts,project.bendRadius):pts;let elbows=rt.style==='elbow'?Math.max(0,pts.length-2):0;return{pts,smooth,length:lengthOf(smooth),elbows}}
function renderTube(rt){let g=routeGeom(rt);if(g.smooth.length<2)return;let isSelected=selectedRoute===rt.id;let color=rt.style==='soft'?'#73d9f5':'#e3bc88';let width=clamp(project.tubeOD*screen([0,0,0]).sf*.62,3,20);stroke(g.smooth,'#060e16',width+3,.8);stroke(g.smooth,color,width,.90);stroke(g.smooth,'#ffffff',Math.max(.7,width*.17),.22);if(isSelected)stroke(g.smooth,'#fff6ca',1.6,1,[6,8]);if(rt.style==='elbow')for(let i=1;i<g.pts.length-1;i++){let v=screen(g.pts[i]);ctx.fillStyle='#e6e9ea';ctx.strokeStyle='#4c5963';ctx.lineWidth=2;ctx.beginPath();ctx.arc(v.x,v.y,width*.85+3,0,Math.PI*2);ctx.fill();ctx.stroke()}}
function labelAt(p,text,color='#dbe6eb',shift=0){let v=screen(p);ctx.font='600 12px system-ui';let tw=ctx.measureText(text).width;let x=v.x+10,y=v.y-9-shift;ctx.fillStyle='#111a22d9';ctx.fillRect(x-4,y-13,tw+8,19);ctx.fillStyle=color;ctx.fillText(text,x,y)}
function draw(){if(!ctx)return;const webgl=window.WalnutLoopWebGL?.active===true;let rect=$('viewport').getBoundingClientRect();W=Math.max(1,rect.width);H=Math.max(1,rect.height);const dd=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(W*dd)||canvas.height!==Math.round(H*dd)){canvas.width=Math.round(W*dd);canvas.height=Math.round(H*dd);canvas.style.width=W+'px';canvas.style.height=H+'px'}dpr=dd;ctx.setTransform(dd,0,0,dd,0,0);ctx.clearRect(0,0,W,H);hitPorts=[];hitParts=[];
 // The depth-tested renderer has its own grid. Keep the original for 2D fallback.
 if(!webgl)for(let u=-300;u<=300;u+=100){stroke([[u,0,-310],[u,0,310]],'#6b839b',.8,.19);stroke([[-330,0,u],[330,0,u]],'#6b839b',.8,.19)}
 const parts=renderedParts();
 const fans=project.display.caseOnly?[]:[
  ...parts.filter(p=>p.type==='radiator').flatMap(attachedFans),...freeBayFans()
 ];
 // One sorting pass for actual front/rear shell faces, radiators, fans, and rotor artwork.
 sceneQueue=[];
 drawCase();
 parts.forEach(renderPart);
 fans.forEach(renderPhysicalFan);
 const visibleIds=new Set(parts.map(p=>p.id));
 if(!project.display.caseOnly)for(const route of project.routes)
  if(visibleIds.has(route.from.split('.')[0])&&visibleIds.has(route.to.split('.')[0]))renderTube(route);
 if(webgl){
  // Forward the existing world-space surfaces to a genuine GPU Z-buffer.
  // Do not paint their projected 2D counterparts on top of the WebGL image.
  try{window.WalnutLoopWebGL.render(sceneQueue,view,{width:W,height:H,revision:sceneRevision,project});}
  catch(err){console.error('WebGL renderer failed; using 2D fallback.',err);
   window.WalnutLoopWebGL.setActive(false);sceneQueue=null;draw();return}
  sceneQueue=null;
 }else flushScene();
 if(project.display.dimensions)drawDimensions();
 if(project.display.ports&&!project.display.caseOnly)for(let p of parts)for(let port of p.ports){let k=key(p,port.id),pos=portPos(k),v=screen(pos);let highlighted=($('fromPort').value===k||$('toPort').value===k);if(!webgl){ctx.beginPath();ctx.arc(v.x,v.y,highlighted?6.7:4.8,0,Math.PI*2);ctx.fillStyle=highlighted?'#fff0b2':'#f4c99f';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#5f3826';ctx.stroke()}hitPorts.push({k,x:v.x,y:v.y,d:v.d})}
 if(project.display.labels&&!project.display.caseOnly){let arr=parts.filter(p=>p.type!=='tray');arr.forEach(p=>labelAt(add(p.pos,[0,p.size[1]/2+10,0]),p.name,p.id===selection?'#fbd3a1':'#d0dce8'));}
 $('viewStatus').textContent=(webgl?'WebGL / depth tested':isSvgMode?'SVG':'Canvas')+' · Drag to orbit · '+fans.length+' fans';$('staticPreview').style.display='none';}
function refreshPortSelect(){let ks=portKeys(),a=$('fromPort').value,b=$('toPort').value;for(let id of ['fromPort','toPort']){$(id).innerHTML='';for(let k of ks){let op=document.createElement('option');op.value=k;op.textContent=portLabel(k);$(id).appendChild(op)}}$('fromPort').value=ks.includes(a)?a:'res.out';$('toPort').value=ks.includes(b)?b:'pump.in'}
function refreshCase(){let fields=[['width','Outside width'],['height','Outside height'],['depth','Outside depth']];$('caseFields').innerHTML=fields.map(([id,name])=>`<div class="field"><label>${name} (mm)</label><input id="case_${id}" type="number" min="200" max="1400" step=".1" value="${project.case[id]}"></div>`).join('');
 let more=[['doors','Each side door (mm)'],['openW','Top opening width (mm)'],['openD','Top opening depth (mm)'],['railWidth','Support rail width (mm)'],['railThickness','Support rail thick. (mm)'],['lowerRailTop','Lower support top (mm)'],['portY','Radiator port height (mm)'],['portFrontA','Port 1 from side edge (mm)'],['portFrontB','Port 2 from side edge (mm)'],['fanOpeningWidth','Fan cutout width (mm)'],['fanOpeningHeight','Fan cutout height (mm)'],['fanOpeningBottom','Fan cutout bottom inset (mm)'],['fanOpeningSide','Fan cutout side inset (mm)'],['windowSide','Window side inset (mm)'],['windowTop','Window top inset (mm)'],['windowHeight','Window height (mm)'],['fanThickness','Fan bank thickness (mm)'],['steelZ','Steel divider X shift (mm)']];
 $('caseMeasuredFields').innerHTML=more.map(([id,name])=>`<div class="field"><label>${name}</label><input id="case_${id}" type="number" step=".1" value="${project.case[id]}"></div>`).join('');
 for(let [id] of fields.concat(more))$('case_'+id).addEventListener('change',e=>{let n=Number(e.target.value);if(Number.isFinite(n)&& (id==='steelZ'||n>0)){project.case[id]=n;if(id==='fanThickness')project.parts.filter(p=>p.type==='radiator').forEach(repositionRadiatorDepth);persist();refreshComponent();draw()}});
 $('wallThickness').value=project.case.wood;$('dividerHeight').value=project.case.divider;
}
// Exact 3D docking of the rear I/O bracket to the rear upper walnut window.
// Center the 310 mm wide rear panel in the 330.2 mm window, and put its
// back face 6 mm inward of the inner walnut wall. Preserve other parts.
function alignTrayToRearWindow(){
 const p=cpart('tray');if(!p)return;
 const c=project.case,behindEdge=-c.depth/2+c.wood+6;
 p.pos=[76,c.divider+p.size[1]/2,behindEdge+p.size[2]/2-2.5];
 changeModel();refreshComponent();
 toast('Tray aligned to the rear window and middle support.');
}
function refreshComponent(){sceneRevision++;let comp=cpart(selection)||project.parts[0];selection=comp.id;
 $('radiatorFanControls').style.display=comp.type==='radiator'?'block':'none';
 if(comp.type==='radiator'){
  comp.fans=comp.fans||{panel:3,inner:0};
  $('panelFanCount').value=String(comp.fans.panel);
  $('innerFanCount').value=String(comp.fans.inner);
  const t=project.case.fanThickness||25.4;
  $('radiatorFanSummary').textContent=(comp.fans.panel+comp.fans.inner)+
   ' attached fans · '+(comp.fans.panel||0)+' panel-facing / '+(comp.fans.inner||0)+
   ' inner-facing · total stack depth '+
   (comp.size[2]+(comp.fans.panel>0?t:0)+(comp.fans.inner>0?t:0)).toFixed(1)+' mm';
 }
 const isTray=comp.type==='tray';
 $('trayCutoutControls').style.display=isTray?'block':'none';
 if(isTray){
  const original=initial().parts.find(v=>v.id==='tray').cutout;
  comp.cutout={...original,...comp.cutout};
  const labels=[['x','X center','mm, + is right'],['z','Z center','mm, − toward rear'],['width','Width','mm'],['depth','Depth','mm']];
  $('trayCutoutFields').innerHTML=labels.map(([key,label,hint])=>
   '<div class="field"><label>'+label+'</label><input type="number" step="1" data-cutout="'+key+'" value="'+comp.cutout[key]+'" title="'+hint+'"></div>').join('');
  $('trayCutoutFields').querySelectorAll('[data-cutout]').forEach(el=>el.addEventListener('change',()=>{
   const key=el.dataset.cutout,n=Number(el.value);
   if(!Number.isFinite(n))return;
   comp.cutout[key]=key==='width'||key==='depth'?Math.max(20,n):n;
   changeModel();
  }));
 }
 refreshFreeBayControls();$('componentVisible').checked=comp.visible!==false;$('mountChooser').style.display=comp.type==='radiator'?'block':'none';if(comp.type==='radiator')$('mountSlot').value=comp.slot||'unmounted';$('componentSelect').innerHTML=project.parts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');$('componentSelect').value=selection;const axes=['X','Y','Z'];$('componentFields').innerHTML=comp.pos.map((x,i)=>`<div class="field"><label>${axes[i]} pos (mm)</label><input id="pos${i}" type="number" step="5" value="${r2(x)}"></div>`).join('')+comp.size.map((x,i)=>`<div class="field"><label>${axes[i]} size (mm)</label><input id="size${i}" type="number" min="1" step="1" value="${r2(x)}"></div>`).join('');for(let i=0;i<3;i++){const j=i;$('pos'+i).addEventListener('change',e=>{comp.pos[j]=Number(e.target.value)||0;changeModel();if(comp.type==='radiator')refreshComponent()});$('size'+i).addEventListener('change',e=>{comp.size[j]=Math.max(1,Number(e.target.value)||1);if(comp.type==='radiator'&&j===2)repositionRadiatorDepth(comp);changeModel();refreshComponent()})}$('componentNote').textContent=comp.note;
 $('portInfo').innerHTML=comp.ports.length?'<strong>Port positions (relative offsets):</strong><div class="help">Click a port dot in the viewer, or adjust its offsets below.</div>'+comp.ports.map((p,i)=>`<div class="help" style="margin:8px 0 3px">${p.name}: <b>${key(comp,p.id)}</b></div><div class="grid3">${p.off.map((v,j)=>`<div class="field"><label>${axes[j]} offset</label><input type="number" step="1" data-port="${i}" data-axis="${j}" value="${v}"></div>`).join('')}</div>`).join(''):'<span class="help">This component has no modeled water ports.</span>';
 $('portInfo').querySelectorAll('input').forEach(el=>el.addEventListener('change',e=>{comp.ports[+e.target.dataset.port].off[+e.target.dataset.axis]=Number(e.target.value)||0;changeModel()}));draw()}
function refreshFreeBayControls(){
 const root=$('freeBayControls');
 const available=FAN_SLOTS.filter(slot=>!project.parts.some(
  p=>p.type==='radiator'&&p.slot===slot.id&&p.visible!==false));
 $('freeBaySection').style.display=available.length?'block':'none';
 if(!available.length){root.replaceChildren();return}
 root.innerHTML=available.map(slot=>
  '<div class="freebay-row"><span>'+slot.name+'</span>'+
  '<label><span class="sr-only">Standalone fans for '+slot.name+'</span>'+
  '<select data-free-bay="'+slot.id+'">'+
  [0,1,2,3].map(n=>'<option value="'+n+'" '+(Number(project.fanOnly?.[slot.id])===n?'selected':'')+
  '>'+n+' fan'+(n===1?'':'s')+'</option>').join('')+
  '</select></label></div>').join('');
 root.querySelectorAll('[data-free-bay]').forEach(el=>el.addEventListener('change',()=>{
  project.fanOnly[el.dataset.freeBay]=Number(el.value);
  showCoolingModel();changeModel();
 }));
}
function changeModel(){sceneRevision++;persist();refreshPortSelect();refreshRouteList();refreshEstimate();refreshFreeBayControls();draw()}
function refreshRouteList(){let root=$('routeList');if(!project.routes.length){root.innerHTML='<div class="muted">No tubing routes yet. Select two ports and press Add route, or load the sample loop.</div>'}else{root.innerHTML=project.routes.map((rt,i)=>{let g=routeGeom(rt);return `<div class="route ${rt.id===selectedRoute?'selected':''}" data-route="${rt.id}"><div class="rtname">${i+1}. ${portLabel(rt.from)} → ${portLabel(rt.to)}<span class="rtdetail">${rt.style==='soft'?'Soft':rt.style==='bend'?'Hard, bends':'Hard, elbows'} · ${Math.round(g.length)} mm · ${g.elbows} elbow${g.elbows===1?'':'s'}</span></div><button class="small" data-select="${rt.id}">Edit</button></div>`}).join('');root.querySelectorAll('[data-select]').forEach(el=>el.addEventListener('click',()=>{selectedRoute=el.dataset.select;refreshRouteList();draw()}))}
 let rt=project.routes.find(r=>r.id===selectedRoute);$('routeEditor').style.display=rt?'block':'none';if(rt){$('editRouteStyle').value=rt.style;$('editRouteAxis').value=rt.axis}}
function estimate(){let tubes=0,straight=0,elbow=0,softLen=0,hardLen=0;let lengths=[];for(let rt of project.routes){let g=routeGeom(rt);tubes++;straight+=2;elbow+=g.elbows;if(rt.style==='soft')softLen+=g.length;else hardLen+=g.length;lengths.push(g.length)}let w=1+project.prices.waste/100;let sf=softLen*w/1000,hf=hardLen*w/1000,c1=straight*project.prices.fit,c2=elbow*project.prices.elbow,c3=sf*project.prices.soft,c4=hf*project.prices.hard,total=c1+c2+c3+c4+project.prices.other;return{total,straight,elbow,softLen,hardLen,sf,hf,c1,c2,c3,c4,lengths}}
function refreshEstimate(){let a=estimate();$('totalLength').textContent=((a.softLen+a.hardLen)/1000).toFixed(2)+' m';$('fittingCount').textContent=a.straight;$('elbowCount').textContent=a.elbow;let money=n=>'$'+n.toFixed(2);$('estimateRows').innerHTML=[['Port compressions',a.straight+' × '+money(project.prices.fit),a.c1],['Integrated 90° connectors',a.elbow+' × '+money(project.prices.elbow),a.c2],['Soft tubing',a.sf.toFixed(2)+' m',a.c3],['Hard tubing',a.hf.toFixed(2)+' m',a.c4],['Other / adapters','allowance',project.prices.other]].map(([n,detail,v])=>`<tr><td>${n}<small style="display:block;color:#8493a4">${detail}</small></td><td>${money(v)}</td></tr>`).join('');$('costTotal').textContent=money(a.total)}
function persist(){try{localStorage.setItem('walnutLoopLab05',JSON.stringify(project))}catch(e){}}
function updateAll(){sceneRevision++;refreshCase();refreshPortSelect();refreshComponent();refreshRouteList();refreshEstimate();for(let id of ['fit','elbow','soft','hard','waste','other'])$(id==='fit'?'fitPrice':id==='elbow'?'elbowPrice':id==='soft'?'softPrice':id==='hard'?'hardPrice':id==='waste'?'wastePct':'otherCost').value=project.prices[id];$('tubeOD').value=project.tubeOD;$('bendRadius').value=project.bendRadius;for(let [id,k] of [['woodBtn','wood'],['steelBtn','steel'],['labelsBtn','labels'],['fansBtn','fans'],['doorsBtn','doors'],['caseOnlyBtn','caseOnly'],['dimensionsBtn','dimensions'],['showPorts','ports'],['internalsBtn','internals']])$(id).classList.toggle('active',project.display[k]);draw()}
function saveFile(name,data,mime){let blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}function normalizeImport(p){let start=initial();let vals={...start,...p,case:{...start.case,...p.case},display:{...start.display,...p.display},prices:{...start.prices,...p.prices},fanOnly:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0,...p.fanOnly}};let slots={rad1:'front-right',rad2:'rear-right',rad3:'front-left',rad4:'rear-left'};vals.parts=vals.parts.map(a=>{
  if(a.type!=='radiator')return a;
  const previousNames={rad1:'Front panel, right radiator',rad2:'Front panel, left radiator',rad3:'Third radiator (unassigned)'};
  const readableNames={rad1:'Radiator 1',rad2:'Radiator 2',rad3:'Radiator 3',rad4:'Radiator 4'};
  return {...a,name:a.name===previousNames[a.id]?readableNames[a.id]:a.name,
   slot:a.slot||slots[a.id]||'unmounted',fans:{panel:3,inner:0,...a.fans}};
 });
 // Existing saved/imported projects get a fourth configurable radiator without
 // rearranging other radiators or overwriting customized fan counts.
 if(!vals.parts.some(part=>part.id==='rad4')){
  const fourth=JSON.parse(JSON.stringify(start.parts.find(part=>part.id==='rad4')));
  if(vals.parts.some(part=>part.type==='radiator'&&part.slot===fourth.slot&&part.visible!==false)){
   fourth.slot='unmounted';fourth.visible=false;
  }
  const afterRads=vals.parts.findIndex(part=>part.type!=='radiator');
  vals.parts.splice(afterRads<0?vals.parts.length:afterRads,0,fourth);
 }
 // Update untouched old 64 mm radiator body defaults to the measured 60 mm.
 // Preserve any custom depth/position and maintain the same panel-facing fan surface.
 for(const rad of vals.parts.filter(v=>v.type==='radiator'&&v.size?.[2]===64)){
  const slot=FAN_SLOTS.find(v=>v.id===rad.slot);
  const c=vals.case,fan=rad.fans?.panel>0?(c.fanThickness||25.4):0;
  const oldAuto=slot?slot.end*(c.depth/2-Math.max(c.wood,fan)-32):null;
  rad.size[2]=60;
  if(oldAuto!==null&&Math.abs(rad.pos[2]-oldAuto)<1)rad.pos[2]+=slot.end*2;
  for(const port of rad.ports||[])if(Math.abs(Math.abs(port.off[2])-33)<1)
   port.off[2]=Math.sign(port.off[2])*31;
 }
 const originalTray=vals.parts.find(v=>v.type==='tray');
 if(originalTray&&Math.abs(originalTray.size[1]-2)<.001){
  if(Math.abs(originalTray.pos[1]-(vals.case.divider+1))<1)
   originalTray.pos[1]=vals.case.divider+.825;
  originalTray.size[1]=1.65;
 }
 // v0.14: the stock default reservoir/pump used to straddle X=0 steel.
 // Change only unmodified old center positions, never a user's manual edits.
 const res=vals.parts.find(v=>v.id==='res');
 const pump=vals.parts.find(v=>v.id==='pump');
 if(res&&res.pos.length===3&&res.pos.every((v,i)=>Math.abs(v-[-12,300,55][i])<.01))
  res.pos=[-125,300,55];
 if(pump&&pump.pos.length===3&&pump.pos.every((v,i)=>Math.abs(v-[-12,104,70][i])<.01))
  pump.pos=[-125,104,70];
 // Tray opening is now a part property. Older projects inherit the improved
 // rear/right access-hole layout, without moving a manually positioned tray.
 if(originalTray){
  originalTray.cutout={...start.parts.find(v=>v.id==='tray').cutout,...originalTray.cutout};
  const old=[76,489.95,-70],newDefault=start.parts.find(v=>v.id==='tray').pos;
  if(originalTray.pos.length===3&&old.every((v,i)=>Math.abs(v-originalTray.pos[i])<.2))
   originalTray.pos=newDefault.slice();
 }
 // v0.11 puts the panel-facing fan inside the actual cutout. Move only
 // radiators still at the old auto-aligned depth; preserve manual Z offsets.
 if(!p.mountVersion){
  const c=vals.case,t=c.fanThickness||25.4;
  for(const rad of vals.parts.filter(x=>x.type==='radiator')){
   const mount=FAN_SLOTS.find(slot=>slot.id===rad.slot);
   if(!mount)continue;
   const offset=Number(rad.fans?.panel)>0?t:0,half=rad.size[2]/2;
   const oldZ=mount.end*(c.depth/2-c.wood-offset-half);
   const newZ=mount.end*(c.depth/2-Math.max(c.wood,offset)-half);
   if(!p.parts.some(a=>a.id===rad.id)||Math.abs(rad.pos[2]-oldZ)<1)
    rad.pos[2]=newZ;
  }
 }
 vals.mountVersion=1;
 // Upgrade unchanged old defaults while retaining custom saved dimensions.
 if(p.case&&!Object.prototype.hasOwnProperty.call(p.case,'fanOpeningBottom')){
  if(p.case.fanOpeningWidth===130)vals.case.fanOpeningWidth=122;
  if(p.case.fanOpeningHeight===370)vals.case.fanOpeningHeight=362;
 }
 // Upgrade the old 8.5-inch window default in imported and saved projects.
 // Other customized window heights are not changed.
 if(p.case&&p.case.windowHeight===215.9)vals.case.windowHeight=209.55;
 return vals}
function validateImport(p){if(!p||!p.case||!Array.isArray(p.parts)||!Array.isArray(p.routes)||!p.prices||!p.display)return false;if(!p.parts.every(x=>typeof x.id==='string'&&Array.isArray(x.pos)&&x.pos.length===3&&Array.isArray(x.size)&&x.size.length===3&&Array.isArray(x.ports)))return false;return true}
function alignRadiatorToOpening(r){
 const c=project.case,mainW=c.width-2*c.doors;
 const sl=FAN_SLOTS.find(s=>s.id===r.slot);
 if(!sl){r.visible=false;return}
 r.visible=true;
 r.size[0]=r.size[0]===64?135:r.size[0];
 r.size[2]=r.size[2]===135?60:r.size[2];
 const b=bayGeometry(sl),depthHalf=r.size[2]/2;
 r.pos=[b.radX,c.portY-r.size[1]/2,b.panelOuter-sl.end*(Math.max(c.wood,r.fans?.panel>0?(c.fanThickness||25.4):0)+depthHalf)];
 const near=sl.side*(mainW/2-c.portFrontA),far=sl.side*(mainW/2-c.portFrontB);
 r.ports[0].off=[near-b.radX,r.size[1]/2,-sl.end*(depthHalf+1)];
 r.ports[1].off=[far-b.radX,r.size[1]/2,-sl.end*(depthHalf+1)];
}
function syncMeasuredRadiators(){
 for(const r of project.parts.filter(p=>p.type==='radiator'))alignRadiatorToOpening(r);
 const tray=cpart('tray');if(tray)tray.pos[1]=project.case.divider+tray.size[1]/2;
}

function loadFourRadiatorPreset(){
 if(!confirm('Set all four radiator openings to three fans on each side? Existing radiator positions and fan counts will be replaced.'))return;
 const layout=['front-right','rear-right','front-left','rear-left'];
 const templates=initial().parts;
 layout.forEach((slot,i)=>{
  const id='rad'+(i+1);
  let rad=cpart(id);
  if(!rad){rad=JSON.parse(JSON.stringify(templates.find(p=>p.id===id)));project.parts.splice(i,0,rad)}
  rad.slot=slot;rad.visible=true;rad.fans={panel:3,inner:3};
  alignRadiatorToOpening(rad);
 });
 for(const slot of FAN_SLOTS)project.fanOnly[slot.id]=0;
 showCoolingModel();changeModel();refreshComponent();
 toast('Four radiators mounted: 3 + 3 fans each.');
}
function setRadiatorSlot(id,slot){let p=cpart(id);if(!p||p.type!=='radiator')return;
 if(slot!=='unmounted'){
  let incumbent=project.parts.find(q=>q!==p&&q.type==='radiator'&&q.slot===slot&&q.visible!==false);
  if(incumbent){toast('That opening is occupied by '+incumbent.name+'. Choose an empty opening.');$('mountSlot').value=p.slot||'unmounted';return}
 }
 p.slot=slot;alignRadiatorToOpening(p);project.routes=project.routes.filter(rt=>portPos(rt.from)&&portPos(rt.to));selectedRoute=null;showCoolingModel();changeModel();refreshComponent();
}
function addRoute(from,to,style,axis){if(!portPos(from)||!portPos(to)||from===to){toast('Select two different, valid ports.');return}let id='route_'+Date.now()+'_'+Math.floor(Math.random()*99999);project.routes.push({id,from,to,style,axis});selectedRoute=id;changeModel();toast('Route added. Select it in the list to change style.');}
function sampleRoutes(){if(project.routes.length&&!confirm('Replace existing tubing routes with a full-loop example?'))return;project.routes=[];let radiatorList=project.parts.filter(p=>p.type==='radiator'&&p.visible!==false).map(p=>p.id);let links=[['res.out','pump.in'],['pump.out','drain.in'],['drain.out',radiatorList[0]+'.in']];for(let i=0;i<radiatorList.length-1;i++)links.push([radiatorList[i]+'.out',radiatorList[i+1]+'.in']);links.push([radiatorList.at(-1)+'.out','cpu.in'],['cpu.out','gpu.in'],['gpu.out','res.in']);links.forEach(([from,to],i)=>project.routes.push({id:'example'+i,from,to,style:i<3?'soft':'bend',axis:i%2===0?'xzy':'zyx'}));selectedRoute=null;changeModel();toast('Loaded '+links.length+' example tubing runs. Layout is provisional.');}
function setView(yaw,pitch,zoom=.90){view.yaw=yaw;view.pitch=pitch;view.zoom=zoom;view.target=[0,345,0];view.pan=[0,0];for(let id of ['isoBtn','frontBtn','sideBtn','topBtn'])$(id).classList.remove('active');draw()}
function init(){enableRenderer(/iPad|iPhone|iPod/i.test(navigator.userAgent)||!nativeCtx?'svg':'canvas');syncMeasuredRadiators();try{const v=JSON.parse(localStorage.getItem('walnutLoopLab05'));if(validateImport(v)){project=normalizeImport(v);persist()}}catch(e){};
 $('saveBtn').onclick=()=>{saveFile('walnut-loop-project.json',JSON.stringify({...project,format:'walnut-loop-v5'},null,2),'application/json');toast('Project JSON downloaded.')};$('loadBtn').onclick=()=>$('fileInput').click();$('fileInput').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let v=JSON.parse(await f.text());if(!validateImport(v))throw Error('Invalid project');project=normalizeImport(v);selection=project.parts[0].id;selectedRoute=null;persist();updateAll();toast('Project imported.')}catch(e){toast('Could not import: '+e.message)}e.target.value=''};$('pngBtn').onclick=()=>{draw();if(window.WalnutLoopWebGL?.active){
    window.WalnutLoopWebGL.exportPng(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='walnut-loop-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)});
    return;
  }if(isSvgMode){const n=$('sceneSvg').cloneNode(true);n.setAttribute('xmlns','http://www.w3.org/2000/svg');saveFile('walnut-loop-view.svg',new XMLSerializer().serializeToString(n),'image/svg+xml');toast('SVG view downloaded.')}else canvas.toBlob(blob=>{if(!blob)return;let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='walnut-loop-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)},'image/png')};$('resetBtn').onclick=()=>{if(!confirm('Reset to the corrected front/back-panel cabinet and starter hardware?'))return;project=initial();syncMeasuredRadiators();selection='rad1';selectedRoute=null;persist();updateAll()};
 $('componentSelect').onchange=e=>{selection=e.target.value;const p=cpart(selection);if(p&&p.type!=='radiator'){project.display.caseOnly=false;showInternals(true)}persist();refreshComponent()};$('mountSlot').onchange=e=>setRadiatorSlot(selection,e.target.value);
 $('fourRadiatorsBtn').onclick=loadFourRadiatorPreset;
 $('alignTrayBtn').onclick=alignTrayToRearWindow;
 for(const [id,face] of [['panelFanCount','panel'],['innerFanCount','inner']]){
  $(id).onchange=e=>{
   const rad=cpart(selection);if(!rad||rad.type!=='radiator')return;
   rad.fans=rad.fans||{panel:3,inner:0};
   rad.fans[face]=clamp(Math.round(Number(e.target.value)||0),0,3);
   repositionRadiatorDepth(rad);
   showCoolingModel();changeModel();refreshComponent();
  };
 }
 $('showCoolingBtn').onclick=()=>{showCoolingModel();changeModel();toast('Cooling assemblies visible. Select a radiator to edit fans.');};$('componentVisible').onchange=e=>{let part=cpart(selection);if(!part)return;part.visible=e.target.checked;project.routes=project.routes.filter(rt=>portPos(rt.from)&&portPos(rt.to));selectedRoute=null;changeModel()};$('wallThickness').onchange=e=>{project.case.wood=clamp(Number(e.target.value),1,80);changeModel()};$('syncRads').onclick=()=>{syncMeasuredRadiators();showCoolingModel();persist();refreshComponent();changeModel();toast('Aligned installed radiators to front/back panel cutouts.');};$('dividerHeight').onchange=e=>{project.case.divider=clamp(Number(e.target.value),50,project.case.height-50);changeModel()};$('centerComponent').onclick=()=>{let p=cpart(selection);if(p)view.target=p.pos.slice();draw()};
 for(let [id,k] of [['woodBtn','wood'],['steelBtn','steel'],['labelsBtn','labels'],['fansBtn','fans'],['doorsBtn','doors'],['caseOnlyBtn','caseOnly'],['dimensionsBtn','dimensions'],['showPorts','ports'],['internalsBtn','internals']])$(id).onclick=()=>{project.display[k]=!project.display[k];$(id).classList.toggle('active',project.display[k]);changeModel()};
 $('addRoute').onclick=()=>addRoute($('fromPort').value,$('toPort').value,$('styleSelect').value,$('axisOrder').value);$('populateRoutes').onclick=sampleRoutes;
 $('editRouteStyle').onchange=e=>{let rt=project.routes.find(r=>r.id===selectedRoute);if(rt){rt.style=e.target.value;changeModel()}};$('editRouteAxis').onchange=e=>{let rt=project.routes.find(r=>r.id===selectedRoute);if(rt){rt.axis=e.target.value;changeModel()}};$('deleteRoute').onclick=()=>{project.routes=project.routes.filter(r=>r.id!==selectedRoute);selectedRoute=null;changeModel()};
 $('tubeOD').onchange=e=>{project.tubeOD=clamp(Number(e.target.value)||16,8,25);changeModel()};$('bendRadius').onchange=e=>{project.bendRadius=clamp(Number(e.target.value)||35,8,150);changeModel()};
 for(let [id,k] of [['fitPrice','fit'],['elbowPrice','elbow'],['softPrice','soft'],['hardPrice','hard'],['wastePct','waste'],['otherCost','other']])$(id).onchange=e=>{project.prices[k]=Math.max(0,Number(e.target.value)||0);changeModel()};
 $('rendererBtn').onclick=()=>{window.WalnutLoopWebGL?.setActive(false);enableRenderer(isSvgMode?'canvas':'svg')};
 $('isoBtn').onclick=()=>{setView(.58,.24,.90);$('isoBtn').classList.add('active')};$('frontBtn').onclick=()=>{setView(0,0,.95);$('frontBtn').classList.add('active')};$('sideBtn').onclick=()=>{setView(Math.PI/2,0,1);$('sideBtn').classList.add('active')};$('topBtn').onclick=()=>{setView(0,Math.PI/2-.001,.92);$('topBtn').classList.add('active')};
 canvas.addEventListener('pointerdown',e=>{isDragging=true;dragMoved=false;last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!isDragging)return;let dx=e.clientX-last[0],dy=e.clientY-last[1];if(Math.abs(dx)+Math.abs(dy)>1)dragMoved=true;if(e.shiftKey||e.buttons===2){view.pan[0]+=dx;view.pan[1]+=dy}else{view.yaw+=dx*.007;view.pitch=clamp(view.pitch-dy*.006,-1.4,1.4)}last=[e.clientX,e.clientY];draw()});canvas.addEventListener('pointerup',e=>{isDragging=false;if(dragMoved)return;let rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;let closest=hitPorts.filter(p=>Math.hypot(p.x-x,p.y-y)<15).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];if(closest){let id=portClicks%2===0?'fromPort':'toPort';$(id).value=closest.k;portClicks++;toast((id==='fromPort'?'From':'To')+': '+portLabel(closest.k));draw();return}let part=hitParts.filter(p=>Math.hypot(p.x-x,p.y-y)<30).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];if(part){selection=part.id;refreshComponent()}});canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=clamp(view.zoom*Math.exp(-e.deltaY*.0015),.28,4);draw()},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(draw).observe($('viewport'));else window.onresize=draw;
 updateAll();}
// The optional Three.js module attaches after this classic script. Old JSON,
// editor events and the existing Canvas/SVG fallback remain unchanged.
window.WalnutLoopRenderBridge={
 redraw:()=>draw(),
 selectLegacy:()=>enableRenderer('canvas'),
 invalidate:()=>{sceneRevision++;draw()}
};
try{init()}catch(error){
  const label=document.getElementById('viewStatus');if(label)label.textContent='Rendering failed: '+error.message+' · static preview shown';
  const pic=document.getElementById('staticPreview');if(pic)pic.style.display='block';
  console.error('Walnut planner rendering failed',error);
}
