"use strict";
/* =====================================================================
   MODELO 3D DEL VIÑEDO · capas apiladas (suelo → manejo → planta → producto → atmósfera)
   Proyección en perspectiva propia sobre SVG, sin bibliotecas. Se gira arrastrando o con
   las flechas; la cámara también se dirige desde el «Recorrido del viñedo» (enfocar, resaltar).
   ===================================================================== */
const COL_VINC = {ecuacion:'#2f5d50', evidencia:'#c0772b', hipotesis:'#7a5c99', campo:'#3f6fb0'};
function vitis3D(cont, red, opt={}){
  const W=980, H=opt.alto||640, D=2300, R0=210, reducir=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let yaw=-0.6, pitch=0.42, yawObj=null, pitchObj=null, girar=!reducir&&!window.__m3dQuieto&&opt.girar!==false, foco=null, marcados=new Set(), ciclo=null, raf=0, arr=null;
  const cz=Object.fromEntries(RED.CAPAS.map(c=>[c.id,c.z])), P={};
  RED.CAPAS.forEach((c,ci)=>{ const l=red.nodos.filter(n=>n.capa===c.id); l.forEach((n,i)=>{ const a=2*Math.PI*i/Math.max(1,l.length)+ci*0.55, r=R0*(l.length>7?(i%2?.62:.95):.85); P[n.id]=[r*Math.cos(a), r*Math.sin(a), c.z]; }); });
  const imp=n=>{ const m=Math.max(1,...red.nodos.map(x=>red.grado[x.id]||0)); return (red.grado[n.id]||0)/m; };
  function proy([x,y,z]){ const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    const x1=x*cy-y*sy, y1=x*sy+y*cy, y2=y1*cp-z*sp, z2=y1*sp+z*cp, f=D/(D+y2); return [W/2+x1*f, H/2-z2*f*0.92, f, y2]; }
  const svgNS='http://www.w3.org/2000/svg'; cont.innerHTML=`<svg class="chart m3v" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Modelo 3D del viñedo','3D vineyard model')}" style="touch-action:none;cursor:grab"></svg>`; const svg=cont.querySelector('svg');
  function dibujar(){ let s=''; const enCiclo=(a,b)=>ciclo&&ciclo.some((x,i)=>x===a&&ciclo[(i+1)%ciclo.length]===b);
    RED.CAPAS.forEach(c=>{ const pts=[]; for(let k=0;k<=48;k++){ const a=2*Math.PI*k/48; pts.push(proy([R0*1.12*Math.cos(a), R0*1.12*Math.sin(a), c.z])); }
      const on=!foco||foco===c.id; s+=`<path d="${pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')}Z" fill="${c.col}" fill-opacity="${on?0.10:0.03}" stroke="${c.col}" stroke-opacity="${on?0.6:0.15}" stroke-width="1.5"/>`;
      const e=proy([R0*1.16,0,c.z]); s+=`<text x="${(e[0]+8).toFixed(1)}" y="${e[1].toFixed(1)}" font-size="13" font-weight="700" fill="${c.col}" opacity="${on?1:.35}">${esc(tx(c.n))}</text>`; });
    const vis=red.vinc.filter(e=>P[e.a]&&P[e.b]).map(e=>({e, a:proy(P[e.a]), b:proy(P[e.b])})).sort((x,y)=>(y.a[3]+y.b[3])-(x.a[3]+x.b[3]));
    vis.forEach(({e,a,b})=>{ const enC=enCiclo(e.a,e.b), dim=(foco&&red.nodos.find(n=>n.id===e.a).capa!==foco&&red.nodos.find(n=>n.id===e.b).capa!==foco)||(ciclo&&!enC)||(marcados.size&&!(marcados.has(e.a)&&marcados.has(e.b))&&!enC);
      const col=COL_VINC[e.t]||'#888', sw=enC?4:1.2+1.6*(e.w||1);
      s+=`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${sw}" stroke-opacity="${dim?0.08:enC?0.95:0.55}" ${e.t==='hipotesis'||e.t==='campo'?'stroke-dasharray="6 5"':''} ${enC?'class="flujo"':''}/>`;
      if(!dim&&(enC||!ciclo)){ const mx=a[0]+(b[0]-a[0])*.62, my=a[1]+(b[1]-a[1])*.62, an=Math.atan2(b[1]-a[1],b[0]-a[0]); s+=`<path d="M${mx} ${my} l${-9*Math.cos(an-0.45)} ${-9*Math.sin(an-0.45)} M${mx} ${my} l${-9*Math.cos(an+0.45)} ${-9*Math.sin(an+0.45)}" stroke="${col}" stroke-width="${enC?3:1.6}" stroke-opacity="${enC?1:.7}"/>`; } });
    red.nodos.map(n=>({n, p:proy(P[n.id])})).sort((x,y)=>y.p[3]-x.p[3]).forEach(({n,p})=>{ const c=RED.CAPAS.find(k=>k.id===n.capa), r=(7+12*imp(n))*p[2], on=(!foco||n.capa===foco)&&(!marcados.size||marcados.has(n.id))&&(!ciclo||ciclo.includes(n.id));
      const val=n.v!=null?fmt(n.v,Math.abs(n.v)>=100?0:Math.abs(n.v)>=10?1:2)+(n.u?' '+n.u:''):T('sin dato','no data');
      s+=`<g opacity="${on?1:0.18}" data-tip="${esc(tx(n.n)+' · '+val+' · '+T('grado','degree')+' '+(red.grado[n.id]||0))}"><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r.toFixed(1)}" fill="${n.v!=null||n.campo?c.col:'none'}" stroke="${c.col}" stroke-width="2"/>
        <text x="${(p[0]+r+4).toFixed(1)}" y="${(p[1]+4).toFixed(1)}" font-size="${(11.5*Math.min(1.15,p[2])).toFixed(1)}" fill="var(--text)">${esc(tx(n.n).slice(0,26))}${on&&(marcados.size||ciclo)?` · <tspan font-weight="700">${esc(val)}</tspan>`:''}</text></g>`; });
    svg.innerHTML=s; enlazarTips(cont); }
  function paso(){ if(!svg.isConnected){ cancelAnimationFrame(raf); return; } if(yawObj!=null){ yaw+=(yawObj-yaw)*0.08; pitch+=(pitchObj-pitch)*0.08; if(Math.abs(yawObj-yaw)<0.002&&Math.abs(pitchObj-pitch)<0.002){ yawObj=pitchObj=null; } } else if(girar&&!arr) yaw+=0.0035;
    dibujar(); raf=requestAnimationFrame(paso); }
  svg.addEventListener('pointerdown',e=>{ arr={x:e.clientX,y:e.clientY,yaw,pitch}; yawObj=null; try{ svg.setPointerCapture(e.pointerId); }catch(_){ } svg.style.cursor='grabbing'; });
  svg.addEventListener('pointermove',e=>{ if(!arr) return; yaw=arr.yaw+(e.clientX-arr.x)*0.008; pitch=Math.max(0.05,Math.min(1.35,arr.pitch+(e.clientY-arr.y)*0.006)); });
  addEventListener('pointerup',()=>{ arr=null; svg.style.cursor='grab'; });
  svg.tabIndex=0; svg.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft') yaw-=0.12; if(e.key==='ArrowRight') yaw+=0.12; if(e.key==='ArrowUp') pitch=Math.min(1.35,pitch+0.08); if(e.key==='ArrowDown') pitch=Math.max(0.05,pitch-0.08); });
  dibujar(); if(!reducir&&!window.__m3dQuieto) raf=requestAnimationFrame(paso);
  const ctl={
    enfocar(capa, giro){ foco=capa; const c=RED.CAPAS.find(k=>k.id===capa); yawObj=yaw+(giro??0.9); pitchObj=c?(c.z>0?0.62:c.z<0?0.25:0.42):0.42; if(reducir||window.__m3dQuieto){ yaw=yawObj; pitch=pitchObj; yawObj=pitchObj=null; dibujar(); } },
    resaltar(ids){ marcados=new Set(ids||[]); ciclo=null; dibujar(); },
    ciclo(ids){ ciclo=ids; marcados=new Set(); dibujar(); },
    libre(){ foco=null; marcados=new Set(); ciclo=null; girar=!reducir&&!window.__m3dQuieto; dibujar(); },
    quieto(v){ girar=!v; } };
  return ctl; }
