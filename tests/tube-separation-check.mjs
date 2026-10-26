// node tests/tube-separation-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const moduleText=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const components=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="allowAuto45"/);
assert.match(html,/assets\/app\.js\?v=0\.26/);
const window={};
vm.runInNewContext(moduleText,{window});
const geom=window.WalnutLoopRouting;
assert.ok(geom.tubeBoxes&&geom.tubeCollisions&&geom.distanceSegments);
assert.ok(geom.distanceSegments([0,0,0],[80,0,0],[40,-20,0],[40,20,0]).distance<.001);
assert.ok(Math.abs(geom.distanceSegments([0,0,0],[80,0,0],[0,26,0],[80,26,0]).distance-26)<.001);
const line={id:'a',points:[[0,0,0],[80,0,0]],ports:['a.out','b.in']};
const crossing={id:'b',points:[[40,-25,0],[40,25,0]],ports:['c.out','d.in'],shared:[]};
const separated={id:'c',points:[[0,30,0],[80,30,0]],ports:['c.out','d.in'],shared:[]};
assert.deepEqual(Array.from(geom.tubeCollisions(crossing,[line],8,2)),['tube:a']);
assert.equal(geom.tubeCollisions(separated,[line],8,2).length,0);
assert.ok(geom.tubeBoxes([line],8,2).every(b=>b.id.startsWith('tube:a:')));
const sharing={id:'tee',points:[[0,0,0],[0,35,0]],ports:['a.out','drain.in'],shared:[[0,0,0]]};
assert.equal(geom.tubeCollisions(sharing,[line],8,2).length,0,
 'A short shared tee junction may coincide, but not a distant tube crossing');
const far={id:'tee',points:[[0,0,0],[60,0,0],[60,40,0]],
 ports:['a.out','drain.in'],shared:[[0,0,0]]};
assert.ok(geom.tubeCollisions(far,[line],8,2).includes('tube:a'),
 'Junction allowance cannot exempt a long shared tube run');

function editor(agent){
 let i=0,scene=[];
 const dom=new Map(),context2d={beginPath(){},moveTo(){},lineTo(){},closePath(){},
  stroke(){},fill(){},arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},
  setLineDash(){},fillText(){},measureText(s){return {width:String(s).length*7}}};
 const node=id=>{
  if(dom.has(id))return dom.get(id);
  const element={id,value:'',checked:false,innerHTML:'',textContent:'',style:{},
   dataset:{},children:[],width:1000,height:800,
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},appendChild(){},replaceChildren(){},
   querySelectorAll(){return []},setAttribute(){},getContext(){return context2d},
   getBoundingClientRect(){return {width:1000,height:800,left:0,top:0}}};
  dom.set(id,element);return element;
 };
 const document={getElementById:node,createElement:()=>node('e'+(++i)),
  createElementNS:()=>node('s'+(++i))};
 const context=vm.createContext({window:{},document,navigator:{userAgent:agent},
  localStorage:{removeItem(){},getItem(){return null}},devicePixelRatio:1,
  console,confirm(){return true},setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(components,context);
 vm.runInContext(moduleText,context);
 vm.runInContext(app+'\n;globalThis.__api={project,cpart,routeGeom,routeObstacles,routePoints,otherTubePaths,tubeTubeHits,sampleRoutes,fittingFor,normalizeImport,initial}',context);
 context.window.WalnutLoopWebGL={active:true,render(commands){scene=commands.slice()},setActive(){}};
 return {api:context.__api,node,scene:()=>scene};
}
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,node}=editor(agent);
 assert.equal(api.project.format,'walnut-loop-v26');
 assert.equal(api.project.allow45,false);
 assert.equal(node('allowAuto45').checked,false);
 assert.deepEqual(Array.from(api.fittingFor('gpu.out').normal),[0,1,0]);
 assert.ok(api.fittingFor('gpu.out').tip[1]>api.fittingFor('gpu.out').base[1]);
 for(const style of ['soft','bend','elbow']){
  node('styleSelect').value=style;
  node('axisOrder').value='xzy';
  node('allowAuto45').checked=false;
  api.sampleRoutes();
  assert.equal(api.project.routes.length,12);
  assert.equal(api.project.allow45,false);
  assert.equal(api.cpart('cpu').fittings?.out?.type||'straight','straight');
  assert.equal(api.cpart('gpu').fittings?.out?.type||'straight','straight');
  const valid=api.project.routes.filter(rt=>!rt.blocked);
  assert.ok(valid.length>=7,'Enough valid example tubes should remain');
  for(const rt of valid){
   const g=api.routeGeom(rt);
   assert.equal(g.collisions.length,0,'Accepted route intersects tube or component '+rt.from);
   assert.equal(api.tubeTubeHits(rt,g.smooth).length,0,'Tube-to-tube check: '+rt.from);
  }
  for(const rt of api.project.routes.filter(rt=>rt.blocked))
   assert.ok(api.routeGeom(rt).blocked,'Unroutable tube must be flagged');
 }
 // Require every sample route to clear neighboring hoses on all
 // three stock cooling layouts, for each tubing style.
 for(const side of ['right','left']){
  api.project.loopMode='single';
  api.project.singleHardwareSide=side;
  for(const id of ['res','pump','drain','res2','pump2','drain2']){
   const p=api.cpart(id);
   p.visible=side==='right'?id.endsWith('2'):!id.endsWith('2');
  }
  for(const style of ['soft','bend','elbow']){
   node('styleSelect').value=style;
   node('allowAuto45').checked=false;
   api.sampleRoutes();
   assert.equal(api.project.routes.length,9);
   assert.ok(api.project.routes.filter(rt=>!rt.blocked&&!api.routeGeom(rt).blocked).length>=6,
    'Single '+side+' '+style+' must retain feasible tubes and flag obstructed ones');
  }
 }
 api.project.loopMode='dual';
 for(const id of ['res','pump','drain','res2','pump2','drain2'])
  api.cpart(id).visible=true;
 node('styleSelect').value='elbow';
 node('allowAuto45').checked=true;
 api.sampleRoutes();
 assert.equal(api.project.allow45,true);
 // The checkbox makes 45° selectable, but does NOT silently add one.
 assert.equal(api.cpart('cpu').fittings?.out?.type||'straight','straight');
 api.cpart('gpu').fittings={in:{type:'45',rotation:135}};
 assert.equal(api.fittingFor('gpu.in').type,'45');
 node('allowAuto45').checked=false;
 api.sampleRoutes();
 assert.equal(api.project.allow45,false);
 assert.equal(api.cpart('gpu').fittings.in.type,'straight',
  'Turning 45° off removes 45° connectors from every component');
 assert.equal(api.fittingFor('gpu.in').type,'straight');
 const copy=api.normalizeImport(api.initial());
 assert.equal(copy.allow45,false);
}
console.log('Tube separation, junction clearance, 45-degree toggle and GPU top ports passed.');
