// node tests/corner-angle-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="routeCornerControls"/);
assert.match(html,/id="cornerList"/);
assert.match(html,/assets\/app\.js\?v=0\.26/);
const w={};vm.runInNewContext(routing,{window:w});
const geometry=w.WalnutLoopRouting;
assert.deepEqual(Array.from(geometry.ELBOW_ANGLES),[90,45]);
assert.deepEqual(Array.from(geometry.BEND_ANGLES),[90,60,45,30,22.5]);
const example=[[0,0,0],[40,20,0],[60,60,0]];
assert.ok(Math.abs(geometry.cornerAngle(...example)-36.86989765)<.01);
assert.equal(geometry.corners(example,'elbow',{},false)[0].valid,false,
 'An arbitrary 37 degree corner cannot be called a 90 degree elbow');
const enabled=geometry.corners(example,'elbow',{1:45},true)[0];
assert.equal(enabled.angle,45);assert.equal(enabled.valid,false);
assert.equal(geometry.corners(example,'elbow',{1:45},false)[0].angle,90,
 'Global 45 disable also applies to tube elbows');
let fixed=geometry.snapCorner(...example,45);
assert.ok(Math.abs(geometry.cornerAngle(example[0],fixed,example[2])-45)<.001);
fixed=geometry.snapCorner(...example,90);
assert.ok(Math.abs(geometry.cornerAngle(example[0],fixed,example[2])-90)<.001);
const rounded=[[0,0,0],[50,0,0],[50+50*Math.cos(Math.PI/3),50*Math.sin(Math.PI/3),0]];
assert.ok(geometry.corners(rounded,'bend',{1:60})[0].valid);
assert.equal(geometry.corners(rounded,'bend',{1:90})[0].valid,false);
const straight=[[0,0,0],[50,0,0],[100,0,0]];
assert.equal(geometry.corners(straight,'elbow').length,0);
const ortho=geometry.orthogonalize([[0,0,0],[50,40,20]],[],'xzy');
assert.ok(ortho.length>=3);
assert.ok(geometry.corners(ortho,'elbow',{},false).every(c=>c.valid));
const blocked=geometry.orthogonalize([[0,0,0],[50,40,20]],
 [{id:'all',min:[-100,-100,-100],max:[100,100,100]}],'xyz');
assert.equal(blocked,null);

for(const agent of ['Desktop Chrome','iPhone Safari']){
 const dom=new Map(),canvas={beginPath(){},moveTo(){},lineTo(){},closePath(){},
  stroke(){},fill(){},arc(){},ellipse(){},fillRect(){},clearRect(){},
  setTransform(){},setLineDash(){},fillText(){},
  measureText(v){return {width:String(v).length*7}}};
 let num=0;
 const node=id=>{
  if(dom.has(id))return dom.get(id);
  const element={id,value:'',checked:false,textContent:'',innerHTML:'',dataset:{},
   style:{},children:[],width:1100,height:860,classList:{add(){},remove(){},toggle(){}},
   getContext(){return canvas},getBoundingClientRect(){return {width:1100,height:860,left:0,top:0}},
   addEventListener(){},appendChild(v){this.children.push(v)},replaceChildren(){},
   querySelectorAll(){return []},setAttribute(){}};
  dom.set(id,element);return element;
 };
 const document={getElementById:node,createElement:()=>node('el'+(++num)),
  createElementNS:()=>node('svg'+(++num))};
 const ctx=vm.createContext({document,window:{},navigator:{userAgent:agent},
  localStorage:{getItem(){return null},removeItem(){}},devicePixelRatio:1,console,
  confirm(){return true},setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(parts,ctx);vm.runInContext(routing,ctx);
 vm.runInContext(app+'\n;globalThis.__test={project,cpart,routeGeom,routeCorners,routeCenterline,routeTools,alignCornerToAngle,refreshCornerControls,sampleRoutes}',ctx);
 const a=ctx.__test;
 ctx.window.WalnutLoopWebGL={active:true,render(){},setActive(){}};
 assert.equal(a.project.format,'walnut-loop-v27');
 const rt={id:'corner_test',from:'cpu.out',to:'gpu.in',style:'elbow',axis:'xzy',
  waypoints:[[45,600,-150],[10,600,-150]]};
 a.project.routes.push(rt);
 let specs=a.routeCorners(rt);
 assert.ok(specs.length>=2);
 const inner=specs.find(c=>c.index>=2&&c.index<=a.routeCenterline(rt).length-3);
 assert.ok(inner,'An editable corner is present');
 rt.cornerAngles={[inner.index]:90};
 assert.equal(a.alignCornerToAngle(rt,inner.index,90),true);
 const after=a.routeCorners(rt).find(c=>c.index===inner.index);
 assert.ok(Math.abs(after.actual-90)<.001,'Align corner modifies physical path');
 rt.style='bend';rt.cornerAngles={[inner.index]:45};
 assert.equal(a.alignCornerToAngle(rt,inner.index,45),true);
 assert.ok(Math.abs(a.routeCorners(rt).find(c=>c.index===inner.index).actual-45)<.001);
 a.refreshCornerControls(rt);
 assert.equal(node('routeCornerControls').style.display,'block');
 assert.ok(node('cornerList').innerHTML.includes('60°'));
 rt.style='elbow';a.project.allow45=false;
 a.refreshCornerControls(rt);
 assert.ok(!node('cornerList').innerHTML.includes('<option value="45"'));
 a.project.allow45=true;a.refreshCornerControls(rt);
 assert.ok(node('cornerList').innerHTML.includes('<option value="45"'));
 rt.style='soft';a.refreshCornerControls(rt);
 assert.equal(node('routeCornerControls').style.display,'none');
 a.project.routes=[];
 node('styleSelect').value='elbow';node('axisOrder').value='xzy';
 a.project.allow45=false;node('allowAuto45').checked=false;
 a.sampleRoutes();
 assert.equal(a.project.routes.length,12);
 const good=a.project.routes.filter(x=>!x.blocked);
 assert.ok(good.length>=3);
 for(const route of good){
  const shape=a.routeGeom(route);
  assert.equal(shape.angleIssues.length,0,'Accepted auto route cannot contain nonstandard elbows');
  assert.ok(shape.corners.every(c=>c.valid&&(c.angle===90||c.angle===45)));
 }
}
console.log('Individual 45/90 elbows, formed bend presets, corner alignment and geometry validation passed.');
