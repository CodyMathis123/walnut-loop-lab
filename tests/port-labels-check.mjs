// Node-only UI regression: port names reflect physical radiator mounting.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const parts=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const routes=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/assets\/app\.js\?v=0\.27/);
assert.match(app,/walnut-loop-v27/);

function editor(userAgent){
 const controls=new Map(),canvas={
  beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},
  arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},
  setLineDash(){},fillText(){},measureText(s){return {width:String(s).length*7}}
 };
 const node=id=>{
  if(controls.has(id))return controls.get(id);
  const n={id,children:[],style:{},dataset:{},value:'',checked:false,
   textContent:'',width:1100,height:860,
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},appendChild(p){this.children.push(p)},
   replaceChildren(){this.children=[]},querySelectorAll(){return []},
   setAttribute(){},getContext(){return canvas},
   getBoundingClientRect(){return {width:1100,height:860,left:0,top:0}}};
  let inner='';
  Object.defineProperty(n,'innerHTML',{get(){return inner},set(value){
   inner=value;if(value==='')this.children=[];
  }});
  controls.set(id,n);return n;
 };
 let counter=0;
 const document={getElementById:node,createElement:()=>node('el'+(++counter)),
  createElementNS:()=>node('svg'+(++counter))};
 const context=vm.createContext({window:{},document,navigator:{userAgent},
  localStorage:{getItem(){return null},removeItem(){}},devicePixelRatio:1,
  console,confirm(){return true},setTimeout(){return 1},clearTimeout(){}});
 vm.runInContext(parts,context);vm.runInContext(routes,context);
 vm.runInContext(app+'\n;globalThis.__ui={project,cpart,portLabel,portDescription,portKeys,refreshPortSelect,alignRadiatorToOpening,selectComponent(id){selection=id;refreshComponent();}}',context);
 return {api:context.__ui,controls:node,context};
}
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,controls,context}=editor(agent);
 const expected=[
  ['rad1','Front right','right'],
  ['rad2','Rear right','right'],
  ['rad3','Front left','left'],
  ['rad4','Rear left','left']
 ];
 for(const [id,location,side] of expected){
  const number=id.slice(3),r=api.cpart(id);
  const prefix='Radiator '+number+' · '+location+' · ';
  assert.equal(api.portLabel(id+'.in'),prefix+'Outer port ('+side+' edge)');
  assert.equal(api.portLabel(id+'.out'),prefix+'Inner port (toward center)');
  assert.equal(api.portDescription(r,r.ports[0]),'Outer port ('+side+' edge)');
  assert.equal(api.portDescription(r,r.ports[1]),'Inner port (toward center)');
 }
 api.refreshPortSelect();
 for(const select of ['fromPort','toPort']){
  const options=controls(select).children;
  assert.equal(options.length,api.portKeys().length);
  const out=options.find(o=>o.value==='rad3.in');
  assert.equal(out.textContent,'Radiator 3 · Front left · Outer port (left edge)');
 }
 // The label changes with mounting slot without changing the route's port ID.
 const first=api.cpart('rad1');
 first.slot='rear-left';
 api.alignRadiatorToOpening(first);
 assert.equal(api.portLabel('rad1.in'),'Radiator 1 · Rear left · Outer port (left edge)');
 assert.equal(api.portLabel('rad1.out'),'Radiator 1 · Rear left · Inner port (toward center)');
 assert.ok(api.portKeys().includes('rad1.in'));
 // If a custom offset moves a port inward, describe its actual location.
 first.ports[0].off[0]=first.ports[1].off[0]+12;
 assert.equal(api.portDescription(first,first.ports[0]),'Inner port (toward center)');
 api.alignRadiatorToOpening(first);
 first.slot='front-right';api.alignRadiatorToOpening(first);
 // The old long hardware model strings no longer fill the selection list.
 assert.equal(api.portLabel('cpu.in'),'CPU block · Inlet');
 assert.equal(api.portLabel('gpu.out'),'GPU block · Top outlet');
 assert.equal(api.portLabel('pump.in'),'Left pump · Inlet');
 assert.equal(api.portLabel('res2.in'),'Right reservoir · Bottom return');
 api.selectComponent('rad1');
 assert.match(controls('portInfo').innerHTML,/Outer port \(right edge\)/);
 assert.match(controls('portInfo').innerHTML,/Inner port \(toward center\)/);
 assert.doesNotMatch(controls('portInfo').innerHTML,/Near side|Far side|Port A|Port B/);
}
console.log('Physical radiator dropdown and component-editor port labels passed.');
