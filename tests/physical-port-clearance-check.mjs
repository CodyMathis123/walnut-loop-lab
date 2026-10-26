// node tests/physical-port-clearance-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const js=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const route=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/Allow 45° fittings/);
assert.match(html,/assets\/app\.js\?v=0\.25/);
const k=()=>({beginPath(){},moveTo(){},lineTo(){},closePath(){},
 stroke(){},fill(){},arc(){},ellipse(){},clearRect(){},fillRect(){},
 setTransform(){},setLineDash(){},fillText(){},measureText(t){return {width:String(t).length*7}}});
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const dot=(a,b)=>a.reduce((t,x,i)=>t+x*b[i],0);
const unit=v=>v.map(x=>x/Math.hypot(...v));
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const nodes=new Map(),canvas=k();let counter=0;
 const el=id=>{
  if(nodes.has(id))return nodes.get(id);
  const n={id,value:'',checked:false,textContent:'',innerHTML:'',style:{},
   dataset:{},children:[],width:1100,height:850,
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},appendChild(v){this.children.push(v)},
   replaceChildren(){},querySelectorAll(){return []},getContext(){return canvas},
   getBoundingClientRect(){return {width:1100,height:850,left:0,top:0}}};
  nodes.set(id,n);return n;
 };
 const document={getElementById:el,createElement:()=>el('e'+(++counter)),
  createElementNS:()=>el('s'+(++counter))};
 const ctx=vm.createContext({document,window:{},navigator:{userAgent:agent},
  devicePixelRatio:1,console:{log(){},warn(){},error(e,detail){throw detail||e}},confirm(){return true},
  localStorage:{getItem(){return null},removeItem(){}},
  setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(parts,ctx);vm.runInContext(route,ctx);
 vm.runInContext(js+`\n;globalThis.testAPI={
  project,cpart,routeGeom,routeObstacles,routeCenterline,routePoints,
  fittingFor,sampleRoutes,refreshComponent,sanitizeFittings,normalizeImport,
  initial,routeTools,fittingLeads
 }`,ctx);
 const api=ctx.testAPI;
 ctx.window.WalnutLoopWebGL={active:true,render(){},setActive(){}};
 assert.equal(api.project.format,'walnut-loop-v25');
 assert.equal(api.project.allow45,false);
 assert.equal(el('allowAuto45').checked,false);
 const wood=api.routeTools.cabinetBoxes(api.project.case,0);
 assert.ok(wood.length>=20,'Cabinet needs individual wood tiles and rails');
 const c=api.project.case,d=c.depth;
 assert.ok(api.routeTools.collisions([[0,50,d/2-60],[0,50,d/2+60]],wood)
  .some(x=>x.startsWith('wood:')),'Solid lower middle front panel must be blocked');
 assert.ok(!api.routeTools.collisions([[149,260,d/2-60],[149,260,d/2+60]],wood)
  .some(x=>x.startsWith('wood:')),'Fan opening must remain a real cutout');
 assert.ok(!api.routeTools.collisions([[0,600,d/2-60],[0,600,d/2+60]],wood)
  .some(x=>x.startsWith('wood:')),'Upper window must remain a real cutout');
 assert.ok(wood.some(b=>b.id==='rail:middle'));
 assert.ok(wood.some(b=>b.id==='steel:divider'));
 const cpu=api.cpart('cpu');
 cpu.fittings={out:{type:'90',rotation:0}};
 const normal=api.fittingFor('cpu.out');
 assert.equal(normal.type,'90');
 assert.ok(Math.abs(dot(normal.normal,normal.outward))<1e-6);
 const last=normal.points.at(-1),before=normal.points.at(-2);
 assert.ok(dot(unit(last.map((v,i)=>v-before[i])),normal.outward)>.996,
  'Physical elbow tip tangent agrees with modeled 90-degree outlet');
 cpu.fittings.out.rotation=90;
 const rotated=api.fittingFor('cpu.out');
 assert.ok(distance(rotated.tip,normal.tip)>10,'Rotating a 90 changes hose direction');
 cpu.fittings.in={type:'45',rotation:25};
 assert.equal(api.fittingFor('cpu.in').type,'straight',
  '45 disabled globally, including manually configured fittings');
 api.sanitizeFittings();
 assert.equal(cpu.fittings.in.type,'straight');
 // Component control must not show a forbidden 45-degree option.
 const routeName={from:'cpu.out',to:'rad1.in',style:'elbow',axis:'xzy'};
 const poly=api.routeCenterline(routeName);
 const base=api.fittingFor(routeName.from),dest=api.fittingFor(routeName.to);
 assert.ok(poly.length>=4);
 assert.ok(distance(poly[0],base.tip)<.001);
 assert.ok(dot(unit(poly[1].map((v,i)=>v-poly[0][i])),base.outward)>.999);
 assert.ok(distance(poly.at(-1),dest.tip)<.001);
 assert.ok(dot(unit(poly.at(-2).map((v,i)=>v-poly.at(-1)[i])),dest.outward)>.999);
 // Fittings on the GPU top point UP, not off its vertical side.
 assert.deepEqual(Array.from(api.fittingFor('gpu.out').normal),[0,1,0]);
 cpu.fittings.out.type='straight';
 for(const style of ['soft','bend','elbow']){
  el('styleSelect').value=style;el('axisOrder').value='xzy';
  el('allowAuto45').checked=false;api.sampleRoutes();
  const good=api.project.routes.filter(r=>!r.blocked);
  assert.ok(good.length>=7,'Stock layout should still have several safe runs');
  for(const rt of good){
   const shape=api.routeGeom(rt),f=api.fittingFor(rt.from),t=api.fittingFor(rt.to);
   assert.equal(shape.collisions.length,0,'Approved route must not pass through case/fan/tube');
   assert.ok(distance(shape.smooth[0],f.tip)<.001);
   assert.ok(distance(shape.smooth.at(-1),t.tip)<.001);
   assert.ok(dot(unit(shape.smooth[1].map((v,i)=>v-shape.smooth[0][i])),f.outward)>.999,
    'Must depart the actual fitting tangent on '+rt.from);
   assert.ok(dot(unit(shape.smooth.at(-2).map((v,i)=>v-shape.smooth.at(-1)[i])),t.outward)>.999,
    'Must approach the actual fitting on '+rt.to);
  }
  for(const rt of api.project.routes.filter(r=>r.blocked))
   assert.ok(api.routeGeom(rt).blocked,'Unsafe path must stay flagged');
 }
 const invalid=api.initial();
 invalid.parts.find(p=>p.id==='cpu').fittings={out:{type:'45',rotation:30}};
 assert.throws(()=>api.normalizeImport(invalid),/current-format/,
  'Global 45 permission also applies to imported greenfield sketches');
 const allowed=api.initial();allowed.allow45=true;
 allowed.parts.find(p=>p.id==='cpu').fittings={out:{type:'45',rotation:30}};
 assert.equal(api.normalizeImport(allowed).allow45,true);
}
console.log('Fixed fitting exits, walnut openings and forbidden 45-degree connectors passed.');
