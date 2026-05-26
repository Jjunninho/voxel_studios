import { ALGOS, MAX_BLOCKS } from './constants.js';
import { mkCanvas, toHex, r4, setSt } from './utils.js';
import { cmHeat, cmViridis } from './colormaps.js';
import { initThree, rebuildMesh } from './viewport.js';
import { preprocess, computeHM, voxelize, autoDetect as coreAutoDetect } from './core.js';

// --- Estado Global ---
let img = null, origW = 0, origH = 0, detBG = null;
let cachedProc = null, cachedHM = null, cachedVoxels = [];
let updateTimer = null;
let curAlgo = 'luminance';

// --- Funções da UI ---
function buildAlgoButtons() {
  document.getElementById('algoGrid').innerHTML=Object.entries(ALGOS).map(([k,a])=>
    `<button class="ab${k===curAlgo?' active':''}" onclick="pickAlgo('${k}')">${a.emoji} ${a.label}</button>`
  ).join('');
}

function buildBlendSelects() {
    const opts=Object.entries(ALGOS).map(([k,a])=>`<option value="${k}">${a.emoji} ${a.label}</option>`).join('');
    document.getElementById('blA').innerHTML=opts;
    document.getElementById('blB').innerHTML=opts;
    document.getElementById('blA').value='luminance';
    document.getElementById('blB').value='sobel';
}

function buildParams() {
    const wrap=document.getElementById('paramsWrap');
    wrap.innerHTML='';
    for(const[ak,algo]of Object.entries(ALGOS)){
      const div=document.createElement('div');
      div.id=`pp_${ak}`; div.style.display=ak===curAlgo?'block':'none';
      for(const[pk,pd]of Object.entries(algo.params)){
        const id=`p_${ak}_${pk}`;
        if(pd.type==='tog'){
          div.innerHTML+=`<div class="toggle-row"><span>${pd.label}</span>
            <label class="tog"><input type="checkbox" id="${id}" ${pd.def?'checked':''} onchange="triggerUpdate()"><span class="sl"></span></label></div>`;
        } else if(pd.type==='sel'){
          div.innerHTML+=`<label>${pd.label}</label><select id="${id}" onchange="triggerUpdate()">
            ${Object.entries(pd.opts).map(([v,l])=>`<option value="${v}"${v===pd.def?' selected':''}>` +l+`</option>`).join('')}</select>`;
        } else {
          div.innerHTML+=`<label>${pd.label}</label><div class="rr">
            <input type="range" id="${id}" min="${pd.min}" max="${pd.max}" step="${pd.step}" value="${pd.def}" oninput="triggerUpdate()">
            <span class="rv" id="${id}_v">${pd.def}</span></div>`;
        }
      }
      wrap.appendChild(div);
    }
    wrap.querySelectorAll('input[type="range"]').forEach(el=>{
      const vEl=document.getElementById(el.id+'_v');
      if(vEl) el.addEventListener('input',()=>{vEl.textContent=parseFloat(el.value).toFixed(el.step<0.1?2:el.step<1?1:0)});
    });
}

function renderCmapStrip() {
    const mode=document.getElementById('cmap').value;
    let g='';
    if(mode==='heat') g='linear-gradient(to right,rgb(20,0,140),rgb(20,55,255),rgb(20,255,0),rgb(210,255,0),rgb(255,0,0),rgb(255,255,100))';
    else if(mode==='viridis'){const s=[0,.125,.25,.375,.5,.625,.75,.875,1].map(t=>{const c=cmViridis(t);return`rgb(${c[0]},${c[1]},${c[2]})`});g=`linear-gradient(to right,${s.join(',')})`}
    else if(mode==='mono') g='linear-gradient(to right,#000,#fff)';
    else g='linear-gradient(to right,#444,#777,#aaa,#ddd)';
    document.getElementById('cmapStrip').style.background=g;
}

function drawCheckerboard(ctx,w,h){
    for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){
      ctx.fillStyle=((x/8+y/8)%2===0)?'#141420':'#1a1a28';
      ctx.fillRect(x,y,8,8);
    }
}
  
function renderPreviewOrig(proc) {
    const cv=document.getElementById('cvO');
    const M=180, sc=Math.max(Math.min(M/proc.width,M/proc.height),2);
    cv.width=proc.width*sc; cv.height=proc.height*sc;
    const ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
    drawCheckerboard(ctx,cv.width,cv.height);
    const t=mkCanvas(proc.width,proc.height);
    const id=t.c.createImageData(proc.width,proc.height); id.data.set(proc.data);
    t.c.putImageData(id,0,0); ctx.drawImage(t.e,0,0,cv.width,cv.height);
}
  
function renderPreviewHM(proc, hm) {
    const cv=document.getElementById('cvH');
    const W=proc.width,H=proc.height;
    const M=180, sc=Math.max(Math.min(M/W,M/H),2);
    cv.width=W*sc; cv.height=H*sc;
    const ctx=cv.getContext('2d'); ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#0a0a14'; ctx.fillRect(0,0,cv.width,cv.height);
    const t=mkCanvas(W,H); const id=t.c.createImageData(W,H); const d=id.data;
    for(let i=0;i<W*H;i++){
      const[r,g,b]=cmHeat(Math.max(0,Math.min(1,hm[i])));
      d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=proc.data[i*4+3]>20?255:0;
    }
    t.c.putImageData(id,0,0); ctx.drawImage(t.e,0,0,cv.width,cv.height);
    ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=.5;
    for(let x=0;x<=cv.width;x+=sc){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cv.height);ctx.stroke()}
    for(let y=0;y<=cv.height;y+=sc){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cv.width,y);ctx.stroke()}
}

window.pickAlgo = function(key) {
    curAlgo = key;
    document.querySelectorAll('.ab').forEach(b=>b.classList.remove('active'));
    document.querySelector(`.ab[onclick*="${key}"]`).classList.add('active');
    document.getElementById('algoDesc').textContent=ALGOS[key].desc;
    document.getElementById('blA').value=key;
    Object.keys(ALGOS).forEach(k=>{const e=document.getElementById(`pp_${k}`);if(e)e.style.display=k===key?'block':'none'});
    fullUpdate();
}

window.triggerUpdate = function() {
    document.getElementById('bgThV').textContent=document.getElementById('bgTh').value;
    const w=parseInt(document.getElementById('blW').value);
    document.getElementById('blPct').innerHTML=`<span class="a">${w}% A</span> / <span class="b">${100-w}% B</span>`;
    
    if(updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(fullUpdate, 60);
}

window.exportJSON = function() {
    if(!cachedVoxels.length) return;
    const bs=parseFloat(document.getElementById('blkSz').value)||1;
    let blocks=cachedVoxels.map(v=>({
      position:{x:r4(v.x*bs),y:r4(v.y*bs),z:r4(v.z*bs)},
      color:toHex(v.oR,v.oG,v.oB),
      type:'cube',
      scale:{x:bs,y:bs,z:bs},
      rotation:{x:0,y:0,z:0}
    }));
    const mnY=Math.min(...blocks.map(b=>b.position.y));
    if(mnY!==0) blocks.forEach(b=>b.position.y=r4(b.position.y-mnY));
    const mnX=Math.min(...blocks.map(b=>b.position.x));
    const mnZ=Math.min(...blocks.map(b=>b.position.z));
    blocks.forEach(b=>{b.position.x=r4(b.position.x-mnX);b.position.z=r4(b.position.z-mnZ)});
  
    const payload={
      textureRecipe:null, customColors:[], blocks,
      _meta:{
        generator:'Depth Lab Procedural v3.0',
        algoA:document.getElementById('blA').value,
        algoB:document.getElementById('blB').value,
        blendWeight:parseInt(document.getElementById('blW').value),
        resolution:{w:parseInt(document.getElementById('resW').value),h:parseInt(document.getElementById('resH').value)},
        maxDepth:parseInt(document.getElementById('maxD').value),
        blockSize:bs,
        timestamp:new Date().toISOString()
      }
    };
  
    const json=JSON.stringify(payload);
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.download=`DepthVoxel_Procedural_${Date.now()}.json`; a.click();
    const sz=json.length>1048576?`${(json.length/1048576).toFixed(2)} MB`:`${(json.length/1024).toFixed(1)} KB`;
    setSt(`💾 Export! ${blocks.length.toLocaleString()} blocos · ${sz}`,'ok');
}

window.autoDetect = function() {
    coreAutoDetect(img, origW, origH, detBG, fullUpdate);
}

// --- Pipeline Clássico ---
function fullUpdate() {
    const proc = preprocess(img, origW, origH, detBG);
    if(!proc) return;
    cachedProc = proc;

    const hm = computeHM(proc);
    if(!hm) return;
    cachedHM = hm;

    renderPreviewOrig(proc);
    renderPreviewHM(proc,hm);
    
    const vx = voxelize(proc, hm);
    
    const isOver=vx.length>MAX_BLOCKS;
    document.getElementById('statB').innerHTML=`<span class="n">${vx.length.toLocaleString()}</span><span class="l">blocos</span>`;
    document.getElementById('statB').className='stat'+(isOver?' over':'');
    const estB=vx.length*88+200;
    document.getElementById('statSz').textContent=estB>1048576?`${(estB/1048576).toFixed(1)}M`:`${(estB/1024).toFixed(0)}K`;

    if(isOver){
        setSt(`🚫 ${vx.length.toLocaleString()} blocos – máx ${MAX_BLOCKS.toLocaleString()}`,'err');
        document.getElementById('expBtn').disabled=true;
        rebuildMesh(vx.slice(0,MAX_BLOCKS), parseFloat(document.getElementById('blkSz').value)||1); 
        cachedVoxels=[]; return;
    }

    rebuildMesh(vx, parseFloat(document.getElementById('blkSz').value)||1);
    cachedVoxels=vx;
    document.getElementById('expBtn').disabled=false;
    setSt(`✅ ${vx.length.toLocaleString()} blocos · ${document.getElementById('statSz').textContent}B`,'ok');
    renderCmapStrip();
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    initThree();
    buildAlgoButtons();
    buildBlendSelects();
    buildParams();
    document.getElementById('algoDesc').textContent=ALGOS.luminance.desc;
    renderCmapStrip();
    setSt('📂 Carregue uma imagem','');

    // Listener do Input de Imagem
    document.getElementById('imgInput').addEventListener('change', (e) => {
        const f=e.target.files[0]; if(!f)return;
        document.getElementById('fileInfo').textContent=`${f.name} (${(f.size/1024).toFixed(1)} KB)`;
        const reader=new FileReader();
        reader.onload=ev=>{
            const i=new Image();
            i.onload=()=>{
            img=i; origW=i.width; origH=i.height;
            document.getElementById('origRes').textContent=`Original: ${origW}×${origH}`;
            const t=mkCanvas(origW,origH); t.c.drawImage(i,0,0);
            const px=t.c.getImageData(0,0,1,1).data;
            detBG={r:px[0],g:px[1],b:px[2]};
            document.getElementById('resW').value=origW;
            document.getElementById('resH').value=origH;
            document.getElementById('expBtn').disabled=false;
            fullUpdate();
            };
            i.src=ev.target.result;
        };
        reader.readAsDataURL(f);
    });

    document.getElementById('cmap').addEventListener('change',()=>{renderCmapStrip();fullUpdate()});
    document.getElementById('blW').addEventListener('input',window.triggerUpdate);
});