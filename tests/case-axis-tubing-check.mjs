// node tests/case-axis-tubing-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
assert.match(html,/id="squareRoute"/);
assert.match(html,/assets\/route-geometry\.js\?v=0\.27\.4/);
assert.match(html,/assets\/app\.js\?v=0\.27\.4/);

const routeCtx={window:{}};
vm.runInNewContext(routing,routeCtx);
const geo=routeCtx.window.WalnutLoopRouting;
const diagonals=[[0,0,0],[40,40,0],[80,0,0]];
assert.ok(Math.abs(geo.cornerAngle(...diagonals)-90)<.001,
 'A pair of diagonal runs can form a deceptive 90-degree elbow');
assert.equal(geo.axisIssues(diagonals).length,2,
 'Both diagonals must fail the strict X/Y/Z check');
const rect=geo.orthogonalize(diagonals,[],'xyz');
assert.ok(rect&&rect.length>=4);
assert.equal(geo.axisIssues(rect).length,0);
assert.equal(geo.corners(rect,'elbow',{},false).filter(c=>!c.valid).length,0);

for(const userAgent of ['Desktop Chrome','iPhone Safari']){
 let counter=0;
 const nodes=new Map(),events={};
 const canvas={beginPath(){},moveTo(){},lineTo(){},closePath(){},
  stroke(){},fill(){},arc(){},ellipse(){},fillRect(){},clearRect(){},
  setTransform(){},setLineDash(){},fillText(){},
  measureText(s){return {width:String(s).length*7}}};
 const node=id=>{
  if(nodes.has(id))return nodes.get(id);
  const n={id,value:'',checked:false,textContent:'',innerHTML:'',
   width:1100,height:860,disabled:false,dataset:{},style:{},children:[],
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(event,cb){if(id==='scene')events[event]=cb},
   appendChild(child){this.children.push(child)},replaceChildren(){},
   querySelectorAll(){return []},setAttribute(){},setPointerCapture(){},
   getContext(){return canvas},
   getBoundingClientRect(){return {left:0,top:0,width:1100,height:860}}};
  nodes.set(id,n);return n;
 };
 const document={getElementById:node,
  createElement:()=>node('new'+(++counter)),
  createElementNS:()=>node('svg'+(++counter))};
 const ctx=vm.createContext({document,window:{},navigator:{userAgent},
  devicePixelRatio:1,console,confirm(){return true},
  localStorage:{getItem(){return null},removeItem(){}},
  setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(parts,ctx);
 vm.runInContext(routing,ctx);
 vm.runInContext(app+`
 globalThis.api={project,routeCenterline,routeGeom,routeTools,changeModel,
  squareElbowRoute,squareSelectedRoute,selectRoute(id){selectedRoute=id;selectedWaypoint=-1}};
 `,ctx);
 ctx.window.WalnutLoopWebGL={active:true,render(){},setActive(){}};
 const api=ctx.api;
 const rt={id:'case_axis_test',from:'rad1.in',to:'rad2.out',
  style:'elbow',axis:'xzy',waypoints:[],loop:'cpu'};
 api.project.routes.push(rt);
 // Two valid straight compression exits can have different X/Z positions;
 // connecting the leads diagonally is unacceptable even if mathematically 90.
 const original=api.routeCenterline(rt),leadA=original[0].slice(),
  depart=original[1].slice(),approach=original.at(-2).slice(),
  leadB=original.at(-1).slice();
 assert.ok(api.routeTools.axisIssues(original).length>0,
  'Fixture includes a non-case-aligned free span');
 api.changeModel();
 const g=api.routeGeom(rt);
 assert.equal(g.axisIssues.length,0,
  'An ordinary model change squares a non-axis-aligned hard elbow path');
 assert.equal(g.angleIssues.length,0,'Only valid 90-degree elbows remain');
 assert.equal(g.pts.length>3,true);
 assert.equal(api.routeTools.axisIssues(g.pts).length,0);
 for(const [i,expected] of [[0,leadA],[1,depart],
   [g.pts.length-2,approach],[g.pts.length-1,leadB]]){
  assert.deepEqual(Array.from(g.pts[i]),Array.from(expected),
   'Both physical port tips and straight exit necks stay anchored');
 }
 // Corrupt a free point again and ensure geometry never renders it as
 // a diagonal even before reconstruction.
 rt.waypoints[0][1]+=17;
 rt.waypoints[0][2]+=13;
 const wrong=api.routeGeom(rt);
 assert.ok(wrong.axisIssues.length>0);
 assert.equal(wrong.smooth.length,0,
  'No angled hard-tube preview should be drawn, even in warning red');
 api.selectRoute(rt.id);
 node('squareRoute').onclick();
 assert.equal(api.routeGeom(rt).axisIssues.length,0);
 // A neighboring elbow may move connected straight runs, but not create
 // any diagonal while dragging.
 const newPoints=api.routeCenterline(rt);
 const joint=2;
 const moved=geo.orthogonalDrag(newPoints,joint,[6,0,0]);
 if(moved)assert.equal(geo.axisIssues(moved).length,0);
 assert.equal(api.project.routes[0].style,'elbow');
}
console.log('Strict X/Y/Z hard elbows: diagonal detection, auto square, drag and anchored ports passed.');
