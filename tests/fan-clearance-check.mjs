// Run with node tests/fan-clearance-check.mjs
// Fan volumes must match what is drawn. Include panel/inner push-pull stacks
// and free-bay fans, with full 120 mm square by actual fan thickness.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const geom=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/assets\/app\.js\?v=0\.25/);
assert.match(html,/route-geometry\.js\?v=0\.25/);
function editor(userAgent){
 let index=0,commands=[];
 const nodes=new Map(),ctx2={beginPath(){},moveTo(){},lineTo(){},
  closePath(){},stroke(){},fill(){},arc(){},ellipse(){},fillRect(){},
  clearRect(){},setTransform(){},setLineDash(){},fillText(){},
  measureText(v){return {width:String(v).length*7}}};
 const el=id=>{
  if(nodes.has(id))return nodes.get(id);
  const n={id,value:'',textContent:'',innerHTML:'',dataset:{},
   style:{},children:[],width:1000,height:860,
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},appendChild(){},replaceChildren(){},
   querySelectorAll(){return []},setAttribute(){},getContext(){return ctx2},
   getBoundingClientRect(){return {width:1000,height:860,left:0,top:0}}};
  nodes.set(id,n);return n;
 };
 const document={getElementById:el,createElement:()=>el('e'+(++index)),
  createElementNS:()=>el('s'+(++index))};
 const context=vm.createContext({document,window:{},navigator:{userAgent},
  localStorage:{getItem(){return null},removeItem(){}},devicePixelRatio:1,
  console,confirm(){return true},setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(geom,context);vm.runInContext(routing,context);
 vm.runInContext(app+`\n;globalThis.__api={
  project,cpart,installedFans,attachedFans,freeBayFans,routeTools,
  routeObstacles,routeGeom,routePoints,sampleRoutes,draw,changeModel
 }`,context);
 context.window.WalnutLoopWebGL={active:true,render(list){commands=list.slice()},setActive(){}};
 context.__api.draw();
 return {api:context.__api,ui:el,commands:()=>commands};
}
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,ui,commands}=editor(agent);
 assert.equal(api.project.format,'walnut-loop-v25');
 assert.equal(api.installedFans().length,24);
 const pushPull=api.installedFans();
 assert.equal(pushPull.filter(f=>f.face==='panel').length,12);
 assert.equal(pushPull.filter(f=>f.face==='inner').length,12);
 assert.ok(pushPull.every(f=>f.radiatorId&&f.slot));
 assert.equal(new Set(pushPull.map(f=>f.radiatorId+f.face+f.row)).size,24);
 const thickness=api.project.case.fanThickness;
 const obstacles=api.routeTools.fanBoxes(pushPull,thickness,0);
 assert.equal(obstacles.length,24);
 assert.equal(new Set(obstacles.map(o=>o.id)).size,24);
 assert.ok(obstacles.every(o=>o.id.startsWith('fan:rad')));
 for(const fan of pushPull){
  const box=obstacles.find(o=>o.id==='fan:'+fan.radiatorId+':'+fan.face+':'+fan.row);
  assert.ok(box,'Missing fan frame '+JSON.stringify(fan));
  for(const i of [0,1,2])
   assert.ok(Math.abs((box.min[i]+box.max[i])/2-fan.pos[i])<1e-6);
  assert.ok(Math.abs(box.max[0]-box.min[0]-120)<1e-6);
  assert.ok(Math.abs(box.max[1]-box.min[1]-120)<1e-6);
  assert.ok(Math.abs(box.max[2]-box.min[2]-thickness)<1e-6);
  // The fan frame must block any tube passing straight through its center.
  const near=fan.pos.slice(),far=fan.pos.slice();
  near[2]-=100;far[2]+=100;
  assert.ok(api.routeTools.collisions([near,far],[box]).includes(box.id));
 }
 const rad=api.cpart('rad1');
 const rt={from:'rad1.out',to:'rad2.in',style:'elbow',axis:'xzy'};
 const routeBlocks=api.routeObstacles(rt,8);
 assert.equal(routeBlocks.filter(b=>b.id.startsWith('fan:')).length,24);
 assert.ok(!routeBlocks.some(b=>b.id==='rad1'),'Endpoint radiator body is exempt');
 assert.ok(routeBlocks.some(b=>b.id==='fan:rad1:inner:1'),
  'The source radiator fan must NOT be exempt');
 // An explicit bend through the source radiator fan should be marked unsafe.
 const sourceFan=pushPull.find(f=>f.radiatorId==='rad1'&&f.face==='inner'&&f.row===1);
 const through={...rt,waypoints:[sourceFan.pos.slice()]};
 assert.ok(api.routeGeom(through).blocked);
 assert.ok(api.routeGeom(through).collisions.some(id=>id.startsWith('fan:rad1:')));
 // Remove only rad1's inner-side fans. Panel-side remains physically present.
 rad.fans.inner=0;
 assert.equal(api.installedFans().length,21);
 assert.equal(api.routeObstacles(rt,8).filter(b=>b.id.startsWith('fan:')).length,21);
 assert.equal(api.installedFans().filter(f=>f.radiatorId==='rad1'&&f.face==='inner').length,0);
 // Fan removal and new fan positions use the same editor configuration.
 rad.fans.inner=3;
 assert.equal(api.installedFans().length,24);
 // Replacing a radiator with 2 bare fans should add exactly those 2 volumes.
 rad.visible=false;
 api.project.fanOnly['front-right']=2;
 const bare=api.freeBayFans().filter(f=>f.slot==='front-right');
 assert.equal(bare.length,2);
 assert.ok(bare.every(f=>f.face==='panel'&&!f.radiatorId));
 assert.equal(api.installedFans().length,20);
 assert.equal(api.routeObstacles(rt,8).filter(b=>b.id.startsWith('fan:')).length,20);
 assert.ok(api.routeObstacles(rt,8).some(b=>b.id.startsWith('fan:front-right:panel:')));
 const freeBox=api.routeObstacles(rt,8).find(b=>b.id.startsWith('fan:front-right:panel:'));
 const a=freeBox.min.map((v,i)=>i===2?v-20:(v+freeBox.max[i])/2);
 const b=freeBox.max.map((v,i)=>i===2?v+20:(v+freeBox.min[i])/2);
 assert.ok(api.routeTools.collisions([a,b],[freeBox]).includes(freeBox.id));
 // Installed radiator overrides bare fan-only setting, to avoid doubles.
 rad.visible=true;
 assert.equal(api.freeBayFans().filter(f=>f.slot==='front-right').length,0);
 assert.equal(api.installedFans().length,24);
 for(const [mode,side] of [['dual','left'],['single','right'],['single','left']]){
  api.project.loopMode=mode;api.project.singleHardwareSide=side;
  for(const id of ['res','pump','drain','res2','pump2','drain2']){
   const p=api.cpart(id);
   p.visible=mode==='dual'||(side==='right'?id.endsWith('2'):!id.endsWith('2'));
  }
  for(const style of ['soft','bend','elbow']){
   ui('styleSelect').value=style;ui('axisOrder').value='xzy';
   api.sampleRoutes();
   assert.equal(api.project.routes.length,mode==='dual'?12:9);
   for(const route of api.project.routes){
    const shape=api.routeGeom(route);
    if(route.blocked){assert.ok(shape.blocked,'Unroutable route flagged');continue}
    assert.equal(shape.collisions.length,0,'Accepted route intersects fan or tube '+route.from+' > '+route.to);
    assert.equal(api.routeTools.collisions(shape.smooth,api.routeObstacles(route,8,false)).length,0);
   }
  }
 }
 api.draw();
 assert.ok(commands().some(x=>x.kind==='tube'),'Routes still render as 3D tubing');
}
console.log('Fan collision envelopes, push/pull counts, fan-only bays and routed loops passed.');
