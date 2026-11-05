"use strict";
/* =====================================================================
   6. BLOQUES · base, Inicio, 1 Viñedo y experimento, 2 Suelo
   ===================================================================== */
/* Referencia del software en formato APA (7.ª ed.): Autores (año). Título (Versión) [Software]. Editorial. DOI */
const citaAPA = ()=> `${esc(tx(CONFIG.citaAutores))} (${CONFIG.anio}). <i>${CONFIG.app}: ${esc(tx(CONFIG.titulo))}</i> (${T('Versión','Version')} ${CONFIG.version}) [Software]. ${CONFIG.doi?`Zenodo. https://doi.org/${CONFIG.doi}`:esc(CONFIG.repo||'')}`;
document.addEventListener('click',ev=>{ if(ev.target.closest('[data-ver-cita]')){ const c=document.querySelector('.cita-card'); if(c) c.scrollIntoView({behavior:'smooth',block:'center'}); return; } if(!ev.target.closest('[data-copiar-cita]')) return; const t=document.getElementById('citaTxt'); try{ navigator.clipboard.writeText(t.innerText); toast(T('Referencia copiada','Reference copied')); }catch(e){} });
const BLOQUES = [
  {id:'inicio', n:'⌂', ill:null,       corto:E('Inicio','Home'), titulo:E('Inicio','Home'), render:()=>renderInicio},
  {id:'vina',   n:'1', ill:'c-uva',    corto:E('Viñedo y experimento','Vineyard and trial'), titulo:E('Viñedo, sitio y diseño experimental','Vineyard, site and experimental design'), render:()=>renderVina},
  {id:'suelo',  n:'2', ill:'i-tierra', corto:E('Suelo','Soil'), titulo:E('Suelo: textura, densidad, agua disponible y química básica','Soil: texture, density, available water and basic chemistry'), render:()=>renderSuelo},
  {id:'clima',  n:'3', ill:'i-tierra', corto:E('Clima','Climate'), titulo:E('Clima: registros diarios, ET0 e índices vitícolas','Climate: daily records, ET0 and viticultural indices'), render:()=>renderClima},
  {id:'raspa',  n:'4', ill:'i-regen',  corto:E('RASPA','SPAC'), titulo:E('Relación agua–suelo–planta–atmósfera','Soil–plant–atmosphere water relations'), render:()=>renderRaspa},
  {id:'fert',   n:'5', ill:'i-tierra', corto:E('Fertilidad','Fertility'), titulo:E('Fertilidad y abonos','Fertility and manures'), render:()=>renderFert},
  {id:'bio',    n:'6', ill:'i-regen',  corto:E('Biomasa','Biomass'), titulo:E('Biomasa, dosel y carbono','Biomass, canopy and carbon'), render:()=>renderBio},
  {id:'prod',   n:'7', ill:'c-uva',    corto:E('Productividad','Productivity'), titulo:E('Productividad, calidad y equilibrio','Productivity, quality and balance'), render:()=>renderProd},
  {id:'energia',n:'8', ill:'i-tierra', corto:E('Energía','Energy'), titulo:E('Energía: cómo reparte el viñedo la radiación','Energy: how the vineyard splits radiation'), render:()=>renderEnergia},
  {id:'est',    n:'9', ill:'i-check',  corto:E('Estadística','Statistics'), titulo:E('Estadística descriptiva e inferencial','Descriptive and inferential statistics'), render:()=>renderEst},
  {id:'sca',    n:'10', ill:'i-regen', corto:E('Sistema complejo','Complex system'), titulo:E('Formulación del sistema complejo adaptativo','Complex adaptive system formulation'), render:()=>renderSca},
  {id:'tablero', n:'11', ill:'i-panel2', corto:E('Tablero','Dashboard'), titulo:E('Tablero del viñedo','Vineyard dashboard'), render:()=>renderTablero},
  {id:'regen',   n:'12', ill:'i-semilla', corto:E('Regeneración','Regeneration'), titulo:E('Regeneración y resiliencia','Regeneration and resilience'), render:()=>renderRegen},
  {id:'riesgos', n:'13', ill:'i-riesgo', corto:E('Riesgos','Risks'), titulo:E('Riesgos del viñedo','Vineyard risks'), render:()=>renderRiesgos},
  {id:'validacion', n:'✓', ill:'i-check', corto:E('Validación','Validation'), titulo:E('Validación','Validation'), render:()=>renderValidacion},
  {id:'teoria', n:'§', ill:'i-book',   corto:E('Teoría','Theory'), titulo:E('Marco teórico y fuentes','Theoretical framework and sources'), render:()=>renderTeoria}
];
const NUMERADOS = BLOQUES.filter(b=>/^\d+$/.test(b.n)).length;
const $ = (s,el=document)=>el.querySelector(s);
const $$ = (s,el=document)=>[...el.querySelectorAll(s)];
const esc = t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(v,d=2){ if(v==null||v===''||isNaN(v)) return '—'; return Number(Math.abs(v)<1e-12?0:v).toLocaleString(LOC(),{minimumFractionDigits:d,maximumFractionDigits:d}); }
const B = id=>BLOQUES.find(b=>b.id===id);
const ill = (id, cls='', style='') => `<svg class="ico ${cls}" style="${style}" aria-hidden="true"><use href="#${id}" width="100%" height="100%"/></svg>`;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('on'),2400); }
const marcaDato = ()=>`<span class="dato">● ${T('Dato publicado','Published data')}</span>`;
const marcaInterp = (t)=>`<span class="interp" title="${esc(t||'')}">◆ ${T('Lectura de Ratio Vitis','Ratio Vitis reading')}</span>`;
const marcaSug = ()=>`<span class="badge" style="background:var(--surface2)">${T('sugerido','suggested')}</span>`;
const fuente = (txt)=>`<div class="fuente">${T('Fuente','Source')}: ${txt}</div>`;
const fuenteInegi = ()=>fuente(T('INEGI, Catálogo Único de Claves Geoestadísticas; Censo de Población y Vivienda 2020.','INEGI, Geostatistical catalogue; 2020 Population and Housing Census.'));
function cabecera(id, lead){ const b=B(id);
  const et = /^\d+$/.test(b.n) ? T(`Bloque ${b.n} de ${NUMERADOS}`,`Block ${b.n} of ${NUMERADOS}`) : (id==='validacion'?T('Evaluación de la plataforma','Platform evaluation'):T('Fundamentos','Foundations'));
  return `<div class="bhead"><div><div class="eyebrow">${et}</div><h1>${esc(tx(b.titulo))}</h1>${lead?`<p class="lead">${lead}</p>`:''}${franjaAvance(id)}</div>${b.ill?`<div class="bill" style="--anim:running">${ill(b.ill)}</div>`:''}</div>`; }
function siguiente(id){ const i=BLOQUES.findIndex(b=>b.id===id), p=BLOQUES[i-1], n=BLOQUES[i+1];
  return `<div class="next no-print">${p?`<button class="btn ghost" data-ir="${p.id}">← ${esc(tx(p.corto))}</button>`:'<span></span>'}
    ${n?`<button class="btn big-next" data-ir="${n.id}"><small>${T('Siguiente','Next')}</small><span>${/^\d+$/.test(n.n)?n.n+' · ':''}${esc(tx(n.titulo))} →</span></button>`:''}</div>`; }
function consejo(prod, cien){ return `<div class="consejo prod">${ill('i-prod')}<p><span class="k">${T('Consejo','Tip')}</span>${prod}</p></div>${cien?`<div class="consejo sci">${ill('i-cien')}<p><span class="k">${T('Para el científico','For the scientist')}</span>${cien}</p></div>`:''}`; }
function descargar(nombre, texto, tipo){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([texto],{type:tipo})); a.download=nombre; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }
const csv = filas => '﻿'+filas.map(f=>f.map(c=>{ const s=String(c??''); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(',')).join('\n');
const slug = ()=> (S.proyecto.nombre||(locSel()||[])[1]||'ratio_vitis').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w\-]+/g,'_');
const locSel = ()=> (TERR.localidades[S.edo+S.mun]||[]).find(l=>l[0]===S.loc) || null;
const munSel = ()=> (TERR.municipios[S.edo]||[]).find(m=>m[0]===S.mun);
const semaforo = (c)=> c ? `<span class="badge ${c.k==='ok'?'ok':c.k==='bad'?'bad':'warn'}">${esc(tx(c.t))}</span>` : '';

/* Campos ligados al estado: data-s="vina.entre" (se guarda al cambiar) */
const leerRuta = (p)=> p.split('.').reduce((o,k)=>o==null?undefined:o[k], S);
function ponerRuta(p, v){ const k=p.split('.'), u=k.pop(), o=k.reduce((o,x)=>o[x], S); o[u]=v; }
const campo = (ruta, etq, opt={})=> `<label class="f"><span>${etq}${opt.q?ayuda(opt.q):''}</span><input data-s="${ruta}" ${opt.tipo==='texto'?'':'type="number" step="any" inputmode="decimal"'} value="${esc(leerRuta(ruta)??'')}" placeholder="${esc(opt.ph||'')}">${opt.nota?`<small class="nota">${opt.nota}</small>`:''}</label>`;
document.addEventListener('change',e=>{ const t=e.target.closest&&e.target.closest('[data-s]'); if(!t||EJ) return; ponerRuta(t.dataset.s, t.type==='checkbox'?t.checked:t.value.trim()); guardar(); render(); });

/* ================= INICIO ================= */
/* Corte de la vid: el agua sube del suelo a la atmósfera (el modelo RASPA en una imagen) */
function vidViva(){ let s=`<svg class="telar-vivo" viewBox="0 0 520 420" aria-hidden="true">
  <rect x="0" y="250" width="520" height="170" fill="#7a5a3a" opacity=".22"/><rect x="0" y="320" width="520" height="100" fill="#7a5a3a" opacity=".18"/>
  <circle cx="440" cy="70" r="34" fill="#e9ad2f" opacity=".85"/>`;
  [0,1,2,3,4].forEach(i=>{ s+=`<line x1="440" y1="70" x2="${300-i*20}" y2="${150+i*12}" stroke="#e9ad2f" stroke-width="2" stroke-dasharray="6 8" opacity=".55"><animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.6s" repeatCount="indefinite"/></line>`; });
  s+=`<path d="M250 250 C248 200 252 170 250 120" stroke="#6b4a2b" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M250 135 C200 120 160 110 120 118 M250 135 C300 118 350 112 390 120" stroke="#6b4a2b" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M250 250 C230 290 200 310 170 350 M250 250 C270 300 300 330 330 370 M250 250 C250 300 248 340 252 390" stroke="#8a6a4a" stroke-width="3" fill="none" opacity=".8"/>`;
  [[110,100],[150,92],[195,100],[300,96],[345,90],[385,102],[230,92]].forEach(([x,y],i)=>{ s+=`<path d="M${x} ${y} q18 -26 36 0 q-18 22 -36 0z" fill="#4f7d3a" opacity=".9"/>`; });
  [[200,128],[300,128]].forEach(([x,y])=>{ s+=`<g fill="#6b3fa0">${[0,1,2,3,4,5].map(k=>`<circle cx="${x+(k%3)*9-9+(k>2?4:0)}" cy="${y+Math.floor(k/3)*9+10}" r="5"/>`).join('')}</g>`; });
  [0,1,2,3,4,5].forEach(i=>{ const x=170+i*32; s+=`<circle r="4" fill="#3f6fb0" opacity=".85"><animateMotion dur="${3.2+i*.35}s" begin="${i*.5}s" repeatCount="indefinite" path="M${x} 370 C${(x+250)/2} 300 250 260 250 200 C250 160 ${200+i*20} 120 ${180+i*30} 60"/><animate attributeName="opacity" values="0;.9;.9;0" dur="${3.2+i*.35}s" begin="${i*.5}s" repeatCount="indefinite"/></circle>`; });
  return s+`</svg>`; }
function renderInicio(el){
  const nl=Object.values(TERR.localidades).reduce((s,l)=>s+l.length,0);
  const pasos=[['vina',T('Viñedo y experimento','Vineyard and trial'),T('Sitio con latitud y altitud del INEGI, tipo de uva, densidad de plantación y un diseño en bloques al azar con sorteo reproducible y croquis.','Site with INEGI latitude and altitude, grape type, planting density and a randomised block design with reproducible draw and layout.')],
    ['suelo',T('Suelo','Soil'),T('Textura con la prueba del frasco, densidad aparente y su clase, agua disponible (ADT y AFA), infiltración, pH y salinidad.','Texture by jar test, bulk density and its class, available water (TAW and RAW), infiltration, pH and salinity.')],
    ['clima',T('Clima','Climate'),T('Importa los registros diarios de tu estación: ET0 de Penman–Monteith día por día, Huglin, frescor nocturno, Winkler y lluvia contra demanda.','Import your station’s daily records: Penman–Monteith ET0 day by day, Huglin, cool nights, Winkler and rain against demand.')],
    ['raspa',T('RASPA','SPAC'),T('El agua del suelo a la atmósfera: coeficiente dual de FAO-56, balance diario, estrés hídrico, potencial de tallo y cuánta agua se evapora sin pasar por la vid.','Water from soil to atmosphere: FAO-56 dual coefficient, daily balance, water stress, stem potential and how much water evaporates without passing through the vine.')],
    ['fert',T('Fertilidad y abonos','Fertility and manures'),T('Análisis de suelo y foliar con rangos de suficiencia citados, relación K/Mg y la dosis de cada abono igualada en nitrógeno.','Soil and tissue analysis with cited sufficiency ranges, K/Mg ratio and each manure dose matched in nitrogen.')],
    ['bio',T('Biomasa y carbono','Biomass and carbon'),T('Peso de poda, área foliar e IAF, NDVI, crecimiento del sarmiento y el carbono acumulado con su CO₂ fijado y O₂ liberado.','Pruning weight, leaf area and LAI, NDVI, shoot growth and accumulated carbon with its fixed CO₂ and released O₂.')],
    ['prod',T('Productividad','Productivity'),T('Rendimiento, °Brix, índice de Ravaz, relación área foliar/fruto y productividad del agua, por tratamiento.','Yield, °Brix, Ravaz index, leaf area/fruit ratio and water productivity, by treatment.')],
    ['energia',T('Energía','Energy'),T('Radiación neta, calor latente y sensible y la relación de Bowen del viñedo, día por día.','Net radiation, latent and sensible heat and the vineyard Bowen ratio, day by day.')]];
  el.innerHTML = `<section class="hero">
    <div><div class="eyebrow">Ratio Complexus · ${T('el viñedo medido','the measured vineyard')}</div>
      <h1>${T('Ratio <em>Vitis</em>: el viñedo como <span class="acc">sistema que se mide</span>','Ratio <em>Vitis</em>: the vineyard as a <span class="acc">measured system</span>')}</h1>
      <p class="big">${T('Ratio Viña recoge lo que sabe la gente del viñedo; Ratio Vitis mide lo que pasa en él. El agua que entra por la lluvia y el riego, la que guarda el suelo, la que sube por la vid y la que se lleva el aire; la energía del sol, el carbono que se queda en la planta y la uva que sale. Cada número viene de tu campo o de una fuente citada, y juntos forman un <b>sistema complejo adaptativo</b> que se puede leer, comparar y proyectar.','Ratio Viña gathers what people know about the vineyard; Ratio Vitis measures what happens in it. Water arriving as rain and irrigation, water the soil holds, water rising through the vine and water the air carries away; the sun’s energy, the carbon kept in the plant and the grapes that leave. Every number comes from your field or a cited source, and together they form a <b>complex adaptive system</b> you can read, compare and project.')}</p>
      <div class="ctas"><button class="btn lg" data-ir="vina">${T('Empezar con mi viñedo →','Start with my vineyard →')}</button><button class="btn link" data-ir="validacion">${T('Ver la validación','See the validation')}</button><button class="btn link" data-ir="teoria">${T('Leer la teoría','Read the theory')}</button><button class="btn link" data-ver-cita>${T('¿Cómo citarla?','How to cite it?')}</button></div>
      <div class="chips"><span class="chip">${T('Todo el cálculo ocurre en tu navegador','All calculations run in your browser')}</span><span class="chip">${T('Sin cookies ni recursos de terceros','No cookies or third-party resources')}</span><span class="chip">${T('Español e inglés','Spanish and English')}</span><span class="chip">${T('Libre (MIT)','Free (MIT)')}</span></div></div>
    <div class="art" aria-hidden="true" style="--anim:running"><div class="stage"></div>${vidViva()}
      <div class="chip-n" style="left:4%;top:2%">${T('Atmósfera','Atmosphere')}<b>ET0 · Rn</b></div>
      <div class="chip-n" style="right:4%;bottom:2%">${T('Suelo','Soil')}<b>ADT · Dr · Ks</b></div></div></section>
  <div class="card como-llenar"><h3>${T('Así distingues lo tuyo de lo demás','How to tell your data from the rest')}</h3><div class="grid g3">
    <div><span class="muestra vacia">${T('Escribe aquí…','Type here…')}</span><p class="nota">${T('Campo vacío: texto gris de ayuda. La aplicación empieza en blanco; nada viene llenado.','Empty field: grey help text. The app starts blank; nothing comes filled in.')}</p></div>
    <div><span class="muestra sugerida">${T('Sugerido','Suggested')}</span><p class="nota">${T('Valor de una tabla publicada (p. ej., FAO-56) mientras no escribas el tuyo; siempre dice de dónde sale.','Value from a published table (e.g., FAO-56) until you type yours; it always says where it comes from.')}</p></div>
    <div><span class="muestra ejemplo">${T('Sin dato','No data')}</span><p class="nota">${T('Lo que no tiene medición ni fuente queda «sin dato». Ratio Vitis no inventa valores.','Whatever has no measurement or source stays “no data”. Ratio Vitis does not invent values.')}</p></div></div></div>
  <div class="card cita-card"><h2>${T('¿Cómo citarla?','How to cite it?')}</h2>
   <p class="nota">${T(`Si usas ${CONFIG.app} en un artículo, una tesis, un informe o una clase, cítala así (APA, 7.ª ed.):`,`If you use ${CONFIG.app} in a paper, thesis, report or class, cite it as follows (APA 7th ed.):`)}</p>
   <p id="citaTxt" class="cita-apa">${citaAPA()}</p>
   ${CONFIG.doi?'':`<p class="nota">${T('El DOI de Zenodo se agrega al publicar la primera versión.','The Zenodo DOI is added when the first version is published.')}</p>`}
   <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center"><button class="btn ghost sm" data-copiar-cita>⧉ ${T('Copiar referencia','Copy reference')}</button>${CONFIG.doi?`<a class="btn link sm" href="https://doi.org/${CONFIG.doi}" target="_blank" rel="noopener">DOI ${CONFIG.doi} ↗</a>`:''}</div><div class="qr-app"><span class="qr-img">${CONFIG.qr}</span><span><b>${CONFIG.url.replace(/^https:\/\//,'').replace(/\/$/,'').replace('.io/','.io/<wbr>')}</b><br>${T('Escanea el código para abrirla en tu celular o compartirla.','Scan the code to open it on your phone or share it.')}</span></div></div>
  <div class="stats">
    <div class="stat"><div class="v">10</div><div class="l">${T('ejemplos resueltos de FAO-56 reproducidos','FAO-56 worked examples reproduced')}</div></div>
    <div class="stat"><div class="v">300</div><div class="l">${T('días aleatorios contra un motor independiente','random days against an independent engine')}</div></div>
    <div class="stat"><div class="v">${fmt(nl,0)}</div><div class="l">${T('localidades de México con latitud y altitud','Mexican localities with latitude and altitude')}</div></div>
    <div class="stat"><div class="v">4</div><div class="l">${T('escalas de potencial hídrico citadas','cited water potential scales')}</div></div></div>
  <h2 class="section-t">${T('El núcleo de Ratio Vitis','The core of Ratio Vitis')}</h2>
  <div class="inc">${pasos.map((p,i)=>`<button data-ir="${p[0]}"><span class="num">${i+1}</span><h3>${p[1]}</h3><p>${p[2]}</p></button>`).join('')}</div>
  <div class="card"><h2>${T('En camino','Coming next')}</h2><p class="nota">${T('Estadística (con exportación a las apps de la suite LABG de Luis Ángel Barrera-Guzmán), el modelo del sistema complejo adaptativo con su «Recorrido del viñedo», impacto y sostenibilidad, prospectiva e informe.','Statistics (with export to Luis Ángel Barrera-Guzmán’s LABG suite apps), the complex adaptive system model with its “Vineyard walk-through”, impact and sustainability, outlook and report.')}</p></div>
  <div class="card"><h2>${T('Rigor: dato publicado, medición o lectura','Rigour: published data, measurement or reading')}</h2>
   <p>${marcaDato()} ${T('Coeficientes, umbrales y fórmulas tomados de una fuente citada y cotejados con su texto.','Coefficients, thresholds and formulas taken from a cited source and checked against its text.')}</p>
   <p>${marcaInterp()} ${T('Supuestos de Ratio Vitis para completar un cálculo; siempre marcados y editables.','Ratio Vitis assumptions to complete a calculation; always flagged and editable.')}</p></div>
  ${siguiente('inicio')}`; }

/* ================= BLOQUE 1 · VIÑEDO, SITIO Y EXPERIMENTO ================= */
function renderVina(el){ const v=S.vina, l=locSel(), st=sitio(), e=S.edo?edoDe(S.edo):null, muns=TERR.municipios[S.edo]||[], locs=TERR.localidades[S.edo+S.mun]||[];
  const dens = num(v.entre)>0&&num(v.sobre)>0 ? 10000/(num(v.entre)*num(v.sobre)) : null, p=EXP.params(), pl=EXP.plantas();
  el.innerHTML = `${cabecera('vina',T('Dónde está el viñedo, cómo está plantado y cómo se va a comparar. La latitud y la altitud alimentan la ecuación de Penman–Monteith; el tipo de uva fija los coeficientes de FAO-56; el diseño en bloques permite comparar tratamientos con rigor.','Where the vineyard is, how it is planted and how it will be compared. Latitude and altitude feed the Penman–Monteith equation; grape type sets the FAO-56 coefficients; the block design lets you compare treatments rigorously.'))}
  <div class="card"><h2>${T('1.1 Sitio','1.1 Site')}${ayuda('sitio')}</h2><div class="mapa-wrap"><div>${mapaTelar(S.edo||'', l?[l[4],l[5]]:null)}</div>
    <div class="rinfo">
      <label class="f"><span>${T('Estado','State')}</span><select id="zEst" class="${S.edo?'':'vacio'}"><option value="" ${S.edo?'':'selected'} disabled>${T('— Elige el estado —','— Choose the state —')}</option>${TERR.estados.map(x=>`<option value="${x[0]}" ${x[0]===S.edo?'selected':''}>${esc(x[1])}</option>`).join('')}</select></label>
      <label class="f"><span>${T('Municipio','Municipality')}</span><select id="zMun" class="${S.mun?'':'vacio'}" ${S.edo?'':'disabled'}><option value="" ${S.mun?'':'selected'} disabled>${S.edo?T('— Elige el municipio —','— Choose the municipality —'):T('— primero el estado —','— state first —')}</option>${muns.map(x=>`<option value="${x[0]}" ${x[0]===S.mun?'selected':''}>${esc(x[1])}</option>`).join('')}</select></label>
      <label class="f"><span>${T('Localidad','Locality')}</span><select id="zLoc" class="${S.loc?'':'vacio'}" ${S.mun?'':'disabled'}><option value="" ${S.loc?'':'selected'} disabled>${S.mun?T('— Elige la localidad —','— Choose the locality —'):T('— primero el municipio —','— municipality first —')}</option>${locs.map(x=>`<option value="${x[0]}" ${x[0]===S.loc?'selected':''}>${esc(x[1])}</option>`).join('')}</select></label>
      <label class="row" style="gap:8px;align-items:center;margin:6px 0"><input type="checkbox" data-s="sitio.manual" ${S.sitio.manual?'checked':''}><span>${T('Escribir latitud y altitud medidas (GPS)','Type measured latitude and altitude (GPS)')}</span></label>
      ${S.sitio.manual?`<div class="grid g2">${campo('sitio.lat',T('Latitud (° N; sur negativa)','Latitude (° N; south negative)'),{ph:T('p. ej., 19.25','e.g., 19.25')})}${campo('sitio.z',T('Altitud (m)','Altitude (m)'),{ph:T('p. ej., 140','e.g., 140')})}</div>`:''}
      <div class="kpis"><div class="kpi"><div class="l">${T('Latitud','Latitude')}</div><div class="v">${st.lat!=null?fmt(st.lat,3)+'°':'—'}</div><div class="s">${S.sitio.manual?T('medida por ti','measured by you'):l?'INEGI':T('sin dato','no data')}</div></div>
        <div class="kpi"><div class="l">${T('Altitud','Altitude')}</div><div class="v">${st.z!=null?fmt(st.z,0)+' m':'—'}</div><div class="s">${st.z!=null?T('presión','pressure')+' '+fmt(FAO.P(st.z),1)+' kPa':''}</div></div></div></div></div>
    ${l&&!S.sitio.manual?fuenteInegi():''}</div>
  <div class="card"><h2>${T('1.2 El viñedo','1.2 The vineyard')}</h2>
    <div class="grid g2">${TIPOS_UVA.map(t=>`<label class="opt ${v.tipo===t.id?'sel':''}"><input type="radio" name="tuva" value="${t.id}" ${v.tipo===t.id?'checked':''}><b>${esc(tx(t.n))}</b><small>Kcb ${FAO.UVA[t.id].kcb.join(' / ')} · p ${FAO.UVA[t.id].p} · h ${t.id==='mesa'?'2':'1.5–2'} m (FAO-56)</small></label>`).join('')}</div>
    <div class="grid g3" style="margin-top:12px">${campo('vina.variedad',T('Variedad','Variety'),{tipo:'texto',ph:T('p. ej., Perlette','e.g., Perlette')})}${campo('vina.portainjerto',T('Portainjerto','Rootstock'),{tipo:'texto',ph:T('o «franco de pie»','or “own-rooted”')})}${campo('vina.anioPlant',T('Año de plantación','Planting year'),{ph:T('p. ej., 2024','e.g., 2024')})}
      ${campo('vina.entre',T('Distancia entre hileras (m)','Row spacing (m)'),{ph:T('p. ej., 3.0','e.g., 3.0')})}${campo('vina.sobre',T('Distancia entre plantas (m)','Vine spacing (m)'),{ph:T('p. ej., 1.4','e.g., 1.4')})}${campo('vina.conduccion',T('Sistema de conducción','Training system'),{tipo:'texto',ph:T('p. ej., espaldera, «Y», parral','e.g., VSP, “Y”, pergola')})}</div>
    <label class="f"><span>${T('Riego','Irrigation')}${ayuda('fw')}</span><select data-s="vina.riego" class="${v.riego?'':'vacio'}"><option value="" ${v.riego?'':'selected'} disabled>${T('— Elige el tipo de riego —','— Choose the irrigation type —')}</option>${FAO.FW.map(x=>`<option value="${x.id}" ${v.riego===x.id?'selected':''}>${esc(tx(x.n))}</option>`).join('')}</select></label>
    <div class="kpis"><div class="kpi"><div class="l">${T('Densidad de plantación','Planting density')}</div><div class="v">${dens!=null?fmt(dens,0):'—'}</div><div class="s">${T('plantas por hectárea = 10 000 / (entre hileras × entre plantas)','vines per hectare = 10 000 / (row × vine spacing)')}</div></div></div></div>
  <div class="card"><h2>${T('1.3 Diseño experimental','1.3 Experimental design')}${ayuda('diseno')}</h2>
    <p class="nota">${T('Escribe los tratamientos (incluye un testigo), cuántos bloques hay (por ejemplo, hileras), cuántas plantas tiene cada parcela y cuántas plantas de bordo dejas en cada extremo del bloque. Luego sortea.','Type the treatments (include a control), how many blocks there are (e.g., rows), how many vines each plot has and how many border vines you leave at each block end. Then randomise.')}</p>
    <div class="tbl-c"><table class="tbl"><thead><tr><th>${T('Clave','Code')}</th><th>${T('Tratamiento','Treatment')}</th><th></th></tr></thead><tbody>
      ${S.exp.trats.map((t,i)=>`<tr><td><input class="mini" data-trat="${i}|id" value="${esc(t.id)}" placeholder="T${i}" style="width:70px"></td><td><input data-trat="${i}|n" value="${esc(t.n||'')}" placeholder="${i===0?T('p. ej., testigo sin abono','e.g., unfertilised control'):T('descripción','description')}" style="width:100%"></td><td><button class="btn sm ghost" data-qtrat="${i}" aria-label="${T('Quitar','Remove')}">×</button></td></tr>`).join('')||`<tr><td colspan="3" class="sindato">${T('Aún no hay tratamientos.','No treatments yet.')}</td></tr>`}</tbody></table></div>
    <div class="row" style="gap:8px;margin:8px 0 14px;flex-wrap:wrap"><button class="btn sm" id="bAddTrat">＋ ${T('Agregar tratamiento','Add treatment')}</button></div>
    <div class="grid g3">${campo('exp.bloques',T('Bloques (repeticiones)','Blocks (replicates)'),{ph:T('p. ej., 3','e.g., 3')})}${campo('exp.plantasParcela',T('Plantas por parcela','Vines per plot'),{ph:T('p. ej., 7','e.g., 7')})}${campo('exp.bordo',T('Plantas de bordo por extremo','Border vines per end'),{ph:T('p. ej., 1','e.g., 1')})}
      ${campo('exp.etiquetaBloque',T('Nombre del bloque','Block name'),{tipo:'texto',ph:T('Hilera','Row')})}${campo('exp.semilla',T('Semilla del sorteo','Random seed'),{tipo:'texto',ph:T('p. ej., la fecha','e.g., the date'),nota:T('La misma semilla repite el mismo croquis.','The same seed repeats the same layout.')})}</div>
    ${p?`<div class="kpis"><div class="kpi"><div class="l">${T('Parcelas','Plots')}</div><div class="v">${p.b*p.trats.length}</div><div class="s">${p.b} × ${p.trats.length}</div></div>
      <div class="kpi"><div class="l">${T('Plantas medidas','Vines measured')}</div><div class="v">${p.b*p.trats.length*p.k}</div><div class="s">${p.b*p.k} ${T('por tratamiento','per treatment')}</div></div>
      <div class="kpi"><div class="l">${T('Plantas por bloque','Vines per block')}</div><div class="v">${p.trats.length*p.k+2*p.bo}</div><div class="s">${T('con','with')} ${2*p.bo} ${T('de bordo','border')}</div></div></div>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" id="bSortear">🎲 ${S.exp.sorteo?T('Sortear de nuevo','Randomise again'):T('Sortear tratamientos','Randomise treatments')}</button>${pl?`<button class="btn ghost" id="bCampo">⤓ ${T('Plantilla de campo (CSV para AgriDesign)','Field sheet (CSV for AgriDesign)')}</button>`:''}</div>
      ${pl?`<div style="margin-top:12px">${EXP.croquis()}</div>${consejo(T('Imprime el croquis, marca las plantas en el campo y lleva la plantilla para anotar. Si cambias tratamientos, bloques o plantas, vuelve a sortear.','Print the layout, mark the vines in the field and take the sheet to record data. If you change treatments, blocks or vines, randomise again.'),T('Modelo: Yij = μ + τi + βj + εij (bloques completos al azar). Con edad de la planta como covariable y medidas repetidas, el análisis pasa a ANCOVA o modelo lineal mixto; la plantilla trae las columnas de edad y fecha para eso.','Model: Yij = μ + τi + βj + εij (randomised complete blocks). With vine age as covariate and repeated measures the analysis becomes ANCOVA or a linear mixed model; the sheet includes age and date columns for that.'))}`:''}`
      :`<p class="sindato">${T('Faltan al menos dos tratamientos, dos bloques y las plantas por parcela.','At least two treatments, two blocks and vines per plot are missing.')}</p>`}</div>
  ${panelVariables()}
  ${siguiente('vina')}`;
  const ponEdo=c=>{ S.edo=c; S.mun=''; S.loc=''; guardar(); render(); };
  $$('[data-edo]',el).forEach(x=>x.onclick=()=>ponEdo(x.dataset.edo)); $('#zEst',el).onchange=ev=>ponEdo(ev.target.value);
  $('#zMun',el).onchange=ev=>{ S.mun=ev.target.value; S.loc=''; guardar(); render(); };
  $('#zLoc',el).onchange=ev=>{ S.loc=ev.target.value; guardar(); render(); };
  $$('input[name=tuva]',el).forEach(r=>r.onchange=()=>{ S.vina.tipo=r.value; guardar(); render(); });
  $('#bAddTrat',el).onclick=()=>{ S.exp.trats.push({id:'T'+S.exp.trats.length, n:''}); S.exp.sorteo=null; guardar(); render(); };
  $$('[data-qtrat]',el).forEach(b=>b.onclick=()=>{ S.exp.trats.splice(+b.dataset.qtrat,1); S.exp.sorteo=null; guardar(); render(); });
  $$('[data-trat]',el).forEach(i=>i.onchange=()=>{ const [k,c]=i.dataset.trat.split('|'); S.exp.trats[+k][c]=i.value.trim(); if(c==='id') S.exp.sorteo=null; guardar(); render(); });
  const bs=$('#bSortear',el); if(bs) bs.onclick=()=>{ if(!S.exp.semilla) S.exp.semilla=new Date().toISOString().slice(0,10); S.exp.sorteo=EXP.sortear(S.exp.semilla); guardar(); render(); toast(T('Tratamientos sorteados','Treatments randomised')); };
  const bc=$('#bCampo',el); if(bc) bc.onclick=()=>descargar(slug()+'_campo.csv', EXP.csvCampo([]), 'text/csv'); }
/* Si cambian bloques, plantas o bordo, el sorteo anterior ya no corresponde */
document.addEventListener('change',e=>{ const t=e.target.closest&&e.target.closest('[data-s^="exp."]'); if(t && !/semilla|etiqueta/.test(t.dataset.s)){ S.exp.sorteo=null; guardar(); } }, true);

/* ================= BLOQUE 2 · SUELO ================= */
function renderSuelo(el){ const s=S.suelo, texJar=SUELO.textura(num(s.jarArena),num(s.jarLimo),num(s.jarArcilla)), tex=s.textura||texJar, sh=sueloHidrico();
  const sumJar=[s.jarArena,s.jarLimo,s.jarArcilla].map(num); const totJar=sumJar.every(v=>v!=null)?sumJar.reduce((a,b)=>a+b,0):null;
  const da = num(s.da)!=null ? num(s.da) : (num(s.daMasa)!=null&&num(s.daVol)>0 ? num(s.daMasa)/num(s.daVol) : null), cda=SUELO.claseDa(da, tex);
  const inf = num(s.infVol)!=null&&num(s.infT)>0 ? num(s.infVol)/num(s.infT) : null, sal=SUELO.salinidad(num(s.ce)), f=sh.fila;
  el.innerHTML = `${cabecera('suelo',T('El suelo es el tanque de agua y de nutrientes de la vid. Con unas cuantas mediciones de campo y un análisis de laboratorio, Ratio Vitis calcula cuánta agua puede guardar para la planta y qué tan cómodo es para sus raíces.','Soil is the vine’s water and nutrient tank. With a few field measurements and a lab analysis, Ratio Vitis computes how much water it can hold for the plant and how comfortable it is for its roots.'))}
  <div class="card"><h2>${T('2.1 Textura','2.1 Texture')}${ayuda('textura')}</h2>
    <p class="nota">${T('Prueba del frasco: llena un frasco con un tercio de suelo y agua, agita, deja asentar y mide la altura de cada capa (arena abajo, limo en medio, arcilla arriba). O elige la clase de tu análisis de laboratorio.','Jar test: fill a jar one-third with soil and water, shake, let it settle and measure each layer’s height (sand at the bottom, silt in the middle, clay on top). Or choose the class from your lab analysis.')}</p>
    <div class="grid g3">${campo('suelo.jarArena',T('Capa de arena (mm)','Sand layer (mm)'))}${campo('suelo.jarLimo',T('Capa de limo (mm)','Silt layer (mm)'))}${campo('suelo.jarArcilla',T('Capa de arcilla (mm)','Clay layer (mm)'))}</div>
    ${totJar?`<p>${T('Arena','Sand')} <b>${fmt(100*sumJar[0]/totJar,0)} %</b> · ${T('limo','silt')} <b>${fmt(100*sumJar[1]/totJar,0)} %</b> · ${T('arcilla','clay')} <b>${fmt(100*sumJar[2]/totJar,0)} %</b> → <b>${esc(tx(SUELO.CLASES[texJar]))}</b> <span class="nota">(${T('triángulo de texturas del USDA','USDA texture triangle')})</span></p>`:''}
    <label class="f"><span>${T('Clase textural del laboratorio (reemplaza la del frasco)','Lab texture class (replaces the jar result)')}</span><select data-s="suelo.textura" class="${s.textura?'':'vacio'}"><option value="">${T('— Usar la prueba del frasco —','— Use the jar test —')}</option>${Object.entries(SUELO.CLASES).map(([k,n])=>`<option value="${k}" ${s.textura===k?'selected':''}>${esc(tx(n))}</option>`).join('')}</select></label>
    ${fuente('UC ANR (2025), Site selection and vineyard design; USDA, Soil Survey Manual.')}</div>
  <div class="card"><h2>${T('2.2 Densidad aparente','2.2 Bulk density')}${ayuda('da')}</h2>
    <div class="grid g3">${campo('suelo.daMasa',T('Masa de suelo seco (g)','Dry soil mass (g)'))}${campo('suelo.daVol',T('Volumen del cilindro (cm³)','Core volume (cm³)'))}${campo('suelo.da',T('O densidad del laboratorio (g cm⁻³)','Or lab bulk density (g cm⁻³)'))}</div>
    <div class="kpis"><div class="kpi"><div class="l">${T('Densidad aparente','Bulk density')}</div><div class="v">${da!=null?fmt(da,2):'—'}</div><div class="s">g cm⁻³</div></div></div>
    ${cda?`<p>${semaforo(cda)}${cda.r?` <span class="nota">${T('Para tu textura: ideal <','For your texture: ideal <')} ${cda.r.ideal}, ${T('afecta','affects')} ${cda.r.afecta}, ${T('restringe >','restricts >')} ${cda.r.restringe} g cm⁻³</span>`:''}</p>`:''}
    ${fuente('USDA-NRCS, Soil Quality Test Kit Guide: Bulk Density, Moisture and Aeration; UC ANR (2025).')}</div>
  <div class="card"><h2>${T('2.3 Agua disponible','2.3 Available water')}${ayuda('adt')}</h2>
    <div class="grid g3">${campo('suelo.cc',T('θ a capacidad de campo (m³ m⁻³)','θ at field capacity (m³ m⁻³)'),{ph:f?`${T('Cuadro 19','Table 19')}: ${f.cc.join('–')}`:'',nota:sh.sug.cc?T('Se usa el centro del rango: ','Range centre is used: ')+fmt(sh.cc,3):''})}
      ${campo('suelo.pmp',T('θ en punto de marchitez (m³ m⁻³)','θ at wilting point (m³ m⁻³)'),{ph:f?`${T('Cuadro 19','Table 19')}: ${f.pmp.join('–')}`:'',nota:sh.sug.pmp?T('Se usa el centro del rango: ','Range centre is used: ')+fmt(sh.pmp,3):''})}
      ${campo('suelo.zr',T('Profundidad de raíces Zr (m)','Rooting depth Zr (m)'),{ph:T('FAO-56: 1.0–2.0 en vid','FAO-56: 1.0–2.0 in grapevine'),nota:T('Mídela en una calicata o con barrena.','Measure it in a soil pit or with an auger.')})}</div>
    ${!f&&tex?`<p class="alert warn">${T('El Cuadro 19 de FAO-56 no trae esta textura: escribe θCC y θPMP de tu laboratorio.','FAO-56 Table 19 does not list this texture: type θFC and θWP from your lab.')}</p>`:''}
    <div class="kpis"><div class="kpi"><div class="l">${T('Agua disponible total (ADT)','Total available water (TAW)')}</div><div class="v">${sh.adt!=null?fmt(sh.adt,0)+' mm':'—'}</div><div class="s">1000 (θCC − θPMP) Zr</div></div>
      <div class="kpi"><div class="l">${T('Agua fácilmente aprovechable (AFA)','Readily available water (RAW)')}</div><div class="v">${sh.afa!=null?fmt(sh.afa,0)+' mm':'—'}</div><div class="s">${sh.p!=null?'p = '+sh.p+' · '+T('Cuadro 22','Table 22'):T('elige el tipo de uva (Bloque 1)','choose the grape type (Block 1)')}</div></div></div>
    <details class="sci"><summary>${T('Capa superficial que se evapora','Evaporating surface layer')}</summary><div class="grid g2" style="margin-top:8px">${campo('suelo.ze',T('Ze (m)','Ze (m)'),{ph:'0.10–0.15'})}${campo('suelo.rew',T('AFE / REW (mm)','REW (mm)'),{ph:f?f.rew.join('–'):''})}</div><p class="nota">AET = 1000 (θCC − 0.5 θPMP) Ze (FAO-56, Ec. 73).</p></details>
    ${fuente('Allen et al. (2006), FAO Riego y Drenaje 56, Cuadros 19 y 22, Ec. 73, 82 y 83.')}</div>
  <div class="card"><h2>${T('2.4 Infiltración y química básica','2.4 Infiltration and basic chemistry')}</h2>
    <div class="grid g3">${campo('suelo.infVol',T('Agua del anillo (cm³)','Ring water (cm³)'),{ph:'500'})}${campo('suelo.infT',T('Tiempo en infiltrarse (s)','Time to infiltrate (s)'))}
      <div class="kpi"><div class="l">${T('Tasa de infiltración','Infiltration rate')}</div><div class="v">${inf!=null?fmt(inf,2):'—'}</div><div class="s">cm³ s⁻¹ (UC ANR)</div></div></div>
    <div class="grid g3">${campo('suelo.ph',T('pH (agua)','pH (water)'),{q:'ph'})}${campo('suelo.ce',T('CEe, extracto de saturación (dS m⁻¹)','ECe, saturation extract (dS m⁻¹)'),{q:'ce'})}${campo('suelo.mo',T('Materia orgánica (%)','Organic matter (%)'))}</div>
    <p>${semaforo(SUELO.clasePh(num(s.ph)))} ${sal?`<span class="badge ${sal.k==='ok'?'ok':sal.k==='bad'?'bad':'warn'}">${T('Rendimiento relativo por salinidad','Relative yield from salinity')}: ${fmt(sal.yr,0)} %</span>`:''}</p>
    ${fuente('UC ANR (2025); NC State Extension, Winegrape Production Guide, cap. 9; Allen et al. (2006), Cuadro 23.')}</div>
  ${siguiente('suelo')}`; }
