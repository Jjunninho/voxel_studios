import { CUBE36 } from './constants.js';

let THREE_S, THREE_C, THREE_R, voxMesh=null, VMAT;
const cam={th:Math.PI*.3, ph:Math.PI*.38, r:55, tx:0, ty:0, tz:0};
let drag=false, pan=false, prev={x:0,y:0};

//
export function initThree() {
  const wrap=document.getElementById('viewport');
  const cv=document.getElementById('c3d');
  THREE_S=new THREE.Scene(); THREE_S.background=new THREE.Color(0x07070e);
  THREE_C=new THREE.PerspectiveCamera(42,wrap.clientWidth/wrap.clientHeight,.1,2000);
  THREE_R=new THREE.WebGLRenderer({canvas:cv,antialias:true});
  THREE_R.setPixelRatio(Math.min(window.devicePixelRatio,2));
  THREE_R.setSize(wrap.clientWidth,wrap.clientHeight);

  // Luzes
  THREE_S.add(new THREE.AmbientLight(0x606070,0.75));
  const d1=new THREE.DirectionalLight(0xffffff,0.85); d1.position.set(12,22,18); THREE_S.add(d1);
  const d2=new THREE.DirectionalLight(0x7788cc,0.35); d2.position.set(-10,4,-14); THREE_S.add(d2);

  // Grid
  THREE_S.add(new THREE.GridHelper(80,80,0x1a1a28,0x131320));

  // Material compartilhado (vertexColors)
  VMAT=new THREE.MeshPhongMaterial({vertexColors:true, shininess:22});

  updateCam();
  (function loop(){requestAnimationFrame(loop);THREE_R.render(THREE_S,THREE_C)})();

  // Resize
  new ResizeObserver(()=>{
    const w=wrap.clientWidth,h=wrap.clientHeight;
    THREE_C.aspect=w/h; THREE_C.updateProjectionMatrix(); THREE_R.setSize(w,h);
  }).observe(wrap);

  // Mouse: rotate / pan / zoom
  cv.addEventListener('mousedown',e=>{if(e.shiftKey)pan=true;else drag=true;prev={x:e.clientX,y:e.clientY}});
  window.addEventListener('mousemove',e=>{
    if(!drag&&!pan)return;
    const dx=e.clientX-prev.x,dy=e.clientY-prev.y; prev={x:e.clientX,y:e.clientY};
    if(drag){cam.th-=dx*.008;cam.ph=Math.max(.04,Math.min(Math.PI-.04,cam.ph-dy*.008));updateCam()}
    if(pan){
      // Vector direita no plano da câmera
      const fwd=new THREE.Vector3();THREE_C.getWorldDirection(fwd);
      const right=fwd.clone().cross(new THREE.Vector3(0,1,0)).normalize();
      const up=right.clone().cross(fwd).normalize();
      const sp=cam.r*.006;
      cam.tx-=(dx*right.x-dy*up.x)*sp;
      cam.ty-=(dx*right.y-dy*up.y)*sp;
      cam.tz-=(dx*right.z-dy*up.z)*sp;
      updateCam();
    }
  });
  window.addEventListener('mouseup',()=>{drag=false;pan=false});
  cv.addEventListener('wheel',e=>{e.preventDefault();cam.r=Math.max(4,Math.min(250,cam.r+e.deltaY*.08));updateCam()},{passive:false});
}

//
function updateCam(){
  THREE_C.position.set(
    cam.tx+cam.r*Math.sin(cam.ph)*Math.sin(cam.th),
    cam.ty+cam.r*Math.cos(cam.ph),
    cam.tz+cam.r*Math.sin(cam.ph)*Math.cos(cam.th));
  THREE_C.lookAt(cam.tx,cam.ty,cam.tz);
}

//
export function rebuildMesh(voxels, blkSz) { // blkSz vindo como argumento
  if(voxMesh){THREE_S.remove(voxMesh);voxMesh.geometry.dispose();voxMesh=null}
  if(!voxels.length) return;

  const bs = blkSz;
  const h=bs/2;
  const N=voxels.length, pos=new Float32Array(N*36*3), col=new Float32Array(N*36*3), nor=new Float32Array(N*36*3);

  // Centra X e Z, pousa Y no chão
  let mnX=Infinity,mnY=Infinity,mnZ=Infinity,mxX=-Infinity,mxY=-Infinity,mxZ=-Infinity;
  voxels.forEach(v=>{mnX=Math.min(mnX,v.x);mnY=Math.min(mnY,v.y);mnZ=Math.min(mnZ,v.z);mxX=Math.max(mxX,v.x);mxY=Math.max(mxY,v.y);mxZ=Math.max(mxZ,v.z)});
  const cx=(mnX+mxX)/2, cz=(mnZ+mxZ)/2;

  for(let vi=0;vi<N;vi++){
    const v=voxels[vi];
    const ox=(v.x-cx)*bs, oy=(v.y-mnY)*bs, oz=(v.z-cz)*bs;
    const base=vi*36;
    for(let f=0;f<36;f++){
      const c=CUBE36[f], idx=(base+f)*3;
      pos[idx]  =ox+c[0]*h;
      pos[idx+1]=oy+c[1]*h;
      pos[idx+2]=oz+c[2]*h;
      col[idx]  =v.r/255; col[idx+1]=v.g/255; col[idx+2]=v.b/255;
      nor[idx]  =c[3]; nor[idx+1]=c[4]; nor[idx+2]=c[5];
    }
  }

  const geom=new THREE.BufferGeometry();
  geom.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geom.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geom.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  voxMesh=new THREE.Mesh(geom,VMAT);
  THREE_S.add(voxMesh);

  // Ajusta câmera
  const sz=Math.max(mxX-mnX,mxY-mnY,mxZ-mnZ)*bs;
  cam.ty=(mxY-mnY)*bs*.5; cam.r=sz*2.4; updateCam();

  // Flash visual
  const vp=document.getElementById('viewport');
  vp.classList.add('flash');setTimeout(()=>vp.classList.remove('flash'),200);
}