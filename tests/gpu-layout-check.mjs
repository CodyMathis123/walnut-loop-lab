// node tests/gpu-layout-check.mjs
// Horizontally mounted PowerColor Reaper PCB and Alphacool #14782 block.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const components=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/assets\/app\.js\?v=0\.27/);
assert.match(html,/id="gpuMountControls"/);
assert.match(html,/id="alignGpuBtn"/);

function harness(userAgent){
 const nodes=new Map(),events={},logs=[];
 let seq=0;
 const c2={beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},
  arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},setLineDash(){},
  fillText(){},measureText(t){return {width:String(t).length*7}}};
 function node(id){
  if(nodes.has(id))return nodes.get(id);
  const n={id,value:'',textContent:'',innerHTML:'',dataset:{},style:{},
   children:[],width:1100,height:860,classList:{add(){},remove(){},toggle(){}},
   appendChild(p){this.children.push(p)},replaceChildren(){this.children=[]},
   addEventListener(k,fn){if(id==='scene')events[k]=fn},getContext(){return c2},
   querySelectorAll(){return []},setAttribute(){},
   getBoundingClientRect(){return {left:0,top:0,width:1100,height:860}}};
  nodes.set(id,n);return n;
 }
 const document={getElementById:node,createElement:()=>node('e'+(++seq)),
  createElementNS:()=>node('s'+(++seq))};
 const ctx=vm.createContext({document,window:{},navigator:{userAgent},
  console:{log(...parts){logs.push(parts.join(' '))},error(...parts){logs.push(parts.join(' '))}},
  localStorage:{removeItem(){},getItem(){return null}},
  devicePixelRatio:1,confirm(){return true},ResizeObserver:class{observe(){}},
  setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(components,ctx);vm.runInContext(routing,ctx);
 vm.runInContext(app+`
 globalThis.__test={
  project,cpart,draw,sampleRoutes,routeGeom,routeObstacles,routeTools,
  fittingFor,boardPoseForTray,gpuPoseForTray,alignMotherboardToTray,
  alignTrayToRearWindow,alignGPUToTray,moveAttachedParts,renderedParts,
  normalizeImport,initial
 }`,ctx);
 let scene=[];
 ctx.window.WalnutLoopWebGL={active:true,render(commands){scene=commands.slice()},setActive(){}};
 ctx.__test.draw();
 return {api:ctx.__test,node,scene:()=>scene,geometry:ctx.window.WalnutLoopPartGeometry,logs};
}

for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,node,scene,geometry,logs}=harness(agent);
 const tray=api.cpart('tray'),mobo=api.cpart('mobo'),gpu=api.cpart('gpu');
 const cpu=api.cpart('cpu');
 assert.equal(api.project.format,'walnut-loop-v27');
 assert.deepEqual(Array.from(gpu.size),[127.33,33.35,197]);
 assert.deepEqual(Array.from(gpu.pcbSize),[98.8,1.6,197]);
 assert.equal(gpu.mountedTo,'tray');
 assert.equal(gpu.orientation,'horizontal');
 assert.equal(gpu.ports.length,2);
 assert.deepEqual(Array.from(gpu.ports.map(p=>p.id)),['in','out']);
 assert.ok(gpu.ports.every(p=>Math.abs(p.off[0]-49.4)<.001));
 assert.ok(gpu.ports.every(p=>Math.abs(p.off[1]-17.675)<.001));
 assert.ok(Math.abs(gpu.ports[0].off[2]-gpu.ports[1].off[2])===34);
 assert.ok(gpu.pos[1]-gpu.size[1]/2>tray.pos[1]+tray.size[1]/2);
 assert.ok(gpu.pos[2]-gpu.size[2]/2<=mobo.pos[2]-mobo.size[2]/2+3);
 assert.ok(Math.abs(gpu.pos[0]-api.gpuPoseForTray(tray,gpu)[0])<.001);
 assert.ok(Math.abs(gpu.pos[1]-api.gpuPoseForTray(tray,gpu)[1])<.001);
 assert.ok(Math.abs(gpu.pos[2]-api.gpuPoseForTray(tray,gpu)[2])<.001);
 assert.ok(Math.abs(mobo.pos[0]-api.boardPoseForTray(tray,mobo)[0])<.001);
 assert.ok(Math.abs(cpu.pos[0]-mobo.pos[0]-18)<.001);
 const blockRight=gpu.pos[0]+gpu.size[0]/2;
 const boardLeft=mobo.pos[0]-mobo.size[0]/2;
 assert.ok(blockRight<boardLeft,'Water block must not overlap motherboard footprint');
 assert.ok(boardLeft-blockRight>=4,'At least 4 mm horizontal gap');
 const metalLeft=tray.pos[0]-tray.size[0]/2;
 const overhang=metalLeft-(gpu.pos[0]-gpu.size[0]/2);
 assert.ok(overhang>20&&overhang<30,'Walnut platform supports GPU left of metal tray');
 assert.ok(api.renderedParts().some(p=>p.id==='gpu'));
 for(const port of gpu.ports){
  const fit=api.fittingFor('gpu.'+port.id);
  assert.deepEqual(Array.from(fit.normal),[0,1,0]);
  assert.ok(fit.tip[1]>fit.base[1]);
  assert.ok(Math.abs(port.off[2])===17);
 }
 // The modeled GPU must have a different visual from a plain cuboid:
 // platform, left PCIe fingers, copper/acrylic block, and rear I/O.
 const boxes=[],polys=[],strokes=[],circles=[];
 const circle3=(center,radius,axis,n=24)=>{
  circles.push({center: Array.from(center),radius,axis});
  return Array.from({length:n+1},(_,i)=>{
   const a=2*Math.PI*i/n;
   return axis==='x'?[center[0],center[1]+radius*Math.cos(a),center[2]+radius*Math.sin(a)]:
          [center[0]+radius*Math.cos(a),center[1],center[2]+radius*Math.sin(a)];
  });
 };
 geometry.renderGPU(gpu,{
  box(p){boxes.push(p)},polygon(vertices,color){polys.push({vertices,color})},
  stroke(points,color){strokes.push({points,color})},circle3
 });
 assert.ok(boxes.length>=6,'GPU has distinct walnut platform, PCB, cooler and rear bracket');
 assert.ok(polys.filter(p=>p.color==='#d4ad57').length>=15,'PCIe gold edge');
 assert.equal(circles.filter(c=>c.axis==='y'&&c.radius===9).length,4,
  'Two G1/4 collars pointing upward on top');
 assert.ok(boxes.some(p=>p.size[0]===gpu.pcbSize[0]&&p.size[2]===gpu.pcbSize[2]));
 assert.ok(boxes.some(p=>p.size[0]===gpu.pcbSize[0]+8&&p.size[1]===8));
 assert.ok(boxes.some(p=>p.pos[2]<gpu.pos[2]-gpu.size[2]/2),'Rear display I/O bracket');
 // Tray movement carries both boards and the CPU block, keeping alignment.
 const oldGpu=gpu.pos.slice(),oldBoard=mobo.pos.slice(),oldCPU=cpu.pos.slice();
 tray.pos[0]+=10;
 api.moveAttachedParts('tray',[10,0,0]);
 assert.ok(Math.abs(gpu.pos[0]-oldGpu[0]-10)<.001);
 assert.ok(Math.abs(mobo.pos[0]-oldBoard[0]-10)<.001);
 assert.ok(Math.abs(cpu.pos[0]-oldCPU[0]-10)<.001);
 api.alignTrayToRearWindow();
 assert.ok(Math.abs(gpu.pos[0]-oldGpu[0])<.001);
 assert.ok(Math.abs(mobo.pos[0]-oldBoard[0])<.001);
 node('componentSelect').onchange({target:{value:'gpu'}});
 assert.equal(node('gpuMountControls').style.display,'block');
 assert.match(node('gpuMountSummary').textContent,/Alphacool #14782/);
 gpu.pos[0]-=12;
 node('alignGpuBtn').onclick();
 assert.ok(Math.abs(gpu.pos[0]-api.gpuPoseForTray(tray,gpu)[0])<.001);
 for(const style of ['soft','bend','elbow']){
  node('styleSelect').value=style;
  node('axisOrder').value='xzy';
  api.sampleRoutes();
  assert.equal(api.project.routes.length,12);
  assert.ok(api.project.routes.every(r=>r.style===style));
  for(const route of api.project.routes){
   const g=api.routeGeom(route);
   if(route.blocked){assert.ok(g.blocked);continue}
   assert.deepEqual(Array.from(g.collisions),[],'Accepted collision in '+route.from+' -> '+route.to);
  }
  assert.ok(scene().some(item=>item.kind==='tube'));
 }
 assert.equal(logs.filter(log=>/failed/i.test(log)).length,0);
}
console.log('Reaper/Alphacool flat-tray layout, ports, renderer, and routing passed.');
