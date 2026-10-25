// Run: node tests/component-geometry-check.mjs
// Verifies manufacturer-inspired parts independently of the GPU/CDN.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/part-geometry.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/<script src="assets\/part-geometry\.js\?v=0\.17"><\/script>\s*<script src="assets\/app\.js\?v=0\.17"><\/script>/);
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
const tray={id:'tray',type:'tray',pos:[8.57,489.775,-69.525],size:[276.86,1.65,323.85]};
window.WalnutLoopPartGeometry.renderTray(tray,geometry);
assertFinite();
const trayBodies=geoEvents.filter(e=>e.kind==='box');
const trayFaces=geoEvents.filter(e=>e.kind==='face');
assert.ok(trayBodies.length>=18,'Expected tray strips, flanges, mounting ears and standoffs');
assert.ok(trayFaces.length>=70,'Rear I/O and circular aperture should use solid strips');
// Corrected factory-style rear/right access hole and future ITX-only standoffs.
assert.equal(trayBodies.filter(e=>e.size[0]===7&&e.size[1]===7&&e.size[2]===7).length,4);
assert.ok(tray.pos[0] + 46 + 120/2 < tray.pos[0] + tray.size[0]/2);
assert.ok(tray.pos[2] - 96 - 100/2 > tray.pos[2] - tray.size[2]/2);
const firstPlate=trayBodies[0].size[0];
geoEvents.length=0;
window.WalnutLoopPartGeometry.renderTray({...tray,cutout:{x:20,z:-85,width:105,depth:90}},geometry);
assert.notEqual(geoEvents.filter(e=>e.kind==='box')[0].size[0],firstPlate,
  'Changing tray opening measurements must rebuild the metal strips');
geoEvents.length=0;
window.WalnutLoopPartGeometry.renderTray(tray,geometry);
assertFinite();

assert.ok(!trayBodies.some(e=>e.size[0]===276.86&&e.size[2]===323.85),
 'Tray must include an actual CPU service opening, not an opaque slab');
// Panel alignment within the rear 13 × 8.25 inch window (above 19.25-in support).
const panelBottom=tray.pos[1]+tray.size[1]/2,panelTop=panelBottom+183;
assert.ok(panelBottom>=488.95&&panelTop<=698.5);
const panel=window.WalnutLoopPartGeometry.rearPanelAlignment(tray);
const {left:panelLeft,right:panelRight,center:panelCenter}=panel;
assert.ok(panelLeft>=-165.1&&panelRight<=165.1);
assert.ok(Math.abs(panelCenter)<.01,'Rear bracket must be centered in 13-inch window');
assert.ok(Math.abs(window.WalnutLoopPartGeometry.trayXForRearPanelCenter(0,tray.size[0])-tray.pos[0])<.01);
const trayLeft=tray.pos[0]-tray.size[0]/2,trayRight=tray.pos[0]+tray.size[0]/2;
assert.ok(Math.abs(panelRight-trayRight-8)<.01,'Bracket must extend 8 mm beyond the tray right');
assert.ok(Math.abs(trayLeft-panelLeft-25.14)<.01,'Bracket left overhang must be about 25 mm');
const moved={...tray,pos:[tray.pos[0]+45,tray.pos[1],tray.pos[2]]};
const movedPanel=window.WalnutLoopPartGeometry.rearPanelAlignment(moved);
assert.ok(Math.abs(movedPanel.left-panelLeft-45)<.01);
assert.ok(Math.abs(movedPanel.right-panelRight-45)<.01);
const resized={...tray,size:[260,tray.size[1],tray.size[2]]};
assert.ok(Math.abs(window.WalnutLoopPartGeometry.rearPanelAlignment(resized).right-
  (resized.pos[0]+130+8))<.01);
const darkRear=trayFaces.filter(e=>e.fill==='#1b2731');
assert.ok(darkRear.length>=70,'Rear panel should surround fan, I/O and seven PCI cutouts');
const fanX=panel.fanX,fanY=panelBottom+119;
const centerCovered=darkRear.some(e=>e.points.length===4&&e.points.every(p=>
  Math.hypot(p[0]-fanX,p[1]-fanY)<10));
assert.equal(centerCovered,false,'Rear fan opening should remain open');
// Validate actual cut-through areas, not just decorative outlines.
assert.ok(fanX>panel.center,'120 mm fan belongs on the right');
assert.ok(panel.split>panel.left&&panel.split<panel.right);
const sheet=darkRear.map(e=>e.points);
function containsPoint(vertices,x,y){
 let inside=false;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
  const a=vertices[i],b=vertices[j];
  if((a[1]>y)!==(b[1]>y) &&
     x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])
    inside=!inside;
 }
 return inside;
}
const covered=(x,y)=>sheet.some(poly=>containsPoint(poly,x,y));
assert.equal(covered(fanX,fanY),false,'Fan center is an open hole');
assert.equal(covered(fanX,panelBottom+30),false,'I/O under the fan must be open');
assert.equal(covered(fanX,panelBottom+58),true,'Metal must separate fan and I/O');
assert.equal(covered(fanX,panelBottom+5),true,'Metal must remain below I/O');
assert.equal(covered(panel.right-4,panelBottom+88),true,'Right outer frame must stay solid');
for(let i=0;i<7;i++){
 const slotCenter=panel.left+19+i*21;
 assert.ok(slotCenter<panel.split,'PCI slot must remain in left section');
 assert.equal(covered(slotCenter,panelBottom+50),false,'PCI slot '+(i+1)+' must be open');
}
assert.equal(covered(panel.left+6,panelBottom+155),true,'Upper-left PCI surround remains metal');
// Moving the tray must move the fan, I/O and PCI holes together.
const shiftedPanel=window.WalnutLoopPartGeometry.rearPanelAlignment({
 ...tray,pos:[tray.pos[0]+30,tray.pos[1],tray.pos[2]]
});
assert.ok(Math.abs(shiftedPanel.fanX-fanX-30)<.01);
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
