// Run: node tests/itx-layout-check.mjs
// Verify Gigabyte Mini-ITX mock, 3 mm tray clearance, TFC front-face ports,
// and compatibility with custom saved layouts. No GPU or third-party package.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const geometry=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/src="assets\/app\.js\?v=0\.18"/);
assert.match(html,/id="alignBoardBtn"/);
assert.match(html,/id="alignBoardSelectedBtn"/);

function harness(userAgent){
 const nodes=new Map();
 const ctx={beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},
  arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},setLineDash(){},
  fillText(){},measureText(t){return {width:String(t).length*7}}};
 const node=id=>{
  if(nodes.has(id))return nodes.get(id);
  const el={id,value:'',textContent:'',innerHTML:'',style:{},dataset:{},children:[],
   width:1024,height:860,classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},querySelectorAll(){return []},setAttribute(){},
   appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},
   getContext(){return ctx},
   getBoundingClientRect(){return {left:0,top:0,width:1024,height:860}}};
  nodes.set(id,el);return el;
 };
 const document={getElementById:node,
  createElement:()=>node('element'+nodes.size),createElementNS:()=>node('svg'+nodes.size)};
 const localStorage={saved:null,getItem(){return this.saved},setItem(k,v){this.saved=v}};
 const context=vm.createContext({window:{},document,localStorage,navigator:{userAgent},
   devicePixelRatio:1,confirm(){return true},console,
   setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(geometry,context);
 vm.runInContext(app+'\n;globalThis.__app={project,cpart,draw,initial,normalizeImport,boardPoseForTray,socketBlockPose,moveAttachedParts,alignTrayToRearWindow,alignMotherboardToTray,syncMeasuredRadiators,changeModel}',context);
 let scene=[];
 context.window.WalnutLoopWebGL={active:true,render(queue){scene=queue.slice()},setActive(){}};
 context.__app.draw();
 return {api:context.__app,node,storage:localStorage,scene:()=>scene,
  geo:context.window.WalnutLoopPartGeometry};
}
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,node,scene,geo}=harness(agent),p=api.project,c=p.case;
 const tray=api.cpart('tray'),board=api.cpart('mobo'),cpu=api.cpart('cpu');
 assert.ok(tray&&board&&cpu);
 assert.equal(board.name.includes('GIGABYTE X570 I AORUS PRO WIFI'),true);
 assert.deepEqual(Array.from(board.size),[170,1.6,170]);
 assert.equal(board.mountedTo,'tray');
 assert.equal(cpu.mountedTo,'mobo');
 assert.ok(Math.abs(tray.pos[1]-tray.size[1]/2-c.divider-3)<.001,
   'Tray underside must sit 3 mm above support');
 assert.ok(Math.abs(board.pos[1]-board.size[1]/2-tray.pos[1]-
   tray.size[1]/2-6.35)<.001,'Motherboard stands off above tray');
 assert.ok(Math.abs(board.pos[0]-api.boardPoseForTray(tray,board)[0])<.001);
 assert.ok(Math.abs(board.pos[2]-api.boardPoseForTray(tray,board)[2])<.001);
 assert.deepEqual(Array.from(cpu.pos),Array.from(api.socketBlockPose(board,cpu)));
 assert.ok(board.pos[0]+85<=tray.pos[0]+tray.size[0]/2);
 assert.ok(board.pos[2]-85>=tray.pos[2]-tray.size[2]/2);
 assert.ok(scene().some(q=>q.kind==='face'&&q.fill==='#183332'),
   'ITX PCB must render in the regular cooling view');
 assert.ok(scene().every(q=>!q.pts||q.pts.every(v=>v.every(Number.isFinite))));
 for(const rad of p.parts.filter(q=>q.type==='radiator')){
  assert.equal(rad.size[2],60);
  for(const port of rad.ports){
   assert.equal(port.off[1],rad.size[1]/2-9,'Ports on upper tank FRONT face');
   assert.ok(Math.abs(port.off[2])>rad.size[2]/2,'Port projects from Z-facing surface');
  }
 }
 // Radiator port circles need to lie on Z planes (not Y-horizontal caps).
 const captured=[],circles=[];
 const circle3=(center,r,axis,n=24)=>{
  circles.push({center,r,axis});
  return Array.from({length:n+1},(_,i)=>{
   const a=2*Math.PI*i/n;
   return axis==='z'?[center[0]+Math.cos(a)*r,center[1]+Math.sin(a)*r,center[2]]:
          axis==='y'?[center[0]+Math.cos(a)*r,center[1],center[2]+Math.sin(a)*r]:
                     [center[0],center[1]+Math.cos(a)*r,center[2]+Math.sin(a)*r];
  });
 };
 const add=(a,b)=>a.map((n,i)=>n+b[i]);
 const collector={box(v){captured.push({kind:'box',...v})},
  polygon(points,fill){captured.push({kind:'face',points,fill})},
  stroke(points){captured.push({kind:'line',points})},circle3,add};
 geo.renderRadiator(api.cpart('rad1'),collector);
 assert.equal(circles.filter(c=>c.r===9.5&&c.axis==='z').length,4,
   'Two radiator port collars must be circular in the Z-facing vertical plane');
 const boardFaces=[];
 geo.renderMotherboard(board,{...collector,
   box(v,colors){boardFaces.push({pos:v.pos,size:v.size})}});
 assert.ok(boardFaces.length>18,'Mock motherboard should include PCB + components');
 assert.ok(boardFaces.some(v=>v.size[0]===170&&v.size[2]===170));
 const originalBoard=board.pos.slice(),originalCPU=cpu.pos.slice();
 tray.pos[0]+=21;
 api.moveAttachedParts('tray',[21,0,0]);
 assert.ok(Math.abs(board.pos[0]-originalBoard[0]-21)<.001);
 assert.ok(Math.abs(cpu.pos[0]-originalCPU[0]-21)<.001);
 api.alignTrayToRearWindow();
 assert.ok(Math.abs(board.pos[0]-originalBoard[0])<.001);
 assert.ok(Math.abs(cpu.pos[0]-originalCPU[0])<.001);
 node('componentSelect').onchange({target:{value:'mobo'}});
 assert.equal(node('motherboardControls').style.display,'block');
 const posBefore=cpu.pos.slice();
 board.pos[2]+=16;api.moveAttachedParts('mobo',[0,0,16]);
 assert.ok(Math.abs(cpu.pos[2]-posBefore[2]-16)<.001);
 node('alignBoardSelectedBtn').onclick();
 assert.ok(Math.abs(cpu.pos[2]-posBefore[2])<.001);
 // Existing projects: add the board, move ONLY untouched stock CPU/tray.
 const old=api.initial();
 old.parts=old.parts.filter(q=>q.id!=='mobo');
 const oldTray=old.parts.find(q=>q.id==='tray');
 oldTray.pos[1]=c.divider+oldTray.size[1]/2;
 const oldTrayY=oldTray.pos[1];
 old.parts.find(q=>q.id==='cpu').pos=[93,525,-110];
 for(const rad of old.parts.filter(q=>q.type==='radiator'))
  for(const port of rad.ports)port.off[1]=rad.size[1]/2;
 const upgraded=api.normalizeImport(old);
 const freshBoard=upgraded.parts.find(q=>q.id==='mobo');
 assert.ok(freshBoard);
 assert.ok(Math.abs(upgraded.parts.find(q=>q.id==='tray').pos[1]-
    oldTrayY-3)<.001);
 const relocatedCpu=upgraded.parts.find(q=>q.id==='cpu');
 assert.equal(relocatedCpu.mountedTo,'mobo');
 assert.ok(Math.abs(relocatedCpu.pos[0]-freshBoard.pos[0]-18)<.001);
 assert.ok(upgraded.parts.filter(q=>q.type==='radiator').every(rad=>
    rad.ports.every(port=>port.off[1]===rad.size[1]/2-9)));
 const manual=api.initial();
 manual.parts=manual.parts.filter(q=>q.id!=='mobo');
 manual.parts.find(q=>q.id==='cpu').pos=[35,550,-90];
 manual.parts.find(q=>q.id==='tray').pos[1]=502;
 manual.parts.find(q=>q.id==='rad1').ports[0].off[1]=166;
 const converted=api.normalizeImport(manual);
 assert.deepEqual(Array.from(converted.parts.find(q=>q.id==='cpu').pos),[35,550,-90]);
 assert.equal(converted.parts.find(q=>q.id==='tray').pos[1],502);
 assert.equal(converted.parts.find(q=>q.id==='rad1').ports[0].off[1],166);
}
console.log('Gigabyte ITX placement, support clearance, front port faces, and migration passed.');
