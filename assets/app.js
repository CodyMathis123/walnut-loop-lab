'use strict';
const $=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), r2=n=>Math.round(n*100)/100;
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),scale=(a,s)=>a.map(x=>x*s),len=a=>Math.hypot(...a),dist=(a,b)=>len(sub(a,b)),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
// Small clearance avoids coplanar intersections between the walnut rail and tray.
const TRAY_CLEARANCE_MM=3;
const ITX_STANDOFF_MM=6.35, CPU_SOCKET_CLEAR_MM=6;
// Alphacool Core RX 9070 XT Hellhound/Pure #14782 datasheet measurements.
// Left tray edge overhang is intentional: the planned walnut cover/platform
// supports the GPU assembly and its rear display-output bracket.
const GPU_BLOCK_MM=[127.33,33.35,197];
const GPU_BACKPLATE_WIDTH_MM=98.8, GPU_PLATFORM_MM=8, GPU_RISER_MM=6;
const BOARD_SOCKET_OFFSET=[18,0,-6];
const initial=()=>({
  format:'walnut-loop-v23',
  case:{width:546.1,height:736.6,depth:508,wood:19.05,doors:19.05,openW:406.4,openD:469.9,railWidth:50.8,railThickness:19.05,divider:488.95,lowerRailTop:19.05,portY:463.55,portFrontA:76.2,portFrontB:139.7,steelWidth:254,steelZ:0,fanOpeningWidth:122,fanOpeningHeight:362,fanOpeningBottom:82.55,fanOpeningSide:44.45,windowSide:88.9,windowTop:38.1,windowHeight:209.55,fanThickness:25.4},
  parts:[
    {id:'rad1',name:'Radiator 1',type:'radiator',fans:{panel:3,inner:3},slot:'front-right',loop:'cpu',pos:[146,273.55,180],size:[135,380,60],ports:[{id:'in',name:'Near side',off:[31.75,190,-33]},{id:'out',name:'Far side',off:[-31.75,190,-33]}],note:'Radiator 1 starts on the front/right opening with three fans on each face. Port height and offsets follow provisional supplied measurements.'},
    {id:'rad2',name:'Radiator 2',type:'radiator',fans:{panel:3,inner:3},slot:'rear-right',loop:'cpu',pos:[-146,273.55,180],size:[135,380,60],ports:[{id:'in',name:'Near side',off:[-31.75,190,-33]},{id:'out',name:'Far side',off:[31.75,190,-33]}],note:'Radiator 2 starts on the rear/right opening with three fans on each face. Radiator depth and mounting can be calibrated later.'},
    {id:'rad3',name:'Radiator 3',type:'radiator',fans:{panel:3,inner:3},slot:'front-left',loop:'gpu',pos:[-146,273.55,180],size:[135,380,60],ports:[{id:'in',name:'Port A',off:[-31.75,190,-33]},{id:'out',name:'Port B',off:[31.75,190,-33]}],note:'Front-left radiator with three 120 mm fans on each side.'},
    {id:'rad4',name:'Radiator 4',type:'radiator',fans:{panel:3,inner:3},slot:'rear-left',loop:'gpu',pos:[-146,273.55,-180],size:[135,380,60],ports:[{id:'in',name:'Port A',off:[-31.75,190,33]},{id:'out',name:'Port B',off:[31.75,190,33]}],note:'Rear-left radiator with three 120 mm fans on each side.'},
    {id:'tray',name:'Mountain Mods ATX tray + 120 rear panel',type:'tray',pos:[8.57,492.775,-69.525],size:[276.86,1.65,323.85],cutout:{x:46,z:-96,width:120,depth:100},ports:[],note:'Mountain Mods ATXTOAB tray (10.9 × 12.75 in) and 120MOTRAY-BW rear I/O/PCI/fan panel. 1.65 mm aluminum. Rear panel geometry is an informed visual approximation.'},
    {id:'mobo',name:'GIGABYTE X570 I AORUS PRO WIFI · mock',type:'mobo',mountedTo:'tray',
     loop:'cpu',pos:[62.00,500.75,-136.45],size:[170,1.6,170],
     socketOffset:[18,0,-6],ports:[],
     note:'170 mm Mini-ITX AM4 mock inspired by GIGABYTE reference. Rear I/O toward −Z, PCIe left, two DIMMs toward front (+Z); socket center is approximate.'},
    {id:'cpu',name:'CPU water block · AM4 socket',type:'cpu',loop:'cpu',mountedTo:'mobo',
     pos:[80.00,519.05,-142.45],size:[65,23,65],ports:[{id:'in',name:'In',off:[-16,17,0]},{id:'out',name:'Out',off:[16,17,0]}],note:'CPU/AM4 block location follows schematic motherboard positioning; no measurements yet.'},
    {id:'gpu',name:'PowerColor Reaper RX 9070 XT · Alphacool Core #14782',type:'gpu',
     loop:'gpu',mountedTo:'tray',orientation:'horizontal',pos:[-91,524.275,-120.95],
     size:GPU_BLOCK_MM.slice(),pcbSize:[GPU_BACKPLATE_WIDTH_MM,1.6,197],platformThickness:GPU_PLATFORM_MM,
     ports:[{id:'in',name:'Right terminal · inlet',off:[GPU_BLOCK_MM[0]/2,8,-17]},
            {id:'out',name:'Right terminal · outlet',off:[GPU_BLOCK_MM[0]/2,8,17]}],
     note:'197 × 127.33 × 33.35 mm Alphacool #14782 block on the PowerColor Reaper; 197 × 98.8 mm backplate used as the approximate PCB footprint. GPU horizontal beside ITX board, rear display I/O toward -Z, PCIe edge to the left (-X), both coolant ports on the right (+X). Walnut mounting platform projects left of the tray; actual PCB and clearance measurements remain provisional.'},
    {id:'res',name:'GPU reservoir · left',type:'res',loop:'gpu',orientation:'vertical',pos:[-125,300,55],size:[72,238,72],ports:[{id:'in',name:'Bottom return',off:[-17,-119,0]},{id:'out',name:'Bottom supply',off:[17,-119,0]},{id:'top',name:'Top fill / vent',off:[0,119,0]}],note:'Left lower chamber, completely clear of the X=0 steel divider. Position and dimensions are provisional.'},
    {id:'pump',name:'GPU pump · left',type:'pump',loop:'gpu',pos:[-125,104,70],size:[76,65,76],ports:[{id:'in',name:'In',off:[0,37,0]},{id:'out',name:'Out',off:[39,5,0]}],note:'Pump location, inlet and outlet orientation are provisional. Maintain a reliable flooded pump inlet.'},
    {id:'drain',name:'GPU drain · left',type:'drain',loop:'gpu',pos:[-190,65,125],size:[55,26,36],ports:[{id:'in',name:'T branch',off:[-28,0,0]},{id:'out',name:'Capped outlet',off:[28,0,0]}],note:'Low-point drain tee with a capped/closed valve. Schematic mounting position.'},
    {id:'res2',name:'CPU reservoir · right',type:'res',loop:'cpu',orientation:'vertical',pos:[125,300,55],size:[72,238,72],ports:[{id:'in',name:'Bottom return',off:[-17,-119,0]},{id:'out',name:'Bottom supply',off:[17,-119,0]},{id:'top',name:'Top fill / vent',off:[0,119,0]}],note:'Right-side reservoir for dedicated CPU loop.'},
    {id:'pump2',name:'CPU pump · right',type:'pump',loop:'cpu',pos:[125,104,70],size:[76,65,76],ports:[{id:'in',name:'In',off:[0,37,0]},{id:'out',name:'Out',off:[39,5,0]}],note:'CPU DDC pump below its right-side reservoir.'},
    {id:'drain2',name:'CPU drain · right',type:'drain',loop:'cpu',pos:[190,65,125],size:[55,26,36],ports:[{id:'in',name:'T branch',off:[-28,0,0]},{id:'out',name:'Capped outlet',off:[28,0,0]}],note:'CPU-side low-point tee/drain with capped outlet.'}
  ],loopMode:'dual',singleHardwareSide:'right', routes:[],prices:{fit:4.95,elbow:10.95,soft:7,hard:13.33,waste:25,other:20},display:{wood:true,steel:true,labels:false,ports:false,fans:false,doors:false,caseOnly:false,internals:false,dimensions:false},fanOnly:{'front-left':0,'front-right':0,'rear-left':0,'rear-right':0},mountVersion:1,tubeOD:16,bendRadius:35});
let project=initial(); let selection='rad1',selectedRoute=null,portClicks=0;
let selectedWaypoint=-1,routeDrag=null;
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
function effectiveLoop(part){
 if(project.loopMode==='single')return 'shared';
 return part.loop||({rad1:'cpu',rad2:'cpu',rad3:'gpu',rad4:'gpu',cpu:'cpu',gpu:'gpu',
 res:'gpu',pump:'gpu',drain:'gpu',res2:'cpu',pump2:'cpu',drain2:'cpu'}[part.id])||'shared';
}
function portLoop(port){const p=cpart(port.split('.')[0]);return p?effectiveLoop(p):null}
function loopHardware(mode){return {res:mode==='cpu'?'res2':'res',pump:mode==='cpu'?'pump2':'pump',drain:mode==='cpu'?'drain2':'drain'}}
function portPos(k){let [id,pid]=k.split('.');let p=cpart(id),q=p&&p.ports.find(x=>x.id===pid);return p&&p.visible!==false&&q?add(p.pos,q.off):null}
function portLabel(k){let [id,pid]=k.split('.');let p=cpart(id),q=p&&p.ports.find(x=>x.id===pid);return p&&q?p.name+' · '+q.name:k}
// All reservoir ports remain visible, but the top fitting is a fill/vent
// opening and is deliberately NOT available for normal tubing routes.
function isFillVentPort(k){
 const [id,pid]=k.split('.');
 return pid==='top'&&cpart(id)?.type==='res';
}
function connectablePort(k){return !isFillVentPort(k)&&portPos(k)!==null}
function portKeys(){return project.parts.filter(p=>p.visible!==false)
 .flatMap(p=>p.ports.filter(port=>!(p.type==='res'&&port.id==='top'))
 .map(port=>key(p,port.id)))}
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
 return project.display.caseOnly?[]:project.parts.filter(p=>p.visible!==false&&(p.type==='radiator'||p.type==='tray'||p.type==='mobo'||p.type==='cpu'||p.type==='gpu'||['res','pump','drain'].includes(p.type)||project.display.internals));
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
   result.push({radiatorId:r.id,slot:slot.id,face,row,pos:[x,y+row*120,z]});
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
   result.push({slot:slot.id,face:'panel',row,pos:[b.centX,b.cy+row*120,b.fanZ]});
 }
 return result;
}
// Shared source of truth for rendering and clearance detection. It includes
// both sides of every installed radiator as well as fan-only empty bays.
function installedFans(){
 return [...project.parts.filter(p=>p.type==='radiator'&&p.visible!==false)
  .flatMap(attachedFans),...freeBayFans()];
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
 else if(p.type==='mobo'&&drawParts?.renderMotherboard)
  drawParts.renderMotherboard(p,geometryAPI);
 else if(p.type==='gpu'&&drawParts?.renderGPU)
  drawParts.renderGPU(p,geometryAPI);
 else if(p.type==='res'&&drawParts?.renderReservoir)drawParts.renderReservoir(p,geometryAPI);
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
 if(p.type==='res'&&!drawParts?.renderReservoir){const axis=p.orientation==='horizontal'?'z':'y',idx=axis==='y'?1:2;
 const offset=[0,0,0];offset[idx]=ps[idx]/2;
 const top=add(p.pos,offset),low=sub(p.pos,offset);
 stroke([low,top],'#70a7bc',4,.75);stroke(circle3(top,ps[0]*.35,axis),'#b9c3cc',1.8);stroke(circle3(low,ps[0]*.35,axis),'#b9c3cc',1.8)}
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

const routeTools=window.WalnutLoopRouting;
function fittingFor(k){
 const [id,pid]=k.split('.');
 const part=cpart(id),port=part?.ports?.find(p=>p.id===pid);
 return part&&port?routeTools.fitting(part,port,project.tubeOD):null;
}
function routeEnds(rt){
 const a=fittingFor(rt.from),b=fittingFor(rt.to);
 return a&&b?[a.tip,b.tip]:null;
}
function routeObstacles(rt,margin=10){
 const clearance=project.tubeOD/2+margin;
 // Do not skip the fans attached to an endpoint radiator. Their full 120 mm
 // square and physical thickness still occupy space around the radiator's
 // inlet/outlet, regardless of whether the fan is on the panel or inside face.
 return [
  ...routeTools.boxes(project.parts,
   [rt.from.split('.')[0],rt.to.split('.')[0]],clearance),
  // End-tank port centers are only 11 mm above the top fan frame in this
  // measured mockup. Use tube radius + 2 mm fan clearance rather than the
  // larger general-purpose component margin; otherwise legitimate radiator
  // connections start inside an inflated fan box and cannot be routed.
  ...routeTools.fanBoxes(installedFans(),project.case.fanThickness||25.4,
   project.tubeOD/2+2)
 ];
}
function routePoints(rt){
 const ends=routeEnds(rt);
 if(!ends)return [];
 const [a,b]=ends;
 if(Array.isArray(rt.waypoints))return [a,...rt.waypoints.map(p=>p.slice()),b];
 let way=[a],current=a.slice();
 for(const axis of (rt.axis||'xzy')){
  const i={x:0,y:1,z:2}[axis];
  if(Math.abs(b[i]-current[i])>.01){
   current=current.slice();current[i]=b[i];way.push(current);
  }
 }
 if(dist(way[way.length-1],b)>.01)way.push(b);
 return way;
}
function planRoute(rt){
 const ends=routeEnds(rt);
 if(!ends)return {points:null,blocked:['invalid-port'],reason:'ports'};
 // Preserve 8 mm tube radius plus ~10 mm general clearance. The tray
 // and motherboard AABBs receive an additional 9 mm in route-geometry.js.
 const blocks=routeObstacles(rt,10);
 // Route fitting end points first; even the soft-tube example must steer
 // around the motherboard, GPU, tray and other modeled components.
 return routeTools.plan(ends[0],ends[1],blocks);
}
function generateRoutePath(rt){
 const original=routePoints(rt),obstacles=routeObstacles(rt,18);
 // Prefer the user's selected X/Y/Z order whenever it already clears
 // component envelopes; detour only the paths that actually need it.
 if(original.length>=2&&!routeTools.collisions(original,obstacles).length){
  delete rt.waypoints;delete rt.blocked;
  return true;
 }
 const planned=planRoute(rt);
 if(planned.points){
  rt.waypoints=planned.points.slice(1,-1);
  delete rt.blocked;
  return true;
 }
 rt.blocked=planned.reason||'collision';
 // Leave no unsafe geometry to render.
 rt.waypoints=[];
 return false;
}
// A waypoint is a true world-space 3D coordinate; endpoints remain attached
// to real hardware ports. Existing automatic routes become editable on demand.
function editableRoute(rt){
 if(!Array.isArray(rt.waypoints))rt.waypoints=routePoints(rt).slice(1,-1);
 return rt.waypoints;
}
function pointSegmentDistance(x,y,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
 return {distance:Math.hypot(x-a.x-t*dx,y-a.y-t*dy),t};
}
function nearestRouteSegment(rt,x,y){
 const pts=routePoints(rt),arr=pts.map(screen);
 let best={distance:Infinity,index:-1,t:.5};
 for(let i=0;i<arr.length-1;i++){
  const hit=pointSegmentDistance(x,y,arr[i],arr[i+1]);
  if(hit.distance<best.distance)best={...hit,index:i};
 }
 return best;
}
function nearestRenderedRoute(x,y){
 let candidate=null;
 for(const rt of project.routes){
  if(!portPos(rt.from)||!portPos(rt.to))continue;
  const line=routeGeom(rt).smooth.map(screen);
  for(let i=0;i<line.length-1;i++){
   const hit=pointSegmentDistance(x,y,line[i],line[i+1]);
   if(hit.distance<15&&(!candidate||hit.distance<candidate.distance))
    candidate={route:rt,distance:hit.distance};
  }
 }
 return candidate;
}
function routePointWorldDelta(dx,dy,shift=false){
 const sf=screen([0,0,0]).sf||1,yaw=view.yaw,pitch=view.pitch;
 if(shift){
  // Shift + vertical drag moves along the camera-facing depth vector.
  const depth=(dy/sf)/Math.max(.22,Math.abs(Math.sin(pitch)));
  return [depth*Math.sin(yaw),0,depth*Math.cos(yaw)];
 }
 return [(dx/sf)*Math.cos(yaw),(-dy/sf)/Math.max(.2,Math.cos(pitch)),
         -(dx/sf)*Math.sin(yaw)];
}
function insertRoutePoint(rt,segmentIndex,t=.5){
 const wp=editableRoute(rt);
 const pts=routePoints(rt),i=clamp(segmentIndex,0,pts.length-2);
 const point=mix(pts[i],pts[i+1],t);
 wp.splice(i,0,point);delete rt.blocked;selectedRoute=rt.id;selectedWaypoint=i;
 return point;
}
function addSelectedRoutePoint(){
 const rt=project.routes.find(r=>r.id===selectedRoute);if(!rt)return;
 const pts=routePoints(rt);
 if(pts.length<2)return;
 let longest=0,index=0;
 for(let i=0;i<pts.length-1;i++){const d=dist(pts[i],pts[i+1]);if(d>longest){longest=d;index=i}}
 insertRoutePoint(rt,index,.5);changeModel();
}
function removeSelectedRoutePoint(){
 const rt=project.routes.find(r=>r.id===selectedRoute);
 if(!rt||selectedWaypoint<0)return;
 const wp=editableRoute(rt);if(selectedWaypoint>=wp.length)return;
 wp.splice(selectedWaypoint,1);selectedWaypoint=-1;changeModel();
}
function clearSelectedRoutePoints(){
 const rt=project.routes.find(r=>r.id===selectedRoute);if(!rt)return;
 delete rt.waypoints;delete rt.blocked;selectedWaypoint=-1;generateRoutePath(rt);changeModel();
}
function drawRouteHandles(){
 const rt=project.routes.find(r=>r.id===selectedRoute);
 if(!rt||project.display.caseOnly||!portPos(rt.from)||!portPos(rt.to))return;
 const pts=routePoints(rt);
 // Open circles for two fixed endpoints, draggable gold circles for bends.
 pts.forEach((point,i)=>{
  const v=screen(point),end=i===0||i===pts.length-1;
  ctx.beginPath();ctx.arc(v.x,v.y,end?5:8,0,Math.PI*2);
  ctx.fillStyle=end?'#15232b':i-1===selectedWaypoint?'#ffefb0':'#f3b86c';
  ctx.strokeStyle=end?'#b6d9df':'#171f28';ctx.lineWidth=2.5;
  ctx.fill();ctx.stroke();
 });
}
function roundPolyline(pts,R){if(pts.length<3)return pts;let out=[pts[0]];for(let i=1;i<pts.length-1;i++){let a=pts[i-1],b=pts[i],c=pts[i+1],u=sub(a,b),v=sub(c,b),L1=len(u),L2=len(v);if(L1<.1||L2<.1){out.push(b);continue}let radius=Math.min(R,L1*.44,L2*.44),p=mix(b,a,radius/L1),q=mix(b,c,radius/L2);out.push(p);for(let j=1;j<=11;j++){let t=j/12;out.push(add(add(scale(p,(1-t)*(1-t)),scale(b,2*(1-t)*t)),scale(q,t*t)))}out.push(q)}out.push(pts[pts.length-1]);return out}
function softPolyline(pts){if(pts.length<2)return pts;let out=[];for(let i=0;i<pts.length-1;i++){let a=pts[Math.max(0,i-1)],b=pts[i],c=pts[i+1],d=pts[Math.min(pts.length-1,i+2)];let L=dist(b,c),sag=Math.min(28,L*.095);for(let j=0;j<=16;j++){if(i>0&&j===0)continue;let t=j/16,t2=t*t,t3=t2*t;let p=[0,1,2].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3));p[1]-=sag*Math.sin(Math.PI*t);out.push(p)}}return out}
function lengthOf(pts){let v=0;for(let i=1;i<pts.length;i++)v+=dist(pts[i],pts[i-1]);return v}
function routeGeom(rt){
 if(rt.blocked)return {pts:[],smooth:[],length:0,elbows:0,collisions:[],blocked:true};
 const pts=routePoints(rt),obstacles=routeObstacles(rt,8);
 let smooth=rt.style==='soft'?softPolyline(pts):
  rt.style==='bend'?roundPolyline(pts,project.bendRadius):pts;
 // Tight curves can bow beyond otherwise-clear control points. Never silently
 // render that curve through a component; display the safe path instead.
 const clashes=routeTools.collisions(smooth,obstacles);
 const safe=!clashes.length;
 if(!safe&&routeTools.collisions(pts,obstacles).length===0)smooth=pts;
 const actual=routeTools.collisions(smooth,obstacles);
 const elbows=rt.style==='elbow'?Math.max(0,pts.length-2):0;
 return {pts,smooth,length:lengthOf(smooth),elbows,collisions:actual,
  blocked:actual.length>0,simplified:!safe&&!actual.length};
}
function renderTube(rt){
 const g=routeGeom(rt);
 if(g.smooth.length<2||rt.blocked)return;
 const chosen=selectedRoute===rt.id;
 const color=g.blocked?'#e66b62':rt.style==='soft'?'#65c9e5':'#cdb7a0';
 const outerRadius=project.tubeOD/2;
 if(sceneQueue){
  sceneQueue.push({kind:'tube',pts:g.smooth,color,radius:outerRadius});
  if(rt.style==='elbow')for(let i=1;i<g.pts.length-1;i++){
   const corner=g.pts[i],before=g.pts[i-1],after=g.pts[i+1];
   const take=Math.min(project.tubeOD*1.2,dist(corner,before)*.4,dist(corner,after)*.4);
   if(take<1)continue;
   sceneQueue.push({kind:'tube',pts:[
    mix(corner,before,take/dist(corner,before)),corner,
    mix(corner,after,take/dist(corner,after))],
    radius:outerRadius+1.8,color:'#899ba6'});
  }
 }else{
  const width=clamp(project.tubeOD*screen([0,0,0]).sf,3,26);
  stroke(g.smooth,'#101820',width+3,.95);
  stroke(g.smooth,color,width,1);
  stroke(g.smooth,'#ffffff',Math.max(.7,width*.13),.22);
  if(chosen)stroke(g.smooth,'#fff6ca',1.6,1,[6,8]);
 }
}
function renderPortFittings(parts){
 if(project.display.caseOnly)return;
 // A manually selected port elbow exists independently from its hose.
 // Connected ports receive an ordinary compression fitting by default.
 const endpoints=new Set(project.routes.filter(rt=>!rt.blocked)
  .flatMap(rt=>[rt.from,rt.to]));
 for(const part of parts){
  for(const port of part.ports){
   const k=part.id+'.'+port.id;
   if(isFillVentPort(k)||(!endpoints.has(k)&&!part.fittings?.[port.id]))continue;
   const fitting=fittingFor(k);if(!fitting)continue;
   if(sceneQueue){
    sceneQueue.push({kind:'tube',pts:fitting.points,
     radius:fitting.radius,color:'#879aa5'});
    sceneQueue.push({kind:'tube',pts:fitting.points.slice(0,2),
     radius:fitting.radius+2,color:'#ccd3d8'});
   }else{
    const width=clamp(fitting.radius*2*screen(fitting.base).sf,3,25);
    stroke(fitting.points,'#182029',width+3,.95);
    stroke(fitting.points,'#bfcbd4',width,.99);
   }
  }
 }
}
function labelAt(p,text,color='#dbe6eb',shift=0){let v=screen(p);ctx.font='600 12px system-ui';let tw=ctx.measureText(text).width;let x=v.x+10,y=v.y-9-shift;ctx.fillStyle='#111a22d9';ctx.fillRect(x-4,y-13,tw+8,19);ctx.fillStyle=color;ctx.fillText(text,x,y)}
function draw(){if(!ctx)return;const webgl=window.WalnutLoopWebGL?.active===true;let rect=$('viewport').getBoundingClientRect();W=Math.max(1,rect.width);H=Math.max(1,rect.height);const dd=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(W*dd)||canvas.height!==Math.round(H*dd)){canvas.width=Math.round(W*dd);canvas.height=Math.round(H*dd);canvas.style.width=W+'px';canvas.style.height=H+'px'}dpr=dd;ctx.setTransform(dd,0,0,dd,0,0);ctx.clearRect(0,0,W,H);hitPorts=[];hitParts=[];
 // The depth-tested renderer has its own grid. Keep the original for 2D fallback.
 if(!webgl)for(let u=-300;u<=300;u+=100){stroke([[u,0,-310],[u,0,310]],'#6b839b',.8,.19);stroke([[-330,0,u],[330,0,u]],'#6b839b',.8,.19)}
 const parts=renderedParts();
 const fans=project.display.caseOnly?[]:installedFans();
 // One sorting pass for actual front/rear shell faces, radiators, fans, and rotor artwork.
 sceneQueue=[];
 drawCase();
 parts.forEach(renderPart);
 fans.forEach(renderPhysicalFan);
 renderPortFittings(parts);
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
 drawRouteHandles();
 if(project.display.ports&&!project.display.caseOnly)for(let p of parts)for(let port of p.ports){let k=key(p,port.id),pos=portPos(k),v=screen(pos);let highlighted=($('fromPort').value===k||$('toPort').value===k);if(!webgl){ctx.beginPath();ctx.arc(v.x,v.y,highlighted?6.7:4.8,0,Math.PI*2);
 ctx.fillStyle=isFillVentPort(k)?'#829ba9':highlighted?'#fff0b2':'#f4c99f';
 ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#5f3826';ctx.stroke()}
 if(connectablePort(k))hitPorts.push({k,x:v.x,y:v.y,d:v.d})}
 if(project.display.labels&&!project.display.caseOnly){let arr=parts.filter(p=>p.type!=='tray');arr.forEach(p=>labelAt(add(p.pos,[0,p.size[1]/2+10,0]),p.name,p.id===selection?'#fbd3a1':'#d0dce8'));}
 $('viewStatus').textContent=(webgl?'WebGL / depth tested':isSvgMode?'SVG':'Canvas')+' · '+(selectedRoute?'Drag gold tubing points':'Drag to orbit')+' · '+fans.length+' fans';$('staticPreview').style.display='none';}
function refreshPortSelect(){let ks=portKeys(),a=$('fromPort').value,b=$('toPort').value;for(let id of ['fromPort','toPort']){$(id).innerHTML='';for(let k of ks){let op=document.createElement('option');op.value=k;op.textContent=portLabel(k);$(id).appendChild(op)}}const hardware=loopHardware(project.loopMode==='single'&&singleKitSide()==='right'?'cpu':'gpu');$('fromPort').value=ks.includes(a)?a:hardware.res+'.out';$('toPort').value=ks.includes(b)?b:hardware.pump+'.in'}
function refreshCase(){let fields=[['width','Outside width'],['height','Outside height'],['depth','Outside depth']];$('caseFields').innerHTML=fields.map(([id,name])=>`<div class="field"><label>${name} (mm)</label><input id="case_${id}" type="number" min="200" max="1400" step=".1" value="${project.case[id]}"></div>`).join('');
 let more=[['doors','Each side door (mm)'],['openW','Top opening width (mm)'],['openD','Top opening depth (mm)'],['railWidth','Support rail width (mm)'],['railThickness','Support rail thick. (mm)'],['lowerRailTop','Lower support top (mm)'],['portY','Radiator port height (mm)'],['portFrontA','Port 1 from side edge (mm)'],['portFrontB','Port 2 from side edge (mm)'],['fanOpeningWidth','Fan cutout width (mm)'],['fanOpeningHeight','Fan cutout height (mm)'],['fanOpeningBottom','Fan cutout bottom inset (mm)'],['fanOpeningSide','Fan cutout side inset (mm)'],['windowSide','Window side inset (mm)'],['windowTop','Window top inset (mm)'],['windowHeight','Window height (mm)'],['fanThickness','Fan bank thickness (mm)'],['steelZ','Steel divider X shift (mm)']];
 $('caseMeasuredFields').innerHTML=more.map(([id,name])=>`<div class="field"><label>${name}</label><input id="case_${id}" type="number" step=".1" value="${project.case[id]}"></div>`).join('');
 for(let [id] of fields.concat(more))$('case_'+id).addEventListener('change',e=>{let n=Number(e.target.value);if(Number.isFinite(n)&& (id==='steelZ'||n>0)){project.case[id]=n;if(id==='fanThickness')project.parts.filter(p=>p.type==='radiator').forEach(repositionRadiatorDepth);persist();refreshComponent();draw()}});
 $('wallThickness').value=project.case.wood;$('dividerHeight').value=project.case.divider;
}
// Exact 3D docking of the rear I/O bracket to the rear upper walnut window.
// Center the 310 mm wide rear panel in the 330.2 mm window, and put its
// back face 6 mm inward of the inner walnut wall. Preserve other parts.
// ITX bracket/CPU assembly. Geometry is measured from the adjustable tray.
function boardPoseForTray(tray,board){
 const x=tray.pos[0]+tray.size[0]/2-board.size[0]/2;
 const z=tray.pos[2]-tray.size[2]/2+10+board.size[2]/2;
 const y=tray.pos[1]+tray.size[1]/2+ITX_STANDOFF_MM+board.size[1]/2;
 return [x,y,z];
}
function gpuPoseForTray(tray,gpu){
 // rear bracket face coincides with the tray rear mounting flange.
 const rear=tray.pos[2]-tray.size[2]/2;
 const x=tray.pos[0]-99.57; // X = -91 mm on the measured default tray
 const y=tray.pos[1]+tray.size[1]/2+
   (gpu.platformThickness||GPU_PLATFORM_MM)+GPU_RISER_MM+gpu.size[1]/2;
 const z=rear+12+gpu.size[2]/2;
 return [x,y,z];
}
function alignGPUToTray(){
 const tray=cpart('tray'),gpu=cpart('gpu'),board=cpart('mobo');
 if(!tray||!gpu)return;
 const planned=gpuPoseForTray(tray,gpu);
 gpu.pos=planned;gpu.mountedTo='tray';
 changeModel();refreshComponent();
 const left=planned[0]-gpu.size[0]/2;
 const platformOverhang=Math.max(0,tray.pos[0]-tray.size[0]/2-left);
 toast('GPU placed on left walnut platform; '+platformOverhang.toFixed(1)+' mm extends beyond the metal tray.');
}
function socketBlockPose(board,cpu){
 const off=board.socketOffset||BOARD_SOCKET_OFFSET;
 return [board.pos[0]+off[0],
         board.pos[1]+board.size[1]/2+CPU_SOCKET_CLEAR_MM+cpu.size[1]/2,
         board.pos[2]+off[2]];
}
function moveAttachedParts(owner,delta){
 if(!delta.some(v=>Math.abs(v)>1e-9))return;
 for(const part of project.parts.filter(p=>p.mountedTo===owner)){
  part.pos=add(part.pos,delta);
  moveAttachedParts(part.id,delta);
 }
}
function alignMotherboardToTray(){
 const tray=cpart('tray'),board=cpart('mobo'),cpu=cpart('cpu');
 if(!tray||!board||!cpu)return;
 board.pos=boardPoseForTray(tray,board);board.mountedTo='tray';
 board.socketOffset=board.socketOffset||BOARD_SOCKET_OFFSET.slice();
 cpu.pos=socketBlockPose(board,cpu);cpu.mountedTo='mobo';
 changeModel();refreshComponent();
 toast('Mini-ITX board aligned to rear/right; block centered on AM4 socket.');
}
function alignTrayToRearWindow(){
 const p=cpart('tray');if(!p)return;
 const c=project.case,behindEdge=-c.depth/2+c.wood+6;
 const x=window.WalnutLoopPartGeometry.trayXForRearPanelCenter(0,p.size[0]);
 const before=p.pos.slice();
 p.pos=[x,c.divider+TRAY_CLEARANCE_MM+p.size[1]/2,behindEdge+p.size[2]/2-2.5];
 moveAttachedParts(p.id,sub(p.pos,before));
 changeModel();refreshComponent();
 toast('Tray aligned to the rear window and middle support.');
}
function setReservoirOrientation(p,orientation){
 if(!p||p.type!=='res'||!['vertical','horizontal'].includes(orientation))return;
 const current=p.orientation==='horizontal'?'horizontal':'vertical';
 if(current===orientation)return;
 const long=current==='vertical'?p.size[1]:p.size[2],diameter=p.size[0];
 const bottom=p.pos[1]-p.size[1]/2;
 const toHorizontal=current==='vertical';
 for(const port of p.ports){
  const [x,y,z]=port.off;
  port.off=toHorizontal?[x,z,-y]:[x,-z,y];
 }
 p.size=orientation==='vertical'?[diameter,long,diameter]:[diameter,diameter,long];
 p.pos[1]=bottom+p.size[1]/2;
 p.orientation=orientation;
}
// Both hardware kits always exist in the editor. A shared loop can use either
// kit alone; dual uses one kit on each side. The inactive kit is hidden.
function singleKitSide(){return project.singleHardwareSide==='left'?'left':'right'}
function syncLoopHardwareVisibility(){
 const dual=project.loopMode==='dual',side=singleKitSide();
 for(const id of ['res','pump','drain']){const p=cpart(id);if(p)p.visible=dual||side==='left'}
 for(const id of ['res2','pump2','drain2']){const p=cpart(id);if(p)p.visible=dual||side==='right'}
}
function refreshLoopSummary(){
 const single=project.loopMode==='single';
 $('loopMode').value=single?'single':'dual';
 $('singleHardwareSideRow').style.display=single?'block':'none';
 $('singleHardwareSide').value=singleKitSide();
 if(single){
  const side=singleKitSide(),kit=loopHardware(side==='left'?'gpu':'cpu');
  $('loopSummary').textContent='One shared CPU + GPU circuit · '+side+' pump + reservoir + drain · 4 radiators';
 }else{
  $('loopSummary').textContent='GPU loop: left pump/reservoir + 2 radiators · CPU loop: right pump/reservoir + 2 radiators';
 }
}
function applyLoopMode(mode,opts={}){
 if(!['single','dual'].includes(mode))return false;
 const side=opts.side||singleKitSide();
 if(!['left','right'].includes(side))return false;
 const switching=project.loopMode!==mode||singleKitSide()!==side;
 if(switching&&project.routes.length&&opts.confirmRoutes!==false&&
   !confirm('Switching cooling layout will clear the current tubing routes. Continue?')){
   refreshLoopSummary();return false;
 }
 if(switching){project.routes=[];selectedRoute=null}
 project.loopMode=mode;project.singleHardwareSide=side;
 syncLoopHardwareVisibility();
 project.display.caseOnly=false;
 changeModel();refreshComponent();
 return true;
}
function refreshComponent(){sceneRevision++;let comp=cpart(selection)||project.parts[0];selection=comp.id;
 const isRes=comp.type==='res',isRad=comp.type==='radiator';
 $('reservoirOrientationControls').style.display=isRes?'block':'none';
 if(isRes)$('reservoirOrientation').value=comp.orientation==='horizontal'?'horizontal':'vertical';
 $('radiatorLoopControls').style.display=isRad&&project.loopMode==='dual'?'block':'none';
 if(isRad)$('radiatorLoop').value=comp.loop||effectiveLoop(comp);
 refreshLoopSummary();
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
 $('motherboardControls').style.display=comp.type==='mobo'?'block':'none';
 $('gpuMountControls').style.display=comp.type==='gpu'?'block':'none';
 if(comp.type==='gpu'){
  const tray=cpart('tray'),mobo=cpart('mobo');
  const overhang=tray?Math.max(0,(tray.pos[0]-tray.size[0]/2)-
     (comp.pos[0]-comp.size[0]/2)):0;
  const edgeGap=mobo?mobo.pos[0]-mobo.size[0]/2-
    (comp.pos[0]+comp.size[0]/2):0;
  $('gpuMountSummary').textContent=
   'Alphacool #14782 · 197 × 127.33 × 33.35 mm; PCB/backplate proxy 197 × 98.8 mm. '+
   'Left block overhang: '+overhang.toFixed(1)+' mm past metal tray. '+
   'Motherboard edge clearance: '+edgeGap.toFixed(1)+' mm before fittings. '+
   'Rear I/O −Z · PCIe −X · G1/4 coolant ports +X.';
 }
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
 refreshFreeBayControls();$('componentVisible').checked=comp.visible!==false;$('mountChooser').style.display=comp.type==='radiator'?'block':'none';if(comp.type==='radiator')$('mountSlot').value=comp.slot||'unmounted';$('componentSelect').innerHTML=project.parts.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');$('componentSelect').value=selection;const axes=['X','Y','Z'];$('componentFields').innerHTML=comp.pos.map((x,i)=>`<div class="field"><label>${axes[i]} pos (mm)</label><input id="pos${i}" type="number" step="5" value="${r2(x)}"></div>`).join('')+comp.size.map((x,i)=>`<div class="field"><label>${axes[i]} size (mm)</label><input id="size${i}" type="number" min="1" step="1" value="${r2(x)}"></div>`).join('');for(let i=0;i<3;i++){const j=i;$('pos'+i).addEventListener('change',e=>{const before=comp.pos.slice();
 comp.pos[j]=Number(e.target.value)||0;
 moveAttachedParts(comp.id,sub(comp.pos,before));
 changeModel();if(['radiator','tray','mobo'].includes(comp.type))refreshComponent()});$('size'+i).addEventListener('change',e=>{comp.size[j]=Math.max(1,Number(e.target.value)||1);if(comp.type==='radiator'&&j===2)repositionRadiatorDepth(comp);changeModel();refreshComponent()})}$('componentNote').textContent=comp.note;
 $('portInfo').innerHTML=comp.ports.length?'<strong>Port positions (relative offsets):</strong><div class="help">Click a port dot in the viewer, or adjust its offsets below.</div>'+comp.ports.map((p,i)=>`<div class="help" style="margin:8px 0 3px">${p.name}: <b>${key(comp,p.id)}</b></div><div class="grid3">${p.off.map((v,j)=>`<div class="field"><label>${axes[j]} offset</label><input type="number" step="1" data-port="${i}" data-axis="${j}" value="${v}"></div>`).join('')}</div>
 ${comp.type==='res'&&p.id==='top'
  ?'<p class="help">Fill / vent port — no circulating tubing connection</p>'
  :`<div class="grid2" style="margin-top:6px">
 <div class="field"><label>Compression fitting</label>
 <select data-fit-port="${p.id}">
 <option value="straight" ${(comp.fittings?.[p.id]?.type||'straight')==='straight'?'selected':''}>Straight</option>
 <option value="45" ${comp.fittings?.[p.id]?.type==='45'?'selected':''}>45° swivel</option>
 <option value="90" ${comp.fittings?.[p.id]?.type==='90'?'selected':''}>90° swivel</option>
 </select></div>
 <div class="field"><label>Swivel rotation (°)</label>
 <input type="number" min="-360" max="360" step="15" data-fit-rotation="${p.id}"
 value="${comp.fittings?.[p.id]?.rotation||0}"></div></div>`}`).join(''):'<span class="help">This component has no modeled water ports.</span>';
 $('portInfo').querySelectorAll('input[data-port]').forEach(el=>el.addEventListener('change',e=>{
 comp.ports[+e.target.dataset.port].off[+e.target.dataset.axis]=Number(e.target.value)||0;changeModel()
 }));
 const updateFitting=(portId,update)=>{
  comp.fittings=comp.fittings||{};
  comp.fittings[portId]={type:'straight',rotation:0,...comp.fittings[portId],...update};
  // The exit point moves with the fitting. Existing explicit route handles
  // remain where placed and retain their attachment to the fitting tip.
  changeModel();
 };
 $('portInfo').querySelectorAll('select[data-fit-port]').forEach(el=>el.addEventListener('change',e=>{
  updateFitting(e.target.dataset.fitPort,{type:e.target.value});
 }));
 $('portInfo').querySelectorAll('input[data-fit-rotation]').forEach(el=>el.addEventListener('change',e=>{
  const n=Number(e.target.value);
  if(Number.isFinite(n))updateFitting(e.target.dataset.fitRotation,{rotation:clamp(n,-360,360)});
 }));
 draw()}
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
function changeModel(){sceneRevision++;persist();refreshLoopSummary();refreshPortSelect();refreshRouteList();refreshEstimate();refreshFreeBayControls();draw()}
function refreshRouteList(){let root=$('routeList');if(!project.routes.length){root.innerHTML='<div class="muted">No tubing routes yet. Select two ports and press Add route, or load the sample loop.</div>'}else{root.innerHTML=project.routes.map((rt,i)=>{let g=routeGeom(rt);return `<div class="route ${rt.id===selectedRoute?'selected':''}" data-route="${rt.id}"><div class="rtname">${i+1}. ${portLabel(rt.from)} → ${portLabel(rt.to)}<span class="rtdetail">${(rt.loop||portLoop(rt.from)).toUpperCase()} · ${rt.style==='soft'?'Soft':rt.style==='bend'?'Hard, bends':'Hard, elbows'} · ${g.blocked?'Clearance needed':Math.round(g.length)+' mm'} · ${g.elbows} elbow${g.elbows===1?'':'s'}</span></div><button class="small" data-select="${rt.id}">Edit</button></div>`}).join('');root.querySelectorAll('[data-select]').forEach(el=>el.addEventListener('click',()=>{selectedRoute=el.dataset.select;selectedWaypoint=-1;refreshRouteList();draw()}))}
 let rt=project.routes.find(r=>r.id===selectedRoute);$('routeEditor').style.display=rt?'block':'none';if(rt){$('editRouteStyle').value=rt.style;$('editRouteAxis').value=rt.axis;$('pointCount').textContent=(rt.waypoints?.length??Math.max(0,routePoints(rt).length-2))+' control points';$('deletePoint').disabled=selectedWaypoint<0}}
function estimate(){
 let straight=0,elbow=0,adapter=0,softLen=0,hardLen=0;
 const ports=new Set(project.routes.filter(r=>!r.blocked).flatMap(r=>[r.from,r.to]));
 for(const p of project.parts.filter(part=>part.visible!==false)){
  for(const [id] of Object.entries(p.fittings||{})){
   if(!isFillVentPort(p.id+'.'+id))ports.add(p.id+'.'+id);
  }
 }
 for(const k of ports){
  if(isFillVentPort(k))continue;
  straight++;
  if(fittingFor(k)?.type!=='straight')adapter++;
 }
 for(const rt of project.routes){
  const g=routeGeom(rt);
  if(g.blocked)continue;
  elbow+=g.elbows;
  if(rt.style==='soft')softLen+=g.length;else hardLen+=g.length;
 }
 const w=1+project.prices.waste/100;
 const sf=softLen*w/1000,hf=hardLen*w/1000;
 const c1=straight*project.prices.fit;
 const c2=(elbow+adapter)*project.prices.elbow;
 const c3=sf*project.prices.soft,c4=hf*project.prices.hard;
 const total=c1+c2+c3+c4+project.prices.other;
 return {total,straight,elbow,adapter,softLen,hardLen,sf,hf,c1,c2,c3,c4};
}
function refreshEstimate(){let a=estimate();$('totalLength').textContent=((a.softLen+a.hardLen)/1000).toFixed(2)+' m';$('fittingCount').textContent=a.straight;$('elbowCount').textContent=a.elbow+a.adapter;let money=n=>'$'+n.toFixed(2);$('estimateRows').innerHTML=[['Port compressions',a.straight+' × '+money(project.prices.fit),a.c1],['Tube elbows + port swivels',a.elbow+' tube + '+a.adapter+' angled port × '+money(project.prices.elbow),a.c2],['Soft tubing',a.sf.toFixed(2)+' m',a.c3],['Hard tubing',a.hf.toFixed(2)+' m',a.c4],['Other / adapters','allowance',project.prices.other]].map(([n,detail,v])=>`<tr><td>${n}<small style="display:block;color:#8493a4">${detail}</small></td><td>${money(v)}</td></tr>`).join('');$('costTotal').textContent=money(a.total)}
// Intentionally no automatic draft persistence during greenfield iteration.
function persist(){}
function updateAll(){sceneRevision++;refreshLoopSummary();refreshCase();refreshPortSelect();refreshComponent();refreshRouteList();refreshEstimate();for(let id of ['fit','elbow','soft','hard','waste','other'])$(id==='fit'?'fitPrice':id==='elbow'?'elbowPrice':id==='soft'?'softPrice':id==='hard'?'hardPrice':id==='waste'?'wastePct':'otherCost').value=project.prices[id];$('tubeOD').value=project.tubeOD;$('bendRadius').value=project.bendRadius;for(let [id,k] of [['woodBtn','wood'],['steelBtn','steel'],['labelsBtn','labels'],['fansBtn','fans'],['doorsBtn','doors'],['caseOnlyBtn','caseOnly'],['dimensionsBtn','dimensions'],['showPorts','ports'],['internalsBtn','internals']])$(id).classList.toggle('active',project.display[k]);draw()}
function saveFile(name,data,mime){let blob=new Blob([data],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}// Greenfield editor: imports are current-format snapshots, never upgraded.
// Re-opening the page intentionally starts with initial() rather than restoring
// older drafts. Export JSON explicitly to keep a particular experiment.
function normalizeImport(p){
 if(!validateImport(p))throw Error('Expected a current-format Walnut Loop Lab project');
 return JSON.parse(JSON.stringify(p));
}
function validateImport(p){
 if(!p||p.format!=='walnut-loop-v23'||!p.case||!p.display||!p.prices||
    !Array.isArray(p.parts)||!Array.isArray(p.routes)||
    !['dual','single'].includes(p.loopMode))return false;
 const required=initial().parts.map(part=>part.id);
 const ids=p.parts.map(part=>part?.id);
 if(ids.length!==required.length||new Set(ids).size!==required.length||
    required.some(id=>!ids.includes(id)))return false;
 return p.parts.every(part=>typeof part.id==='string' &&
   Array.isArray(part.pos)&&part.pos.length===3&&part.pos.every(Number.isFinite)&&
   Array.isArray(part.size)&&part.size.length===3&&part.size.every(n=>Number.isFinite(n)&&n>0)&&
   Array.isArray(part.ports)) &&
   // Imported sketches follow the same rule as interactive routing.
   p.routes.every(route=>{
    if(typeof route?.from!=='string'||typeof route?.to!=='string')return false;
    return ![route.from,route.to].some(k=>{
     const [id,pid]=k.split('.');
     return pid==='top'&&p.parts.find(part=>part.id===id)?.type==='res';
    });
   });
}
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
 // TFC X-Changer G1/4 ports occupy the broad inward-facing FRONT surface
 // of the upper end tank; never place them on the horizontal tank cap.
 const portY=r.size[1]/2-9;
 r.ports[0].off=[near-b.radX,portY,-sl.end*(depthHalf+1)];
 r.ports[1].off=[far-b.radX,portY,-sl.end*(depthHalf+1)];
}
function syncMeasuredRadiators(){
 for(const r of project.parts.filter(p=>p.type==='radiator'))alignRadiatorToOpening(r);
 const tray=cpart('tray');
 if(tray){
  const before=tray.pos.slice();
  tray.pos[1]=project.case.divider+TRAY_CLEARANCE_MM+tray.size[1]/2;
  moveAttachedParts(tray.id,sub(tray.pos,before));
 }
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
function addRoute(from,to,style,axis){
 if(isFillVentPort(from)||isFillVentPort(to)){
  toast('Reservoir top ports are fill/vent only; connect tubing to the two bottom ports.');
  return;
 }
 if(!connectablePort(from)||!connectablePort(to)||from===to){
  toast('Select two different, valid ports.');return
 }if(project.loopMode==='dual'&&portLoop(from)!==portLoop(to)){toast('GPU and CPU loops are separate; select ports in the same loop.');return}let id='route_'+Date.now()+'_'+Math.floor(Math.random()*99999);const route={id,from,to,style,axis,loop:portLoop(from)};
 const safe=generateRoutePath(route);
 project.routes.push(route);selectedRoute=id;selectedWaypoint=-1;
 changeModel();toast(safe?'Route added with component clearance.':'No clear automatic path. Adjust component positions or add points.');}
function sampleRoutes(){
 if(project.routes.length&&!confirm('Replace existing routes with '+project.loopMode+'-loop examples?'))return;
 const links=[];
 function chain(mode,hardware,block){
  const rad=project.parts.filter(p=>p.type==='radiator'&&p.visible!==false&&effectiveLoop(p)===mode);
  if(!rad.length)return [];
  const steps=[[hardware.res+'.out',hardware.pump+'.in'],
    [hardware.pump+'.out',rad[0].id+'.in']];
  for(let i=1;i<rad.length;i++)steps.push([rad[i-1].id+'.out',rad[i].id+'.in']);
  const last=rad[rad.length-1].id;
  if(block==='both')steps.push([last+'.out','gpu.in'],['gpu.out','cpu.in'],['cpu.out',hardware.res+'.in']);
  else steps.push([last+'.out',block+'.in'],[block+'.out',hardware.res+'.in']);
  // Drain is a tee branch from the pump outlet, NOT part of the main circuit.
  // Its outlet remains capped; opening this valve is a separate maintenance action.
  steps.push([hardware.pump+'.out',hardware.drain+'.in']);
  return steps;
 }
 if(project.loopMode==='dual'){
  for(const mode of ['gpu','cpu'])for(const ports of chain(mode,loopHardware(mode),mode))
   links.push({ports,mode});
 }else for(const ports of chain('shared',loopHardware(singleKitSide()==='right'?'cpu':'gpu'),'both'))
  links.push({ports,mode:'shared'});
 // Sample topology follows the active cooling layout, while geometry uses
 // exactly the tubing style and routing axis currently selected by the user.
 const chosenStyle=['soft','bend','elbow'].includes($('styleSelect').value)
  ?$('styleSelect').value:'soft';
 const chosenAxis=['xzy','zyx','yxz','xyz'].includes($('axisOrder').value)
  ?$('axisOrder').value:'xzy';
 project.routes=links.filter(({ports})=>connectablePort(ports[0])&&connectablePort(ports[1]))
  .map(({ports,mode},i)=>({id:'example'+i,from:ports[0],to:ports[1],
   loop:mode,style:chosenStyle,axis:chosenAxis}));
 const unresolved=project.routes.filter(rt=>!generateRoutePath(rt)).length;
 selectedRoute=null;selectedWaypoint=-1;changeModel();
 toast('Generated '+(project.routes.length-unresolved)+' clearance-aware '+chosenStyle+
  ' routes'+(unresolved?' · '+unresolved+' need manual placement (not drawn)':'')+
  '; fill/vent ports stay free.');
}
function setView(yaw,pitch,zoom=.90){view.yaw=yaw;view.pitch=pitch;view.zoom=zoom;view.target=[0,345,0];view.pan=[0,0];for(let id of ['isoBtn','frontBtn','sideBtn','topBtn'])$(id).classList.remove('active');draw()}
function init(){enableRenderer(/iPad|iPhone|iPod/i.test(navigator.userAgent)||!nativeCtx?'svg':'canvas');syncMeasuredRadiators();syncLoopHardwareVisibility();
 // v0.18 intentionally discards old browser drafts; no automatic restore.
 try{localStorage.removeItem('walnutLoopLab05')}catch(e){}
 $('saveBtn').onclick=()=>{saveFile('walnut-loop-project.json',JSON.stringify({...project,format:'walnut-loop-v23'},null,2),'application/json');toast('Project JSON downloaded.')};$('loadBtn').onclick=()=>$('fileInput').click();$('fileInput').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let v=JSON.parse(await f.text());if(!validateImport(v))throw Error('Invalid project');project=normalizeImport(v);selection=project.parts[0].id;selectedRoute=null;persist();updateAll();toast('Project imported.')}catch(e){toast('Could not import: '+e.message)}e.target.value=''};$('pngBtn').onclick=()=>{draw();if(window.WalnutLoopWebGL?.active){
    window.WalnutLoopWebGL.exportPng(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='walnut-loop-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)});
    return;
  }if(isSvgMode){const n=$('sceneSvg').cloneNode(true);n.setAttribute('xmlns','http://www.w3.org/2000/svg');saveFile('walnut-loop-view.svg',new XMLSerializer().serializeToString(n),'image/svg+xml');toast('SVG view downloaded.')}else canvas.toBlob(blob=>{if(!blob)return;let url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='walnut-loop-view.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)},'image/png')};$('resetBtn').onclick=()=>{if(!confirm('Reset to the corrected front/back-panel cabinet and starter hardware?'))return;project=initial();syncMeasuredRadiators();selection='rad1';selectedRoute=null;persist();updateAll()};
 $('componentSelect').onchange=e=>{selection=e.target.value;const p=cpart(selection);if(p&&!['radiator','mobo','cpu','res','pump','drain'].includes(p.type)){project.display.caseOnly=false;showInternals(true)}persist();refreshComponent()};$('mountSlot').onchange=e=>setRadiatorSlot(selection,e.target.value);
 $('fourRadiatorsBtn').onclick=loadFourRadiatorPreset;
 $('alignTrayBtn').onclick=alignTrayToRearWindow;
 $('alignBoardBtn').onclick=alignMotherboardToTray;
 $('alignBoardSelectedBtn').onclick=alignMotherboardToTray;
 $('alignGpuBtn').onclick=alignGPUToTray;
 $('loopMode').onchange=e=>applyLoopMode(e.target.value);
 $('singleHardwareSide').onchange=e=>applyLoopMode('single',{side:e.target.value});
 $('reservoirOrientation').onchange=e=>{
  const part=cpart(selection);
  if(!part||part.type!=='res')return;
  setReservoirOrientation(part,e.target.value);changeModel();refreshComponent();
 };
 $('radiatorLoop').onchange=e=>{
  const part=cpart(selection);if(!part||part.type!=='radiator')return;
  if(!['cpu','gpu'].includes(e.target.value))return;
  if(project.routes.length&&!confirm('Changing radiator ownership will remove tubing routes connected to it. Continue?')){
   e.target.value=part.loop||effectiveLoop(part);return;
  }
  project.routes=project.routes.filter(rt=>!rt.from.startsWith(part.id+'.')&&!rt.to.startsWith(part.id+'.'));
  part.loop=e.target.value;selectedRoute=null;changeModel();refreshComponent();
 };
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
 $('editRouteStyle').onchange=e=>{let rt=project.routes.find(r=>r.id===selectedRoute);if(rt){rt.style=e.target.value;changeModel()}};$('editRouteAxis').onchange=e=>{let rt=project.routes.find(r=>r.id===selectedRoute);if(rt){rt.axis=e.target.value;changeModel()}};$('deleteRoute').onclick=()=>{project.routes=project.routes.filter(r=>r.id!==selectedRoute);selectedRoute=null;selectedWaypoint=-1;changeModel()};
 $('addPoint').onclick=addSelectedRoutePoint;
 $('deletePoint').onclick=removeSelectedRoutePoint;
 $('autoRoute').onclick=clearSelectedRoutePoints;
 $('tubeOD').onchange=e=>{project.tubeOD=clamp(Number(e.target.value)||16,8,25);changeModel()};$('bendRadius').onchange=e=>{project.bendRadius=clamp(Number(e.target.value)||35,8,150);changeModel()};
 for(let [id,k] of [['fitPrice','fit'],['elbowPrice','elbow'],['softPrice','soft'],['hardPrice','hard'],['wastePct','waste'],['otherCost','other']])$(id).onchange=e=>{project.prices[k]=Math.max(0,Number(e.target.value)||0);changeModel()};
 $('rendererBtn').onclick=()=>{window.WalnutLoopWebGL?.setActive(false);enableRenderer(isSvgMode?'canvas':'svg')};
 $('isoBtn').onclick=()=>{setView(.58,.24,.90);$('isoBtn').classList.add('active')};$('frontBtn').onclick=()=>{setView(0,0,.95);$('frontBtn').classList.add('active')};$('sideBtn').onclick=()=>{setView(Math.PI/2,0,1);$('sideBtn').classList.add('active')};$('topBtn').onclick=()=>{setView(0,Math.PI/2-.001,.92);$('topBtn').classList.add('active')};
 function canvasPoint(e){
 const rect=canvas.getBoundingClientRect();
 return [e.clientX-rect.left,e.clientY-rect.top];
}
canvas.addEventListener('pointerdown',e=>{
 isDragging=true;dragMoved=false;last=[e.clientX,e.clientY];routeDrag=null;
 const [x,y]=canvasPoint(e);
 if(!project.display.caseOnly&&e.button!==2){
  const rt=project.routes.find(r=>r.id===selectedRoute);
  if(rt&&portPos(rt.from)&&portPos(rt.to)){
   const pts=routePoints(rt);
   for(let i=1;i<pts.length-1;i++){
    const v=screen(pts[i]);
    if(Math.hypot(v.x-x,v.y-y)<17){
     editableRoute(rt);selectedWaypoint=i-1;
     routeDrag={route:rt,index:i-1};
     break;
    }
   }
  }
  if(!routeDrag){
   const hit=nearestRenderedRoute(x,y);
   if(hit){
    const target=hit.route;
    // Clicking a tube creates an editable bend at the nearest control segment.
    const seg=nearestRouteSegment(target,x,y);
    if(seg.index>=0){
     insertRoutePoint(target,seg.index,seg.t);
     routeDrag={route:target,index:selectedWaypoint};
     refreshRouteList();sceneRevision++;draw();
    }
   }
  }
 }
 if(routeDrag){selectedRoute=routeDrag.route.id;refreshRouteList();draw()}
 canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!isDragging)return;
 const dx=e.clientX-last[0],dy=e.clientY-last[1];
 if(Math.abs(dx)+Math.abs(dy)>1)dragMoved=true;
 if(routeDrag){
  const wp=routeDrag.route.waypoints?.[routeDrag.index];
  if(wp){const delta=routePointWorldDelta(dx,dy,!!e.shiftKey);
   routeDrag.route.waypoints[routeDrag.index]=add(wp,delta);
   sceneRevision++;draw();
  }
 }else if(e.shiftKey||e.buttons===2){
  view.pan[0]+=dx;view.pan[1]+=dy;draw();
 }else{
  view.yaw+=dx*.007;view.pitch=clamp(view.pitch-dy*.006,-1.4,1.4);draw();
 }
 last=[e.clientX,e.clientY];
});
canvas.addEventListener('pointerup',e=>{
 const edited=!!routeDrag;routeDrag=null;isDragging=false;
 if(edited){changeModel();return}
 if(dragMoved)return;
 const [x,y]=canvasPoint(e);
 const closest=hitPorts.filter(p=>Math.hypot(p.x-x,p.y-y)<15)
  .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
 if(closest){
  let id=portClicks%2===0?'fromPort':'toPort';$(id).value=closest.k;portClicks++;
  toast((id==='fromPort'?'From':'To')+': '+portLabel(closest.k));draw();return;
 }
 const part=hitParts.filter(p=>Math.hypot(p.x-x,p.y-y)<30)
  .sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
 if(part){selection=part.id;refreshComponent()}
});
canvas.addEventListener('pointercancel',()=>{
 if(routeDrag){routeDrag=null;changeModel()}isDragging=false;
});
canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=clamp(view.zoom*Math.exp(-e.deltaY*.0015),.28,4);draw()},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
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
