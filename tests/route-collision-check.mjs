// node tests/route-collision-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/route-geometry\.js\?v=0\.24/);
assert.match(html,/assets\/app\.js\?v=0\.24/);
const w={};vm.runInNewContext(routing,{window:w});
const routingTools=w.WalnutLoopRouting;
assert.ok(routingTools?.plan&&routingTools.fitting&&routingTools.collisions);
const obstacle={id:'mock-motherboard',min:[-40,-7,-45],max:[40,7,45]};
assert.deepEqual(Array.from(routingTools.collisions([[-100,0,0],[100,0,0]],[obstacle])),['mock-motherboard']);
const detour=routingTools.plan([-100,0,0],[100,0,0],[obstacle]);
assert.ok(detour.points&&detour.points.length>=3);
assert.equal(routingTools.collisions(detour.points,[obstacle]).length,0);
assert.ok(detour.points.some(p=>Math.abs(p[1])>=7||Math.abs(p[2])>=45),
 'Route must follow the inflated AABB boundary or bypass it');

const cpu={id:'cpu',type:'cpu',pos:[100,500,0],size:[65,23,65],fittings:{},
 ports:[{id:'out',off:[16,17,0]}]};
const port=cpu.ports[0];
const straight=routingTools.fitting(cpu,port,16);
assert.equal(straight.type,'straight');
assert.ok(straight.tip[1]>straight.base[1]);
cpu.fittings.out={type:'90',rotation:0};
const ninety=routingTools.fitting(cpu,port,16);
assert.ok(Math.abs(ninety.outward[1])<1e-6);
assert.ok(Math.hypot(ninety.tip[0]-straight.tip[0],ninety.tip[2]-straight.tip[2])>10);
cpu.fittings.out={type:'90',rotation:90};
const swivel=routingTools.fitting(cpu,port,16);
assert.ok(Math.hypot(swivel.tip[0]-ninety.tip[0],swivel.tip[2]-ninety.tip[2])>10);
cpu.fittings.out={type:'45',rotation:45};
const fortyFive=routingTools.fitting(cpu,port,16);
assert.ok(Math.abs(fortyFive.outward[1]-Math.SQRT1_2)<1e-6);

function editor(userAgent){
 const controls=new Map(),context2d={beginPath(){},moveTo(){},lineTo(){},closePath(){},
  stroke(){},fill(){},arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},
  setLineDash(){},fillText(){},measureText(t){return {width:String(t).length*6}}};
 let id=0;
 const element=k=>{
  if(controls.has(k))return controls.get(k);
  const el={id:k,value:'',innerHTML:'',textContent:'',style:{},dataset:{},children:[],
   width:1100,height:860,disabled:false,
   classList:{add(){},remove(){},toggle(){}},
   querySelectorAll(){return []},appendChild(x){this.children.push(x)},
   replaceChildren(){this.children=[]},setAttribute(){},addEventListener(){},
   getContext(){return context2d},
   getBoundingClientRect(){return {left:0,top:0,width:1100,height:860}}};
  controls.set(k,el);return el;
 };
 const document={getElementById:element,createElement:()=>element('e'+(++id)),
  createElementNS:()=>element('s'+(++id))};
 const ctx=vm.createContext({document,window:{},navigator:{userAgent},
  localStorage:{getItem(){return null},removeItem(){}},devicePixelRatio:1,
  console,confirm(){return true},setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(parts,ctx);
 vm.runInContext(routing,ctx);
 vm.runInContext(app+'\n;globalThis.__api={project,cpart,sampleRoutes,routeGeom,routePoints,routeObstacles,routeTools,fittingFor,draw,addRoute,changeModel}',ctx);
 let commands=[];
 ctx.window.WalnutLoopWebGL={active:true,render(queue){commands=queue.slice()},setActive(){}};
 return {api:ctx.__api,element,commands:()=>commands};
}
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,element,commands}=editor(agent);
 for(const style of ['soft','bend','elbow']){
  element('styleSelect').value=style;
  element('axisOrder').value='xzy';
  api.sampleRoutes();
  assert.equal(api.project.routes.length,12);
  assert.ok(api.project.routes.every(r=>r.style===style));
  for(const rt of api.project.routes){
   const g=api.routeGeom(rt);
   if(rt.blocked){assert.ok(g.blocked,'Unroutable tube must be flagged');continue}
   assert.equal(g.collisions.length,0,'Accepted route penetrated a component or tube: '+rt.from+' -> '+rt.to);
   assert.equal(api.routeTools.collisions(g.smooth,api.routeObstacles(rt,8,false)).length,0);
  }
  assert.ok(api.project.routes.filter(r=>!r.blocked).length>=6,'Several sample routes must remain feasible');
  const tubes=commands().filter(item=>item.kind==='tube');
  assert.ok(tubes.length>20,'Default sample must produce 3D tubes and compression fittings');
  assert.ok(tubes.some(t=>t.radius===api.project.tubeOD/2));
  assert.ok(tubes.some(t=>t.radius>api.project.tubeOD/2));
 }
 // A 90-degree fitting must affect the actual route connection and render
 // on the block even when no tubing is connected to that port.
 api.project.routes=[];
 const block=api.cpart('cpu');
 block.fittings={out:{type:'90',rotation:0},in:{type:'45',rotation:75}};
 api.draw();
 assert.ok(commands().some(t=>t.kind==='tube'&&t.color==='#879aa5'));
 const first=api.fittingFor('cpu.out').tip.slice();
 block.fittings.out.rotation=120;
 const second=api.fittingFor('cpu.out').tip;
 assert.ok(first.some((v,i)=>Math.abs(v-second[i])>1));
 element('styleSelect').value='bend';
 api.addRoute('cpu.out','rad1.in','bend','xyz');
 const route=api.project.routes[0];
 assert.ok(route);
 if(!route.blocked)assert.deepEqual(Array.from(api.routePoints(route)[0]),Array.from(second));
 assert.equal(api.project.format,'walnut-loop-v24');
}
console.log('Collision detours, 3D tubing samples, and rotatable 45/90 port fittings passed.');
