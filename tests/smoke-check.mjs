// Run from the repository root: node tests/smoke-check.mjs
// Minimal regression checks without a browser or third-party dependencies.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
assert.match(html,/<script\s+src="assets\/app\.js\?v=0\.11"><\/script>/);
assert.match(html,/<link\s+rel="stylesheet"\s+href="assets\/style\.css\?v=0\.11">/);
for(const m of app.matchAll(/\$\('([A-Za-z0-9_]+)'\)/g)){
 assert.ok(html.includes('id="'+m[1]+'"'),'Missing HTML element: '+m[1]);
}

function makeHarness(userAgent){
 const nodes=new Map(),ctx={
  beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},
  arc(){},ellipse(){},fillRect(){},clearRect(){},setTransform(){},setLineDash(){},fillText(){},
  measureText(t){return {width:String(t).length*7}}
 };
 const node=id=>{
  if(nodes.has(id))return nodes.get(id);
  const value={id,value:'',dataset:{},style:{},textContent:'',children:[],
   width:1000,height:850,
   classList:{add(){},remove(){},toggle(){}},
   appendChild(n){this.children.push(n)},replaceChildren(){this.children=[]},
   setAttribute(){},addEventListener(){},querySelectorAll(){return []},
   getContext(){return ctx},
   getBoundingClientRect(){return {left:0,top:0,width:1000,height:850}}
  };
  nodes.set(id,value);return value;
 };
 const document={getElementById:node,createElement:tag=>node('element-'+Math.random()),createElementNS:(ns,tag)=>node('svg-'+Math.random())};
 const store={data:null,getItem(){return this.data},setItem(k,v){this.data=v}};
 const context=vm.createContext({
  document,navigator:{userAgent},localStorage:store,window:{},devicePixelRatio:1,
  setTimeout(){return 1},clearTimeout(){},console,confirm(){return true}
 });
 vm.runInContext(app+'\n;globalThis.__test={initial,project,cpart,attachedFans,freeBayFans,setRadiatorSlot,normalizeImport,draw}',context);
 return {ui:node,model:context.__test,store};
}

for(const ua of ['Desktop Chrome','iPhone Safari']){
 const {ui,model,store}=makeHarness(ua);
 assert.equal(ui('rendererBtn').textContent.includes(ua.startsWith('iPhone')?'SVG':'Canvas'),true);
 assert.equal(model.project.parts.filter(p=>p.type==='radiator'&&p.visible!==false).length,4);
 assert.equal(model.project.parts.filter(p=>p.type==='radiator').length,4);
 assert.deepEqual(Array.from(model.project.parts.filter(p=>p.type==='radiator').map(p=>p.slot)).sort(),
   ['front-left','front-right','rear-left','rear-right'].sort());
 const slotInfo=['front-left','front-right','rear-left','rear-right'];
 for(const slot of slotInfo){
  const rad=model.project.parts.find(p=>p.type==='radiator'&&p.slot===slot);
  assert.equal(model.attachedFans(rad).length,6);
  const end=slot.startsWith('front')?1:-1;
  const frontFace=model.attachedFans(rad)[0].pos[2]+end*model.project.case.fanThickness/2;
  assert.ok(Math.abs(frontFace-end*model.project.case.depth/2)<.001,
    'Panel-facing fan must be flush in its cutout: '+slot);
 }
 assert.equal(model.attachedFans(model.cpart('rad1')).length,6);
 assert.equal(typeof ui('innerFanCount').onchange,'function');
 const otherPosition=model.cpart('rad1').pos.slice();
 // Choose six fans (3 panel-side + 3 inside) and ensure cooling is visible.
 ui('showCoolingBtn').onclick();
 ui('panelFanCount').onchange({target:{value:'3'}});
 ui('innerFanCount').onchange({target:{value:'3'}});
 assert.equal(model.project.display.caseOnly,false);
 assert.equal(model.project.display.internals,false);
 assert.equal(model.attachedFans(model.cpart('rad1')).length,6);
 assert.ok(store.data,'Project not persisted');
 assert.equal(typeof ui('internalsBtn').onclick,'function');
 // Show provisional hardware only when explicitly enabled.
 assert.equal(model.project.display.internals,false);
 ui('internalsBtn').onclick();
 assert.equal(model.project.display.internals,true);
 ui('showCoolingBtn').onclick();
 assert.equal(model.project.display.internals,false);
 // Occupied slots are protected, and other radiator positions are not reset.
 model.cpart('rad1').pos[0]+=8;
 const adjusted=model.cpart('rad1').pos.slice();
 model.setRadiatorSlot('rad2','front-left');
 assert.equal(model.cpart('rad2').slot,'rear-right');
 assert.deepEqual(Array.from(model.cpart('rad1').pos),Array.from(adjusted));
 // Unmounting clears a slot and permits standalone fans exactly within it.
 model.setRadiatorSlot('rad4','unmounted');
 assert.equal(model.cpart('rad4').visible,false);
 model.project.fanOnly['rear-left']=3;
 assert.equal(model.freeBayFans().filter(f=>f.pos[2]<0&&f.pos[0]<0).length,3);
 // The 4-radiator preset restores all four mounted radiator assemblies.
 ui('fourRadiatorsBtn').onclick();
 assert.equal(model.project.parts.filter(p=>p.type==='radiator'&&p.visible!==false).length,4);
 assert.equal(model.project.parts.filter(p=>p.type==='radiator').reduce((n,p)=>n+model.attachedFans(p).length,0),24);
 // Old JSON projects gain defaults but retain the support-height correction.
 const old=model.initial();
 old.parts=old.parts.filter(p=>p.id!=='rad4');
 old.parts.forEach(p=>{delete p.fans});
 delete old.fanOnly;
 delete old.mountVersion;
 old.case.windowHeight=215.9;
 const updated=model.normalizeImport(old);
 assert.equal(updated.case.windowHeight,209.55);
 assert.equal(updated.parts.find(p=>p.id==='rad1').fans.panel,3);
 assert.equal(updated.fanOnly['rear-right'],0);
 assert.equal(updated.parts.filter(p=>p.type==='radiator').length,4);
 assert.ok(updated.parts.some(p=>p.id==='rad4'));
 model.draw();
}
assert.equal(html.includes('Measurements captured'),false);
assert.ok(html.includes('<summary>Case dimensions</summary>'));
assert.ok(html.includes('<summary>Tubing routes</summary>'));

console.log('Walnut Loop Lab: smoke checks passed for desktop Canvas and mobile SVG.');
