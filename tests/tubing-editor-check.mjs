// node tests/tubing-editor-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const geo=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const id of ['addPoint','deletePoint','autoRoute','pointCount','singleHardwareSide']){
 assert.ok(html.includes('id="'+id+'"'),'Missing route control '+id);
}
assert.match(html,/assets\/app\.js\?v=0\.19/);

function setup(userAgent){
 let counter=0;
 const registry=new Map(),canvasEvents={};
 const ctx={beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},
  arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},setLineDash(){},
  fillText(){},measureText(t){return {width:String(t).length*7}}};
 const get=id=>{
  if(registry.has(id))return registry.get(id);
  const node={id,value:'',textContent:'',innerHTML:'',style:{},dataset:{},children:[],
   width:1100,height:860,disabled:false,
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(type,fn){if(id==='scene')canvasEvents[type]=fn},
   querySelectorAll(){return []},appendChild(x){this.children.push(x)},
   replaceChildren(){this.children=[]},setAttribute(){},
   setPointerCapture(){},
   getContext(){return ctx},
   getBoundingClientRect(){return {left:0,top:0,width:1100,height:860}}};
  registry.set(id,node);return node;
 };
 const document={getElementById:get,createElement:()=>get('element'+(++counter)),
  createElementNS:()=>get('svg'+(++counter))};
 const context=vm.createContext({window:{},navigator:{userAgent},document,
  devicePixelRatio:1,console,localStorage:{getItem(){return null},removeItem(){}},
  confirm(){return true},setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(geo,context);
 vm.runInContext(code+`
 globalThis.testAPI={
  project,cpart,portPos,screen,draw,addRoute,routePoints,routeGeom,
  editableRoute,insertRoutePoint,nearestRenderedRoute,pointSegmentDistance,
  routePointWorldDelta,addSelectedRoutePoint,removeSelectedRoutePoint,
  clearSelectedRoutePoints,selectRoute(id){selectedRoute=id;selectedWaypoint=-1},
  getSelectedWaypoint(){return selectedWaypoint},
  getYaw(){return view.yaw},getPitch(){return view.pitch}
 };`,context);
 // Emulate the actual WebGL bridge after editor boot, without needing a GPU.
 context.window.WalnutLoopWebGL={active:true,render(){},setActive(){}};
 context.testAPI.draw();
 return {api:context.testAPI,node:get,events:canvasEvents};
}
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,node,events}=setup(agent);
 assert.equal(typeof events.pointerdown,'function');
 assert.equal(typeof events.pointermove,'function');
 assert.equal(typeof events.pointerup,'function');
 api.addRoute('res.out','pump.in','soft','xyz');
 assert.equal(api.project.routes.length,1);
 const rt=api.project.routes[0];
 api.selectRoute(rt.id);
 const initial=api.routePoints(rt);
 assert.ok(initial.length>=2);
 // Clicking tube creates a point, and dragging changes the 3D point, not camera.
 const line=api.routeGeom(rt).smooth,center=line[Math.floor(line.length/2)];
 const xy=api.screen(center);
 const cameraYaw=api.getYaw();
 events.pointerdown({clientX:xy.x,clientY:xy.y,button:0,pointerId:1,shiftKey:false});
 assert.ok(Array.isArray(rt.waypoints));
 assert.ok(rt.waypoints.length>=1);
 const before=rt.waypoints[api.getSelectedWaypoint()].slice();
 events.pointermove({clientX:xy.x+24,clientY:xy.y-16,shiftKey:false,buttons:1});
 events.pointerup({clientX:xy.x+24,clientY:xy.y-16,button:0,pointerId:1});
 assert.ok(rt.waypoints[api.getSelectedWaypoint()].some((v,i)=>Math.abs(v-before[i])>.1),
  'Dragging should change a 3D waypoint');
 assert.equal(api.getYaw(),cameraYaw,'Dragging a route must not orbit the case');
 const midCount=rt.waypoints.length;
 node('addPoint').onclick();
 assert.equal(rt.waypoints.length,midCount+1);
 node('deletePoint').onclick();
 assert.equal(rt.waypoints.length,midCount);
 // Soft paths must remain curved; elbows and rounded bends use same control points.
 rt.style='soft';assert.ok(api.routeGeom(rt).smooth.length>rt.waypoints.length+2);
 rt.style='bend';assert.ok(api.routeGeom(rt).smooth.length>=rt.waypoints.length+2);
 rt.style='elbow';assert.equal(api.routeGeom(rt).elbows,rt.waypoints.length);
 assert.equal(api.routeGeom(rt).pts.length,rt.waypoints.length+2);
 const originalPoints=JSON.stringify(rt.waypoints);
 // Shift+drag is a depth-plane edit.
 api.selectRoute(rt.id);
 const point=rt.waypoints[0].slice(),p=api.screen(point);
 events.pointerdown({clientX:p.x,clientY:p.y,button:0,pointerId:2,shiftKey:true});
 events.pointermove({clientX:p.x,clientY:p.y+21,buttons:1,shiftKey:true});
 events.pointerup({clientX:p.x,clientY:p.y+21,pointerId:2});
 assert.ok(Math.abs(rt.waypoints[0][2]-point[2])>.1 ||
  Math.abs(rt.waypoints[0][0]-point[0])>.1,'Shift must edit depth');
 assert.notEqual(JSON.stringify(rt.waypoints),originalPoints);
 node('autoRoute').onclick();
 assert.equal(rt.waypoints,undefined,'Reset returns to automatic route');
 assert.equal(api.routePoints(rt).length,initial.length);
 // Hardware modes should not move or alter prior route waypoint types.
 assert.equal(typeof api.routePointWorldDelta(15,-10,false)[1],'number');
 const projectJson=JSON.stringify({...api.project,format:'walnut-loop-v19'});
 assert.ok(projectJson.includes('"routes"'));
}
console.log('Tubing pointer drag, edit handles, styles, shift depth and reset passed.');
