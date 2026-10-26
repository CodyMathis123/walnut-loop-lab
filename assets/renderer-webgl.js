/**
 * Walnut Loop Lab: real 3D Z-buffer backend.
 *
 * Imports Three.js as an ES module while leaving the classic editor, hit tests,
 * projects and Canvas/SVG fallback independent. No build step required.
 * All 3D primitives arrive as WORLD coordinates (millimetres).
 */
const button = document.getElementById('webglBtn');
const viewport = document.getElementById('viewport');
const editor = window.WalnutLoopRenderBridge;

function unavailable(message) {
  button.disabled = true;
  button.textContent = '3D unavailable';
  button.title = message;
  viewport.classList.remove('webgl-active');
  const status = document.getElementById('viewStatus');
  if (status) status.title = 'Legacy Canvas/SVG rendering is still available. ' + message;
}

if (!button || !viewport || !editor) {
  console.warn('Walnut WebGL: editor controls not ready.');
} else {
  try {
    // GitHub Pages remains a static site; a pinned import-map dependency is
    // loaded only for the optional GPU backend.
    const THREE = await import('three');
    const renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true, depth: true,
      preserveDrawingBuffer: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.id = 'webglCanvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    viewport.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const world = new THREE.Group();
    scene.add(world);

    const grid = new THREE.GridHelper(900, 9, 0x435266, 0x344356);
    grid.position.y = -0.7;
    grid.material.transparent = true;
    grid.material.opacity = 0.17;
    grid.material.depthWrite = false;
    scene.add(grid);

    const camera = new THREE.OrthographicCamera(-500, 500, 450, -450, 1, 6000);
    const colorMaterials = new Map();
    let active = false, revision = -1;
    let dimensions = { width: 0, height: 0 };

    function parseCssColor(value) {
      const hex = String(value || '#ffffff').trim();
      if (/^#[0-9a-f]{8}$/i.test(hex))
        return { color: hex.slice(0, 7), opacity: parseInt(hex.slice(7), 16) / 255 };
      if (/^#[0-9a-f]{4}$/i.test(hex))
        return {
          color: '#' + [...hex.slice(1, 4)].map(c => c + c).join(''),
          opacity: parseInt(hex.slice(4) + hex.slice(4), 16) / 255
        };
      return { color: hex, opacity: 1 };
    }

    function material(colorCode, lines, opacityMultiplier = 1) {
      const { color, opacity } = parseCssColor(colorCode);
      const alpha = Math.max(0, Math.min(1, opacity * opacityMultiplier));
      const key = (lines ? 'line' : 'face') + ':' + color + ':' + alpha.toFixed(3);
      if (colorMaterials.has(key)) return colorMaterials.get(key);
      const shared = { color, transparent: alpha < 0.999, opacity: alpha,
        depthTest: true, depthWrite: !lines && alpha >= 0.999 };
      const mat = lines
        ? new THREE.LineBasicMaterial(shared)
        : new THREE.MeshBasicMaterial({ ...shared, side: THREE.DoubleSide });
      colorMaterials.set(key, mat);
      return mat;
    }

    function releaseWorld() {
      for (const child of [...world.children]) {
        world.remove(child);
        child.geometry?.dispose();
        // Materials are deliberately shared and reused between revisions.
      }
    }

    function bucket(map, key) {
      if (!map.has(key)) map.set(key, []);
      return map.get(key);
    }

    function pushVertex(output, point) {
      output.push(point[0], point[1], point[2]);
    }

    // Build actual radial 3D tubing meshes from world-space centerlines.
    // Faceted light/dark strips give a readable cylindrical finish without
    // requiring shadow maps or adding any CDN dependencies.
    function tubeMesh(pts, radius, baseColor, faces) {
      if (!Array.isArray(pts) || pts.length < 2 || radius <= 0) return;
      const clean = pts.filter((p, i) => i === 0 || p.some((v, j) => Math.abs(v - pts[i - 1][j]) > 0.001));
      if (clean.length < 2) return;
      const N = 10,ring = [];
      const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      const unit = a => {const l = Math.hypot(...a) || 1;return a.map(v => v/l);};
      const difference = (a,b) => a.map((v,i) => v-b[i]);
      for (let i=0; i<clean.length; i++) {
        const previous=clean[Math.max(0,i-1)], next=clean[Math.min(clean.length-1,i+1)];
        const tangent=unit(difference(next,previous));
        const reference=Math.abs(tangent[1])<0.87?[0,1,0]:[1,0,0];
        const u=unit(cross(tangent,reference)),v=unit(cross(tangent,u));
        const points=[];
        for(let j=0;j<N;j++){
          const a=2*Math.PI*j/N;
          points.push(clean[i].map((component,k)=>component+
            radius*(u[k]*Math.cos(a)+v[k]*Math.sin(a))));
        }
        ring.push(points);
      }
      const mix=(col,f)=>{
        if(!/^#[0-9a-f]{6}$/i.test(col))return '#a1b2bc';
        const ints=[1,3,5].map(i=>parseInt(col.slice(i,i+2),16));
        return '#'+ints.map(n=>Math.max(0,Math.min(255,Math.round(n*f)))
          .toString(16).padStart(2,'0')).join('');
      };
      for(let i=1;i<ring.length;i++)for(let j=0;j<N;j++){
        const k=(j+1)%N;
        const color=mix(baseColor,0.66+0.34*(Math.cos(j*2*Math.PI/N)*.5+.5));
        const out=bucket(faces,color);
        for(const p of [ring[i-1][j],ring[i-1][k],ring[i][k],
                        ring[i-1][j],ring[i][k],ring[i][j]])pushVertex(out,p);
      }
      for(const end of [0,ring.length-1])for(let j=1;j<N-1;j++){
        const out=bucket(faces,mix(baseColor,0.78));
        for(const p of [ring[end][0],ring[end][j],ring[end][j+1]])pushVertex(out,p);
      }
    }

    function buildMeshes(commands, project) {
      releaseWorld();
      const faces = new Map(), lines = new Map();

      for (const item of commands) {
        if (!Array.isArray(item.pts) || item.pts.length < 2) continue;

        if (item.kind === 'tube' && item.pts.length >= 2) {
          tubeMesh(item.pts, Number(item.radius) || 6,
            item.color || '#73c9dc', faces);
        } else if (item.kind === 'face' && item.pts.length >= 3) {
          // Solid panel strips and box faces are planar convex polygons.
          const color = item.fill || '#7c8490';
          if (parseCssColor(color).opacity <= 0.001) continue;
          const output = bucket(faces, color);
          for (let i = 1; i + 1 < item.pts.length; i++) {
            pushVertex(output, item.pts[0]);
            pushVertex(output, item.pts[i]);
            pushVertex(output, item.pts[i + 1]);
          }
        } else if (item.kind === 'line' && item.pts.length >= 2) {
          const c = item.color || '#ffffff';
          const opacity = item.alpha ?? 1;
          if (opacity <= 0.001) continue;
          const key = c + '|' + Number(opacity).toFixed(3);
          const output = bucket(lines, key);
          for (let i = 1; i < item.pts.length; i++) {
            pushVertex(output, item.pts[i - 1]);
            pushVertex(output, item.pts[i]);
          }
        }
      }

      for (const [color, vertices] of faces) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material(color, false));
        mesh.frustumCulled = false;
        world.add(mesh);
      }

      for (const [key, vertices] of lines) {
        const split = key.lastIndexOf('|');
        const color = key.slice(0, split), opacity = +key.slice(split + 1);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const edges = new THREE.LineSegments(geometry, material(color, true, opacity));
        edges.frustumCulled = false;
        world.add(edges);
      }

      // Model water-block/radiator connection dots in 3D rather than floating
      // in front of the wood, so they also respect the depth buffer.
      if (project?.display?.ports && !project?.display?.caseOnly) {
        const markerGeometry = new THREE.SphereGeometry(4.6, 10, 8);
        const markerMaterial = material('#f4c99f', false);
        const visible = project.parts.filter(part =>
          part.visible !== false && (part.type === 'radiator' || project.display.internals));
        for (const part of visible) for (const port of part.ports) {
          const point = part.pos.map((v, index) => v + port.off[index]);
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(...point);
          world.add(marker);
        }
      }
    }

    function updateCamera(view, { width, height }) {
      const W = Math.max(1, width), H = Math.max(1, height);
      if (dimensions.width !== W || dimensions.height !== H) {
        dimensions = { width: W, height: H };
        renderer.setSize(W, H, false);
      }
      const sf = Math.min(W / 800, H / 880) * view.zoom;
      const dx = -(view.pan?.[0] || 0) / sf;
      const dy = (0.02 * H + (view.pan?.[1] || 0)) / sf;

      camera.left = -W / (2 * sf) + dx;
      camera.right = W / (2 * sf) + dx;
      camera.top = H / (2 * sf) + dy;
      camera.bottom = -H / (2 * sf) + dy;
      camera.updateProjectionMatrix();

      const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
      const sy = Math.sin(view.yaw), cy = Math.cos(view.yaw);
      const target = view.target || [0, 350, 0];
      const R = 2200;
      camera.up.set(0, 1, 0);
      camera.position.set(target[0] + R * sy * cp,
                          target[1] + R * sp,
                          target[2] + R * cy * cp);
      camera.lookAt(...target);
      camera.updateMatrixWorld();
    }

    const bridge = {
      get active() { return active; },
      setActive(value) {
        active = !!value;
        viewport.classList.toggle('webgl-active', active);
        renderer.domElement.style.display = active ? 'block' : 'none';
        button.classList.toggle('active', active);
        button.textContent = active ? '3D: WebGL' : '3D: Off';
        editor.redraw();
      },
      render(commands, view, frame) {
        if (!active) return;
        if (revision !== frame.revision) {
          buildMeshes(commands, frame.project);
          revision = frame.revision;
        }
        updateCamera(view, frame);
        renderer.render(scene, camera);
      },
      exportPng(callback) {
        renderer.domElement.toBlob(callback, 'image/png');
      },
      invalidate() { revision = -1; editor.redraw(); }
    };

    window.WalnutLoopWebGL = bridge;
    button.disabled = false;
    button.title = 'Use GPU depth testing; click to switch to the 2D fallback.';
    button.onclick = () => {
      if (!bridge.active) editor.selectLegacy();
      bridge.setActive(!bridge.active);
    };

    // The legacy gesture/annotation canvas remains above the GPU canvas, but
    // only gets background overlays and pointer events in WebGL mode.
    editor.selectLegacy();
    bridge.setActive(true);
    window.addEventListener('webglcontextlost', event => {
      if (event.target !== renderer.domElement) return;
      event.preventDefault();
      bridge.setActive(false);
      unavailable('WebGL context lost. Use Canvas/SVG fallback.');
    }, true);
  } catch (error) {
    console.warn('Three.js WebGL unavailable; falling back to Canvas/SVG.', error);
    unavailable('Three.js could not load or WebGL is not supported.');
  }
}
