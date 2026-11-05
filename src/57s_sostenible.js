"use strict";
/* =====================================================================
   Bloque 14 · SOSTENIBILIDAD POR TRATAMIENTO
   ---------------------------------------------------------------------
   Índice de la propuesta de tesis de Hernández González (2026, sección 6.8):
   marco MESMIS (Masera et al., 1999) con un índice numérico del tipo de
   Sarandón (2002), en cuatro pasos:
     1. Indicadores por dimensión (ambiental, económica, social y de manejo).
     2. Normalización 0–1: más es mejor  Iₙ = (x − x_mín)/(x_máx − x_mín);
                           menos es mejor Iₙ = (x_máx − x)/(x_máx − x_mín).
        Mín y máx: los observados entre tratamientos o, si los escribes, los de referencia.
     3. ID = Σ wᵢ Iₙᵢ / Σ wᵢ ;  ISG = (w_A IA + w_E IE + w_S IS) / (w_A + w_E + w_S).
     4. Sostenible si ISG ≥ 0.5 y ninguna dimensión < 0.5; radar AMIBA por tratamiento.
   Como en Ratio Milpa, Telar y Viña: escala 0–4 de Sarandón (ISG × 4; regla ISGen > 2
   y ninguna dimensión < 2) y huella de carbono por hectárea con los factores por
   defecto del IPCC (2006, 2019) y el GWP100 del AR6 (Forster et al., 2021).
   La relación de los indicadores con los ODS es una lectura de Ratio Vitis.
   ===================================================================== */
const IPCC = {diesel:2.68, EF1:0.010, gasf:0.11, EF4:0.010, leach:0.24, EF5:0.011, gwpN2O:273, ureaC:0.20};
function huellaCarbono(c){ const d=num(c.diesel), N=num(c.nkg), U=num(c.urea); if(d==null&&N==null&&U==null) return null;
  const comb=(d||0)*IPCC.diesel, n2o=(N||0)*(IPCC.EF1+IPCC.gasf*IPCC.EF4+IPCC.leach*IPCC.EF5)*44/28*IPCC.gwpN2O, urea=(U||0)*IPCC.ureaC*44/12;
  return {comb, n2o, urea, tot:comb+n2o+urea}; }
/* Carbono neto fijado por hectárea con los datos del Bloque 6 (t CO₂ ha⁻¹) */
function carbonoUnidad(uid){ const b=S.bio, fC=num(b.fC), den=densidad(); const msT=k=>{ const l=Object.values(((b.ms||{})[uid]||{})[k]||{}).map(num).filter(x=>x!=null); return l.length?l.reduce((a,x)=>a+x,0):null; };
  const c=CAMPO.carbono(msT('ini'), msT('fin'), fC), fij=c&&den?c.co2*den/1e6:null, rs=num(b.resp), dd=num(b.respDias), emit=rs!=null&&dd!=null?rs*dd*10000/1e6:null;
  return fij==null?null:{fij, emit, neto:fij-(emit||0)}; }
const IND_S = [
  {id:'mo', d:'A', n:E('Materia orgánica del suelo','Soil organic matter'), u:'%', s:1, o:'cap', ods:[15,2]},
  {id:'cneto', d:'A', n:E('Carbono fijado neto','Net fixed carbon'), u:'t CO₂ ha⁻¹', s:1, o:'bio', ods:[13]},
  {id:'wue', d:'A', n:E('Eficiencia en el uso del agua','Water use efficiency'), u:'kg m⁻³', s:1, o:'raspa', ods:[6]},
  {id:'nbal', d:'A', n:E('Balance de nitrógeno (exceso)','Nitrogen balance (excess)'), u:'kg N ha⁻¹', s:-1, o:'cap', ods:[6,14]},
  {id:'huella', d:'A', n:E('Huella de carbono','Carbon footprint'), u:'kg CO₂e ha⁻¹', s:-1, o:'ipcc', ods:[13]},
  {id:'rend', d:'E', n:E('Rendimiento por planta','Yield per vine'), u:'kg', s:1, o:'prod', ods:[2]},
  {id:'costo', d:'E', n:E('Costo del abono','Manure cost'), u:'$ ha⁻¹', s:-1, o:'cap', ods:[1]},
  {id:'bc', d:'E', n:E('Relación beneficio/costo','Benefit/cost ratio'), u:'', s:1, o:'bc', ods:[1,8]},
  {id:'resid', d:'S', n:E('Residuos locales aprovechados','Local residues recycled'), u:'kg ha⁻¹', s:1, o:'cap', ods:[12]},
  {id:'jornal', d:'S', n:E('Mano de obra requerida','Labour required'), u:'jornales ha⁻¹', s:-1, o:'cap', ods:[8]},
  {id:'adop', d:'S', n:E('Facilidad de adopción','Ease of adoption'), u:'0–4', s:1, o:'cap', ods:[4]}];
const DIM_S = {A:{n:E('Ambiental','Environmental'),c:'#2f7d4a'}, E:{n:E('Económica','Economic'),c:'#c27c0e'}, S:{n:E('Social y de manejo','Social and management'),c:'#7a4f9a'}};
const ODS_N = {1:E('Fin de la pobreza','No poverty'),2:E('Hambre cero','Zero hunger'),4:E('Educación de calidad','Quality education'),6:E('Agua limpia','Clean water'),8:E('Trabajo decente','Decent work'),12:E('Producción responsable','Responsible production'),13:E('Acción por el clima','Climate action'),14:E('Vida submarina','Life below water'),15:E('Vida de ecosistemas terrestres','Life on land')};
function sostenibilidadT(){ const st=S.sost||{}, U=unidades(), cap=st.u||{}, off=st.off||{}, ref=st.ref||{}, w=st.w||{}, wd=st.wd||{}, sent=st.sent||{};
  const r=RASPA.correr(), etc=!r.falta?r.tot.etc:null, den=densidad();
  const val=(i,u)=>{ const c=cap[u.id]||{}, P=(S.prod.datos||{})[u.id]||{};
    if(i.o==='cap') return num(c[i.id]);
    if(i.id==='cneto'){ const k=carbonoUnidad(u.id); return k?k.neto:null; }
    if(i.id==='wue'){ const rd=num(P.rend); return rd!=null&&den&&etc>0?rd*den/1000*1000/(etc*10):null; }
    if(i.id==='huella'){ const h=huellaCarbono(c); return h?h.tot:null; }
    if(i.id==='rend') return num(P.rend);
    if(i.id==='bc'){ const ing=num(c.ingreso), cos=num(c.costoTot); return ing!=null&&cos>0?ing/cos:null; } return null; };
  const inds=IND_S.filter(i=>!off[i.id]).map(i=>{ const sg=sent[i.id]!=null?+sent[i.id]:i.s, x=U.map(u=>val(i,u)), ob=x.filter(v=>v!=null);
    const rmin=num((ref[i.id]||{}).min), rmax=num((ref[i.id]||{}).max), conRef=rmin!=null&&rmax!=null&&rmax>rmin;
    const mn=conRef?rmin:ob.length?Math.min(...ob):null, mx=conRef?rmax:ob.length?Math.max(...ob):null;
    const In=x.map(v=>v==null||mn==null||!(mx>mn)?null:Math.max(0,Math.min(1,sg>0?(v-mn)/(mx-mn):(mx-v)/(mx-mn))));
    return {...i, sg, x, In, mn, mx, conRef, w:num(w[i.id])??1}; });
  const porU=U.map((u,k)=>{ const dim={}; Object.keys(DIM_S).forEach(d=>{ const l=inds.filter(i=>i.d===d&&i.In[k]!=null); const sw=l.reduce((s,i)=>s+i.w,0); dim[d]=l.length&&sw>0?l.reduce((s,i)=>s+i.w*i.In[k],0)/sw:null; });
    const ds=Object.keys(DIM_S).filter(d=>dim[d]!=null), swd=ds.reduce((s,d)=>s+(num(wd[d])??1),0);
    const ISG=ds.length===3&&swd>0?ds.reduce((s,d)=>s+(num(wd[d])??1)*dim[d],0)/swd:null;
    const ods={}; inds.forEach(i=>{ if(i.In[k]==null) return; i.ods.forEach(o=>(ods[o]=ods[o]||[]).push(i.In[k])); });
    return {u, col:EXP.color(u.id)!=='var(--muted)'?EXP.color(u.id):'#2f5d50', dim, ISG, sost:ISG!=null&&ISG>=0.5&&ds.every(d=>dim[d]>=0.5), ods:Object.fromEntries(Object.entries(ods).map(([o,l])=>[o,l.reduce((a,b)=>a+b,0)/l.length]))}; });
  return {inds, porU, U, etc}; }
/* Radar AMIBA: un polígono por tratamiento sobre los indicadores normalizados */
function amiba(ss){ const L=ss.inds, n=L.length; if(n<3) return `<p class="sindato">${T('Se necesitan al menos tres indicadores con valor.','At least three indicators with a value are needed.')}</p>`;
  const W=640, C=W/2, R=W/2-150, p=(k,v)=>{ const a=-Math.PI/2+2*Math.PI*k/n; return [C+R*v*Math.cos(a), C+R*v*Math.sin(a)]; };
  let s=`<svg class="chart" viewBox="0 0 ${W} ${W}" role="img" aria-label="AMIBA">`;
  [0.25,0.5,0.75,1].forEach(g=>{ s+=`<polygon points="${L.map((_,k)=>p(k,g).join(',')).join(' ')}" fill="none" stroke="var(--border)" ${g===0.5?'stroke-width="2" stroke-dasharray="5 4"':''}/>`; });
  L.forEach((i,k)=>{ const [x,y]=p(k,1), [tx_,ty]=p(k,1.13); s+=`<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" stroke="var(--border)"/><text x="${tx_}" y="${ty}" font-size="11.5" text-anchor="${Math.abs(tx_-C)<8?'middle':tx_>C?'start':'end'}" fill="${DIM_S[i.d].c}" font-weight="700">${esc(tx(i.n).length>24?tx(i.n).slice(0,23)+'…':tx(i.n))}</text>`; });
  ss.porU.forEach((q,k)=>{ const pts=L.map((i,j)=>p(j,i.In[k]??0)); s+=`<polygon points="${pts.map(x=>x.join(',')).join(' ')}" fill="${q.col}" fill-opacity=".12" stroke="${q.col}" stroke-width="2.5"/>`+pts.map((x,j)=>`<circle cx="${x[0]}" cy="${x[1]}" r="4" fill="${q.col}" data-tip="${esc(q.u.n+' · '+tx(L[j].n)+' · '+(L[j].In[k]!=null?fmt(L[j].In[k],2):T('sin dato','no data')))}"/>`).join(''); });
  return s+`<text x="${C+4}" y="${C-R*0.5-4}" font-size="10.5" class="m">0.5</text></svg>`; }
function renderSost(el){ const ss=sostenibilidadT(), st=S.sost||{}, cap=st.u||{}, off=st.off||{}, ref=st.ref||{}, w=st.w||{}, wd=st.wd||{}, U=ss.U;
  const inp=(ruta, v, ph)=>`<input data-sp="${ruta}" type="number" step="any" inputmode="decimal" value="${esc(v??'')}" placeholder="${esc(ph||'')}" style="width:100%;min-width:70px">`;
  const capt=[['mo',T('MO (%)','SOM (%)')],['nbal',T('Exceso de N (kg ha⁻¹)','N excess (kg ha⁻¹)')],['costo',T('Costo del abono ($ ha⁻¹)','Manure cost ($ ha⁻¹)')],['ingreso',T('Ingreso ($ ha⁻¹)','Income ($ ha⁻¹)')],['costoTot',T('Costo total ($ ha⁻¹)','Total cost ($ ha⁻¹)')],['resid',T('Residuos reciclados (kg ha⁻¹)','Residues recycled (kg ha⁻¹)')],['jornal',T('Jornales ha⁻¹','Labour days ha⁻¹')],['adop',T('Adopción (0–4)','Adoption (0–4)')],['diesel',T('Diésel (L ha⁻¹)','Diesel (L ha⁻¹)')],['nkg',T('N aplicado (kg ha⁻¹)','N applied (kg ha⁻¹)')],['urea',T('Urea (kg ha⁻¹)','Urea (kg ha⁻¹)')]];
  const algun=ss.porU.some(q=>q.ISG!=null);
  el.innerHTML=`${cabecera('sost',T('¿Qué tratamiento es más sostenible? Cada uno se califica en tres dimensiones —ambiental, económica y social— con indicadores medidos en tu experimento, llevados a una escala de 0 a 1 para poder sumarlos.','Which treatment is most sustainable? Each one is scored in three dimensions —environmental, economic and social— with indicators measured in your experiment, brought to a 0 to 1 scale so they can be added.'))}
  ${consejo(T('Llena la tabla de captura con lo que sabes de cada tratamiento. Lo que ya mediste en otros bloques (rendimiento, carbono, agua) se toma solo. Un tratamiento es sostenible si su índice general llega a 0.5 y ninguna dimensión se queda abajo.','Fill the entry table with what you know about each treatment. What you already measured in other blocks (yield, carbon, water) is taken automatically. A treatment is sustainable if its general index reaches 0.5 and no dimension falls below.'),
    T('MESMIS (Masera et al., 1999) + índice tipo Sarandón (2002), según la sección 6.8 de la propuesta de Hernández González (2026): normalización mín–máx (observada o de referencia), ID = Σwᵢ Iₙᵢ/Σwᵢ, ISG = Σ w_D ID / Σ w_D; sostenible si ISG ≥ 0.5 y toda ID ≥ 0.5. Equivalencia con Milpa, Telar y Viña: escala 0–4 = ISG × 4.','MESMIS (Masera et al., 1999) + Sarandón-type index (2002), following section 6.8 of Hernández González’s (2026) proposal: min–max normalisation (observed or reference), ID = Σwᵢ Iₙᵢ/Σwᵢ, ISG = Σ w_D ID / Σ w_D; sustainable if ISG ≥ 0.5 and every ID ≥ 0.5. Equivalence with Milpa, Telar and Viña: 0–4 scale = ISG × 4.'))}
  <div class="kpis">${ss.porU.map(q=>`<div class="kpi" style="border-top:4px solid ${q.col}"><div class="l">${esc(q.u.n)}</div><div class="v">${q.ISG!=null?fmt(q.ISG,2):'—'}</div><div class="s">${q.ISG!=null?`<span class="badge ${q.sost?'ok':'bad'}">${q.sost?T('Sostenible','Sustainable'):T('No sostenible aún','Not yet sustainable')}</span> · ${T('escala 0–4','0–4 scale')} ${fmt(4*q.ISG,2)}`:T('faltan dimensiones','dimensions missing')}</div></div>`).join('')}</div>
  <div class="grid g2"><div class="card"><h3>${T('Radar AMIBA por tratamiento','AMIBA radar by treatment')}</h3>${amiba(ss)}
     <div class="legend-cat">${ss.porU.map(q=>`<span><i style="background:${q.col}"></i>${esc(q.u.n)}</span>`).join('')}</div><p class="nota">${T('Cada eje es un indicador normalizado (0 en el centro, 1 en el borde); la línea punteada es 0.5.','Each axis is a normalised indicator (0 at the centre, 1 at the edge); the dashed line is 0.5.')}</p></div>
   <div class="card"><h3>${T('Índices por dimensión','Indices by dimension')}</h3>
     ${tablaU([T('Unidad','Unit'),...Object.values(DIM_S).map(d=>`<span style="color:${d.c}">${esc(tx(d.n))}</span>`),'ISG'], ss.porU.map(q=>`<tr><td><b style="color:${q.col}">${esc(q.u.n)}</b></td>${Object.keys(DIM_S).map(d=>`<td class="r" style="${q.dim[d]!=null&&q.dim[d]<0.5?'color:var(--bad-text);font-weight:700':''}">${q.dim[d]!=null?fmt(q.dim[d],2):'—'}</td>`).join('')}<td class="r"><b>${q.ISG!=null?fmt(q.ISG,2):'—'}</b></td></tr>`))}
     ${algun?barrasH(ss.porU.filter(q=>q.ISG!=null).map(q=>({l:q.u.n, v:q.ISG, c:q.col, vl:fmt(q.ISG,2)})),{max:1,izq:150,w:520,fila:28}):''}
     <p class="nota">${T('En rojo, las dimensiones bajo 0.5: son las que impiden que el tratamiento sea sostenible.','In red, dimensions below 0.5: they keep the treatment from being sustainable.')}</p></div></div>
  <div class="card"><h2>${T('14.1 Captura por tratamiento','14.1 Entry by treatment')}</h2>
    ${tablaU([T('Dato','Datum'),...U.map(u=>esc(u.n))], capt.map(([k,n])=>`<tr><td>${n}</td>${U.map(u=>`<td>${inp(`sost.u.${u.id}.${k}`, (cap[u.id]||{})[k])}</td>`).join('')}</tr>`))}
    <p class="nota">${T('El rendimiento, el carbono neto (Bloque 6) y la eficiencia en el uso del agua (Bloques 4 y 7) se calculan solos. El costo total sirve para la relación beneficio/costo; diésel, N y urea, para la huella de carbono.','Yield, net carbon (Block 6) and water use efficiency (Blocks 4 and 7) are computed automatically. Total cost feeds the benefit/cost ratio; diesel, N and urea, the carbon footprint.')}</p></div>
  <div class="card"><h2>${T('14.2 Indicadores, sentido, referencias y pesos','14.2 Indicators, direction, references and weights')}</h2>
    ${tablaU([T('Incluir','Include'),T('Indicador','Indicator'),T('Sentido','Direction'),...U.map(u=>esc(u.n)),T('Mín ref.','Ref. min'),T('Máx ref.','Ref. max'),T('Peso','Weight')], IND_S.map(i=>{ const q=ss.inds.find(x=>x.id===i.id), sg=q?q.sg:i.s;
      return `<tr style="${off[i.id]?'opacity:.45':''}"><td><input type="checkbox" data-soff="${i.id}" ${off[i.id]?'':'checked'}></td><td><span class="punto" style="background:${DIM_S[i.d].c}"></span>${esc(tx(i.n))}<br><small class="muted">${esc(i.u)}</small></td>
        <td><button class="btn sm ghost" data-ssent="${i.id}" title="${T('Cambiar sentido','Change direction')}">${sg>0?T('▲ más es mejor','▲ more is better'):T('▼ menos es mejor','▼ less is better')}</button></td>
        ${U.map((u,k)=>`<td class="r">${q&&q.x[k]!=null?fmt(q.x[k],2)+'<br><small class="muted">Iₙ '+(q.In[k]!=null?fmt(q.In[k],2):'—')+'</small>':'—'}</td>`).join('')}
        <td>${inp(`sost.ref.${i.id}.min`, (ref[i.id]||{}).min, q&&q.mn!=null&&!q.conRef?fmt(q.mn,2):'')}</td><td>${inp(`sost.ref.${i.id}.max`, (ref[i.id]||{}).max, q&&q.mx!=null&&!q.conRef?fmt(q.mx,2):'')}</td><td>${inp(`sost.w.${i.id}`, w[i.id], '1')}</td></tr>`; }))}
    <div class="row" style="gap:12px;flex-wrap:wrap;margin-top:8px">${Object.entries(DIM_S).map(([d,x])=>`<label class="f" style="max-width:180px"><span>${T('Peso','Weight')} · ${esc(tx(x.n))}</span>${inp(`sost.wd.${d}`, wd[d], '1')}</label>`).join('')}</div>
    <p class="nota">${T('Sin referencias, el mínimo y el máximo son los observados entre tratamientos (en gris); con referencias de la literatura puedes comparar con otros sistemas, que es lo preferible. Con un solo tratamiento hacen falta referencias.','Without references, min and max are those observed among treatments (in grey); with literature references you can compare with other systems, which is preferable. With a single treatment, references are needed.')}</p></div>
  <div class="card"><h3>${T('Huella y balance de carbono','Carbon footprint and balance')}${ayuda('huella')}</h3>
     ${tablaU([T('Unidad','Unit'),T('Combustible','Fuel'),'N₂O','Urea',T('Huella (t CO₂e ha⁻¹)','Footprint (t CO₂e ha⁻¹)'),T('Fijado neto (t CO₂ ha⁻¹)','Net fixed (t CO₂ ha⁻¹)'),T('Balance','Balance')], U.map(u=>{ const h=huellaCarbono(cap[u.id]||{}), k=carbonoUnidad(u.id), bal=h&&k?k.neto-h.tot/1000:null;
       return `<tr><td><b>${esc(u.n)}</b></td><td class="r">${h?fmt(h.comb,0):'—'}</td><td class="r">${h?fmt(h.n2o,0):'—'}</td><td class="r">${h?fmt(h.urea,0):'—'}</td><td class="r"><b>${h?fmt(h.tot/1000,2):'—'}</b></td><td class="r">${k?fmt(k.neto,2):'—'}</td><td class="r">${bal!=null?`<b style="color:var(--${bal>=0?'ok':'bad'}-text)">${bal>=0?'+':''}${fmt(bal,2)}</b>`:'—'}</td></tr>`; }))}
     <p class="nota">${T('Balance = carbono fijado neto en la biomasa − huella. Positivo: el tratamiento fija más de lo que emite su manejo.','Balance = net carbon fixed in biomass − footprint. Positive: the treatment fixes more than its management emits.')}</p>
     <div class="formula sci">N₂O = N × (EF₁ + Frac<sub>GASF</sub>·EF₄ + Frac<sub>LEACH</sub>·EF₅) × 44/28 = N × (0.010 + 0.11·0.010 + 0.24·0.011) × 44/28 ; CO₂e = N₂O × 273 ; ${T('urea','urea')}: 0.20 × 44/12 ; ${T('diésel','diesel')}: 2.68 kg CO₂ L⁻¹</div>
     ${fuente('IPCC (2006, 2019), factores por defecto; GWP100 del AR6 (Forster et al., 2021). Fórmulas de Ratio Milpa, Telar y Viña.')}</div>
   <div class="card"><h3>${T('Indicadores y Objetivos de Desarrollo Sostenible','Indicators and Sustainable Development Goals')}</h3>
     ${tablaU(['ODS',...U.map(u=>esc(u.n))], Object.keys(ODS_N).filter(o=>ss.porU.some(q=>q.ods[o]!=null)).map(o=>`<tr><td><b>${o}</b> · ${esc(tx(ODS_N[o]))}</td>${ss.porU.map(q=>`<td class="r">${q.ods[o]!=null?fmt(100*q.ods[o],0)+' %':'—'}</td>`).join('')}</tr>`))}
     <p class="nota">${T('Cumplimiento = media de los indicadores normalizados ligados a cada ODS.','Compliance = mean of the normalised indicators linked to each SDG.')} ${marcaInterp(T('La relación indicador–ODS es una propuesta de Ratio Vitis, como la de Ratio Viña.','The indicator–SDG link is a Ratio Vitis proposal, as in Ratio Viña.'))}</p></div>
  ${siguiente('sost')}`;
  $$('[data-soff]',el).forEach(c=>c.onchange=()=>{ S.sost=S.sost||{}; S.sost.off=S.sost.off||{}; if(c.checked) delete S.sost.off[c.dataset.soff]; else S.sost.off[c.dataset.soff]=true; guardar(); render(); });
  $$('[data-ssent]',el).forEach(b=>b.onclick=()=>{ const i=IND_S.find(x=>x.id===b.dataset.ssent), q=ss.inds.find(x=>x.id===i.id); S.sost=S.sost||{}; S.sost.sent=S.sost.sent||{}; S.sost.sent[i.id]=-(q?q.sg:i.s); guardar(); render(); });
  enlazarTips(el); }
/* Para la capacidad adaptativa del Bloque 13: dimensiones económica y social (0–1) */
function sarandonCA(){ const ss=sostenibilidadT(), l=[]; ['E','S'].forEach(d=>{ const v=ss.porU.map(q=>q.dim[d]).filter(x=>x!=null); if(v.length) l.push({n:d==='E'?E('Dimensión económica','Economic dimension'):E('Dimensión social y de manejo','Social and management dimension'), v:v.reduce((a,b)=>a+b,0)/v.length}); }); return l; }
