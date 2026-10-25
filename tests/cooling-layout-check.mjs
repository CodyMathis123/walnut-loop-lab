// node tests/cooling-layout-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const geometry=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="loopMode"/);
assert.match(html,/id="reservoirOrientation"/);
assert.match(html,/id="radiatorLoop"/);
assert.match(html,/src="assets\/app\.js\?v=0\.18"/);

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
 vm.runInContext(source+'\n;globalThis.__app={initial,project,cpart,renderedParts,effectiveLoop,applyLoopMode,setReservoirOrientation,normalizeImport,sampleRoutes,addRoute,changeModel}',context);
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
 assert.ok(['res2','pump2','drain2'].every(id=>api.cpart(id).visible===false));
 assert.equal(api.cpart('res').visible!==false,true);
 api.sampleRoutes();
 assert.equal(p.routes.length,9);
 assert.ok(p.routes.some(r=>r.to==='cpu.in'));
 assert.ok(p.routes.some(r=>r.to==='gpu.in'));
 assert.ok(p.routes.every(r=>r.loop==='shared'));
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
 assert.deepEqual(Array.from(res.ports.find(q=>q.id==='out').off),[0,0,119]);
 assert.ok(storage.data.includes('"orientation":"horizontal"'));
 node('reservoirOrientation').onchange({target:{value:'vertical'}});
 assert.equal(res.orientation,'vertical');
 assert.equal(JSON.stringify(res.ports.map(q=>q.off)),original);
 assert.deepEqual(Array.from(res.pos),Array.from(originalPosition));
 // Right reservoir can independently be laid horizontally.
 node('componentSelect').onchange({target:{value:'res2'}});
 node('reservoirOrientation').onchange({target:{value:'horizontal'}});
 assert.equal(api.cpart('res').orientation,'vertical');
 assert.equal(api.cpart('res2').orientation,'horizontal');
 // New projects are dual; old saved projects remain single and gain hidden spare parts.
 const old=api.initial();
 delete old.loopMode;
 old.parts=old.parts.filter(x=>!['res2','pump2','drain2'].includes(x.id));
 const oldDrain=old.parts.find(x=>x.id==='drain');
 oldDrain.pos=[55,80,75];
 const upgraded=api.normalizeImport(old);
 assert.equal(upgraded.loopMode,'single');
 assert.ok(['res2','pump2','drain2'].every(id=>upgraded.parts.find(x=>x.id===id)?.visible===false));
 assert.deepEqual(Array.from(upgraded.parts.find(x=>x.id==='drain').pos),[-190,65,125]);
 assert.equal(upgraded.parts.find(x=>x.id==='res').pos[0],-125);
 // A manually moved pump or drain is preserved, not reset.
 const custom=api.initial();delete custom.loopMode;
 custom.parts.find(x=>x.id==='drain').pos=[-160,75,90];
 const converted=api.normalizeImport(custom);
 assert.deepEqual(Array.from(converted.parts.find(x=>x.id==='drain').pos),[-160,75,90]);
}
console.log('Cooling presets, isolation, reservoir rotation and legacy migration passed.');
