export const MAX_BLOCKS = 15000;

// Vértices do cubo (CUBE36)
export const CUBE36 = [
  [-1,-1,1,0,0,1],[1,-1,1,0,0,1],[1,1,1,0,0,1],[-1,-1,1,0,0,1],[1,1,1,0,0,1],[-1,1,1,0,0,1], // Front
  [1,-1,-1,0,0,-1],[-1,-1,-1,0,0,-1],[-1,1,-1,0,0,-1],[1,-1,-1,0,0,-1],[-1,1,-1,0,0,-1],[1,1,-1,0,0,-1], // Back
  [1,-1,1,1,0,0],[1,-1,-1,1,0,0],[1,1,-1,1,0,0],[1,-1,1,1,0,0],[1,1,-1,1,0,0],[1,1,1,1,0,0], // Right
  [-1,-1,-1,-1,0,0],[-1,-1,1,-1,0,0],[-1,1,1,-1,0,0],[-1,-1,-1,-1,0,0],[-1,1,1,-1,0,0],[-1,1,-1,-1,0,0], // Left
  [-1,1,1,0,1,0],[1,1,1,0,1,0],[1,1,-1,0,1,0],[-1,1,1,0,1,0],[1,1,-1,0,1,0],[-1,1,-1,0,1,0], // Top
  [-1,-1,-1,0,-1,0],[1,-1,-1,0,-1,0],[1,-1,1,0,-1,0],[-1,-1,-1,0,-1,0],[1,-1,1,0,-1,0],[-1,-1,1,0,-1,0] // Bottom
];

// Definição dos Algoritmos
export const ALGOS = {
  luminance: {
    label:'Luminância', emoji:'💡',
    desc:'Profundidade pela luminância perceptual.\nL = 0.299·R + 0.587·G + 0.114·B\nPixels mais claros → mais profundos (ou invertido).',
    params: { invert:{type:'tog',def:false,label:'Inverter'}, gamma:{type:'range',def:1,min:0.2,max:3,step:0.1,label:'Gamma'} },
    run(px, W, H, p) {
      const o = new Float32Array(W*H);
      for(let i=0;i<W*H;i++){
        if(px[i*4+3]<20){o[i]=0;continue}
        let L = (0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2])/255;
        L = Math.pow(L, p.gamma);
        o[i] = p.invert ? 1-L : L;
      }
      return o;
    }
  },
  channel: {
    label:'Canal RGB', emoji:'🔴',
    desc:'Usa um canal de cor isolado como profundidade.\nÚtil quando um canal contém mais informação de depth que a luminância combinada.',
    params: { ch:{type:'sel',def:'r',opts:{r:'Red',g:'Green',b:'Blue'},label:'Canal'}, invert:{type:'tog',def:false,label:'Inverter'} },
    run(px, W, H, p) {
      const off = p.ch==='r'?0:p.ch==='g'?1:2;
      const o = new Float32Array(W*H);
      for(let i=0;i<W*H;i++){
        if(px[i*4+3]<20){o[i]=0;continue}
        o[i] = p.invert ? 1-px[i*4+off]/255 : px[i*4+off]/255;
      }
      return o;
    }
  },
  sobel: {
    label:'Sobel Edge', emoji:'✏️',
    desc:'Detecta bordas com filtro Sobel (Gx/Gy).\nMagnitude = √(Gx²+Gy²).\nBordas da imagem virão as partes mais altas — efeito "relevo".',
    params: { strength:{type:'range',def:1.2,min:0.1,max:5,step:0.1,label:'Força'} },
    run(px, W, H, p) {
      const lm = new Float32Array(W*H);
      for(let i=0;i<W*H;i++) lm[i]=px[i*4+3]<20?0:(0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2])/255;
      const o = new Float32Array(W*H);
      for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
        const i=y*W+x;
        const gx=-lm[i-W-1]+lm[i-W+1]-2*lm[i-1]+2*lm[i+1]-lm[i+W-1]+lm[i+W+1];
        const gy= lm[i-W-1]+2*lm[i-W]+lm[i-W+1]-lm[i+W-1]-2*lm[i+W]-lm[i+W+1];
        o[i]=Math.min(1,Math.sqrt(gx*gx+gy*gy)*p.strength);
      }
      return o;
    }
  },
  gradient: {
    label:'Grad. Integrado', emoji:'📈',
    desc:'Integração dos gradientes (Shape-from-Shading simplificado).\nReconstói superfície a partir dos gradientes da imagem.\nO algoritmo mais interessante para pesquisa de inferência 3D.',
    params: { dir:{type:'sel',def:'h',opts:{h:'Horizontal',v:'Vertical',b:'Ambos'},label:'Direção'}, str:{type:'range',def:1,min:0.1,max:5,step:0.1,label:'Força'} },
    run(px, W, H, p) {
      const lm = new Float32Array(W*H);
      for(let i=0;i<W*H;i++) lm[i]=px[i*4+3]<20?0:(0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2])/255;
      const oH=new Float32Array(W*H), oV=new Float32Array(W*H);
      if(p.dir!=='v') for(let y=0;y<H;y++){let a=0;for(let x=1;x<W;x++){a+=lm[y*W+x]-lm[y*W+x-1];oH[y*W+x]=a}}
      if(p.dir!=='h') for(let x=0;x<W;x++){let a=0;for(let y=1;y<H;y++){a+=lm[y*W+x]-lm[(y-1)*W+x];oV[y*W+x]=a}}
      const o=new Float32Array(W*H);
      let mn=Infinity,mx=-Infinity;
      for(let i=0;i<W*H;i++){const v=p.dir==='h'?oH[i]:p.dir==='v'?oV[i]:oH[i]+oV[i];o[i]=v;if(v<mn)mn=v;if(v>mx)mx=v}
      const rng=mx-mn||1;
      for(let i=0;i<W*H;i++){o[i]=((o[i]-mn)/rng)*Math.min(1,p.str);if(px[i*4+3]<20)o[i]=0}
      return o;
    }
  },
  positional: {
    label:'Perspectiva', emoji:'👁️',
    desc:'Simula perspectiva pela posição na imagem.\nObjetos embaixo = mais perto = mais profundos.\nCombina com luminância via peso ajustável.',
    params: { lw:{type:'range',def:0.5,min:0,max:1,step:0.05,label:'Peso Luminância'}, inv:{type:'tog',def:false,label:'Inverter Y'} },
    run(px, W, H, p) {
      const o=new Float32Array(W*H);
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const i=y*W+x;
        if(px[i*4+3]<20){o[i]=0;continue}
        const L=(0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2])/255;
        const pos=p.inv ? y/H : 1-y/H;
        o[i]=p.lw*L+(1-p.lw)*pos;
      }
      return o;
    }
  },
  bilateral: {
    label:'Bilateral', emoji:'🧊',
    desc:'Filtro bilateral: suaviza a imagem preservando bordas, depois converte em profundidade.\nResulta em um heightmap mais limpo que a luminância pura — menos ruído, mais detalhado nas transições.',
    params: { rad:{type:'range',def:2,min:1,max:3,step:1,label:'Raio'}, ss:{type:'range',def:3,min:0.5,max:10,step:0.5,label:'Sigma Espacial'}, sr:{type:'range',def:0.12,min:0.02,max:0.5,step:0.01,label:'Sigma Cor'} },
    run(px, W, H, p) {
      const lm=new Float32Array(W*H);
      for(let i=0;i<W*H;i++) lm[i]=px[i*4+3]<20?0:(0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2])/255;
      const o=new Float32Array(W*H);
      const R=p.rad, s2s=2*p.ss*p.ss, s2r=2*p.sr*p.sr;
      for(let y=0;y<H;y++) for(let x=0;x<W;x++){
        const i=y*W+x;
        if(px[i*4+3]<20){o[i]=0;continue}
        let ws=0,vs=0;
        for(let dy=-R;dy<=R;dy++) for(let dx=-R;dx<=R;dx++){
          const nx=x+dx,ny=y+dy;
          if(nx<0||nx>=W||ny<0||ny>=H)continue;
          const ni=ny*W+nx; if(px[ni*4+3]<20)continue;
          const cd=lm[i]-lm[ni];
          const w=Math.exp(-(dx*dx+dy*dy)/s2s)*Math.exp(-(cd*cd)/s2r);
          ws+=w; vs+=w*lm[ni];
        }
        o[i]=ws>0?vs/ws:lm[i];
      }
      return o;
    }
  }
};