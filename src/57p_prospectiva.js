"use strict";
/* =====================================================================
   Bloque 15 · PROSPECTIVA A 1, 2 Y 5 AÑOS POR TRATAMIENTO
   ---------------------------------------------------------------------
   Objetivo 6 e hipótesis de sistema de Hernández González (2026): «los
   tratamientos que mejoran la materia orgánica y la retención de agua del
   suelo dan al viñedo mayor resiliencia en los escenarios a 1, 2 y 5 años»;
   y sección 6.8: el índice de sostenibilidad se recalcula en cada escenario.
   Escenarios exploratorios (Godet y Durance, 2007): futuros posibles con
   supuestos explícitos y editables, no pronósticos.
   Cadena del modelo, para cada tratamiento, escenario y año t:
     1. MO(t) = MO₀ + r·t  (r: cambio anual de MO del tratamiento).
     2. θCC y θPMP cambian con la MO según Saxton y Rawls (2006, Ec. 1–2);
        al θ medido se le suma solo la diferencia Δθ = θ(MO(t)) − θ(MO₀).
     3. Clima del año base con +ΔT (IPCC, 2018: 0.2 °C por década, 0.1–0.3),
        lluvia × (1 + ΔP) y riego × fI; se corre otra vez el balance FAO-56.
     4. Resiliencia: transpiración relativa Tr/Tpot, días con Ks < 1 y freno.
     5. Rendimiento con Ky de Doorenbos y Kassam (1979) solo si escribes Ky.
     6. ISG del Bloque 14 con los indicadores que cambian (MO, rendimiento,
        eficiencia del agua, beneficio/costo); los demás quedan como hoy.
   ===================================================================== */
const ESC_V = [
  {id:'des', n:E('Deseable','Desirable'), col:'#2f8f6a', p:{dT:0.1, dP:0, fI:100, gP:1, gC:1}},
  {id:'ten', n:E('Tendencial','Trend'), col:'#c98b21', p:{dT:0.2, dP:-5, fI:100, gP:0, gC:2}},
  {id:'nod', n:E('No deseado','Undesired'), col:'#c43a2f', p:{dT:0.3, dP:-20, fI:75, gP:-1.5, gC:4}}];
const PAR_V = [
  ['dT', E('Calentamiento (°C por década)','Warming (°C per decade)'), 'ipcc', 0.05],
  ['dP', E('Cambio de la lluvia frente al año base (%)','Rainfall change from the base year (%)'), 'sup', 1],
  ['fI', E('Agua de riego disponible (% de la aplicada hoy)','Irrigation water available (% of today’s)'), 'sup', 5],
  ['gP', E('Precio real de la uva (% por año)','Real grape price (% per year)'), 'sup', 0.5],
  ['gC', E('Costo real de producción (% por año)','Real production cost (% per year)'), 'sup', 0.5]];
const HOR_V = [0,1,2,5];
/* Saxton y Rawls (2006), Ec. 1 y 2: arena S y arcilla C en fracción, MO en % (válida hasta 8 % de MO y 60 % de arcilla) */
function saxtonRawls(Sa, Cl, OM){ OM=Math.max(0,Math.min(8,OM));
  const t15=-0.024*Sa+0.487*Cl+0.006*OM+0.005*Sa*OM-0.013*Cl*OM+0.068*Sa*Cl+0.031, w15=t15+(0.14*t15-0.02);
  const t33=-0.251*Sa+0.195*Cl+0.011*OM+0.006*Sa*OM-0.027*Cl*OM+0.452*Sa*Cl+0.299, w33=t33+(1.283*t33*t33-0.374*t33-0.015);
  return {cc:w33, pmp:w15}; }
function fraccionesSuelo(){ const s=S.suelo, a=num(s.jarArena), l=num(s.jarLimo), c=num(s.jarArcilla); if([a,l,c].some(v=>v==null)) return null; const t=a+l+c; return t>0?{Sa:a/t, Cl:c/t}:null; }
function prospV(){ const g=S.prosp||{}, e=g.esc||{};
  return {ky:num(g.ky), dmo:g.dmo||{}, esc:Object.fromEntries(ESC_V.map(x=>[x.id, Object.fromEntries(Object.keys(x.p).map(k=>[k, num((e[x.id]||{})[k])??x.p[k]]))]))}; }
/* Rangos de Spearman (empates con rango medio) */
function spearman(x, y){ const rk=v=>{ const o=v.map((z,i)=>[z,i]).sort((a,b)=>a[0]-b[0]), r=Array(v.length); for(let i=0;i<o.length;){ let j=i; while(j+1<o.length&&o[j+1][0]===o[i][0]) j++; for(let k=i;k<=j;k++) r[o[k][1]]=(i+j)/2+1; i=j+1; } return r; };
  const a=rk(x), b=rk(y), n=x.length, m=(n+1)/2; let sxy=0, sx=0, sy=0; for(let i=0;i<n;i++){ sxy+=(a[i]-m)*(b[i]-m); sx+=(a[i]-m)**2; sy+=(b[i]-m)**2; } return sx>0&&sy>0?sxy/Math.sqrt(sx*sy):null; }
function simularVitis(){ const P=prospV(), base=RASPA.correr(); if(base.falta) return {falta:base.falta, P};
  const U=unidades(), fr=fraccionesSuelo(), cap=(S.sost||{}).u||{}, den=densidad(), moS=num(S.suelo.mo), ss=sostenibilidadT();
  const trat=U.map(u=>{ const mo0=num((cap[u.id]||{}).mo)??moS, r=num(P.dmo[u.id]), sug=num((cap[u.id]||{}).mo)!=null&&moS!=null?num((cap[u.id]||{}).mo)-moS:null;
    return {u, col:EXP.color(u.id)!=='var(--muted)'?EXP.color(u.id):'#2f5d50', mo0, r:r??0, rDef:r==null, sug, Y0:num(((S.prod.datos||{})[u.id]||{}).rend), c:cap[u.id]||{}}; });
  const resil=b=>{ const Tp=b.b.reduce((s,d)=>s+d.kcb*d.et0,0), fr_=b.b.reduce((s,d)=>s+d.kcb*d.et0*(1-d.Ks),0); return {Tpot:Tp, freno:fr_, relT:Tp>0?1-fr_/Tp:null, dEst:b.diasEstres, I:b.tot.I, DP:b.tot.DP, etc:b.tot.etc, P:b.tot.P}; };
  const cache={}, run=o=>{ const k=JSON.stringify(o); return cache[k]||(cache[k]=resil(RASPA.correr(o))); };
  const res={};
  ESC_V.forEach(e=>{ const p=P.esc[e.id]; res[e.id]={};
    HOR_V.forEach(t=>{ res[e.id][t]=trat.map(q=>{ const mo=q.mo0!=null?Math.max(0,q.mo0+q.r*t):null;
        let dcc=0, dpmp=0; if(fr&&q.mo0!=null&&t>0&&q.r){ const a=saxtonRawls(fr.Sa,fr.Cl,q.mo0), b=saxtonRawls(fr.Sa,fr.Cl,mo); dcc=b.cc-a.cc; dpmp=b.pmp-a.pmp; }
        const o=t===0?{}:{dT:+(p.dT*t/10).toFixed(4), fP:1+p.dP/100, fI:p.fI/100, dcc:+dcc.toFixed(6), dpmp:+dpmp.toFixed(6)}, z=run(o);
        return {...z, mo, dcc, dpmp, taw:base.sh.zr?1000*(base.par.cc+dcc-base.par.pmp-dpmp)*base.sh.zr:null}; }); }); });
  /* Rendimiento, eficiencia del agua y beneficio/costo */
  ESC_V.forEach(e=>{ const p=P.esc[e.id]; HOR_V.forEach(t=>res[e.id][t].forEach((z,k)=>{ const q=trat[k], z0=res[e.id][0][k];
    const f=P.ky!=null&&z.relT!=null&&z0.relT!=null?Math.max(0,1-P.ky*(1-z.relT))/Math.max(1e-9,1-P.ky*(1-z0.relT)):1;
    z.Y=q.Y0!=null?q.Y0*f:null; z.wue=z.Y!=null&&den&&z.etc>0?z.Y*den/1000*1000/(z.etc*10):null;
    const ing=num(q.c.ingreso), cos=num(q.c.costoTot); z.bc=ing!=null&&cos>0?ing*Math.pow(1+p.gP/100,t)*(q.Y0>0&&z.Y!=null?z.Y/q.Y0:1)/(cos*Math.pow(1+p.gC/100,t)):null; })); });
  /* ISG recalculado: mismos indicadores, sentidos y pesos del Bloque 14; rango común a todos los años y escenarios */
  const wd=(S.sost||{}).wd||{}, claves=[]; ESC_V.forEach(e=>HOR_V.forEach(t=>claves.push([e.id,t])));
  const valor=(i,k,z)=>i.id==='mo'?z.mo:i.id==='rend'?z.Y:i.id==='wue'?z.wue:i.id==='bc'?z.bc:i.x[k];
  const inds=ss.inds.map(i=>{ const todos=claves.flatMap(([e,t])=>res[e][t].map((z,k)=>valor(i,k,z))).filter(v=>v!=null);
    const mn=i.conRef?i.mn:todos.length?Math.min(...todos):null, mx=i.conRef?i.mx:todos.length?Math.max(...todos):null; return {...i, pmn:mn, pmx:mx}; });
  claves.forEach(([e,t])=>res[e][t].forEach((z,k)=>{ const dim={};
    Object.keys(DIM_S).forEach(d=>{ const l=inds.filter(i=>i.d===d).map(i=>{ const v=valor(i,k,z); return v==null||i.pmn==null||!(i.pmx>i.pmn)?null:{w:i.w, In:Math.max(0,Math.min(1,i.sg>0?(v-i.pmn)/(i.pmx-i.pmn):(i.pmx-v)/(i.pmx-i.pmn)))}; }).filter(Boolean);
      const sw=l.reduce((s,x)=>s+x.w,0); dim[d]=l.length&&sw>0?l.reduce((s,x)=>s+x.w*x.In,0)/sw:null; });
    const ds=Object.keys(DIM_S).filter(d=>dim[d]!=null), swd=ds.reduce((s,d)=>s+(num(wd[d])??1),0);
    z.dim=dim; z.ISG=ds.length===3&&swd>0?ds.reduce((s,d)=>s+(num(wd[d])??1)*dim[d],0)/swd:null; z.sost=z.ISG!=null&&z.ISG>=0.5&&ds.every(d=>dim[d]>=0.5); }));
  /* Hipótesis de sistema: a 5 años, ¿más MO va con más transpiración relativa (menos estrés)? */
  const hip=ESC_V.map(e=>{ const l=res[e.id][5].map((z,k)=>({mo:z.mo, rt:z.relT})).filter(x=>x.mo!=null&&x.rt!=null);
    const varia=l.length>=3&&new Set(l.map(x=>x.mo.toFixed(4))).size>1&&new Set(l.map(x=>x.rt.toFixed(6))).size>1;
    return {e, n:l.length, rho:varia?spearman(l.map(x=>x.mo),l.map(x=>x.rt)):null}; });
  return {P, base, trat, res, inds, hip, fr, conRef:inds.some(i=>i.conRef), sinKy:P.ky==null}; }

const IND_V = [
  {k:'ISG', n:E('Índice de sostenibilidad general (ISG)','Overall sustainability index (ISG)'), u:E('0–1; 0.5 es el umbral','0–1; 0.5 is the threshold'), d:2, mn:0, mx:1},
  {k:'relT', n:E('Transpiración relativa (resiliencia)','Relative transpiration (resilience)'), u:E('Tr / Tpot; 1 = sin estrés','Tr / Tpot; 1 = no stress'), d:3},
  {k:'dEst', n:E('Días con estrés hídrico','Water stress days'), u:E('días con Ks < 1','days with Ks < 1'), d:0},
  {k:'freno', n:E('Transpiración perdida por estrés','Transpiration lost to stress'), u:'mm', d:0},
  {k:'mo', n:E('Materia orgánica del suelo','Soil organic matter'), u:'%', d:2},
  {k:'taw', n:E('Agua disponible total (ADT)','Total available water (TAW)'), u:'mm', d:1},
  {k:'Y', n:E('Rendimiento por planta','Yield per vine'), u:'kg', d:2},
  {k:'wue', n:E('Eficiencia en el uso del agua','Water use efficiency'), u:'kg m⁻³', d:2},
  {k:'bc', n:E('Relación beneficio/costo','Benefit/cost ratio'), u:'', d:2}];
/* Una gráfica por escenario, una línea por tratamiento, eje de 0 a 5 años */
function graficaV(sim, e, k){ const ind=IND_V.find(x=>x.k===k), W=360, H=230, L=50, B=34, R=14, Tp=14, s0=sim.res[e.id];
  const ser=sim.trat.map((q,i)=>HOR_V.map(t=>s0[t][i][k])); const all=ESC_V.flatMap(x=>HOR_V.flatMap(t=>sim.res[x.id][t].map(z=>z[k]))).filter(v=>v!=null);
  if(!all.length) return `<p class="sindato">${T('Sin dato','No data')}</p>`;
  let mn=ind.mn??Math.min(...all), mx=ind.mx??Math.max(...all); if(ind.mn==null){ if(mx-mn<1e-9){ const d=Math.abs(mn)*.05||1; mn-=d; mx+=d; } const pad=(mx-mn)*.1; mn-=pad; mx+=pad; }
  const X=t=>L+(W-L-R)*t/5, Y=v=>Tp+(H-Tp-B)*(1-(v-mn)/(mx-mn));
  let s=`<svg class="chart prosp-g" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(tx(ind.n)+' · '+tx(e.n))}">`;
  for(let i=0;i<=4;i++){ const v=mn+(mx-mn)*i/4; s+=`<line class="grid" x1="${L}" y1="${Y(v)}" x2="${W-R}" y2="${Y(v)}"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" font-size="12" class="m">${fmt(v,ind.d)}</text>`; }
  if(k==='ISG') s+=`<line x1="${L}" x2="${W-R}" y1="${Y(0.5)}" y2="${Y(0.5)}" stroke="var(--bad)" stroke-dasharray="5 4" opacity=".7"/>`;
  [1,2,5].forEach(t=>{ s+=`<line x1="${X(t)}" y1="${Tp}" x2="${X(t)}" y2="${H-B}" stroke="var(--border-strong)" stroke-dasharray="3 3"/><text x="${X(t)}" y="${H-B+16}" text-anchor="middle" font-size="12.5" font-weight="700">${t} ${t===1?T('año','yr'):T('años','yrs')}</text>`; });
  s+=`<text x="${X(0)}" y="${H-B+16}" text-anchor="middle" font-size="12" class="m">${T('hoy','now')}</text>`;
  sim.trat.forEach((q,i)=>{ const pts=HOR_V.map((t,j)=>ser[i][j]==null?null:[X(t),Y(ser[i][j])]).filter(Boolean); if(!pts.length) return;
    s+=`<polyline class="linea-p" fill="none" stroke="${q.col}" stroke-width="2.6" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;
    HOR_V.forEach((t,j)=>{ if(ser[i][j]!=null) s+=`<circle cx="${X(t)}" cy="${Y(ser[i][j])}" r="4.2" fill="${q.col}" stroke="var(--card)" stroke-width="1.5" data-tip="${esc(q.u.n+' · '+tx(e.n)+' · '+(t?t+' '+T('años','years'):T('hoy','now'))+': '+fmt(ser[i][j],ind.d)+(typeof ind.u==='string'&&ind.u?' '+ind.u:''))}"/>`; }); });
  return s+'</svg>'; }
function tablaISGv(sim){ const cel=z=>z.ISG==null?'<td class="r">—</td>':`<td class="r" style="background:${z.sost?'var(--ok-soft)':'var(--bad-soft)'}"><b>${fmt(z.ISG,2)}</b></td>`;
  return `<div class="tbl-c"><table class="tbl prosp-t"><thead><tr><th>${T('Tratamiento','Treatment')}</th><th>${T('Hoy','Now')}</th>${ESC_V.map(e=>[1,2,5].map(t=>`<th class="r" style="color:${e.col}">${esc(tx(e.n))}<br><small>${t} ${t===1?T('año','yr'):T('años','yrs')}</small></th>`).join('')).join('')}</tr></thead><tbody>
    ${sim.trat.map((q,i)=>`<tr><td><b style="color:${q.col}">${esc(q.u.n)}</b></td>${cel(sim.res.ten[0][i])}${ESC_V.map(e=>[1,2,5].map(t=>cel(sim.res[e.id][t][i])).join('')).join('')}</tr>`).join('')}</tbody></table></div>`; }
function lecturaV(sim){ const L=[], nod=sim.res.nod, des=sim.res.des, mejor=(r,k)=>{ let b=null; r.forEach((z,i)=>{ if(z[k]!=null&&(b==null||z[k]>r[b][k])) b=i; }); return b; };
  const bR=mejor(nod[5],'relT'); if(bR!=null) L.push(T(`En el escenario no deseado, a 5 años, <b>${esc(sim.trat[bR].u.n)}</b> es el tratamiento más resiliente: conserva ${fmt(100*nod[5][bR].relT,0)} % de su transpiración (hoy ${fmt(100*nod[0][bR].relT,0)} %) con ${nod[5][bR].dEst} días de estrés.`,`In the undesired scenario, at 5 years, <b>${esc(sim.trat[bR].u.n)}</b> is the most resilient treatment: it keeps ${fmt(100*nod[5][bR].relT,0)} % of its transpiration (now ${fmt(100*nod[0][bR].relT,0)} %) with ${nod[5][bR].dEst} stress days.`));
  const bI=mejor(des[5],'ISG'); if(bI!=null) L.push(T(`Con el escenario deseable, a 5 años, el ISG más alto es el de <b>${esc(sim.trat[bI].u.n)}</b> (${fmt(des[5][bI].ISG,2)}).`,`In the desirable scenario, at 5 years, the highest ISG is <b>${esc(sim.trat[bI].u.n)}</b>’s (${fmt(des[5][bI].ISG,2)}).`));
  const caen=sim.trat.filter((q,i)=>sim.res.ten[0][i].sost&&!nod[5][i].sost).map(q=>esc(q.u.n)); if(caen.length) L.push(T(`Dejan de ser sostenibles en el escenario no deseado a 5 años: ${caen.join(', ')}.`,`They stop being sustainable in the undesired scenario at 5 years: ${caen.join(', ')}.`));
  return L; }
function renderProsp(el){ const sim=simularVitis(), ind=renderProsp.ind||'ISG';
  const marca=t=>t==='ipcc'?`<span class="dato">● IPCC (2018), SR1.5, SPM A.1</span>`:`<span class="interp">◆ ${T('Supuesto editable','Editable assumption')}</span>`;
  if(sim.falta){ el.innerHTML=`${cabecera('prosp','')}<div class="card vacio-res"><h2>${T('La prospectiva vuelve a correr el balance del Bloque 4','The outlook re-runs the Block 4 balance')}</h2><ul>${sim.falta.map(f=>`<li>${esc(tx(f[1]))}</li>`).join('')}</ul><button class="btn" data-ir="raspa">${T('Ir al Bloque 4','Go to Block 4')} →</button></div>${siguiente('prosp')}`; return; }
  const P=sim.P, hipC=h=>h.rho==null?`<span class="badge neu">${T('sin contraste','no contrast')}</span>`:h.rho>0?`<span class="badge ok">${T('la apoya','supports it')}</span>`:`<span class="badge bad">${T('no la apoya','does not support it')}</span>`, lec=lecturaV(sim);
  el.innerHTML=`${cabecera('prosp',T('¿Qué tratamiento aguanta mejor los próximos 1, 2 y 5 años? La app proyecta la materia orgánica de cada tratamiento, la convierte en agua que el suelo retiene y vuelve a correr día a día tu balance de agua con tres climas posibles. Al final recalcula el índice de sostenibilidad del Bloque 14.','Which treatment copes best over the next 1, 2 and 5 years? The app projects each treatment’s organic matter, turns it into water the soil holds and re-runs your daily water balance under three possible climates. Then it recalculates the Block 14 sustainability index.'))}
  ${consejo(T('No son pronósticos: son tres futuros posibles para decidir hoy. Escribe cuánto cambia la materia orgánica de cada tratamiento por año y mira si el que más la sube es el que menos sufre la sequía.','These are not forecasts: they are three possible futures to decide today. Write how much each treatment’s organic matter changes per year and see whether the one that raises it most suffers least in drought.'),
    T('Escenarios exploratorios (Godet y Durance, 2007). Δθ por MO con Saxton y Rawls (2006); balance diario FAO-56 rehecho con el año base perturbado (método delta, humedad relativa constante); calentamiento IPCC (2018); rendimiento con Ky (Doorenbos y Kassam, 1979) solo si lo escribes. ISG de la sección 6.8 con rango común a todos los años y escenarios.','Exploratory scenarios (Godet & Durance, 2007). Δθ from SOM with Saxton & Rawls (2006); daily FAO-56 balance re-run on the perturbed base year (delta method, constant relative humidity); IPCC (2018) warming; yield with Ky (Doorenbos & Kassam, 1979) only if you enter it. Section 6.8 ISG with a common range over all years and scenarios.'))}
  <div class="kpis">${ESC_V.map(e=>{ const l=sim.res[e.id][5], n=l.filter(z=>z.sost).length, v=l.filter(z=>z.relT!=null); return `<div class="kpi" style="border-top:4px solid ${e.col}"><div class="l">${esc(tx(e.n))} · 5 ${T('años','years')}</div><div class="v" style="color:${e.col}">${n} / ${l.length}</div><div class="s">${T('tratamientos sostenibles','sustainable treatments')} · Tr/Tpot ${v.length?fmt(Math.min(...v.map(z=>z.relT)),2)+'–'+fmt(Math.max(...v.map(z=>z.relT)),2):'—'}</div></div>`; }).join('')}</div>
  ${!sim.fr?`<div class="alert warn"><p>${T('Sin las capas de arena, limo y arcilla del Bloque 2 no se puede calcular cómo cambia la retención de agua con la materia orgánica: el suelo de cada tratamiento queda como hoy.','Without the sand, silt and clay layers from Block 2 the change in water holding with organic matter cannot be computed: each treatment’s soil stays as today.')} <a href="#suelo" data-ir="suelo">${T('Ir al Bloque 2','Go to Block 2')}</a></p></div>`:''}
  <div class="card"><h2>${T('15.1 Materia orgánica de cada tratamiento','15.1 Organic matter of each treatment')}</h2>
   ${tablaU([T('Tratamiento','Treatment'),T('MO hoy (%)','SOM now (%)'),T('Cambio de MO por año (puntos %)','SOM change per year (% points)'),T('De tus datos','From your data'),T('MO a 5 años (%)','SOM at 5 years (%)'),T('ADT hoy → 5 años (mm)','TAW now → 5 years (mm)')], sim.trat.map((q,i)=>{ const z0=sim.res.ten[0][i], z5=sim.res.ten[5][i];
     return `<tr><td><b style="color:${q.col}">${esc(q.u.n)}</b></td><td>${q.mo0!=null?fmt(q.mo0,2):`<span class="sindato">${T('sin dato','no data')}</span>`}</td><td><input data-sp="prosp.dmo.${q.u.id}" type="number" step="0.05" inputmode="decimal" value="${esc(P.dmo[q.u.id]??'')}" placeholder="0" style="width:90px"></td>
       <td>${q.sug!=null?`${fmt(q.sug,2)} <button class="btn sm ghost" data-usar-mo="${q.u.id}" data-v="${+q.sug.toFixed(3)}">${T('Usar','Use')}</button>`:'—'}</td><td>${z5.mo!=null?fmt(z5.mo,2):'—'}</td><td>${z0.taw!=null?fmt(z0.taw,1)+' → '+fmt(z5.taw,1):'—'}</td></tr>`; }))}
   <p class="nota">${T('«De tus datos» es la MO del tratamiento (Bloque 14) menos la MO inicial del suelo (Bloque 2), como cambio de un ciclo. Vacío = sin cambio. La MO del tratamiento sale del Bloque 14; si no está, la del Bloque 2.','“From your data” is the treatment SOM (Block 14) minus the initial soil SOM (Block 2), as a one-cycle change. Empty = no change. Treatment SOM comes from Block 14; if missing, from Block 2.')}</p>
   <p class="nota sci">${T('La MO no sube sin límite: la ecuación de Saxton y Rawls se acota a 8 % de MO. Una tendencia lineal de 5 años es un supuesto; revísala con los análisis de suelo de cada ciclo.','SOM does not rise without limit: the Saxton and Rawls equation is capped at 8 % SOM. A linear 5-year trend is an assumption; check it against each cycle’s soil tests.')}</p></div>
  <div class="card"><div class="row between"><h2 style="margin:0">${T('15.2 Trayectorias por escenario','15.2 Trajectories by scenario')}</h2>
    <label class="f" style="margin:0;min-width:300px"><select id="pvInd">${IND_V.map(x=>`<option value="${x.k}" ${x.k===ind?'selected':''}>${esc(tx(x.n))}</option>`).join('')}</select></label></div>
   <p class="nota">${esc(tx(IND_V.find(x=>x.k===ind).u))}${ind==='Y'&&sim.sinKy?' · '+T('sin Ky el rendimiento se queda como hoy','without Ky yield stays as today'):''}</p>
   <div class="prosp-grid">${ESC_V.map(e=>`<div class="card"><h3 style="margin:0 0 4px;color:${e.col}">${esc(tx(e.n))}</h3>${graficaV(sim,e,ind)}</div>`).join('')}</div>
   <div class="legend-cat">${sim.trat.map(q=>`<span><i style="background:${q.col}"></i>${esc(q.u.n)}</span>`).join('')}</div></div>
  <div class="card"><h2>${T('15.3 Índice de sostenibilidad recalculado','15.3 Recalculated sustainability index')}</h2>${tablaISGv(sim)}
   <p class="nota">${T('Verde: sostenible (ISG ≥ 0.5 y ninguna dimensión debajo de 0.5). Cambian con el escenario la MO, el rendimiento, la eficiencia en el uso del agua y la relación beneficio/costo; los demás indicadores quedan como hoy.','Green: sustainable (ISG ≥ 0.5 and no dimension below 0.5). SOM, yield, water use efficiency and benefit/cost change with the scenario; the other indicators stay as today.')}
    ${sim.conRef?'':T(' Para comparar años, el mínimo y el máximo de cada indicador se toman de todos los años y escenarios; por eso «hoy» puede diferir un poco del Bloque 14. Si escribes referencias en 14.2, se usan esas y «hoy» coincide.',' To compare years, each indicator’s minimum and maximum are taken over all years and scenarios, so “now” may differ slightly from Block 14. If you enter references in 14.2, those are used and “now” matches.')}</p></div>
  <div class="grid g2">
   <div class="card"><h3>${T('Hipótesis de sistema','System hypothesis')}</h3><p><i>${T('«Los tratamientos que mejoran la materia orgánica y la retención de agua del suelo dan al viñedo mayor resiliencia en los escenarios a 1, 2 y 5 años.»','“Treatments that improve soil organic matter and water holding give the vineyard greater resilience in the 1-, 2- and 5-year scenarios.”')}</i> <small class="muted">Hernández González (2026)</small></p>
    ${tablaU([T('Escenario a 5 años','Scenario at 5 years'),T('ρ de Spearman (MO vs Tr/Tpot)','Spearman ρ (SOM vs Tr/Tpot)'),T('Lectura','Reading')], sim.hip.map(h=>`<tr><td><span class="punto" style="background:${h.e.col}"></span>${esc(tx(h.e.n))}</td><td class="r">${h.rho!=null?fmt(h.rho,2):'—'}</td><td>${hipC(h)}</td></tr>`))}
    <p class="nota">${sim.hip.every(h=>h.rho==null)?T('Hace falta que los tratamientos difieran en MO (15.1) y que haya días con estrés para contrastarla. Con 4 tratamientos, ρ describe el orden; la prueba estadística está en el Bloque 9.','Treatments must differ in SOM (15.1) and there must be stress days to test it. With 4 treatments, ρ describes the ranking; the statistical test is in Block 9.'):T('ρ > 0: el orden de la MO coincide con el de la resiliencia. Con 4 tratamientos describe el orden, no es una prueba de significancia (esa está en el Bloque 9).','ρ > 0: the SOM ranking matches the resilience ranking. With 4 treatments it describes the ranking, it is not a significance test (that is in Block 9).')}</p></div>
   <div class="card"><h3>${T('Lo que dicen los escenarios','What the scenarios say')}</h3>${lec.length?`<ul>${lec.map(x=>`<li>${x}</li>`).join('')}</ul>`:`<p class="sindato">${T('Captura datos de los tratamientos para leer los escenarios.','Enter treatment data to read the scenarios.')}</p>`}</div></div>
  <div class="card"><div class="row between"><h2 style="margin:0">${T('15.4 Supuestos de cada escenario','15.4 Assumptions per scenario')}</h2><button class="btn ghost sm" id="pvReset">${T('Volver a los valores iniciales','Reset to defaults')}</button></div>
   <div class="tbl-c"><table class="tbl prosp-sup"><thead><tr><th>${T('Variable','Variable')}</th>${ESC_V.map(e=>`<th style="color:${e.col}">${esc(tx(e.n))}</th>`).join('')}<th>${T('Base','Basis')}</th></tr></thead><tbody>
    ${PAR_V.map(([k,n,b,st])=>`<tr><td>${esc(tx(n))}</td>${ESC_V.map(e=>`<td><input type="number" step="${st}" data-sp="prosp.esc.${e.id}.${k}" value="${P.esc[e.id][k]}"></td>`).join('')}<td>${marca(b)}</td></tr>`).join('')}</tbody></table></div>
   <div class="grid g2" style="margin-top:12px"><label class="f"><span>${T('Factor de respuesta del rendimiento al agua, Ky (temporada)','Yield response factor to water, Ky (season)')}</span><input type="number" step="0.01" min="0" data-sp="prosp.ky" value="${esc(P.ky??'')}" placeholder="${T('sin dato','no data')}"><small class="nota">${T('Escríbelo de tu fuente (FAO-33 o FAO-66) para tu variedad. Sin Ky, el rendimiento se queda como hoy.','Write it from your source (FAO-33 or FAO-66) for your variety. Without Ky, yield stays as today.')}</small></label>
    <p class="nota" style="align-self:center">${T('Año base: tus registros diarios del Bloque 3 desde la brotación, con el mismo calendario de riego del Bloque 4. A 1, 2 y 5 años se repite ese año con el clima de cada escenario.','Base year: your Block 3 daily records from budburst, with the same Block 4 irrigation calendar. At 1, 2 and 5 years that year is repeated with each scenario’s climate.')}</p></div></div>
  <div class="card sci"><h3>${T('Modelo','Model')}</h3><div class="formula">MO(t) = MO₀ + r·t ; θ<sub>CC</sub>(t) = θ<sub>CC,${T('medido','measured')}</sub> + [θ<sub>33</sub>(MO(t)) − θ<sub>33</sub>(MO₀)] ; θ<sub>PMP</sub>(t) ${T('igual con','likewise with')} θ<sub>1500</sub><br>
   θ<sub>1500t</sub> = −0.024S + 0.487C + 0.006MO + 0.005S·MO − 0.013C·MO + 0.068S·C + 0.031 ; θ<sub>1500</sub> = θ<sub>1500t</sub> + (0.14θ<sub>1500t</sub> − 0.02)<br>
   θ<sub>33t</sub> = −0.251S + 0.195C + 0.011MO + 0.006S·MO − 0.027C·MO + 0.452S·C + 0.299 ; θ<sub>33</sub> = θ<sub>33t</sub> + (1.283θ<sub>33t</sub>² − 0.374θ<sub>33t</sub> − 0.015)<br>
   T<sub>${T('máx, mín, rocío','max, min, dew')}</sub>(t) = T + ΔT·t/10 ; P(t) = P·(1 + ΔP) ; I(t) = I·f<sub>I</sub> → ${T('balance FAO-56 diario','daily FAO-56 balance')} (Ec. 84–86)<br>
   Tr/Tpot = 1 − Σ K<sub>cb</sub>ET₀(1 − K<sub>s</sub>) / Σ K<sub>cb</sub>ET₀ ; Y(t)/Y₀ = [1 − K<sub>y</sub>(1 − Tr/Tpot)<sub>t</sub>] / [1 − K<sub>y</sub>(1 − Tr/Tpot)<sub>0</sub>]<br>
   B/C(t) = ${T('ingreso','income')}·(1+g<sub>P</sub>)<sup>t</sup>·Y(t)/Y₀ ÷ ${T('costo','cost')}·(1+g<sub>C</sub>)<sup>t</sup> ; ISG(t) ${T('con la normalización y los pesos del Bloque 14','with Block 14 normalisation and weights')}</div>
   <p class="nota">${sim.fr?`S = ${fmt(sim.fr.Sa,3)} · C = ${fmt(sim.fr.Cl,3)} (${T('capas de la prueba del frasco, Bloque 2','jar-test layers, Block 2')}) · `:''}θ<sub>CC</sub> = ${fmt(sim.base.par.cc,3)} · θ<sub>PMP</sub> = ${fmt(sim.base.par.pmp,3)} · Z<sub>r</sub> = ${fmt(sim.base.sh.zr,2)} m · K<sub>y</sub> = ${P.ky!=null?fmt(P.ky,2):'—'} · ${sim.base.dias} ${T('días del año base','base-year days')}.</p>
   ${fuente('Saxton y Rawls (2006), Ec. 1–2; Allen et al. (2006), FAO-56; IPCC (2018), SR1.5, SPM A.1; Doorenbos y Kassam (1979); Godet y Durance (2007); Hernández González (2026), objetivo 6 y sección 6.8.')}</div>
  ${siguiente('prosp')}`;
  $('#pvInd',el).onchange=e=>{ renderProsp.ind=e.target.value; render(); };
  $$('[data-usar-mo]',el).forEach(b=>b.onclick=()=>{ ponerProfundo('prosp.dmo.'+b.dataset.usarMo, b.dataset.v); guardar(); render(); });
  $('#pvReset',el).onclick=()=>{ if(S.prosp) S.prosp.esc={}; guardar(); render(); toast(T('Supuestos iniciales','Default assumptions')); };
  enlazarTips(el); }
