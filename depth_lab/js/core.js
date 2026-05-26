import { ALGOS } from './constants.js';
import { mkCanvas, setSt } from './utils.js'; // Adicionei setSt aqui para o autoDetect usar
import { getColorAt } from './colormaps.js';

//
export function preprocess(img, origW, origH, detBG) {
  if(!img) return null;
  // Nota: lê inputs do DOM, mas usa os argumentos passados para imagem/dimensões
  const W=parseInt(document.getElementById('resW').value)||origW;
  const H=parseInt(document.getElementById('resH').value)||origH;
  const mode=document.getElementById('bgMode').value;
  const th=parseInt(document.getElementById('bgTh').value);
  const c=mkCanvas(W,H); c.c.drawImage(img,0,0,W,H);
  const d=c.c.getImageData(0,0,W,H);
  const out=new Uint8ClampedArray(d.data);
  for(let i=0;i<out.length;i+=4){
    const r=out[i],g=out[i+1],b=out[i+2]; let bg=false;
    if(mode==='auto'&&detBG){const dr=r-detBG.r,dg=g-detBG.g,db=b-detBG.b;bg=Math.sqrt(dr*dr+dg*dg+db*db)<th}
    else if(mode==='bright') bg=(0.299*r+0.587*g+0.114*b)>(255-th);
    if(bg) out[i+3]=0;
  }
  return {data:out, width:W, height:H};
}

//
function getParams(key) {
  const algo=ALGOS[key], p={};
  for(const[k,d]of Object.entries(algo.params)){
    const el=document.getElementById(`p_${key}_${k}`);
    if(!el){p[k]=d.def;continue}
    p[k]=d.type==='tog'?el.checked:d.type==='sel'?el.value:parseFloat(el.value);
  }
  return p;
}

//
export function computeHM(proc) {
  if(!proc) return null;
  const kA=document.getElementById('blA').value;
  const kB=document.getElementById('blB').value;
  const wA=parseInt(document.getElementById('blW').value)/100;
  const hmA=ALGOS[kA].run(proc.data, proc.width, proc.height, getParams(kA));
  if(wA>0.999||kA===kB) return hmA;
  const hmB=ALGOS[kB].run(proc.data, proc.width, proc.height, getParams(kB));
  const o=new Float32Array(proc.width*proc.height);
  for(let i=0;i<o.length;i++) o[i]=hmA[i]*wA+hmB[i]*(1-wA);
  return o;
}

//
export function voxelize(proc, hm) {
  const maxD=parseInt(document.getElementById('maxD').value)||8;
  const bs=parseFloat(document.getElementById('blkSz').value)||1;
  const orient=document.getElementById('orient').value;
  const cm=document.getElementById('cmap').value;
  const W=proc.width,H=proc.height, vx=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const i=y*W+x;
    if(proc.data[i*4+3]<20) continue;
    const t=Math.max(0,Math.min(1,hm[i]));
    const layers=Math.max(1,Math.round(t*maxD));
    const [cr,cg,cb]=getColorAt(t,cm,proc.data[i*4],proc.data[i*4+1],proc.data[i*4+2]);
    for(let z=0;z<layers;z++){
      let px,py,pz;
      if(orient==='upright'){px=x;py=H-1-y;pz=z}
      else{px=x;py=z;pz=y}
      vx.push({x:px,y:py,z:pz,r:cr,g:cg,b:cb,oR:proc.data[i*4],oG:proc.data[i*4+1],oB:proc.data[i*4+2],depth:t});
    }
  }
  return vx;
}

//
export function autoDetect(img, origW, origH, detBG, callback) {
  if(!img) return;
  const oc=mkCanvas(origW,origH); oc.c.drawImage(img,0,0);
  const origPx=oc.c.getImageData(0,0,origW,origH);
  let best=1; const maxDiv=Math.min(80,Math.floor(Math.min(origW,origH)/3));
  for(let d=2;d<=maxDiv;d++){
    const sw=Math.floor(origW/d),sh=Math.floor(origH/d);
    if(sw<3||sh<3)break;
    const sc=mkCanvas(sw,sh); sc.c.drawImage(img,0,0,sw,sh);
    const bc=mkCanvas(origW,origH); bc.c.drawImage(sc.e,0,0,origW,origH);
    const bk=bc.c.getImageData(0,0,origW,origH);
    let diff=0,tot=0;
    for(let i=0;i<origPx.data.length;i+=4){
      if(detBG){const dr=origPx.data[i]-detBG.r,dg=origPx.data[i+1]-detBG.g,db=origPx.data[i+2]-detBG.b;if(Math.sqrt(dr*dr+dg*dg+db*db)<45)continue}
      tot++;
      if(Math.abs(origPx.data[i]-bk.data[i])+Math.abs(origPx.data[i+1]-bk.data[i+1])+Math.abs(origPx.data[i+2]-bk.data[i+2])>18)diff++;
    }
    if(tot>0&&(diff/tot)<.06)best=d; else break;
  }
  document.getElementById('resW').value=Math.floor(origW/best);
  document.getElementById('resH').value=Math.floor(origH/best);
  setSt(`🔮 Pixel ≈ ${best}px → ${Math.floor(origW/best)}×${Math.floor(origH/best)}`,'ok');
  if(callback) callback();
}