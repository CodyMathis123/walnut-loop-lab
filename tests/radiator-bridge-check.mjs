// node tests/radiator-bridge-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
for(const id of ['addBridgeRoute','bridgeControls','bridgeExit','bridgeRise','bridgeOrder',
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
const base=geo.radiatorBridge(example,{exit:35,rise:90,order:'x'});
checkRightAngles(base);
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
  validateImport,changeModel,selectRoute(id){selectedRoute=id;selectedWaypoint=-1}};
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
 assert.equal(rt.bridge.exit,50);
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
