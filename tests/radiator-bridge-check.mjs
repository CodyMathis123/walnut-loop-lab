// node tests/radiator-bridge-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
for(const id of ['addBridgeRoute','bridgeControls','bridgeExit','bridgeExitB','bridgeRise','bridgeOrder',
 'bridgeStatus','makeBridge','fitBridge','detachBridge','routePointControls']){
 assert.ok(html.includes('id="'+id+'"'),'Missing bridge control '+id);
}
const routingCtx={window:{}};
vm.runInNewContext(routing,routingCtx);
const geo=routingCtx.window.WalnutLoopRouting;
const example={
 a:{tip:[-150,460,160],outward:[0,0,-1],type:'straight'},
 b:{tip:[150,460,160],outward:[0,0,-1],type:'straight'},
 depart:[-150,460,130],approach:[150,460,130]
};
const checkRightAngles=pts=>{
 assert.ok(Array.isArray(pts)&&pts.length>=6,'Physical route exists');
 for(let i=1;i<pts.length;i++){
  const v=pts[i].map((n,k)=>n-pts[i-1][k]);
  assert.equal(v.filter(n=>Math.abs(n)>1e-6).length,1,
   'Every run follows exactly one world axis');
 }
 for(let i=1;i<pts.length-1;i++){
  const angle=geo.cornerAngle(pts[i-1],pts[i],pts[i+1]);
  assert.ok(angle<.001||Math.abs(angle-90)<.001,
   'No non-right-angle turns or hairpins; got '+angle);
 }
};
const defaultBridge={exit:35,rise:90,order:'x'};
const base=geo.radiatorBridge(example,defaultBridge);
checkRightAngles(base);
const handles=geo.radiatorBridgeHandles(example,defaultBridge);
assert.deepEqual(handles.map(h=>h.id),['a-exit','a-top','b-top','b-exit']);
const shiftedA=geo.dragRadiatorBridge(example,defaultBridge,'a-exit',25,40);
assert.equal(shiftedA.exitA,60);
assert.equal(shiftedA.exitB,undefined,'Moving near side does not shift far side');
assert.equal(shiftedA.rise,90,'Lower elbow does not change riser height');
checkRightAngles(geo.radiatorBridge(example,shiftedA));
const afterA=geo.radiatorBridgeHandles(example,shiftedA);
assert.ok(Math.abs(afterA[0].point[2]-handles[0].point[2])>20);
assert.deepEqual(Array.from(afterA[3].point),Array.from(handles[3].point),
 'Far radiator elbow stays in place');
const shiftedTop=geo.dragRadiatorBridge(example,shiftedA,'b-top',-15,35);
assert.equal(shiftedTop.exitB,20);
assert.equal(shiftedTop.exitA,60);
assert.equal(shiftedTop.rise,125);
checkRightAngles(geo.radiatorBridge(example,shiftedTop));
const newHandles=geo.radiatorBridgeHandles(example,shiftedTop);
assert.equal(newHandles[1].point[1],newHandles[2].point[1],
 'Both upper elbows remain on one horizontal plane');
assert.equal(newHandles[1].point[1]-handles[1].point[1],35);
const cornerIndex=base.findIndex(p=>
 p.every((n,i)=>Math.abs(n-handles[0].point[i])<.0001));
assert.ok(cornerIndex>=2);
const propagated=geo.orthogonalDrag(base,cornerIndex,[0,0,-15]);
assert.ok(propagated,'Orthogonal routes should support dragging linked elbows');
checkRightAngles(propagated);
assert.deepEqual(Array.from(propagated[0]),Array.from(base[0]));
assert.deepEqual(Array.from(propagated.at(-1)),Array.from(base.at(-1)));
assert.ok(Math.abs(propagated[cornerIndex][2]-base[cornerIndex][2])>1);
assert.equal(geo.orthogonalDrag([[0,0,0],[3,2,0],[4,2,4],[5,2,4]],
  2,[1,0,0]),null,'Non-orthogonal tubing must not use constrained solver');
assert.equal(base[0][2],160);
assert.equal(base.at(-1)[2],160);
assert.equal(Math.max(...base.map(p=>p[1])),550);
assert.equal(geo.corners(base,'elbow',{},false).filter(c=>!c.valid).length,0);
const depthShift={...example,b:{...example.b,tip:[150,450,-150]},
 approach:[150,450,-180]};
checkRightAngles(geo.radiatorBridge(depthShift,{exit:20,rise:100,order:'x'}));
checkRightAngles(geo.radiatorBridge(depthShift,{exit:20,rise:100,order:'z'}));
assert.equal(geo.radiatorBridge({...example,a:{...example.a,type:'90'}},{rise:90}),null,
 'Bridge must not silently override an angled port fitting');

for(const userAgent of ['Desktop Chrome','iPhone Safari']){
 let serial=0;
 const nodes=new Map(),events={};
 const canvas={beginPath(){},moveTo(){},lineTo(){},closePath(){},
  stroke(){},fill(){},arc(){},ellipse(){},fillRect(){},clearRect(){},
  setTransform(){},setLineDash(){},fillText(){},
  measureText(v){return {width:String(v).length*7}}};
 const get=id=>{
  if(nodes.has(id))return nodes.get(id);
  const node={id,value:'',checked:false,textContent:'',innerHTML:'',dataset:{},
   style:{},children:[],classList:{add(){},remove(){},toggle(){}},
   width:1100,height:850,disabled:false,
   addEventListener(type,fn){if(id==='scene')events[type]=fn},
   appendChild(v){this.children.push(v)},replaceChildren(){},
   querySelectorAll(){return []},setAttribute(){},setPointerCapture(){},
   getContext(){return canvas},
   getBoundingClientRect(){return {width:1100,height:850,left:0,top:0}}
  };
  nodes.set(id,node);return node;
 };
 const document={getElementById:get,createElement:()=>get('element'+(++serial)),
  createElementNS:()=>get('svg'+(++serial))};
 const ctx=vm.createContext({document,navigator:{userAgent},window:{},
  localStorage:{getItem(){return null},removeItem(){}},
  devicePixelRatio:1,console,confirm(){return true},
  setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(parts,ctx);vm.runInContext(routing,ctx);
 vm.runInContext(app+`
 globalThis.api={project,cpart,routeCenterline,routeGeom,canBridgePorts,
  validateImport,changeModel,bridgeHandles,fittingLeads,screen,
  selectRoute(id){selectedRoute=id;selectedWaypoint=-1}};
 `,ctx);
 const api=ctx.api;
 ctx.window.WalnutLoopWebGL={active:true,render(){},setActive(){}};
 api.project.loopMode='single';
 get('fromPort').value='rad3.in';
 get('toPort').value='rad1.in';
 get('styleSelect').value='elbow';
 get('axisOrder').value='xzy';
 assert.equal(api.canBridgePorts('rad3.in','rad1.in'),true);
 get('addBridgeRoute').onclick();
 assert.equal(api.project.routes.length,1);
 const rt=api.project.routes[0];
 assert.equal(rt.bridge.rise,95);
 assert.equal(rt.waypoints,undefined,'Bridge is not approximated with freeform handles');
 checkRightAngles(api.routeCenterline(rt));
 assert.equal(api.routeGeom(rt).angleIssues.length,0);
 assert.equal(get('bridgeControls').style.display,'block');
 assert.equal(get('routePointControls').style.display,'none');
 const oldTop=Math.max(...api.routeCenterline(rt).map(p=>p[1]));
 get('bridgeRise').onchange({target:{value:'140'}});
 assert.equal(rt.bridge.rise,140);
 assert.ok(Math.max(...api.routeCenterline(rt).map(p=>p[1]))>oldTop);
 get('bridgeExit').onchange({target:{value:'50'}});
 assert.equal(rt.bridge.exitA,50);
 get('bridgeExitB').onchange({target:{value:'65'}});
 assert.equal(rt.bridge.exitB,65);
 checkRightAngles(api.routeCenterline(rt));
 // Simulate an actual pointer drag from a 90° elbow's projected position.
 // Top handle moves its riser height while opposite riser remains square.
 api.selectRoute(null);
 const top=api.bridgeHandles(rt).find(h=>h.id==='a-top'),
  where=api.screen(top.point),
  higher=api.screen(top.point.map((n,i)=>n+(i===1?27:0)));
 events.pointerdown({clientX:where.x,clientY:where.y,button:0,pointerId:20});
 events.pointermove({clientX:higher.x,clientY:higher.y,
  button:0,buttons:1,shiftKey:false,pointerId:20});
 events.pointerup({clientX:higher.x,clientY:higher.y,pointerId:20});
 assert.ok(Math.abs(rt.bridge.rise-167)<1,'Dragging top elbow changes rise');
 checkRightAngles(api.routeCenterline(rt));
 // Independent lower elbow drag lengthens only the selected side's exit.
 const bottom=api.bridgeHandles(rt).find(h=>h.id==='b-exit'),
  p0=api.screen(bottom.point),
  outward=api.fittingLeads(rt).b.outward,
  p1=api.screen(bottom.point.map((v,i)=>v+outward[i]*18));
 const previousExitA=rt.bridge.exitA,previousExitB=rt.bridge.exitB;
 events.pointerdown({clientX:p0.x,clientY:p0.y,button:0,pointerId:21});
 events.pointermove({clientX:p1.x,clientY:p1.y,
  button:0,buttons:1,shiftKey:false,pointerId:21});
 events.pointerup({clientX:p1.x,clientY:p1.y,pointerId:21});
 assert.ok(rt.bridge.exitB>previousExitB+10,'Dragging lower elbow lengthens its exit');
 assert.equal(rt.bridge.exitA,previousExitA,
  'Dragged elbow cannot move the opposite exit independently');
 checkRightAngles(api.routeCenterline(rt));
 const snapshot=JSON.parse(JSON.stringify({...api.project,format:'walnut-loop-v27'}));
 assert.equal(api.validateImport(snapshot),true,'Bridge survives project export/import');
 api.cpart('rad1').pos[1]+=12;
 api.changeModel();
 checkRightAngles(api.routeCenterline(rt));
 get('detachBridge').onclick();
 assert.equal(rt.bridge,undefined);
 assert.ok(rt.waypoints?.length>0,'Converted route exposes editable control points');
 assert.equal(get('routePointControls').style.display,'block');
 get('makeBridge').onclick();
 assert.ok(rt.bridge,'Editable route can be rebuilt as a radiator bridge');
 api.cpart('rad1').fittings={in:{type:'90',rotation:0}};
 assert.equal(api.canBridgePorts('rad3.in','rad1.in'),false);
 assert.equal(api.routeGeom(rt).blocked,true,
  'A conflicting fitting is explicitly reported instead of inventing a port exit');
}
console.log('Parametric radiator bridge exits, exact 90-degree runs, edits, fit guards, and imports passed.');
