"use strict";
/* =====================================================================
   Bloque 16 · INFORME
   Un documento imprimible con lo que ya calcularon los bloques: resumen
   redactado solo con datos capturados, hoja de acciones del productor,
   tablero, agua y fenología, sostenibilidad y prospectiva, cita con QR y
   referencias. Exporta CSV y un JSON reproducible (entradas, parámetros y
   resultados). No calcula nada nuevo: reúne y cita.
   ===================================================================== */
/* Toma los paneles del Tablero ya construidos (sin cabecera ni navegación) */
function panelesTablero(){ const d=document.createElement('div'); renderTablero(d); const k=d.querySelector('.kpis'), t=d.querySelector('.tablero');
  if(t) t.querySelectorAll('button[data-ir]').forEach(b=>b.closest('p')?b.closest('p').remove():b.remove());
  return (k?k.outerHTML:'')+(t?t.outerHTML:''); }
function resumenVitis(){ const r=RASPA.correr(), ok=!r.falta, U=unidades(), ss=sostenibilidadT(), rg=regeneracion(), rs=riesgos({rg}), L=[];
  const v=S.vina, l=typeof locSel==='function'?locSel():null;
  L.push(T(`Viñedo de ${v.tipo?tx(TIPOS_UVA.find(t=>t.id===v.tipo).n).toLowerCase():'uva'}${v.variedad?' «'+v.variedad+'»':''}${l?' en '+l[1]:''}${densidad()?`, con ${fmt(densidad(),0)} plantas por hectárea`:''}${U.length>1?` y ${U.length} tratamientos en comparación`:''}.`,
    `${v.tipo?tx(TIPOS_UVA.find(t=>t.id===v.tipo).n):'Grape'} vineyard${v.variedad?' “'+v.variedad+'”':''}${l?' in '+l[1]:''}${densidad()?`, with ${fmt(densidad(),0)} vines per hectare`:''}${U.length>1?` and ${U.length} treatments compared`:''}.`));
  if(ok) L.push(T(`En ${r.dias} días desde la brotación la atmósfera pidió ${fmt(r.tot.et0,0)} mm (ET₀) y el viñedo usó ${fmt(r.tot.etc,0)} mm; ${fmt(100*(1-(r.fracE||0)),0)} % pasó por la vid. Hubo ${r.diasEstres} días con estrés hídrico (Ks < 1).`,
    `In ${r.dias} days from budburst the atmosphere demanded ${fmt(r.tot.et0,0)} mm (ET₀) and the vineyard used ${fmt(r.tot.etc,0)} mm; ${fmt(100*(1-(r.fracE||0)),0)} % went through the vine. There were ${r.diasEstres} water-stress days (Ks < 1).`));
  const sos=ss.porU.filter(q=>q.ISG!=null); if(sos.length){ const b=[...sos].sort((a,c)=>c.ISG-a.ISG)[0], n=sos.filter(q=>q.sost).length;
    L.push(T(`${n} de ${sos.length} tratamientos son sostenibles (ISG ≥ 0.5 sin dimensiones debajo); el ISG más alto es el de ${b.u.n} (${fmt(b.ISG,2)}).`,`${n} of ${sos.length} treatments are sustainable (ISG ≥ 0.5 with no dimension below); the highest ISG is ${b.u.n}’s (${fmt(b.ISG,2)}).`)); }
  if(rg.IR!=null) L.push(T(`Índice de procesos regenerativos: ${fmt(100*rg.IR,0)} (${tx(rg.clase.n).toLowerCase()}).`,`Regenerative process index: ${fmt(100*rg.IR,0)} (${tx(rg.clase.n).toLowerCase()}).`));
  if(rs.idx!=null) L.push(T(`Índice de riesgo: ${fmt(100*rs.idx,0)} con ${rs.act.length} riesgos evaluados.`,`Risk index: ${fmt(100*rs.idx,0)} with ${rs.act.length} risks assessed.`));
  return L.join(' '); }
/* Hoja de acciones: cada renglón sale de un resultado ya calculado y dice de qué bloque viene */
function accionesVitis(){ const r=RASPA.correr(), A=[], sal=SUELO.salinidad(num(S.suelo.ce)), rs=riesgos(), ss=sostenibilidadT();
  if(!r.falta){ const lam=RASPA.laminaNeta(r.ultimo); if(r.diasEstres>0) A.push(['raspa',T(`Hubo ${r.diasEstres} días con estrés hídrico. Hoy faltan ${fmt(lam,0)} mm para regresar el suelo a capacidad de campo.`,`There were ${r.diasEstres} water-stress days. Today ${fmt(lam,0)} mm are needed to bring the soil back to field capacity.`)]);
    if(r.tot.DP>0.2*(r.tot.I+r.tot.P)&&r.tot.I>0) A.push(['raspa',T(`${fmt(r.tot.DP,0)} mm se fueron debajo de la raíz: revisa la lámina y la frecuencia de riego.`,`${fmt(r.tot.DP,0)} mm went below the root zone: review irrigation depth and frequency.`)]); }
  if(sal&&sal.yr<100) A.push(['suelo',T(`La salinidad (CE ${fmt(num(S.suelo.ce),1)} dS m⁻¹) resta ${fmt(100-sal.yr,0)} % del rendimiento posible (FAO-56).`,`Salinity (EC ${fmt(num(S.suelo.ce),1)} dS m⁻¹) removes ${fmt(100-sal.yr,0)} % of attainable yield (FAO-56).`)]);
  rs.top.filter(x=>x.r>=10).slice(0,3).forEach(x=>A.push(['riesgos',T(`Riesgo ${tx(x.nivel.n).toLowerCase()}: ${tx(x.n)}.`,`${tx(x.nivel.n)} risk: ${tx(x.n)}.`)]));
  ss.porU.forEach(q=>{ const bajas=Object.keys(DIM_S).filter(d=>q.dim[d]!=null&&q.dim[d]<0.5); if(bajas.length&&q.ISG!=null) A.push(['sost',T(`${q.u.n}: mejorar la dimensión ${bajas.map(d=>tx(DIM_S[d].n).toLowerCase()).join(' y ')}.`,`${q.u.n}: improve the ${bajas.map(d=>tx(DIM_S[d].n).toLowerCase()).join(' and ')} dimension.`)]); });
  return A; }
function csvTratamientos(){ const U=unidades(), ss=sostenibilidadT(), den=densidad(), sim=simularVitis(), g=(o,u,k)=>num(((o||{})[u.id]||{})[k]);
  return csv([['unidad','rend_kg_planta','rend_t_ha','brix','acidez','poda_kg','ravaz','area_foliar_m2','N_foliar','MO','ID_ambiental','ID_economica','ID_social','ISG','sostenible','ISG_no_deseado_5','TrTpot_no_deseado_5']].concat(U.map((u,k)=>{ const q=ss.porU[k], rd=g(S.prod.datos,u,'rend'), pd=g(S.bio.datos,u,'poda'), z=sim.res?sim.res.nod[5][k]:null;
    return [u.n, rd, rd!=null&&den?rd*den/1000:'', g(S.prod.datos,u,'brix'), g(S.prod.datos,u,'acidez'), pd, rd!=null&&pd>0?rd/pd:'', g(S.bio.datos,u,'af'), g(S.fert.foliar,u,'N'), g((S.sost||{}).u,u,'mo'), q.dim.A, q.dim.E, q.dim.S, q.ISG, q.ISG==null?'':q.sost?'si':'no', z?z.ISG:'', z?z.relT:''].map(x=>x==null?'':typeof x==='number'?+x.toFixed(4):x); }))); }
function csvBalance(){ const r=RASPA.correr(); if(r.falta) return null; const ks=Object.keys(r.b[0]).filter(k=>k==='f'||typeof r.b[0][k]==='number');
  return csv([ks].concat(r.b.map(d=>ks.map(k=>typeof d[k]==='number'?+d[k].toFixed(4):d[k])))); }
function csvProsp(){ const sim=simularVitis(); if(sim.falta) return null; const f=[['escenario','anio','unidad','MO','ADT_mm','TrTpot','dias_estres','freno_mm','riego_mm','rend_kg_planta','EUA_kg_m3','BC','ISG','sostenible']];
  ESC_V.forEach(e=>HOR_V.forEach(t=>sim.res[e.id][t].forEach((z,k)=>f.push([e.id,t,sim.trat[k].u.n,z.mo,z.taw,z.relT,z.dEst,z.freno,z.I,z.Y,z.wue,z.bc,z.ISG,z.ISG==null?'':z.sost?'si':'no'].map(x=>x==null?'':typeof x==='number'?+x.toFixed(4):x)))));
  return csv(f); }
function jsonReproducible(){ const r=RASPA.correr(), ss=sostenibilidadT(), sim=simularVitis();
  return JSON.stringify({app:CONFIG.app, version:CONFIG.version, generado:new Date().toISOString(), cita:citaAPA().replace(/<[^>]+>/g,''),
    entradas:S, parametros:{fao56:r.falta?null:r.par, ipcc:IPCC, prospectiva:sim.P, sostenibilidad:{indicadores:ss.inds.map(i=>({id:i.id, dim:i.d, sentido:i.sg, peso:i.w, min:i.mn, max:i.mx, referencia:i.conRef}))}},
    resultados:{balance:r.falta?{falta:r.falta.map(x=>tx(x[1]))}:{dias:r.dias, totales:r.tot, diasEstres:r.diasEstres, ksMin:r.ksMin},
      sostenibilidad:ss.porU.map(q=>({unidad:q.u.n, dim:q.dim, ISG:q.ISG, sostenible:q.sost})),
      prospectiva:sim.falta?null:Object.fromEntries(ESC_V.map(e=>[e.id, Object.fromEntries(HOR_V.map(t=>[t, sim.res[e.id][t].map((z,k)=>({unidad:sim.trat[k].u.n, MO:z.mo, ADT:z.taw, TrTpot:z.relT, diasEstres:z.dEst, ISG:z.ISG}))]))])), hipotesis:sim.falta?null:sim.hip.map(h=>({escenario:h.e.id, rho:h.rho}))},
    referencias:REFS}, null, 1); }
function renderInforme(el){ const r=RASPA.correr(), ok=!r.falta, rz=resiliencia(), fe=fenologia(), ss=sostenibilidadT(), sim=simularVitis(), acc=accionesVitis(), v=S.vina, l=typeof locSel==='function'?locSel():null, st=sitio(), sh=sueloHidrico();
  const fila=(a,b)=>`<tr><td>${a}</td><td><b>${b}</b></td></tr>`, sd=`<span class="sindato">${T('sin dato','no data')}</span>`, f=(x,d,u)=>x!=null&&isFinite(x)?fmt(x,d)+(u?' '+u:''):sd;
  const falta=BLOQUES_LLENAR.map(id=>({id, a:avance(id)})).filter(x=>x.a&&x.a.estado!=='ok');
  el.innerHTML=`${cabecera('informe',T('Todo tu viñedo en un documento: resumen, acciones, resultados de cada bloque, sostenibilidad y prospectiva. Imprímelo o guárdalo en PDF, descarga las tablas o guarda el proyecto.','Your whole vineyard in one document: summary, actions, results of each block, sustainability and outlook. Print or save it as PDF, download the tables or save the project.'))}
  <div class="card no-print"><div class="row" style="gap:8px;flex-wrap:wrap">
    <button class="btn" id="iImp">⎙ ${T('Imprimir o guardar PDF','Print or save PDF')}</button>
    <button class="btn ghost" id="iTrat">${T('CSV por tratamiento','CSV by treatment')}</button><button class="btn ghost" id="iBal" ${ok?'':'disabled'}>${T('CSV del balance diario','Daily balance CSV')}</button><button class="btn ghost" id="iPro" ${sim.falta?'disabled':''}>${T('CSV de la prospectiva','Outlook CSV')}</button>
    <button class="btn ghost sci" id="iJson">{ } ${T('JSON reproducible','Reproducible JSON')}</button>
    <button class="btn ghost" onclick="guardarProyecto()">⤓ ${T('Guardar proyecto','Save project')}</button><label class="btn ghost"><input type="file" accept=".json" style="display:none" onchange="abrirProyecto(this.files[0])">⤒ ${T('Abrir proyecto','Open project')}</label></div>
   <p class="nota">${T('La impresión sigue la vista activa: Productor (resumen y acciones) o Científico (con modelos, parámetros y referencias). El JSON reproducible guarda entradas, parámetros y resultados para rehacer cada cálculo.','Printing follows the active view: Producer (summary and actions) or Scientist (with models, parameters and references). The reproducible JSON stores inputs, parameters and results to redo every calculation.')}</p></div>
  <div class="card inf-portada"><div><div><div class="eyebrow">${T('Informe de Ratio Vitis','Ratio Vitis report')} · ${esc(S.proyecto.fecha||'')}</div>
     <h2 style="margin:4px 0">${esc(S.proyecto.nombre||T('Viñedo sin nombre','Unnamed vineyard'))}</h2><p class="muted" style="margin:0">${esc(S.proyecto.responsable||'')}</p></div>
</div>
   <p style="font-size:17px;line-height:1.6">${esc(resumenVitis())}</p>
   <div class="grid g2"><table class="tbl"><tbody>
     ${fila(T('Uva','Grape'), [v.tipo?tx(TIPOS_UVA.find(t=>t.id===v.tipo).n):'', v.variedad, v.portainjerto?T('portainjerto ','rootstock ')+v.portainjerto:''].filter(Boolean).map(esc).join(' · ')||sd)}
     ${fila(T('Marco de plantación','Planting layout'), num(v.entre)&&num(v.sobre)?`${fmt(num(v.entre),2)} × ${fmt(num(v.sobre),2)} m · ${fmt(densidad(),0)} ${T('plantas ha⁻¹','vines ha⁻¹')}`:sd)}
     ${fila(T('Sitio','Site'), [l?esc(l[1]):'', st.lat!=null?fmt(st.lat,3)+'°':'', st.z!=null?fmt(st.z,0)+' m':''].filter(Boolean).join(' · ')||sd)}
     ${fila(T('Diseño','Design'), unidades().length>1?`${unidades().length} ${T('tratamientos','treatments')}${num(S.exp.bloques)?' · '+S.exp.bloques+' '+T('bloques','blocks'):''}`:sd)}</tbody></table>
    <table class="tbl"><tbody>
     ${fila(T('Suelo','Soil'), sh.tex?esc(tx(SUELO.CLASES[sh.tex]||E(sh.tex,sh.tex))):sd)}
     ${fila(T('Agua disponible total','Total available water'), f(sh.adt,0,'mm'))}
     ${fila(T('Clima','Climate'), S.clima.dias.length?`${S.clima.dias.length} ${T('días','days')} · ${esc(S.clima.dias[0].f)} → ${esc(S.clima.dias[S.clima.dias.length-1].f)}`:sd)}
     ${fila(T('Brotación','Budburst'), S.raspa.brot?esc(S.raspa.brot):sd)}</tbody></table></div></div>
  <div class="card prod"><h3>${T('Hoja de acciones','Action sheet')}</h3>${acc.length?`<ol class="acciones">${acc.map(([b,t])=>`<li>${esc(t)} <small class="muted">· ${esc(tx(B(b).corto))}</small></li>`).join('')}</ol>`:`<p class="sindato">${T('Aún no hay resultados que pidan una acción.','No results call for action yet.')}</p>`}
   ${falta.length?`<p class="nota">${T('Para completar el informe falta capturar en','To complete the report, still to enter in')}: ${falta.map(x=>`<a href="#${x.id}" data-ir="${x.id}">${B(x.id).n}. ${esc(tx(B(x.id).corto))}</a> (${x.a.h}/${x.a.t})`).join(' · ')}</p>`:''}</div>
  <h2 class="inf-sec">1 · ${T('Tablero del viñedo','Vineyard dashboard')}</h2>${panelesTablero()}
  <h2 class="inf-sec">2 · ${T('Agua y fenología','Water and phenology')}</h2>
  <div class="grid g2"><div class="card"><h3>${T('Coeficiente de estrés diario (Ks)','Daily stress coefficient (Ks)')}</h3>${rz?lineaKs(rz)+`<p class="nota">${T('Sombreado: episodios con Ks < 1. Autonomía hoy','Shaded: episodes with Ks < 1. Autonomy today')}: ${rz.autonomia!=null?fmt(rz.autonomia,1)+' '+T('días','days'):'—'}.</p>`:`<p class="sindato">${T('Sin balance del Bloque 4.','No Block 4 balance.')}</p>`}</div>
   <div class="card"><h3>${T('Fenología observada','Observed phenology')}</h3>${fe.some(x=>x.fases.some(z=>z.dias!=null))?`<div class="legend-cat"><span><i style="background:#2f5d50"></i>${T('Brotación','Budburst')}</span>${FASES.map(x=>`<span><i style="background:${x.c}"></i>${esc(tx(x.n))}</span>`).join('')}</div>${lineaFeno(fe)}`:`<p class="sindato">${T('Sin fechas fenológicas (Bloque 4, sección 4.5).','No phenological dates (Block 4, section 4.5).')}</p>`}</div></div>
  <h2 class="inf-sec">3 · ${T('Sostenibilidad por tratamiento','Sustainability by treatment')}</h2>
  <div class="grid g2"><div class="card"><h3>${T('Índices por dimensión','Indices by dimension')}</h3>
     ${tablaU([T('Unidad','Unit'),...Object.values(DIM_S).map(d=>`<span style="color:${d.c}">${esc(tx(d.n))}</span>`),'ISG',''], ss.porU.map(q=>`<tr><td><b style="color:${q.col}">${esc(q.u.n)}</b></td>${Object.keys(DIM_S).map(d=>`<td class="r">${q.dim[d]!=null?fmt(q.dim[d],2):'—'}</td>`).join('')}<td class="r"><b>${q.ISG!=null?fmt(q.ISG,2):'—'}</b></td><td>${q.ISG!=null?`<span class="badge ${q.sost?'ok':'bad'}">${q.sost?T('Sostenible','Sustainable'):T('Aún no','Not yet')}</span>`:''}</td></tr>`))}
     <p class="nota">${T('MESMIS + índice tipo Sarandón, sección 6.8 de Hernández González (2026).','MESMIS + Sarandón-type index, section 6.8 of Hernández González (2026).')}</p></div>
   <div class="card"><h3>${T('Radar AMIBA','AMIBA radar')}</h3>${amiba(ss)}<div class="legend-cat">${ss.porU.map(q=>`<span><i style="background:${q.col}"></i>${esc(q.u.n)}</span>`).join('')}</div></div></div>
  <h2 class="inf-sec">4 · ${T('Prospectiva a 1, 2 y 5 años','Outlook at 1, 2 and 5 years')}</h2>
  ${sim.falta?`<div class="card"><p class="sindato">${T('Necesita el balance del Bloque 4.','Needs the Block 4 balance.')}</p></div>`:`<div class="card"><h3>${T('ISG recalculado por escenario','ISG recalculated by scenario')}</h3>${tablaISGv(sim)}
   <div class="prosp-grid inf">${ESC_V.map(e=>`<div class="pg"><b style="color:${e.col}">${esc(tx(e.n))}</b> · <small class="muted">${T('transpiración relativa','relative transpiration')}</small>${graficaV(sim,e,'relT')}</div>`).join('')}</div>
   <div class="legend-cat">${sim.trat.map(q=>`<span><i style="background:${q.col}"></i>${esc(q.u.n)}</span>`).join('')}</div>
   <p><b>${T('Hipótesis de sistema','System hypothesis')}:</b> ${sim.hip.map(h=>`${esc(tx(h.e.n))} ρ = ${h.rho!=null?fmt(h.rho,2):'—'}`).join(' · ')}. <span class="nota">${T('ρ de Spearman entre MO y Tr/Tpot a 5 años; ρ > 0 la apoya.','Spearman ρ between SOM and Tr/Tpot at 5 years; ρ > 0 supports it.')}</span></p>
   <p class="nota">${T('Escenarios exploratorios con supuestos explícitos (Bloque 15); no son pronósticos.','Exploratory scenarios with explicit assumptions (Block 15); not forecasts.')}${sim.kySug?' '+T('Rendimiento con K<sub>y</sub> = 0.85 de la uva (FAO-56, Cuadro 24).','Yield with grape K<sub>y</sub> = 0.85 (FAO-56, Table 24).'):''}</p></div>`}
  <div class="card sci"><h3>${T('Parámetros del modelo','Model parameters')}</h3>
   ${ok?`<p class="formula">θ<sub>CC</sub> = ${fmt(r.par.cc,3)} · θ<sub>PMP</sub> = ${fmt(r.par.pmp,3)} · Z<sub>r</sub> = ${fmt(r.par.zr,2)} m · Z<sub>e</sub> = ${fmt(r.par.ze,2)} m · REW = ${fmt(r.par.rew,1)} mm · p = ${fmt(r.par.p,2)} · K<sub>cb</sub> ${fmt(r.par.etapas.kini,2)} / ${fmt(r.par.etapas.kmed,2)} / ${fmt(r.par.etapas.kfin,2)} · L ${r.par.etapas.Li}/${r.par.etapas.Ld}/${r.par.etapas.Lm}/${r.par.etapas.Lf} ${T('días','days')} · f<sub>w</sub> = ${fmt(r.par.fw,2)}</p>`:`<p class="sindato">${T('Sin balance.','No balance.')}</p>`}
   <p class="nota">${T('Totales de la temporada','Season totals')}: ${ok?`ET₀ ${fmt(r.tot.et0,0)} · ETc ${fmt(r.tot.etc,0)} · T ${fmt(r.tot.T,0)} · E ${fmt(r.tot.E,0)} · P ${fmt(r.tot.P,0)} · I ${fmt(r.tot.I,0)} · DP ${fmt(r.tot.DP,0)} mm`:'—'}. ${T('Todas las ecuaciones y sus fuentes están en la vista científica de cada bloque y en la página de Validación.','All equations and their sources are in each block’s scientist view and on the Validation page.')}</p></div>
  <div class="card cita-card"><h3>${T('Cómo citar','How to cite')}</h3><p class="cita-apa">${citaAPA()}</p>
   <div class="qr-app"><span class="qr-img">${CONFIG.qr}</span><span><b>${CONFIG.url.replace(/^https:\/\//,'').replace(/\/$/,'')}</b><br>${T('Escanea el código para abrir la aplicación.','Scan the code to open the app.')}</span></div>
   <p class="nota">${T('Caso de estudio','Case study')}: Hernández González, J. (2026). ${T('Propuesta de tesis de maestría','Master’s thesis proposal')}. Universidad Autónoma Chapingo.</p></div>
  <div class="card sci"><h3>${T('Referencias','References')}</h3><ol class="refs">${REFS.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
  ${siguiente('informe')}`;
  $('#iImp',el).onclick=()=>print();
  $('#iTrat',el).onclick=()=>descargar(slug()+'_tratamientos.csv', csvTratamientos(), 'text/csv');
  if(ok) $('#iBal',el).onclick=()=>descargar(slug()+'_balance_diario.csv', csvBalance(), 'text/csv');
  if(!sim.falta) $('#iPro',el).onclick=()=>descargar(slug()+'_prospectiva.csv', csvProsp(), 'text/csv');
  $('#iJson',el).onclick=()=>descargar(slug()+'_reproducible.json', jsonReproducible(), 'application/json');
  enlazarTips(el); }
