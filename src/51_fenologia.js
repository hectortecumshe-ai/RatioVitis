"use strict";
/* =====================================================================
   4.5 FENOLOGÍA OBSERVADA · fechas de poda, floración, cuajado, envero y cosecha
   por unidad (tratamiento). Días desde la brotación y grados-día con base 10 °C,
   Σ max(0, (Tmáx + Tmín)/2 − 10), la misma suma del índice de Winkler
   (Amerine y Winkler, 1944) que usa el Bloque 3, sobre los registros diarios.
   ===================================================================== */
const FASES = [{k:'flor', n:E('Floración','Flowering'), c:'#d9a441'}, {k:'cuaj', n:E('Cuajado','Fruit set'), c:'#7a9a3a'}, {k:'env', n:E('Envero','Veraison'), c:'#7a4f9a'}, {k:'cos', n:E('Cosecha','Harvest'), c:'#b05434'}];
function fenologia(){ const brot=S.raspa.brot, dias=S.clima.dias||[], F=S.raspa.feno||{};
  const gdd=(f)=>{ if(!brot||!f||f<brot) return null; const l=dias.filter(d=>d.f>=brot&&d.f<=f), n=Math.round((Date.parse(f)-Date.parse(brot))/864e5)+1;
    return {v:l.reduce((s,d)=>s+Math.max(0,(d.tmax+d.tmin)/2-10),0), cob:n>0?l.length/n:0}; };
  return unidades().map(u=>({u, fases:FASES.map(x=>{ const f=((F[u.id]||{})[x.k])||''; return {...x, f, dias:brot&&f?Math.round((Date.parse(f)-Date.parse(brot))/864e5):null, g:gdd(f)}; })})); }
function lineaFeno(fe){ const mx=Math.max(30,...fe.flatMap(r=>r.fases.map(x=>x.dias||0))), W=760, L=150, R=20, fila=34, H=fe.length*fila+58, x=d=>L+d*(W-L-R)/mx;
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('Línea de tiempo fenológica','Phenological timeline')}">`;
  for(let d=0; d<=mx; d+=30) s+=`<line x1="${x(d)}" x2="${x(d)}" y1="10" y2="${H-40}" stroke="var(--border)"/><text x="${x(d)}" y="${H-26}" text-anchor="middle" font-size="11" class="m">${d}</text>`;
  fe.forEach((r,i)=>{ const y=20+i*fila; s+=`<text x="${L-10}" y="${y+5}" text-anchor="end" font-size="12.5">${esc(r.u.n)}</text><line x1="${x(0)}" x2="${x(Math.max(0,...r.fases.map(z=>z.dias||0)))}" y1="${y}" y2="${y}" stroke="var(--muted)" stroke-width="2"/><circle cx="${x(0)}" cy="${y}" r="6" fill="#2f5d50" data-tip="${esc(T('Brotación','Budburst')+' · '+S.raspa.brot)}"/>`;
    r.fases.filter(z=>z.dias!=null&&z.dias>=0).forEach(z=>{ s+=`<circle cx="${x(z.dias)}" cy="${y}" r="7" fill="${z.c}" data-tip="${esc(tx(z.n)+' · '+z.f+' · '+z.dias+' '+T('días','days')+(z.g?' · '+fmt(z.g.v,0)+' °C·d':''))}"/>`; }); });
  return s+`<text x="${(L+W-R)/2}" y="${H-1}" text-anchor="middle" font-size="11.5" class="m">${T('días desde la brotación','days since budburst')}</text></svg>`; }
function seccionFeno(){ const fe=fenologia(), hay=fe.some(r=>r.fases.some(z=>z.f));
  return `<div class="card"><h2>${T('4.5 Fenología observada','4.5 Observed phenology')}</h2>
    <p class="nota">${T('Anota la fecha en que la mitad de las plantas de cada unidad llegó a cada etapa. La brotación es la del apartado 4.1.','Write the date when half the vines of each unit reached each stage. Budburst is the one in 4.1.')}</p>
    <div class="row" style="gap:12px;flex-wrap:wrap"><label class="f"><span>${T('Fecha de poda','Pruning date')}</span><input type="date" data-s="raspa.poda" value="${esc(S.raspa.poda||'')}"></label>
      <label class="f"><span>${T('Brotación','Budburst')}</span><input type="date" value="${esc(S.raspa.brot||'')}" disabled></label>
      ${S.raspa.poda&&S.raspa.brot?`<p style="align-self:center">${T('De la poda a la brotación','From pruning to budburst')}: <b>${Math.round((Date.parse(S.raspa.brot)-Date.parse(S.raspa.poda))/864e5)} ${T('días','days')}</b></p>`:''}</div>
    ${tablaU([T('Unidad','Unit'),...FASES.map(x=>esc(tx(x.n)))], fe.map(r=>`<tr><td><b>${esc(r.u.n)}</b></td>${r.fases.map(z=>`<td><input type="date" data-sp="raspa.feno.${r.u.id}.${z.k}" value="${esc(z.f)}"></td>`).join('')}</tr>`))}
    ${hay?`<div class="legend-cat"><span><i style="background:#2f5d50"></i>${T('Brotación','Budburst')}</span>${FASES.map(x=>`<span><i style="background:${x.c}"></i>${esc(tx(x.n))}</span>`).join('')}</div>${lineaFeno(fe)}
    ${tablaU([T('Unidad','Unit'),...FASES.map(x=>esc(tx(x.n))+'<br><small>'+T('días · °C·d','days · °C·d')+'</small>')], fe.map(r=>`<tr><td><b>${esc(r.u.n)}</b></td>${r.fases.map(z=>`<td>${z.dias!=null?`<b>${z.dias}</b> · ${z.g?(z.g.cob>=0.9?fmt(z.g.v,0):`<span class="sindato">${T('cobertura','coverage')} ${fmt(100*z.g.cob,0)} %</span>`):'—'}`:'—'}</td>`).join('')}</tr>`))}
    <p class="nota sci">${T('Grados-día: Σ max(0, (Tmáx + Tmín)/2 − 10) desde la brotación, con los registros del Bloque 3; se muestran si hay datos en al menos el 90 % de los días.','Degree-days: Σ max(0, (Tmax + Tmin)/2 − 10) from budburst, with Block 3 records; shown when at least 90 % of days have data.')}</p>
    ${fuente('Amerine y Winkler (1944), suma de temperaturas con base 10 °C.')}`:''}</div>`; }
