"use strict";
/* =====================================================================
   EXPERIMENTO · diseño en bloques completos al azar (Bloque 1)
   Cada bloque (p. ej., una hilera) se divide en tantas parcelas como tratamientos;
   los tratamientos se sortean dentro de cada bloque. Unidad experimental: la parcela.
   El sorteo usa un generador pseudoaleatorio con semilla (mulberry32), así que
   la misma semilla reproduce el mismo croquis. Exporta la plantilla de campo en
   formato «tidy» (una fila por planta) para AgriDesign (Barrera-Guzmán, 2026).
   ===================================================================== */
const EXP = (()=>{
  function semillaNum(s){ let h=1779033703^String(s).length; for(const c of String(s)){ h=Math.imul(h^c.charCodeAt(0),3432918353); h=h<<13|h>>>19; } return h>>>0; }
  function mulberry32(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function barajar(l, rnd){ const a=l.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  /* Parámetros vigentes; null si falta algo */
  function params(){ const e=S.exp, t=(e.trats||[]).filter(x=>x.id&&x.id.trim()), b=num(e.bloques), k=num(e.plantasParcela), bo=num(e.bordo)??0;
    return t.length>=2 && b>=2 && k>=1 ? {trats:t, b:Math.round(b), k:Math.round(k), bo:Math.max(0,Math.round(bo)), etq:e.etiquetaBloque||T('Hilera','Row')} : null; }
  function sortear(semilla){ const p=params(); if(!p) return null; const rnd=mulberry32(semillaNum(semilla));
    return Array.from({length:p.b}, ()=> barajar(p.trats.map(x=>x.id), rnd)); }
  /* Lista de plantas: bloque, posición, parcela, tratamiento (o «bordo») */
  function plantas(){ const p=params(), so=S.exp.sorteo; if(!p||!so||so.length!==p.b||so[0].length!==p.trats.length) return null; const out=[];
    so.forEach((fila,bi)=>{ let pos=0; for(let i=0;i<p.bo;i++) out.push({b:bi+1, pos:++pos, parc:null, trat:'bordo'});
      fila.forEach((tid,pi)=>{ for(let j=0;j<p.k;j++) out.push({b:bi+1, pos:++pos, parc:bi*p.trats.length+pi+1, trat:tid}); });
      for(let i=0;i<p.bo;i++) out.push({b:bi+1, pos:++pos, parc:null, trat:'bordo'}); });
    return out; }
  const COLS = ['#2f5d50','#c0772b','#3f6fb0','#8a3f5a','#7a5c99','#4f7d3a','#b8562e','#39718a'];
  function color(tid){ const i=(S.exp.trats||[]).findIndex(x=>x.id===tid); return i<0?'var(--muted)':COLS[i%COLS.length]; }
  /* Croquis en SVG: un renglón por bloque, una celda por planta */
  function croquis(){ const p=params(), pl=plantas(); if(!pl) return '';
    const porB=p.bo*2+p.trats.length*p.k, cw=Math.max(12,Math.min(26,860/porB)), L=86, W=L+porB*cw+10, fh=34, H=p.b*(fh+14)+40;
    let s=`<svg class="chart croquis" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Croquis del experimento','Experiment layout')}">`;
    for(let bi=0;bi<p.b;bi++){ const y=20+bi*(fh+14); s+=`<text x="${L-8}" y="${y+fh/2+4}" text-anchor="end" font-size="12" class="m">${esc(p.etq)} ${bi+1}</text>`;
      pl.filter(x=>x.b===bi+1).forEach(x=>{ const xx=L+(x.pos-1)*cw, bo=x.trat==='bordo';
        s+=`<rect x="${xx+1}" y="${y}" width="${cw-2}" height="${fh}" rx="3" fill="${bo?'var(--surface2)':color(x.trat)}" ${bo?'stroke="var(--border)" stroke-dasharray="3 2"':''} data-tip="${esc((bo?T('Planta de bordo','Border vine'):x.trat+' · '+T('parcela','plot')+' '+x.parc)+' · '+T('posición','position')+' '+x.pos)}"/>`; });
      S.exp.sorteo[bi].forEach((tid,pi)=>{ const x0=L+(p.bo+pi*p.k)*cw; s+=`<text x="${x0+p.k*cw/2}" y="${y+fh/2+4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${esc(tid)}</text>`; }); }
    s+=`<text x="${L}" y="${H-8}" font-size="11" class="m">${T('Celdas punteadas: plantas de bordo, no se miden.','Dashed cells: border vines, not measured.')}</text></svg>`; return s; }
  /* Plantilla de campo (una fila por planta medida) para AgriDesign, AnalizaR o una hoja de cálculo */
  function csvCampo(vars){ const pl=plantas(); if(!pl) return null; vars=vars||[];
    return csv([[T('Bloque','Block'),T('Tratamiento','Treatment'),T('Parcela','Plot'),T('Planta','Vine'),T('Edad_anios','Age_years'),T('Fecha','Date')].concat(vars)]
      .concat(pl.filter(x=>x.trat!=='bordo').map(x=>[x.b,x.trat,x.parc,`${x.b}-${x.pos}`,'',''].concat(vars.map(()=>''))))); }
  return {params, sortear, plantas, croquis, csvCampo, color, semillaNum};
})();
