// Run: node tests/component-geometry-check.mjs
// Verifies manufacturer-inspired parts independently of the GPU/CDN.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/<script src="assets\/part-geometry\.js\?v=0\.13"><\/script>\s*<script src="assets\/app\.js\?v=0\.13"><\/script>/);
assert.match(app,/p\.type==='tray'&&drawParts\?\.renderTray/);
assert.match(app,/p\.type==='radiator'&&drawParts\?\.renderRadiator/);

const window={};
vm.runInNewContext(source,{window});
assert.equal(typeof window.WalnutLoopPartGeometry.renderTray,'function');
assert.equal(typeof window.WalnutLoopPartGeometry.renderRadiator,'function');

const colors={trayFaces:0,finFaces:0,darkSlots:0},geoEvents=[];
const circle3=(origin,r,axis,n=40)=>Array.from({length:n+1},(_,i)=>{
 const a=2*Math.PI*i/n,cos=Math.cos(a)*r,sin=Math.sin(a)*r;
 return axis==='y'?[origin[0]+cos,origin[1],origin[2]+sin]:
  axis==='x'?[origin[0],origin[1]+cos,origin[2]+sin]:
  [origin[0]+cos,origin[1]+sin,origin[2]];
});
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const geometry={
 box(part){geoEvents.push({kind:'box',pos:part.pos,size:part.size});},
 polygon(points,fill){geoEvents.push({kind:'face',points,fill});},
 stroke(points){geoEvents.push({kind:'line',points});},
 circle3,add
};
function assertFinite() {
 for(const e of geoEvents)for(const pt of
   e.kind==='box'?[e.pos,e.size]:e.points)
  for(const n of pt)assert.ok(Number.isFinite(n),'Non-finite geometry value');
}
const tray={id:'tray',type:'tray',pos:[76,489.775,-70],size:[276.86,1.65,323.85]};
window.WalnutLoopPartGeometry.renderTray(tray,geometry);
assertFinite();
const trayBodies=geoEvents.filter(e=>e.kind==='box');
const trayFaces=geoEvents.filter(e=>e.kind==='face');
assert.ok(trayBodies.length>=18,'Expected tray strips, flanges, mounting ears and standoffs');
assert.ok(trayFaces.length>=70,'Rear I/O and circular aperture should use solid strips');
assert.ok(!trayBodies.some(e=>e.size[0]===276.86&&e.size[2]===323.85),
 'Tray must include an actual CPU service opening, not an opaque slab');
// Panel alignment within the rear 13 × 8.25 inch window (above 19.25-in support).
const panelBottom=tray.pos[1]+tray.size[1]/2,panelTop=panelBottom+183;
assert.ok(panelBottom>=488.95&&panelTop<=698.5);
const panelLeft=tray.pos[0]-76-155,panelRight=tray.pos[0]-76+155;
assert.ok(panelLeft>=-165.1&&panelRight<=165.1);
const darkRear=trayFaces.filter(e=>e.fill==='#1b2731');
assert.ok(darkRear.length>=70,'Rear panel should surround fan, I/O and seven PCI cutouts');
const fanX=-86,fanY=panelBottom+92;
const centerCovered=darkRear.some(e=>e.points.length===4&&e.points.every(p=>
  Math.hypot(p[0]-fanX,p[1]-fanY)<10));
assert.equal(centerCovered,false,'Rear fan opening should remain open');
geoEvents.length=0;

const radiator={id:'rad1',type:'radiator',pos:[100,273,198.6],
 size:[135,380,60],ports:[
  {id:'in',off:[-30,190,31]},{id:'out',off:[30,190,31]}
 ]};
window.WalnutLoopPartGeometry.renderRadiator(radiator,geometry);
assertFinite();
const boxes=geoEvents.filter(e=>e.kind==='box');
const fins=geoEvents.filter(e=>e.kind==='line');
assert.equal(boxes.length,4,'Radiator should have two rails and two end tanks');
assert.ok(fins.length>=120,'Expect recessed fin rows and mounting details');
assert.ok(geoEvents.some(e=>e.kind==='face'&&e.fill==='#111b25'));
assert.ok(!boxes.some(e=>e.size[0]===135&&e.size[1]===380),
 'Radiator center must not be a single opaque rectangle');
console.log('Component geometry checks passed: real tray cutouts and 60 mm finned radiator.');
