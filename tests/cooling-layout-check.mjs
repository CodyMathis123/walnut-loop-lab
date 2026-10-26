// node tests/cooling-layout-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const geometry=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../assets/route-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="loopMode"/);
assert.match(html,/id="reservoirOrientation"/);
assert.match(html,/id="radiatorLoop"/);
assert.match(html,/src="assets\/app\.js\?v=0\.23"/);

function harness(agent){
 const elements=new Map(),ctx={
  beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},fill(){},
  arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},setLineDash(){},
  fillText(){},measureText(t){return {width:String(t).length*7};}
 };
 const node=id=>{
  if(elements.has(id))return elements.get(id);
  const obj={id,value:'',textContent:'',innerHTML:'',style:{},dataset:{},children:[],
   width:1000,height:850,
   classList:{add(){},remove(){},toggle(){}},
   addEventListener(){},querySelectorAll(){return []},setAttribute(){},
   appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},
   getContext(){return ctx},
   getBoundingClientRect(){return {left:0,top:0,width:1000,height:850}}
  };
  elements.set(id,obj);return obj;
 };
 const document={getElementById:node,
  createElement:()=>node('element'+elements.size),
  createElementNS:()=>node('svg'+elements.size)};
 const storage={data:null,getItem(){return this.data},setItem(k,v){this.data=v}};
 let allowChange=true;
 const context=vm.createContext({
  document,navigator:{userAgent:agent},window:{},localStorage:storage,
  devicePixelRatio:1,console,
  confirm(){return allowChange},
  setTimeout(){return 1},clearTimeout(){}
 });
 vm.runInContext(geometry,context);
 vm.runInContext(routing,context);
 vm.runInContext(source+'\n;globalThis.__app={initial,project,cpart,renderedParts,effectiveLoop,applyLoopMode,setReservoirOrientation,normalizeImport,sampleRoutes,addRoute,changeModel,portKeys,portPos,routeGeom}',context);
 return {api:context.__app,node,storage,allow:(v)=>allowChange=v};
}
for(const agent of ['Desktop Chrome','iPhone Safari']){
 const {api,node,storage,allow}=harness(agent);
 const p=api.project;
 assert.equal(p.loopMode,'dual');
 const group=(owner)=>p.parts.filter(x=>x.type==='radiator'&&x.loop===owner);
 assert.equal(group('gpu').length,2);
 assert.equal(group('cpu').length,2);
 assert.deepEqual(Array.from(group('gpu').map(r=>r.slot)).sort(),['front-left','rear-left']);
 assert.deepEqual(Array.from(group('cpu').map(r=>r.slot)).sort(),['front-right','rear-right']);
 assert.equal(p.parts.filter(x=>x.type==='res').length,2);
 for(const id of ['res','res2']){
  const reservoir=api.cpart(id);
  assert.equal(reservoir.ports.length,3);
  assert.deepEqual(Array.from(reservoir.ports.map(v=>v.id)),['in','out','top']);
  assert.equal(reservoir.ports.find(v=>v.id==='in').off[1],-119);
  assert.equal(reservoir.ports.find(v=>v.id==='out').off[1],-119);
  assert.equal(reservoir.ports.find(v=>v.id==='top').off[1],119);
  assert.notEqual(reservoir.ports[0].off[0],reservoir.ports[1].off[0]);
 }

 assert.equal(p.parts.filter(x=>x.type==='pump').length,2);
 assert.equal(p.parts.filter(x=>x.type==='drain').length,2);
 for(const id of ['res','pump','drain','res2','pump2','drain2']){
  const item=api.cpart(id);
  assert.equal(item.visible!==false,true,'Dual mode visible: '+id);
  assert.ok((item.pos[0]<0)===(id==='res'||id==='pump'||id==='drain'),
    'Hardware must be entirely on its proper side: '+id);
  assert.ok(item.pos[0]<0?item.pos[0]+item.size[0]/2<0:
                                item.pos[0]-item.size[0]/2>0,'No divider overlap: '+id);
 }
 assert.ok(api.renderedParts().some(x=>x.id==='res2'));
 // Top ports are still physically modeled, but cannot be part of tubing.
 assert.ok(api.portPos('res.top'));
 assert.ok(api.portPos('res2.top'));
 assert.ok(!api.portKeys().includes('res.top'));
 assert.ok(!api.portKeys().includes('res2.top'));
 assert.ok(api.portKeys().includes('res.in'));
 assert.ok(api.portKeys().includes('res.out'));
 assert.ok(api.portKeys().includes('res2.in'));
 assert.ok(api.portKeys().includes('res2.out'));
 api.addRoute('res.top','pump.in','soft','xzy');
 api.addRoute('pump.out','res2.top','soft','xzy');
 assert.equal(p.routes.length,0,'No hoses may connect to fill/vent ports');
 // All styles must be honored by the example generator.
 for(const [style,axis] of [['soft','xzy'],['elbow','yxz'],['bend','zyx']]){
  node('styleSelect').value=style;
  node('axisOrder').value=axis;
  api.sampleRoutes();
  assert.equal(p.routes.length,12);
  assert.ok(p.routes.every(rt=>rt.style===style),'Style should be '+style);
  assert.ok(p.routes.every(rt=>rt.axis===axis),'Axis order should be '+axis);
  assert.ok(p.routes.every(rt=>!rt.from.endsWith('.top')&&!rt.to.endsWith('.top')));
  if(style==='elbow')assert.ok(p.routes.some(rt=>api.routeGeom(rt).elbows>0));
 }
 // Return to the default style for the remaining mode-switch checks.
 node('styleSelect').value='soft';
 node('axisOrder').value='xzy';
 api.sampleRoutes();
 assert.equal(p.routes.length,12);
 assert.equal(p.routes.filter(r=>r.loop==='gpu').length,6);
 assert.equal(p.routes.filter(r=>r.loop==='cpu').length,6);
 assert.ok(p.routes.every(r=>r.loop===api.effectiveLoop(api.cpart(r.from.split('.')[0]))));
 assert.ok(p.routes.every(r=>r.loop===api.effectiveLoop(api.cpart(r.to.split('.')[0]))));
 assert.ok(p.routes.every(r=>!r.from.endsWith('drain.out')&&!r.from.endsWith('drain2.out')),
  'Both drain outlets must remain capped');
 const routeCount=p.routes.length;
 api.addRoute('res.out','pump2.in','soft','xzy');
 assert.equal(p.routes.length,routeCount,'Cannot connect GPU and CPU loops');
 allow(false);
 assert.equal(api.applyLoopMode('single'),false,'Cancel must leave mode and routes alone');
 assert.equal(p.loopMode,'dual');
 allow(true);
 assert.equal(api.applyLoopMode('single'),true);
 assert.equal(p.routes.length,0,'Mode change clears old cross-loop route topology');
 assert.equal(p.singleHardwareSide,'right');
 assert.ok(['res','pump','drain'].every(id=>api.cpart(id).visible===false));
 assert.ok(['res2','pump2','drain2'].every(id=>api.cpart(id).visible!==false));
 api.sampleRoutes();
 assert.equal(p.routes.length,9);
 assert.ok(p.routes.some(r=>r.to==='cpu.in'));
 assert.ok(p.routes.some(r=>r.to==='gpu.in'));
 assert.ok(p.routes.every(r=>r.loop==='shared'));
 assert.ok(p.routes.some(r=>r.from==='res2.out'&&r.to==='pump2.in'));
 assert.ok(p.routes.some(r=>r.from==='cpu.out'&&r.to==='res2.in'),
  'Right reservoir return must use the bottom return port');
 assert.ok(p.routes.every(r=>!r.from.startsWith('res.')&&!r.to.startsWith('res.')));
 assert.ok(p.routes.every(r=>!r.from.endsWith('.top')&&!r.to.endsWith('.top')));
 assert.equal(api.applyLoopMode('single',{side:'left'}),true);
 assert.equal(p.singleHardwareSide,'left');
 assert.ok(['res2','pump2','drain2'].every(id=>api.cpart(id).visible===false));
 assert.ok(['res','pump','drain'].every(id=>api.cpart(id).visible!==false));
 node('styleSelect').value='elbow';
 node('axisOrder').value='xyz';
 api.sampleRoutes();
 assert.equal(p.routes.length,9);
 assert.ok(p.routes.every(r=>r.style==='elbow'&&r.axis==='xyz'));
 assert.ok(p.routes.some(r=>r.from==='res.out'&&r.to==='pump.in'));
 assert.ok(p.routes.some(r=>r.from==='cpu.out'&&r.to==='res.in'));
 assert.ok(p.routes.every(r=>!r.from.endsWith('.top')&&!r.to.endsWith('.top')));
 assert.equal(api.applyLoopMode('dual'),true);
 assert.ok(['res2','pump2','drain2'].every(id=>api.cpart(id).visible!==false));
 assert.equal(p.routes.length,0);
 const res=api.cpart('res'),original=JSON.stringify(res.ports.map(q=>q.off));
 const originalPosition=res.pos.slice(),bottom=res.pos[1]-res.size[1]/2;
 node('componentSelect').onchange({target:{value:'res'}});
 assert.equal(node('reservoirOrientationControls').style.display,'block');
 node('reservoirOrientation').onchange({target:{value:'horizontal'}});
 assert.equal(res.orientation,'horizontal');
 assert.deepEqual(Array.from(res.size),[72,72,238]);
 assert.ok(Math.abs(res.pos[1]-res.size[1]/2-bottom)<1e-9);
 assert.deepEqual(Array.from(res.ports.find(q=>q.id==='out').off),[17,0,119]);
 assert.deepEqual(Array.from(res.ports.find(q=>q.id==='top').off),[0,0,-119]);
 assert.equal(storage.data,null,'Prototyping changes are not automatically persisted');
 node('reservoirOrientation').onchange({target:{value:'vertical'}});
 assert.equal(res.orientation,'vertical');
 assert.equal(JSON.stringify(res.ports.map(q=>q.off)),original);
 assert.deepEqual(Array.from(res.pos),Array.from(originalPosition));
 // Right reservoir can independently be laid horizontally.
 node('componentSelect').onchange({target:{value:'res2'}});
 node('reservoirOrientation').onchange({target:{value:'horizontal'}});
 assert.equal(api.cpart('res').orientation,'vertical');
 assert.equal(api.cpart('res2').orientation,'horizontal');
 // Explicit imports are complete snapshots of this version, without migration.
 const current=api.initial();
 assert.equal(current.format,'walnut-loop-v23');
 current.parts.find(x=>x.id==='drain').pos=[-160,75,90];
 const restored=api.normalizeImport(current);
 assert.deepEqual(Array.from(restored.parts.find(x=>x.id==='drain').pos),[-160,75,90]);
 const incomplete=api.initial();
 incomplete.parts=incomplete.parts.filter(x=>x.id!=='res2');
 assert.throws(()=>api.normalizeImport(incomplete),/current-format/);
 const invalidFillRoute=api.initial();
 invalidFillRoute.routes.push({id:'vent-tube',from:'res.top',to:'pump.in',
  style:'soft',axis:'xzy',loop:'gpu'});
 assert.throws(()=>api.normalizeImport(invalidFillRoute),/current-format/,
  'Current project snapshots must not attach a hose to a top vent');

}
console.log('Cooling presets, isolation, reservoir rotation and current-format import passed.');
