// Node-only tests for the optional GPU backend; no WebGL device or CDN needed.
// Run: node tests/webgl-smoke-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../assets/renderer-webgl.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');

assert.match(html,/type="importmap"/);
assert.match(html,/three@0\.186\.1\/build\/three\.module\.js/);
assert.match(html,/type="module" src="assets\/renderer-webgl\.js\?v=0\.24"/);
assert.match(html,/id="webglBtn"/);
assert.match(app,/window\.WalnutLoopWebGL\.render\(sceneQueue,view/);
assert.match(app,/window\.WalnutLoopRenderBridge=/);
assert.match(app,/if\(!webgl\)\{ctx\.beginPath\(\);ctx\.arc/);

const calls=[],vec=()=>({set(x,y,z){Object.assign(this,{x,y,z});}});
const element=id=>({
 id,style:{},children:[],classList:{
  entries:new Set(),add(k){this.entries.add(k)},remove(k){this.entries.delete(k)},
  toggle(k,v){if(v)this.add(k);else this.remove(k);}
 },
 setAttribute(){},prepend(el){this.children.unshift(el)},
 toBlob(callback){callback({test:'PNG'});}
});
class Group{
 constructor(){this.children=[];this.position=vec();}
 add(child){this.children.push(child);}
 remove(child){this.children=this.children.filter(x=>x!==child);}
}
class Geometry{
 constructor(){this.attributes={};this.disposed=false;}
 setAttribute(k,v){this.attributes[k]=v;}
 computeVertexNormals(){}
 dispose(){this.disposed=true;}
}
class Renderer {
 constructor(args){this.args=args;this.domElement=element('webglCanvas');calls.push(this);}
 setPixelRatio(v){this.ratio=v;}
 setClearColor(){}
 setSize(w,h){this.size=[w,h];}
 render(scene,camera){this.scene=scene;this.camera=camera;this.renders=(this.renders||0)+1;}
}
class Camera{
 constructor(){this.up=vec();this.position=vec();}
 lookAt(...target){this.target=target;}
 updateProjectionMatrix(){}
 updateMatrixWorld(){}
}
class Material{constructor(args){Object.assign(this,args)}}
class Attribute{constructor(values){this.array=values}}
class Mesh{constructor(geo,mat){this.geometry=geo;this.material=mat;this.position=vec();}}
class Grid{constructor(){this.position=vec();this.material={};}}
const THREE={
 WebGLRenderer:Renderer,Scene:Group,Group,GridHelper:Grid,OrthographicCamera:Camera,
 LineBasicMaterial:Material,MeshBasicMaterial:Material,DoubleSide:2,
 BufferGeometry:Geometry,Float32BufferAttribute:Attribute,
 Mesh,LineSegments:Mesh,SphereGeometry:Geometry
};
const nodes={webglBtn:element('webglBtn'),viewport:element('viewport'),viewStatus:element('viewStatus')};
let legacy=0,redraw=0;
const fakeWindow={devicePixelRatio:1,WalnutLoopRenderBridge:{
 selectLegacy(){legacy++},redraw(){redraw++}
},addEventListener(){}};
const moduleBody=script.replace("await import('three')","await Promise.resolve(TEST_THREE)");
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
await new AsyncFunction('document','window','console','TEST_THREE',moduleBody)(
 {getElementById:id=>nodes[id]},fakeWindow,console,THREE
);
const bridge=fakeWindow.WalnutLoopWebGL;
assert.ok(bridge?.active);
assert.equal(nodes.viewport.children.length,1);
assert.ok(legacy>0&&redraw>0);

const face=z=>({kind:'face',fill:'#9f7049',pts:[
 [-100,0,z],[100,0,z],[100,400,z],[-100,400,z]
]});
const draw=[face(254),{kind:'face',fill:'#24313d',pts:[
 [-50,100,235],[50,100,235],[50,200,235],[-50,200,235]
]},{kind:'line',color:'#ffbb00',alpha:.5,pts:[[0,100,253],[0,400,253]]}];
const project={parts:[],display:{ports:false}};
const frame={width:1000,height:850,revision:3,project};
const view={yaw:.58,pitch:.24,zoom:.9,target:[0,355,0],pan:[0,0]};
bridge.render(draw,view,frame);
const r=calls[0],world=r.scene.children[0];
assert.ok(r.args.depth);
assert.equal(world.children.length,3);
assert.equal(world.children[0].material.depthTest,true);
assert.equal(world.children[0].material.depthWrite,true);
assert.equal(world.children[0].geometry.attributes.position.array.length,18);
assert.equal(world.children[2].material.depthWrite,false);
assert.equal(world.children[2].material.opacity,.5);

const geometry=world.children[0].geometry;
bridge.render(draw,{...view,yaw:0},frame);
assert.equal(world.children[0].geometry,geometry,'Orbit must reuse existing GPU geometry');
bridge.render(draw,view,{...frame,revision:4});
assert.notEqual(world.children[0].geometry,geometry,'Edit must rebuild GPU geometry');
assert.equal(geometry.disposed,true);

const camera=r.camera,zoom=Math.min(1000/800,850/880)*view.zoom;
assert.ok(Math.abs((camera.right-camera.left)-1000/zoom)<.0001);
assert.ok(Math.abs(camera.position.x-(2200*Math.sin(.58)*Math.cos(.24)))<.0001);
assert.ok(Math.abs(camera.position.y-(355+2200*Math.sin(.24)))<.0001);

// Actual cylindrical tube meshes must become depth-tested triangle geometry,
 // not WebGL lines that can visibly pass in front of solid hardware.
bridge.render([{kind:'tube',
 pts:[[0,0,0],[0,80,0],[100,80,0]],radius:8,color:'#65c9e5'}],
 view,{...frame,revision:5});
const tubeMeshes=world.children.filter(m=>m.geometry?.attributes?.position?.array?.length>0);
assert.ok(tubeMeshes.length>=3,'Cylinder surface should generate several shaded facets');
assert.ok(tubeMeshes.every(m=>m.material.depthWrite===true));
assert.ok(tubeMeshes.some(m=>m.geometry.attributes.position.array.length>=18));

let exported=false;
bridge.exportPng(blob=>{assert.equal(blob.test,'PNG');exported=true});
assert.ok(exported);
bridge.setActive(false);
assert.equal(bridge.active,false);
assert.equal(nodes.viewport.classList.entries.has('webgl-active'),false);
console.log('Walnut Loop Lab WebGL backend smoke checks passed.');
