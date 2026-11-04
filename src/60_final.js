"use strict";
/* =====================================================================
   8. VALIDACIÓN, TEORÍA, PROYECTO Y NAVEGACIÓN
   ===================================================================== */
/* Casos aleatorios calculados por pruebas/verificar_fao56.py (motor independiente en Python); armar.py los incrusta */
const CASOS_FAO56 = __CASOS__;
/* Ejemplos resueltos de Allen et al. (2006), FAO-56: valor publicado y tolerancia (redondeo del manual) */
function ejemplosFAO(){ const u2=FAO.u2de(2.78,10), e18=FAO.et0({J:187, tmax:21.5, tmin:12.3, hrmax:84, hrmin:63, u2, n:9.25}, {lat:50.80, z:100});
  return [[T('Ej. 2 · presión a 1800 m (kPa)','Ex. 2 · pressure at 1800 m (kPa)'), FAO.P(1800), 81.8, 0.05],
    [T('Ej. 2 · constante psicrométrica (kPa °C⁻¹)','Ex. 2 · psychrometric constant (kPa °C⁻¹)'), FAO.gamma(FAO.P(1800)), 0.054, 0.0005],
    [T('Ej. 8 · Ra, 3 de septiembre, 20° S (MJ m⁻² d⁻¹)','Ex. 8 · Ra, 3 September, 20° S (MJ m⁻² d⁻¹)'), FAO.Ra(-20,246), 32.2, 0.05],
    [T('Ej. 14 · u2 desde 3.2 m s⁻¹ a 10 m','Ex. 14 · u2 from 3.2 m s⁻¹ at 10 m'), FAO.u2de(3.2,10), 2.4, 0.01],
    [T('Ej. 15 · Rs de Hargreaves, Lyon (MJ m⁻² d⁻¹)','Ex. 15 · Hargreaves Rs, Lyon (MJ m⁻² d⁻¹)'), FAO.rsHarg(26.6,14.8,40.6), 22.3, 0.05],
    [T('Ej. 18 · Ra, Uccle, 6 de julio','Ex. 18 · Ra, Uccle, 6 July'), e18.ra, 41.09, 0.02],
    [T('Ej. 18 · radiación neta Rn','Ex. 18 · net radiation Rn'), e18.rn, 13.28, 0.08],
    [T('Ej. 18 · déficit de presión de vapor (kPa)','Ex. 18 · vapour pressure deficit (kPa)'), e18.vpd, 0.589, 0.003],
    [T('Ej. 18 · ET0 (mm d⁻¹)','Ex. 18 · ET0 (mm d⁻¹)'), e18.et0, 3.88, 0.03],
    [T('Ej. 20 · ET0 de Hargreaves, Lyon (mm d⁻¹)','Ex. 20 · Hargreaves ET0, Lyon (mm d⁻¹)'), FAO.et0Harg(26.6,14.8,40.55), 5.0, 0.05]]; }
function comparaCasos(){ const d=CASOS_FAO56.map(c=>Math.abs(FAO.et0({J:c.J, tmax:c.tmax, tmin:c.tmin, hrmax:c.hrmax, hrmin:c.hrmin, u2:c.u2, rs:c.rs, n:c.n}, {lat:c.lat, z:c.z}).et0-c.et0));
  return {n:d.length, max:Math.max(...d), media:d.reduce((a,b)=>a+b,0)/d.length}; }
/* Sorteo: misma semilla, mismo croquis; cada bloque contiene todos los tratamientos una sola vez */
function pruebaSorteo(){ const g=S; S=Object.assign(estadoInicial(),{exp:{trats:[{id:'T0'},{id:'T1'},{id:'T2'},{id:'T3'}], bloques:'3', plantasParcela:'7', bordo:'1', etiquetaBloque:'', semilla:'x', sorteo:null}});
  const a=EXP.sortear('prueba'), b=EXP.sortear('prueba'); S=g; const ok1=JSON.stringify(a)===JSON.stringify(b), ok2=a.every(f=>[...f].sort().join()==='T0,T1,T2,T3'); return ok1&&ok2; }
function renderValidacion(el){ const ej=ejemplosFAO(), cs=comparaCasos(), so=pruebaSorteo();
  const ok=(x,t)=>`<span class="badge ${x<=t?'ok':'bad'}">${x<=t?T('Correcto','Correct'):T('Revisar','Check')}</span>`;
  const tex=[[45,40,15,'franco'],[90,5,5,'arena'],[20,30,50,'arcilla'],[10,75,15,'frlimoso'],[60,10,30,'frarcare']].map(([a,l,c,k])=>[a,l,c,k,SUELO.textura(a,l,c)]);
  el.innerHTML = `${cabecera('validacion',T('Cada cálculo de Ratio Vitis se comprueba contra los ejemplos resueltos de su fuente y contra una implementación independiente. Esta página corre las pruebas cada vez que la abres.','Every Ratio Vitis calculation is checked against its source’s worked examples and against an independent implementation. This page runs the tests every time you open it.'))}
  <div class="card"><h2>${T('1. Ejemplos resueltos de FAO-56','1. FAO-56 worked examples')}</h2>
   <div class="tbl-c"><table class="tbl"><thead><tr><th>${T('Ejemplo','Example')}</th><th>${T('Ratio Vitis','Ratio Vitis')}</th><th>FAO-56</th><th>${T('Resultado','Result')}</th></tr></thead><tbody>
   ${ej.map(([n,v,p,t])=>`<tr><td>${n}</td><td>${fmt(v,4)}</td><td>${p}</td><td>${ok(Math.abs(v-p),t)}</td></tr>`).join('')}</tbody></table></div>
   <p class="nota">${T('La tolerancia es la del redondeo con que el manual publica cada resultado.','The tolerance is the rounding with which the manual publishes each result.')}</p>${fuente('Allen et al. (2006), FAO Riego y Drenaje 56, Ejemplos 2, 8, 14, 15, 18 y 20.')}</div>
  <div class="card"><h2>${T('2. Motor independiente','2. Independent engine')}</h2>
   <p>${T(`La ET0 de ${cs.n} días aleatorios (latitudes de 14 a 33°, altitudes de 0 a 2600 m, con radiación medida, horas de sol o Hargreaves) se calculó con un programa escrito aparte en Python a partir de las ecuaciones del manual.`,`ET0 for ${cs.n} random days (latitudes 14–33°, altitudes 0–2600 m, with measured radiation, sunshine hours or Hargreaves) was computed with a separate Python program written from the manual’s equations.`)}</p>
   <div class="kpis"><div class="kpi"><div class="l">${T('Diferencia máxima','Maximum difference')}</div><div class="v">${cs.max.toExponential(1)}</div><div class="s">mm d⁻¹ ${ok(cs.max,1e-6)}</div></div><div class="kpi"><div class="l">${T('Diferencia media','Mean difference')}</div><div class="v">${cs.media.toExponential(1)}</div><div class="s">mm d⁻¹</div></div></div>
   <p class="nota">pruebas/verificar_fao56.py</p></div>
  <div class="card"><h2>${T('3. Textura, sorteo y clases','3. Texture, randomisation and classes')}</h2>
   <div class="tbl-c"><table class="tbl"><thead><tr><th>${T('Arena–limo–arcilla (%)','Sand–silt–clay (%)')}</th><th>${T('Esperado (USDA)','Expected (USDA)')}</th><th>Ratio Vitis</th><th></th></tr></thead><tbody>
   ${tex.map(([a,l,c,k,r])=>`<tr><td>${a}–${l}–${c}</td><td>${esc(tx(SUELO.CLASES[k]))}</td><td>${esc(tx(SUELO.CLASES[r]))}</td><td>${ok(k===r?0:1,0)}</td></tr>`).join('')}</tbody></table></div>
   <p>${T('Sorteo en bloques: la misma semilla da el mismo croquis y cada bloque contiene cada tratamiento una vez','Block randomisation: the same seed gives the same layout and each block holds each treatment once')} ${ok(so?0:1,0)}</p>
   <p>${T('Peciolo en floración, N = 1.50 % (Garnacha: óptimo 1.46–1.64) → clase','Petiole at flowering, N = 1.50 % (Grenache: optimal 1.46–1.64) → class')} ${esc(tx(CAMPO.claseGarnacha('peciolo|floracion','N',1.50).n))} ${ok(CAMPO.claseGarnacha('peciolo|floracion','N',1.50).i===2?0:1,0)}</p>
   <p>${T('Carbono: 100 g de C acumulado → CO₂ 366.7 g y O₂ 266.7 g','Carbon: 100 g of accumulated C → CO₂ 366.7 g and O₂ 266.7 g')} ${ok(Math.abs(CAMPO.carbono(0,1000,0.1).co2-366.667)+Math.abs(CAMPO.carbono(0,1000,0.1).o2-266.667),0.01)}</p>
   <p>${T('Er-Raki et al. (2013): NDVI de suelo desnudo 0.15 → fc = 0','Er-Raki et al. (2013): bare-soil NDVI 0.15 → fc = 0')} ${ok(Math.abs(CAMPO.fcNDVI(0.15)),1e-12)}</p>
   <p>${T('Potencial de tallo −0.65 MPa (hueco de la escala del IVES entre −0.6 y −0.7) → clase','Stem potential −0.65 MPa (gap of the IVES scale between −0.6 and −0.7) → class')} ${RASPA.psi('tallo',-0.65).ives[1]} ${ok(RASPA.psi('tallo',-0.65).ives[1]===2?0:1,0)}</p></div>
  ${siguiente('validacion')}`; }

const REFS = [
  'Allen, R. G., Pereira, L. S., Raes, D., y Smith, M. (2006). Evapotranspiración del cultivo: guías para la determinación de los requerimientos de agua de los cultivos (Estudio FAO Riego y Drenaje 56). FAO.',
  'Amerine, M. A., y Winkler, A. J. (1944). Composition and quality of musts and wines of California grapes. Hilgardia, 15(6), 493–673.',
  'Barrera-Guzmán, L. Á. (2026). AgriDesign: Diseña y analiza experimentos agrícolas (Versión 1.0) [Software]. Zenodo. https://doi.org/10.5281/zenodo.22683046',
  'Barrera-Guzmán, L. Á. (2026). PhenologyPro: ¿Cuánto calor, cuánta agua y para cuándo? (Versión 1.2.0) [Software]. Zenodo. https://doi.org/10.5281/zenodo.23004710',
  'Chan, S. (2001). Complex adaptive systems. ESD.83 Research Seminar in Engineering Systems, Massachusetts Institute of Technology.',
  'Er-Raki, S., Rodriguez, J. C., Garatuza-Payan, J., Watts, C. J., y Chehbouni, A. (2013). Determination of crop evapotranspiration of table grapes in a semi-arid region of Northwest Mexico using multi-spectral vegetation index. Agricultural Water Management, 122, 12–19.',
  'HortScience (1993). An empirical protocol for indirect measurement of leaf area index in grape (Vitis vinifera L.). HortScience, 28(8), 777.',
  'OENO One. Sufficiency ranges (SR) and deviation from optimum percentage (DOP) references for leaf blade and petiole of red Grenache. https://oeno-one.eu/article/view/94',
  'OENO One. Water and carbon fluxes in vineyards under climate change – a review of eddy-covariance studies. https://oeno-one.eu/article/view/9872',
  'Permanhani et al. (2016). Deficit irrigation in table grape: eco-physiological basis and potential use to save water and improve quality. Theoretical and Experimental Plant Physiology, 28, 85–108.',
  'UC Davis. Research summary 214: Effect of shoot number on leaf area and crop weight relationship. https://wine.ucdavis.edu/',
  'Hernández González, J. (2026). Adaptabilidad del cultivo de uva (Vitis vinifera L.) en Mata de Zarza, Veracruz, como sistema complejo adaptativo (propuesta de tesis de maestría). Universidad Autónoma Chapingo.',
  'Holland, J. H. (1995). Hidden order: How adaptation builds complexity. Addison-Wesley.',
  'IVES Technical Reviews. A few words on grapevine leaf water potential. https://ives-technicalreviews.eu/article/view/3620',
  'NC State Extension. North Carolina Winegrape Grower’s Guide, chapter 9: Vine nutrition. https://content.ces.ncsu.edu/pdf/chapter-9-vine-nutrition/2014-10-16/winegrapes9.pdf',
  'Soil Science Division Staff (2017). Soil survey manual (USDA Handbook 18). USDA.',
  'Tonietto, J., y Carbonneau, A. (2004). A multicriteria climatic classification system for grape-growing regions worldwide. Agricultural and Forest Meteorology, 124(1–2), 81–97.',
  'UC ANR. Using stem water potential for wine grape irrigation management. https://ucanr.edu/sites/default/files/2014-05/189775.pdf',
  'UC ANR (2025). Site selection and vineyard design. https://ucanr.edu/sites/default/files/2025-02/407854.pdf',
  'Uriarte et al. (2025). Quantifying the effects of water status on grapevine vegetative growth, yield, and grape composition. Australian Journal of Grape and Wine Research.',
  'USDA-NRCS. Soil quality test kit guide: Bulk density, moisture and aeration. https://www.nrcs.usda.gov/sites/default/files/2022-10/Soil%20Bulk%20Density%20Moisture%20Aeration.pdf'];
function renderTeoria(el){
  const sec=[
   [T('El viñedo como sistema complejo adaptativo','The vineyard as a complex adaptive system'),T('Un sistema complejo adaptativo está formado por agentes que interactúan localmente y se adaptan; de esas interacciones emergen patrones que ningún agente diseñó (Holland, 1995; Chan, 2001). En el viñedo, la vid, el suelo, la atmósfera y el manejo se retroalimentan: más hojas transpiran más agua, el suelo se agota antes, el estrés frena el crecimiento y el dosel cambia. Ratio Vitis mide esos flujos para que la emergencia se pueda leer con números.','A complex adaptive system is made of agents that interact locally and adapt; from those interactions emerge patterns no agent designed (Holland, 1995; Chan, 2001). In the vineyard, vine, soil, atmosphere and management feed back on each other: more leaves transpire more water, the soil is depleted sooner, stress slows growth and the canopy changes. Ratio Vitis measures those flows so emergence can be read in numbers.')],
   [T('La relación agua–suelo–planta–atmósfera','Soil–plant–atmosphere water relations'),T('La atmósfera fija la demanda (ET0, por Penman–Monteith); el suelo guarda el agua disponible entre capacidad de campo y punto de marchitez; la vid transpira según su coeficiente basal Kcb y el suelo húmedo evapora según Ke. Cuando el agotamiento pasa el agua fácilmente aprovechable, el coeficiente Ks reduce la transpiración. Es el método del coeficiente dual de FAO-56 (Allen et al., 2006).','The atmosphere sets demand (ET0, by Penman–Monteith); soil stores available water between field capacity and wilting point; the vine transpires by its basal coefficient Kcb and wet soil evaporates by Ke. When depletion exceeds readily available water, Ks reduces transpiration. This is the FAO-56 dual coefficient method (Allen et al., 2006).')],
   [T('El estado hídrico de la planta','Plant water status'),T('El potencial hídrico medido con cámara de presión expresa la tensión del agua en la vid: al alba se equilibra con el suelo; el de tallo al mediodía integra suelo y atmósfera y es más sensible a déficits leves. Las escalas del IVES, de UC ANR y de Uriarte et al. (2025) traducen el valor a niveles de déficit.','Water potential measured with a pressure chamber expresses water tension in the vine: predawn it equilibrates with the soil; midday stem potential integrates soil and atmosphere and is more sensitive to mild deficits. The IVES, UC ANR and Uriarte et al. (2025) scales translate the value into deficit levels.')],
   [T('Clima vitícola','Viticultural climate'),T('El índice heliotérmico de Huglin, el de frescor nocturno y el de sequía forman la clasificación climática multicriterio de Tonietto y Carbonneau (2004); los grados día de Winkler vienen de Amerine y Winkler (1944). Se desarrollaron para la viticultura templada.','The Huglin heliothermal index, the cool night index and the dryness index make up the multicriteria climatic classification of Tonietto and Carbonneau (2004); Winkler degree days come from Amerine and Winkler (1944). They were developed for temperate viticulture.')],
   [T('Diseño experimental y estadística','Experimental design and statistics'),T('Los tratamientos se comparan en bloques completos al azar: cada bloque recibe todos los tratamientos sorteados, y la variación entre bloques se separa del efecto del tratamiento. Ratio Vitis prepara el sorteo, el croquis y la plantilla de campo, y entrega los datos en el formato de AgriDesign y PhenologyPro (Barrera-Guzmán, 2026) para su análisis.','Treatments are compared in randomised complete blocks: each block receives all randomised treatments, and between-block variation is separated from the treatment effect. Ratio Vitis prepares the draw, the layout and the field sheet, and hands the data in AgriDesign and PhenologyPro format (Barrera-Guzmán, 2026) for analysis.')]];
  el.innerHTML = `${cabecera('teoria',T('Las ideas y las fuentes de Ratio Vitis.','The ideas and sources behind Ratio Vitis.'))}
  <div class="teoria">${sec.map((s,i)=>`<details ${i===0?'open':''}><summary>${s[0]}</summary><div class="tb"><p>${s[1]}</p></div></details>`).join('')}</div>
  <div class="card"><h2>${T('Referencias','References')}</h2><ol>${REFS.map(r=>`<li>${esc(r)}</li>`).join('')}</ol></div>
  <div class="card"><h3>${T('Alcances y límites','Scope and limits')}</h3><ul>
   <li>${T('Los coeficientes de cultivo son los de FAO-56; en uva de mesa del noroeste de México, Er-Raki et al. (2013) midieron valores menores, por lo que un viñedo con medición propia debe preferirla.','Crop coefficients are FAO-56’s; in table grapes of Northwest Mexico, Er-Raki et al. (2013) measured lower values, so a vineyard with its own measurement should prefer it.')}</li>
   <li>${T('El balance supone escurrimiento y ascenso capilar nulos.','The balance assumes zero runoff and capillary rise.')}</li>
   <li>${T('Las regiones de Winkler y las clases de la temperatura media de la temporada se mostrarán cuando estén verificadas contra su fuente.','Winkler regions and growing-season temperature classes will be shown once verified against their source.')}</li></ul></div>
  ${siguiente('teoria')}`; }

/* ================= PROYECTO: guardar y abrir ================= */
function guardarProyecto(){ descargar(slug()+'.vitis.json', JSON.stringify(Object.assign({app:'Ratio Vitis', version:CONFIG.version}, S), null, 1), 'application/json'); }
function abrirProyecto(file){ const r=new FileReader(); r.onload=()=>{ try{ const g=JSON.parse(r.result); if(!g.formato) throw 0; S=fusionar(estadoInicial(), g); guardar(); render(); toast(T('Proyecto abierto','Project opened')); }catch(e){ toast(T('No es un archivo de Ratio Vitis','Not a Ratio Vitis file')); } }; r.readAsText(file); }

/* ================= NAVEGACIÓN ================= */
function renderNav(){ $('#nav').innerHTML = BLOQUES.map(b=>{ const a=EJ?null:avance(b.id);
    return `<button class="${S.bloque===b.id?'act':''} ${a?'est-'+a.estado:''}" data-ir="${b.id}" ${a?`title="${esc(a.h+' / '+a.t+' · '+a.txt)}"`:''}><span class="n">${b.n}</span>${esc(tx(b.corto))}${a?`<i class="nav-est" aria-hidden="true"></i>`:''}</button>`; }).join('');
  const a=$('#nav .act'); if(a&&a.scrollIntoView) a.scrollIntoView({block:'nearest',inline:'center'});
  if(EJ){ $('#progTxt').textContent=T('Ejemplo · no son tus datos','Example · not your data'); $('#progFill').style.width='0%'; return; }
  const f=avanceTotal(), hechos=BLOQUES_LLENAR.filter(k=>avance(k).estado==='ok').length;
  $('#progTxt').textContent=T(`Llenado por ti: ${Math.round(100*f)} % · ${hechos} de ${BLOQUES_LLENAR.length} bloques completos`,`Filled in by you: ${Math.round(100*f)} % · ${hechos} of ${BLOQUES_LLENAR.length} blocks complete`); $('#progFill').style.width=(100*f)+'%'; }
function actualizarPill(){ const l=locSel(), v=S.vina; $('#pillTxt').textContent=!v.tipo&&!v.variedad&&!l?T('Viñedo nuevo · sin datos aún','New vineyard · no data yet'):[v.variedad||(v.tipo?tx(TIPOS_UVA.find(t=>t.id===v.tipo).n):''), l?l[1]:''].filter(Boolean).join(' · '); }
function renderAyuda(){ $('#dlgAyuda').innerHTML=`<div class="dh"><h2>${T('Cómo usar Ratio Vitis','How to use Ratio Vitis')}</h2><button class="ibtn round" onclick="this.closest('dialog').close()" aria-label="×">✕</button></div>
  <div class="db"><ol><li>${T('<b>Avanza en orden</b>: viñedo y experimento, suelo, clima y RASPA.','<b>Move in order</b>: vineyard and trial, soil, climate and SPAC.')}</li>
  <li>${T('Los signos <b>?</b> explican cada variable, de dónde sale y cómo se interpreta.','The <b>?</b> signs explain each variable, where it comes from and how to read it.')}</li>
  <li>${T('<b>Productor / Científico</b> cambia la vista; <b>ES / EN</b> el idioma; ☀/☾ el tema.','<b>Producer / Scientist</b> switches view; <b>ES / EN</b> language; ☀/☾ theme.')}</li>
  <li>${T('Tu trabajo se <b>guarda solo</b> en este navegador. Para llevarlo a otro equipo:','Your work is <b>saved automatically</b> in this browser. To move it to another device:')}
   <div class="row" style="gap:8px;margin-top:6px;flex-wrap:wrap"><button class="btn sm" onclick="guardarProyecto()">⤓ ${T('Guardar proyecto','Save project')}</button><label class="btn sm ghost"><input type="file" accept=".json" style="display:none" onchange="abrirProyecto(this.files[0])">⤒ ${T('Abrir proyecto','Open project')}</label></div></li></ol></div>`; }
function render(){ document.documentElement.lang=LANG; $$('.langsw button[data-lang]').forEach(b=>b.classList.toggle('on',b.dataset.lang===LANG));
  document.documentElement.setAttribute('data-modo',MODO); $$('.modesw button').forEach(b=>{ const on=b.dataset.vista===MODO; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
  $('#lblProd').textContent=T('Productor','Producer'); $('#lblCien').textContent=T('Científico','Scientist'); $('#brandSub').textContent=T('· el viñedo medido','· the measured vineyard');
  document.documentElement.classList.toggle('modo-ejemplo', EJ); franjaEjemplo();
  const b=B(S.bloque)||BLOQUES[0]; b.render()($('#main')); enlazarTips($('#main'));
  $('#pie').innerHTML=`<svg style="width:26px;height:26px;vertical-align:middle;margin-right:6px"><use href="#i-logo"/></svg><b>Ratio Vitis</b> ${CONFIG.version} · Ratio Complexus · ${esc(CONFIG.autores)} · ${CONFIG.anio}<br><span class="tiny">${T('Herramienta de apoyo a la decisión: los resultados dependen de los datos capturados. Licencia MIT.','Decision-support tool: results depend on the data entered. MIT licence.')}</span>`;
  renderNav(); actualizarPill(); renderAyuda(); }
function irA(id){ S.visitados[S.bloque]=true; S.bloque=id; guardar(); render(); scrollTo({top:0,behavior:'smooth'}); }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-ir]'); if(t) irA(t.dataset.ir); });
function ponerModo(m){ MODO=m==='cien'?'cien':'prod'; try{ localStorage.setItem('vitis_modo',MODO); }catch(e){} render();
  toast(MODO==='cien'?T('Vista científica: fórmulas, tablas y validación','Scientist view: formulas, tables and validation'):T('Vista productor: lo esencial, en lenguaje sencillo','Producer view: the essentials in plain language')); }
document.addEventListener('click',e=>{ const t=e.target.closest('[data-vista]'); if(t) ponerModo(t.dataset.vista); });
$$('.langsw button[data-lang]').forEach(b=>b.addEventListener('click',()=>{ LANG=b.dataset.lang; try{ localStorage.setItem('vitis_lang',LANG); }catch(e){} render(); toast(LANG==='en'?'English':'Español'); }));
function aplicarTema(t){ if(t) document.documentElement.setAttribute('data-theme',t); else document.documentElement.removeAttribute('data-theme');
  const dark=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches; $('#btnTema').textContent=dark?'☾':'☀'; }
$('#btnTema').addEventListener('click',()=>{ const cur=document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); const nt=cur==='dark'?'light':'dark'; aplicarTema(nt); try{ localStorage.setItem('vitis_tema',nt); }catch(e){} });
$('#btnAyuda').addEventListener('click',()=>{ const d=$('#dlgAyuda'); if(d.showModal) d.showModal(); });
try{ aplicarTema(localStorage.getItem('vitis_tema')); }catch(e){ aplicarTema(null); }
S = cargar();
/* Enlace directo a un bloque: #raspa, #clima/cien, #validacion/prod/en */
function aplicarHash(){ const h=decodeURIComponent(location.hash.slice(1)).split('/'); if(h[0]&&BLOQUES.some(b=>b.id===h[0])) S.bloque=h[0]; if(h[1]==='cien'||h[1]==='prod') MODO=h[1]; if(h[2]==='en'||h[2]==='es') LANG=h[2]; }
aplicarHash();
addEventListener('hashchange',()=>{ aplicarHash(); render(); scrollTo(0,0); });
let _temaPrevio=null, _cerrados=[];
addEventListener('beforeprint',()=>{ _temaPrevio=document.documentElement.getAttribute('data-theme'); document.documentElement.setAttribute('data-theme','light'); _cerrados=$$('.teoria details:not([open])'); _cerrados.forEach(d=>d.open=true); });
addEventListener('afterprint',()=>{ if(_temaPrevio) document.documentElement.setAttribute('data-theme',_temaPrevio); else document.documentElement.removeAttribute('data-theme'); _cerrados.forEach(d=>d.open=false); _cerrados=[]; });
render();
