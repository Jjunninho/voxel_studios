(function(){
"use strict";

/* ══════════════════════════════════════════════════════════════════
   VOXEL CRITIC v2.0 — RLHF TRAINER COM IA REAL
   Features: K-Means Clustering, Receitas por Classe, Aprendizado Real
   ══════════════════════════════════════════════════════════════════ */

const CUBE36=[
  [-1,-1,1,0,0,1],[1,-1,1,0,0,1],[1,1,1,0,0,1],[-1,-1,1,0,0,1],[1,1,1,0,0,1],[-1,1,1,0,0,1],
  [1,-1,-1,0,0,-1],[-1,-1,-1,0,0,-1],[-1,1,-1,0,0,-1],[1,-1,-1,0,0,-1],[-1,1,-1,0,0,-1],[1,1,-1,0,0,-1],
  [1,-1,1,1,0,0],[1,-1,-1,1,0,0],[1,1,-1,1,0,0],[1,-1,1,1,0,0],[1,1,-1,1,0,0],[1,1,1,1,0,0],
  [-1,-1,-1,-1,0,0],[-1,-1,1,-1,0,0],[-1,1,1,-1,0,0],[-1,-1,-1,-1,0,0],[-1,1,1,-1,0,0],[-1,1,-1,-1,0,0],
  [-1,1,1,0,1,0],[1,1,1,0,1,0],[1,1,-1,0,1,0],[-1,1,1,0,1,0],[1,1,-1,0,1,0],[-1,1,-1,0,1,0],
  [-1,-1,-1,0,-1,0],[1,-1,-1,0,-1,0],[1,-1,1,0,-1,0],[-1,-1,-1,0,-1,0],[1,-1,1,0,-1,0],[-1,-1,1,0,-1,0]
];

/* ══════════════════════════════════════════════════════════════════
   STATE COM CLUSTERING
   ══════════════════════════════════════════════════════════════════ */
const S = {
  objects : [],      // [{id, name, voxels, blockSize, meta, thumbnail, features, cluster}]
  sel     : -1,
  ratings : {},      // {id → 1..5}
  clusters: [],      // [{id, name, color, members:[], avgFeatures, recipeCount}]
  numClusters: 5,    // Número de clusters a descobrir
  clusteringDone: false
};

/* ══════════════════════════════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════════════════════════════ */
function hexToRGB(hex) {
  const v = parseInt((hex||'#888').replace('#',''), 16);
  return { r:(v>>16)&255, g:(v>>8)&255, b:v&255 };
}
function toHex(r,g,b) {
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function setSt(msg, cls) {
  const e=document.getElementById('stMsg');
  if(e){ e.innerHTML=msg; e.className=cls==='ok'?'sok':cls==='err'?'serr':'swarn'; }
}
function uid() { return 'id_'+Date.now()+'_'+Math.random().toString(36).slice(2,8); }

/* ══════════════════════════════════════════════════════════════════
   FEATURE EXTRACTION — Extrai características do objeto para clustering
   ══════════════════════════════════════════════════════════════════ */
function extractFeatures(obj) {
  const vx = obj.voxels;
  const N = vx.length;
  if(!N) return null;

  // Bounds
  let mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
  let comX=0,comY=0,comZ=0;
  let colorR=0,colorG=0,colorB=0;
  
  vx.forEach(v=>{
    mnX=Math.min(mnX,v.x); mxX=Math.max(mxX,v.x);
    mnY=Math.min(mnY,v.y); mxY=Math.max(mxY,v.y);
    mnZ=Math.min(mnZ,v.z); mxZ=Math.max(mxZ,v.z);
    comX+=v.x; comY+=v.y; comZ+=v.z;
    colorR+=v.r; colorG+=v.g; colorB+=v.b;
  });

  const w = mxX-mnX+1;
  const h = mxY-mnY+1;
  const d = mxZ-mnZ+1;
  const volume = w*h*d;
  const maxDim = Math.max(w,h,d);

  // Aspect Ratios (normalizados)
  const aspectXY = w/h;
  const aspectXZ = w/d;
  const aspectYZ = h/d;

  // Proporções normalizadas
  const propW = w/maxDim;
  const propH = h/maxDim;
  const propD = d/maxDim;

  // Densidade
  const density = N/volume;

  // Centro de massa normalizado
  const comXn = (comX/N - mnX) / w;
  const comYn = (comY/N - mnY) / h;
  const comZn = (comZ/N - mnZ) / d;

  // Cor média
  const avgR = colorR/N/255;
  const avgG = colorG/N/255;
  const avgB = colorB/N/255;

  // Complexidade (dispersão dos voxels)
  let dispersion = 0;
  const cx = comX/N, cy = comY/N, cz = comZ/N;
  vx.forEach(v => {
    const dx = v.x - cx, dy = v.y - cy, dz = v.z - cz;
    dispersion += Math.sqrt(dx*dx + dy*dy + dz*dz);
  });
  dispersion = dispersion / N / maxDim;

  // Feature vector para clustering
  return {
    // Forma (8 features)
    propW, propH, propD,
    aspectXY, aspectXZ, aspectYZ,
    density,
    dispersion,
    // Centro de massa (3 features)
    comXn, comYn, comZn,
    // Cor (3 features) - opcional
    avgR, avgG, avgB,
    // Tamanho (1 feature)
    size: Math.log(N+1) / 10  // normalizado
  };
}

/* ══════════════════════════════════════════════════════════════════
   K-MEANS CLUSTERING
   ══════════════════════════════════════════════════════════════════ */
function normalizeFeatures(features) {
  // Calcula min/max de cada feature
  const keys = Object.keys(features[0]);
  const mins = {}, maxs = {};
  
  keys.forEach(k => {
    mins[k] = Math.min(...features.map(f => f[k]));
    maxs[k] = Math.max(...features.map(f => f[k]));
  });

  // Normaliza para [0,1]
  return features.map(f => {
    const nf = {};
    keys.forEach(k => {
      const range = maxs[k] - mins[k];
      nf[k] = range > 0 ? (f[k] - mins[k]) / range : 0;
    });
    return nf;
  });
}

function distance(f1, f2) {
  let sum = 0;
  Object.keys(f1).forEach(k => {
    const d = f1[k] - f2[k];
    sum += d * d;
  });
  return Math.sqrt(sum);
}

function kMeansClustering(objects, k) {
  if(objects.length < k) k = Math.max(1, objects.length);

  // Extrai features
  const features = objects.map(o => o.features).filter(Boolean);
  if(!features.length) return null;

  const normalized = normalizeFeatures(features);
  const n = normalized.length;

  // Inicializa centroides aleatoriamente (K-means++)
  const centroids = [];
  const firstIdx = Math.floor(Math.random() * n);
  centroids.push({...normalized[firstIdx]});

  for(let c = 1; c < k; c++) {
    const distances = normalized.map((f, i) => {
      const minDist = Math.min(...centroids.map(cent => distance(f, cent)));
      return minDist * minDist;
    });
    const total = distances.reduce((a,b) => a+b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for(let i = 0; i < n; i++) {
      r -= distances[i];
      if(r <= 0) { idx = i; break; }
    }
    centroids.push({...normalized[idx]});
  }

  // Itera até convergência
  let assignments = new Array(n).fill(0);
  let changed = true;
  let iterations = 0;
  const maxIter = 50;

  while(changed && iterations < maxIter) {
    changed = false;
    iterations++;

    // Assign to nearest centroid
    for(let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for(let c = 0; c < k; c++) {
        const d = distance(normalized[i], centroids[c]);
        if(d < minDist) {
          minDist = d;
          bestCluster = c;
        }
      }
      if(assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    // Recalcula centroides
    const counts = new Array(k).fill(0);
    const sums = centroids.map(() => ({}));
    
    for(let i = 0; i < n; i++) {
      const c = assignments[i];
      counts[c]++;
      Object.keys(normalized[i]).forEach(key => {
        sums[c][key] = (sums[c][key] || 0) + normalized[i][key];
      });
    }

    for(let c = 0; c < k; c++) {
      if(counts[c] > 0) {
        Object.keys(sums[c]).forEach(key => {
          centroids[c][key] = sums[c][key] / counts[c];
        });
      }
    }
  }

  return { assignments, centroids, iterations };
}

/* ══════════════════════════════════════════════════════════════════
   CLUSTER MANAGEMENT
   ══════════════════════════════════════════════════════════════════ */
const CLUSTER_COLORS = [
  '#6c63ff', '#ff6584', '#00d4ff', '#39ff14', '#ffcc00',
  '#ff6b35', '#9d4edd', '#06ffa5', '#ff006e', '#8338ec'
];

function performClustering() {
  if(S.objects.length < 2) {
    setSt('⚠️ Mínimo 2 objetos para clustering', 'warn');
    return;
  }

  setSt('🧠 Analisando objetos...', 'ok');

  // Extrai features de todos os objetos
  S.objects.forEach(obj => {
    obj.features = extractFeatures(obj);
  });

  // Ajusta número de clusters
  const k = Math.min(S.numClusters, S.objects.length);
  
  // Executa K-means
  const result = kMeansClustering(S.objects, k);
  if(!result) {
    setSt('❌ Erro no clustering', 'err');
    return;
  }

  // Atribui clusters aos objetos
  S.objects.forEach((obj, i) => {
    obj.cluster = result.assignments[i];
  });

  // Cria estrutura de clusters
  S.clusters = [];
  for(let c = 0; c < k; c++) {
    const members = S.objects.filter(o => o.cluster === c);
    S.clusters.push({
      id: c,
      name: `Classe ${c+1}`,
      color: CLUSTER_COLORS[c % CLUSTER_COLORS.length],
      members: members.map(m => m.id),
      avgFeatures: result.centroids[c],
      recipeCount: 0
    });
  }

  S.clusteringDone = true;
  updateClusterUI();
  rebuildThumbnails();
  setSt(`✅ ${k} classes descobertas (${result.iterations} iterações)`, 'ok');
}

function updateClusterUI() {
  // Atualiza painel de clusters
  const panel = document.getElementById('clusterPanel');
  if(!panel || !S.clusteringDone) return;

  panel.innerHTML = S.clusters.map(cl => {
    const ratedCount = cl.members.filter(id => (S.ratings[id]||0) >= 3).length;
    return `
      <div class="cluster-card" style="border-left: 3px solid ${cl.color}">
        <div class="cl-hdr">
          <input type="text" class="cl-name" value="${cl.name}" data-cid="${cl.id}" 
                 placeholder="Nome da classe...">
          <span class="cl-count">${cl.members.length} obj</span>
        </div>
        <div class="cl-stats">
          <span>📊 Avaliados ≥3★: <b>${ratedCount}</b></span>
        </div>
      </div>
    `;
  }).join('');

  // Event listeners para renomear
  panel.querySelectorAll('.cl-name').forEach(input => {
    input.addEventListener('change', e => {
      const cid = parseInt(e.target.dataset.cid);
      S.clusters[cid].name = e.target.value || `Classe ${cid+1}`;
    });
  });
}

/* ══════════════════════════════════════════════════════════════════
   GEOMETRY BUILDER
   ══════════════════════════════════════════════════════════════════ */
function buildGeom(voxels, bs) {
  const N = voxels.length;
  if(!N) return null;
  bs = bs || 1;
  const h = bs/2;

  let mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
  for(let i=0;i<N;i++){
    const v=voxels[i];
    if(v.x<mnX)mnX=v.x; if(v.x>mxX)mxX=v.x;
    if(v.y<mnY)mnY=v.y; if(v.y>mxY)mxY=v.y;
    if(v.z<mnZ)mnZ=v.z; if(v.z>mxZ)mxZ=v.z;
  }

  const cx=(mnX+mxX)/2, cy=(mnY+mxY)/2, cz=(mnZ+mxZ)/2;

  const pos=new Float32Array(N*108);
  const col=new Float32Array(N*108);
  const nor=new Float32Array(N*108);

  for(let i=0;i<N;i++){
    const v=voxels[i];
    const ox=(v.x-cx)*bs, oy=(v.y-cy)*bs, oz=(v.z-cz)*bs;
    for(let f=0;f<36;f++){
      const c=CUBE36[f], idx=(i*36+f)*3;
      pos[idx]=ox+c[0]*h; pos[idx+1]=oy+c[1]*h; pos[idx+2]=oz+c[2]*h;
      col[idx]=v.r/255;   col[idx+1]=v.g/255;   col[idx+2]=v.b/255;
      nor[idx]=c[3];       nor[idx+1]=c[4];       nor[idx+2]=c[5];
    }
  }

  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('color',    new THREE.Float32BufferAttribute(col,3));
  g.setAttribute('normal',   new THREE.Float32BufferAttribute(nor,3));

  const size=Math.max(mxX-mnX,mxY-mnY,mxZ-mnZ)*bs;
  return { geom:g, size, bounds:{mnX,mnY,mnZ,mxX,mxY,mxZ} };
}

/* ══════════════════════════════════════════════════════════════════
   MAIN RENDERER
   ══════════════════════════════════════════════════════════════════ */
let mScene, mCam, mRend, mMesh, mMat;
const camS = { th:Math.PI*.35, ph:Math.PI*.38, r:55 };
let _drag=false, _prev={x:0,y:0};

function initMain() {
  const wrap=document.getElementById('prevWrap');
  const cv  =document.getElementById('mainCanvas');

  mScene=new THREE.Scene();
  mScene.background=new THREE.Color(0x07070e);
  mCam=new THREE.PerspectiveCamera(42, wrap.clientWidth/wrap.clientHeight, .1, 2000);
  mRend=new THREE.WebGLRenderer({canvas:cv, antialias:true});
  mRend.setPixelRatio(Math.min(devicePixelRatio,2));
  mRend.setSize(wrap.clientWidth, wrap.clientHeight);

  mScene.add(new THREE.AmbientLight(0x606070, 0.75));
  const d1=new THREE.DirectionalLight(0xffffff,0.85); d1.position.set(12,22,18); mScene.add(d1);
  const d2=new THREE.DirectionalLight(0x7788cc,0.35); d2.position.set(-10,4,-14); mScene.add(d2);

  mScene.add(new THREE.GridHelper(80,80,0x1a1a28,0x131320));
  mMat=new THREE.MeshPhongMaterial({vertexColors:true, shininess:22});

  camUpd();
  (function loop(){requestAnimationFrame(loop); mRend.render(mScene,mCam)})();

  new ResizeObserver(()=>{
    const w=wrap.clientWidth, h=wrap.clientHeight;
    mCam.aspect=w/h; mCam.updateProjectionMatrix(); mRend.setSize(w,h);
  }).observe(wrap);

  cv.addEventListener('mousedown', e=>{ _drag=true; _prev={x:e.clientX,y:e.clientY}; });
  addEventListener('mousemove', e=>{
    if(!_drag) return;
    camS.th -= (e.clientX-_prev.x)*.008;
    camS.ph  = Math.max(.04, Math.min(Math.PI-.04, camS.ph-(e.clientY-_prev.y)*.008));
    _prev={x:e.clientX, y:e.clientY};
    camUpd();
  });
  addEventListener('mouseup', ()=> _drag=false);
  cv.addEventListener('wheel', e=>{
    e.preventDefault();
    camS.r=Math.max(4, Math.min(350, camS.r+e.deltaY*.1));
    camUpd();
  },{ passive:false });
}

function camUpd() {
  mCam.position.set(
    camS.r*Math.sin(camS.ph)*Math.sin(camS.th),
    camS.r*Math.cos(camS.ph),
    camS.r*Math.sin(camS.ph)*Math.cos(camS.th)
  );
  mCam.lookAt(0,0,0);
}

/* ══════════════════════════════════════════════════════════════════
   OFFSCREEN RENDERER
   ══════════════════════════════════════════════════════════════════ */
let oScene, oCam, oRend, oCv, oMat;

function initOff() {
  oCv=document.createElement('canvas');
  oCv.width=180; oCv.height=180;

  oScene=new THREE.Scene();
  oScene.background=new THREE.Color(0x0a0a14);
  oCam=new THREE.PerspectiveCamera(42, 1, .1, 2000);
  oRend=new THREE.WebGLRenderer({canvas:oCv, antialias:true});
  oRend.setPixelRatio(1);
  oRend.setSize(180,180);

  oScene.add(new THREE.AmbientLight(0x606070, 0.75));
  const d1=new THREE.DirectionalLight(0xffffff,0.85); d1.position.set(12,22,18); oScene.add(d1);
  const d2=new THREE.DirectionalLight(0x7788cc,0.35); d2.position.set(-10,4,-14); oScene.add(d2);

  oMat=new THREE.MeshPhongMaterial({vertexColors:true, shininess:22});
}

function renderThumb(voxels, bs) {
  if(!oScene) return '';
  const res=buildGeom(voxels, bs);
  if(!res) return '';

  const mesh=new THREE.Mesh(res.geom, oMat);
  oScene.add(mesh);

  const sz=res.size || 10;
  oCam.position.set(sz*.85, sz*.65, sz*1.05);
  oCam.lookAt(0,0,0);

  oRend.render(oScene, oCam);
  const url=oCv.toDataURL('image/png');

  oScene.remove(mesh);
  res.geom.dispose();
  return url;
}

/* ══════════════════════════════════════════════════════════════════
   IMPORT
   ══════════════════════════════════════════════════════════════════ */
function parseVoxelJSON(txt) {
  const data=JSON.parse(txt);
  if(!data.blocks || !Array.isArray(data.blocks))
    throw new Error('Formato inválido — campo "blocks" não encontrado');

  const voxels=data.blocks.map(b=>{
    const pos=b.position || {x:0,y:0,z:0};
    const {r,g,b:bv}=hexToRGB(b.color);
    return { x:pos.x, y:pos.y, z:pos.z, r, g, b:bv };
  });

  const bs=(data.blocks[0] && data.blocks[0].scale) ? data.blocks[0].scale.x : 1;
  return { voxels, blockSize:bs, meta:data._meta || {} };
}

function importFiles(files) {
  let count=0;
  const arr=[...files];
  let done=0;

  if(!arr.length) return;

  arr.forEach(f=>{
    if(!f.name.endsWith('.json')){ done++; return; }
    const reader=new FileReader();
    reader.onload=ev=>{
      try {
        const parsed=parseVoxelJSON(ev.target.result);
        const obj={
          id: uid(),
          name: f.name.replace(/\.json$/,''),
          voxels: parsed.voxels,
          blockSize: parsed.blockSize,
          meta: parsed.meta,
          thumbnail: '',
          features: null,
          cluster: -1
        };
        S.objects.push(obj);
        count++;

        setTimeout(()=>{
          obj.thumbnail = renderThumb(obj.voxels, obj.blockSize);
          addThumb(obj);
          updateStats();
          if(S.sel<0) select(S.objects.length-1);
        }, 50);

      } catch(err) {
        console.error('Erro ao parsear '+f.name, err);
      }
      done++;
      if(done===arr.length) setSt(`📦 ${count}/${arr.length} importado(s)`, count?'ok':'err');
    };
    reader.readAsText(f);
  });
}

/* ══════════════════════════════════════════════════════════════════
   UI — Select, Rate, Navigate
   ══════════════════════════════════════════════════════════════════ */
function select(idx) {
  if(idx<0 || idx>=S.objects.length) return;
  S.sel=idx;
  const obj=S.objects[idx];

  // Atualiza mesh principal
  if(mMesh){ mScene.remove(mMesh); mMesh.geometry.dispose(); mMesh=null; }
  const res=buildGeom(obj.voxels, obj.blockSize);
  if(res){
    mMesh=new THREE.Mesh(res.geom, mMat);
    mScene.add(mMesh);
  }

  // Info do objeto
  const cluster = S.clusteringDone && obj.cluster >= 0 ? S.clusters[obj.cluster] : null;
  const clusterTag = cluster ? `<span style="color:${cluster.color}">🏷️ ${cluster.name}</span>` : '';
  document.getElementById('oInfo').innerHTML=`
    <span class="oname">${obj.name}</span>
    <span class="odet">${obj.voxels.length} blocos ${clusterTag}</span>
  `;

  // Rating
  const r=S.ratings[obj.id]||0;
  document.querySelectorAll('.star').forEach(s=>{
    s.classList.toggle('active', parseInt(s.dataset.r)<=r);
  });

  // Nav counter
  document.getElementById('ncnt').textContent=`${idx+1} / ${S.objects.length}`;

  // Highlight thumbnail
  document.querySelectorAll('.tc').forEach((el,i)=> el.classList.toggle('sel', i===idx));

  // Flash effect
  const pw=document.getElementById('prevWrap');
  pw.classList.remove('flash');
  setTimeout(()=> pw.classList.add('flash'), 10);

  // Show/hide hints
  document.getElementById('emptyEl').style.display= S.objects.length ? 'none' : 'flex';
  document.getElementById('hintEl').style.display= S.objects.length ? 'block' : 'none';
}

function rate(val) {
  if(S.sel<0) return;
  const obj=S.objects[S.sel];
  S.ratings[obj.id]=val;
  document.querySelectorAll('.star').forEach(s=> s.classList.toggle('active', parseInt(s.dataset.r)<=val));
  
  // Atualiza thumbnail
  const tc=document.querySelectorAll('.tc')[S.sel];
  if(tc){
    tc.className='tc'+(S.sel===S.sel?' sel':'');
    if(val>=4) tc.classList.add('rated-good');
    else if(val<=2) tc.classList.add('rated-bad');
    tc.querySelector('.tc-st').textContent='★'.repeat(val);
    tc.querySelector('.tc-st').className=val>0?'tc-st':'tc-st unr';
  }
  
  updateStats();
  updateClusterUI();
}

function nav(dir) {
  if(!S.objects.length) return;
  let nxt=(S.sel+dir+S.objects.length)%S.objects.length;
  select(nxt);
}

function addThumb(obj) {
  const idx=S.objects.findIndex(o=> o.id===obj.id);
  const scr=document.getElementById('tpScr');
  
  const cluster = S.clusteringDone && obj.cluster >= 0 ? S.clusters[obj.cluster] : null;
  const clusterDot = cluster ? `<span style="color:${cluster.color}">●</span>` : '';
  
  const div=document.createElement('div');
  div.className='tc';
  div.innerHTML=`
    <div class="tc-img">${obj.thumbnail?`<img src="${obj.thumbnail}">`:'<div class="tc-ph">📦</div>'}</div>
    <div class="tc-inf">
      <div class="tc-nm">${clusterDot} ${obj.name}</div>
      <div class="tc-meta">${obj.voxels.length} blocos · <span class="tc-st unr">☆☆☆☆☆</span></div>
    </div>
  `;
  div.addEventListener('click', ()=> select(idx));
  scr.appendChild(div);
}

function rebuildThumbnails() {
  const scr=document.getElementById('tpScr');
  scr.innerHTML='';
  S.objects.forEach(obj => addThumb(obj));
  if(S.sel>=0) select(S.sel);
}

function updateStats() {
  document.getElementById('sI').textContent = S.objects.length;
  document.getElementById('sR').textContent = Object.keys(S.ratings).length;
  
  // Receitas por cluster
  if(S.clusteringDone) {
    S.clusters.forEach(cl => {
      cl.recipeCount = cl.members.filter(id => (S.ratings[id]||0) >= 3).length;
    });
  }
  
  const totalRecipes = Object.values(S.ratings).filter(r=> r>=3).length;
  document.getElementById('sRc').textContent = totalRecipes;
  
  document.getElementById('expRBtn').disabled = totalRecipes === 0;
  document.getElementById('expDBtn').disabled = S.objects.length === 0;
}

/* ══════════════════════════════════════════════════════════════════
   EXPORT RECEITAS POR CLASSE
   ══════════════════════════════════════════════════════════════════ */
function extractPalette(voxels, max) {
  max=max||8;
  const map={};
  voxels.forEach(v=>{
    const key=`${v.r},${v.g},${v.b}`;
    map[key]=(map[key]||0)+1;
  });
  return Object.entries(map)
    .sort((a,b)=> b[1]-a[1])
    .slice(0, max)
    .map(([key,cnt])=>{
      const [r,g,b]=key.split(',').map(Number);
      return { hex:toHex(r,g,b), weight:+(cnt/voxels.length).toFixed(3) };
    });
}

function extractRecipe(obj) {
  const vx=obj.voxels, N=vx.length;
  if(!N) return null;

  let mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
  let comX=0,comY=0,comZ=0;
  vx.forEach(v=>{
    mnX=Math.min(mnX,v.x); mxX=Math.max(mxX,v.x);
    mnY=Math.min(mnY,v.y); mxY=Math.max(mxY,v.y);
    mnZ=Math.min(mnZ,v.z); mxZ=Math.max(mxZ,v.z);
    comX+=v.x; comY+=v.y; comZ+=v.z;
  });

  const bounds={ 
    w:Math.round(mxX-mnX+1), 
    h:Math.round(mxY-mnY+1), 
    d:Math.round(mxZ-mnZ+1) 
  };

  const silW=bounds.w, silH=bounds.h;
  if(silW <= 0 || silH <= 0) return null;

  const sil=new Array(Math.floor(silW*silH)).fill(0);
  const dSum=new Float32Array(Math.floor(silW*silH));
  const dCnt=new Float32Array(Math.floor(silW*silH));
  
  vx.forEach(v=>{
    const sx=Math.round(v.x-mnX);
    const sy=Math.round(v.y-mnY);
    
    if(sx >= 0 && sx < silW && sy >= 0 && sy < silH) {
      const idx=sy*silW+sx;
      sil[idx]=1;
      dSum[idx]+=v.z-mnZ;
      dCnt[idx]++;
    }
  });

  const depthData=[];
  for(let i=0;i<silW*silH;i++)
    depthData.push(dCnt[i]>0 ? +(dSum[i]/dCnt[i]/(bounds.d||1)).toFixed(3) : 0);

  const maxDim=Math.max(bounds.w,bounds.h,bounds.d);
  const proportions={ w:+(bounds.w/maxDim).toFixed(3), h:+(bounds.h/maxDim).toFixed(3), d:+(bounds.d/maxDim).toFixed(3) };

  const volume=bounds.w*bounds.h*bounds.d;
  const density=+(N/volume).toFixed(3);

  const cluster = S.clusteringDone && obj.cluster >= 0 ? S.clusters[obj.cluster] : null;

  return {
    id: obj.id,
    name: obj.name,
    class: cluster ? cluster.name : 'Unknown',
    classId: obj.cluster,
    rating: S.ratings[obj.id] || 0,
    seed: Date.now()+Math.floor(Math.random()*99999),
    source: obj.meta,
    structure: {
      bounds,
      proportions,
      density,
      totalBlocks: N,
      palette: extractPalette(vx),
      silhouette: { w:silW, h:silH, mask:sil },
      depthProfile: { w:silW, h:silH, data:depthData },
      centerOfMass: { x:+(comX/N).toFixed(2), y:+(comY/N).toFixed(2), z:+(comZ/N).toFixed(2) }
    },
    variation: {
      colorShiftRange: 0.12,
      scaleRange: [0.85, 1.15],
      noiseLevel: 0.08
    }
  };
}

function exportRecipes() {
  if(!S.clusteringDone) {
    setSt('⚠️ Execute clustering antes de exportar', 'warn');
    return;
  }

  // Agrupa receitas por classe
  const recipesByClass = {};
  
  S.objects
    .filter(o => (S.ratings[o.id]||0) >= 3)
    .forEach(o => {
      const recipe = extractRecipe(o);
      if(!recipe) return;
      
      const className = recipe.class;
      if(!recipesByClass[className]) {
        recipesByClass[className] = [];
      }
      recipesByClass[className].push(recipe);
    });

  if(Object.keys(recipesByClass).length === 0) {
    setSt('⚠️ Sem receitas com nota ≥ 3★', 'err');
    return;
  }

  const payload={
    _type:'voxel_recipe_set_clustered',
    _version:'2.0',
    _generated: new Date().toISOString(),
    _generator:'Voxel Critic v2.0 - AI Clustering',
    _info:'Receitas organizadas por classe descoberta automaticamente via K-Means',
    _clustering: {
      method: 'K-Means',
      numClusters: S.clusters.length,
      classes: S.clusters.map(cl => ({
        id: cl.id,
        name: cl.name,
        color: cl.color,
        totalObjects: cl.members.length,
        recipeCount: cl.recipeCount
      }))
    },
    recipesByClass
  };

  const json=JSON.stringify(payload, null, 2);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  a.download=`recipes_clustered_${Date.now()}.json`;
  a.click();
  
  const total = Object.values(recipesByClass).reduce((sum, arr) => sum + arr.length, 0);
  setSt(`🧬 ${total} receitas em ${Object.keys(recipesByClass).length} classes · ${(json.length/1024).toFixed(1)} KB`, 'ok');
}

function exportDataset() {
  const data=S.objects.map(o=>({
    id: o.id,
    name: o.name,
    rating: S.ratings[o.id] || 0,
    class: S.clusteringDone && o.cluster >= 0 ? S.clusters[o.cluster].name : 'Unknown',
    classId: o.cluster,
    meta: o.meta,
    blocks: o.voxels.map(v=>({
      position:{ x:v.x, y:v.y, z:v.z },
      color: toHex(v.r,v.g,v.b),
      type:'cube',
      scale:{ x:o.blockSize, y:o.blockSize, z:o.blockSize },
      rotation:{ x:0, y:0, z:0 }
    }))
  }));

  const payload={
    _type:'voxel_training_dataset_clustered',
    _version:'2.0',
    _generated: new Date().toISOString(),
    _clustering: S.clusteringDone ? {
      method: 'K-Means',
      classes: S.clusters.map(cl => ({ id: cl.id, name: cl.name, members: cl.members.length }))
    } : null,
    totalObjects: data.length,
    totalRated: Object.keys(S.ratings).length,
    data
  };

  const json=JSON.stringify(payload, null, 2);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  a.download=`dataset_clustered_${Date.now()}.json`;
  a.click();
  setSt(`📦 Dataset: ${data.length} obj · ${(json.length/1024).toFixed(1)} KB`, 'ok');
}

/* ══════════════════════════════════════════════════════════════════
   KEYBOARD
   ══════════════════════════════════════════════════════════════════ */
addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft')  { e.preventDefault(); nav(-1); }
  if(e.key==='ArrowRight') { e.preventDefault(); nav(1);  }
  if(e.key>='1' && e.key<='5') rate(parseInt(e.key));
});

/* ══════════════════════════════════════════════════════════════════
   DRAG & DROP
   ══════════════════════════════════════════════════════════════════ */
document.body.addEventListener('dragover', e=>{ e.preventDefault(); document.body.classList.add('dragging'); });
document.body.addEventListener('dragleave', e=>{ if(!e.relatedTarget) document.body.classList.remove('dragging'); });
document.body.addEventListener('drop', e=>{
  e.preventDefault();
  document.body.classList.remove('dragging');
  importFiles(e.dataTransfer.files);
});

/* ══════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', ()=>{
  initMain();
  initOff();

  document.getElementById('fInput').addEventListener('change', e=>{
    importFiles(e.target.files);
    e.target.value='';
  });

  document.getElementById('btnPrev').addEventListener('click', ()=> nav(-1));
  document.getElementById('btnNext').addEventListener('click', ()=> nav(1));

  document.getElementById('expRBtn').addEventListener('click', exportRecipes);
  document.getElementById('expDBtn').addEventListener('click', exportDataset);
  
  // Botão de clustering
  document.getElementById('clusterBtn').addEventListener('click', performClustering);
  
  // Slider de clusters
  document.getElementById('numClusters').addEventListener('input', e => {
    S.numClusters = parseInt(e.target.value);
    document.getElementById('numClustersVal').textContent = S.numClusters;
  });

  document.querySelectorAll('.star').forEach(star=>{
    star.addEventListener('mouseenter', ()=>{
      const r=parseInt(star.dataset.r);
      document.querySelectorAll('.star').forEach(s=> s.classList.toggle('hover', parseInt(s.dataset.r)<=r));
    });
    star.addEventListener('mouseleave', ()=>{
      document.querySelectorAll('.star').forEach(s=> s.classList.remove('hover'));
    });
    star.addEventListener('click', ()=> rate(parseInt(star.dataset.r)));
  });
});

})();
