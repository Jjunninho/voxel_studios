const VIR=[[68,1,84],[62,34,150],[56,87,140],[40,120,145],[30,145,142],[20,168,134],[10,188,120],[5,205,100],[15,220,75],[40,230,50],[75,235,30],[120,237,20],[165,235,25],[205,228,45],[235,218,75],[250,205,110],[255,190,140],[255,175,165],[250,162,185],[240,152,200],[225,145,212],[208,140,220],[190,138,225],[172,138,228],[155,140,228],[140,143,227],[127,148,224],[115,154,220],[106,161,214],[100,169,207],[97,177,199],[96,186,190]];

export function cmViridis(t){const i=Math.min(VIR.length-1,Math.round(t*(VIR.length-1)));return VIR[i]}

export function cmHeat(t){
  if(t<.25){const s=t/.25;return[Math.round(20*s),Math.round(55*s),Math.round(140+115*s)]}
  if(t<.5){const s=(t-.25)/.25;return[Math.round(20*(1-s)),Math.round(55+200*s),Math.round(255*(1-s))]}
  if(t<.75){const s=(t-.5)/.25;return[Math.round(210*s),255,0]}
  const s=(t-.75)/.25;return[255,Math.round(255*(1-s)),Math.round(100*s)]
}

export function cmMono(t){const v=Math.round(t*255);return[v,v,v]}

export function getColorAt(t, mode, oR, oG, oB) {
  if(mode==='original') return[oR,oG,oB];
  if(mode==='heat')    return cmHeat(Math.max(0,Math.min(1,t)));
  if(mode==='viridis') return cmViridis(Math.max(0,Math.min(1,t)));
  return cmMono(Math.max(0,Math.min(1,t)));
}