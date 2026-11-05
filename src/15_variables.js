"use strict";
/* =====================================================================
   VARIABLES DEL ESTUDIO · cada caso de estudio enciende o apaga las variables
   que puede obtener. Una variable apagada se oculta en su bloque, no cuenta en el
   avance y los motores la tratan como faltante (FAO-56 usa entonces sus
   estimaciones: humedad desde Tmín, viento de 2 m s⁻¹, radiación por Hargreaves).
   d = dificultad sin instrumentos: f fácil · m media · x requiere instrumento.
   campos: rutas data-s · cols: rutas data-sp con * por unidad · sec: tarjeta «N.N».
   ===================================================================== */
const VARS = [
  {id:'portainjerto', b:'vina', d:'f', n:E('Portainjerto','Rootstock'), o:E('Registro del vivero.','Nursery record.'), campos:['vina.portainjerto']},
  {id:'anioPlant', b:'vina', d:'f', n:E('Año de plantación','Planting year'), o:E('Registro del productor.','Grower record.'), campos:['vina.anioPlant']},
  {id:'conduccion', b:'vina', d:'f', n:E('Sistema de conducción','Training system'), o:E('Observación.','Observation.'), campos:['vina.conduccion']},
  {id:'da', b:'suelo', d:'f', n:E('Densidad aparente','Bulk density'), o:E('Cilindro o lata de volumen conocido, secado y báscula.','Cylinder or can of known volume, drying and scale.'), campos:['suelo.da','suelo.daMasa','suelo.daVol']},
  {id:'ccpmp', b:'suelo', d:'x', n:E('Capacidad de campo y punto de marchitez','Field capacity and wilting point'), o:E('Si la apagas, se estiman con la textura (FAO-56, Cuadro 19).','If off, they are estimated from texture (FAO-56, Table 19).'), campos:['suelo.cc','suelo.pmp']},
  {id:'zerew', b:'suelo', d:'x', n:E('Capa evaporante y agua fácilmente evaporable','Evaporating layer and readily evaporable water'), o:E('Si la apagas: 0.10 m y el centro del rango del Cuadro 19 (FAO-56).','If off: 0.10 m and the centre of the Table 19 range (FAO-56).'), campos:['suelo.ze','suelo.rew']},
  {id:'infil', b:'suelo', d:'f', n:E('Infiltración','Infiltration'), o:E('Lata sin fondo enterrada, agua y cronómetro.','Bottomless can, water and stopwatch.'), campos:['suelo.infVol','suelo.infT']},
  {id:'ph', b:'suelo', d:'m', n:E('pH del suelo','Soil pH'), o:E('Tiras o medidor de bolsillo.','Strips or pocket meter.'), campos:['suelo.ph']},
  {id:'ce', b:'suelo', d:'m', n:E('Conductividad eléctrica (CEe)','Electrical conductivity (ECe)'), o:E('Medidor de bolsillo.','Pocket meter.'), campos:['suelo.ce']},
  {id:'mo', b:'suelo', d:'x', n:E('Materia orgánica','Organic matter'), o:E('Laboratorio.','Laboratory.'), campos:['suelo.mo']},
  {id:'hr', b:'clima', d:'m', n:E('Humedad relativa','Relative humidity'), o:E('Higrómetro barato. Si la apagas, la presión de vapor se estima con Tmín (FAO-56).','Cheap hygrometer. If off, vapour pressure is estimated from Tmin (FAO-56).')},
  {id:'viento', b:'clima', d:'x', n:E('Velocidad del viento','Wind speed'), o:E('Anemómetro. Si la apagas, se usan 2 m s⁻¹ (FAO-56).','Anemometer. If off, 2 m s⁻¹ is used (FAO-56).')},
  {id:'rad', b:'clima', d:'x', n:E('Radiación solar u horas de sol','Solar radiation or sunshine hours'), o:E('Piranómetro. Si la apagas, se estima con las temperaturas (Hargreaves, FAO-56).','Pyranometer. If off, it is estimated from temperatures (Hargreaves, FAO-56).')},
  {id:'fc', b:'raspa', d:'f', n:E('Fracción cubierta por el dosel','Canopy cover fraction'), o:E('La sombra al mediodía, a ojo.','Midday shade, by eye.'), campos:['raspa.fc']},
  {id:'riegos', b:'raspa', d:'f', n:E('Riegos aplicados','Irrigation applied'), o:E('Caudal del gotero × horas × goteros ÷ área.','Emitter flow × hours × emitters ÷ area.'), sec:'4.2'},
  {id:'psi', b:'raspa', d:'x', n:E('Potencial hídrico','Water potential'), o:E('Cámara de presión. Sin ella, el estrés se lee con el coeficiente Ks del balance.','Pressure chamber. Without it, stress is read from the balance Ks coefficient.'), sec:'4.4'},
  {id:'feno', b:'raspa', d:'f', n:E('Fechas fenológicas','Phenological dates'), o:E('Observación: floración, cuajado, envero y cosecha.','Observation: flowering, fruit set, veraison and harvest.'), sec:'4.5'},
  {id:'fsuelo', b:'fert', d:'x', n:E('Análisis químico del suelo','Soil chemical analysis'), o:E('Laboratorio.','Laboratory.'), sec:'5.1'},
  {id:'foliar', b:'fert', d:'x', n:E('Análisis foliar','Leaf analysis'), o:E('Laboratorio.','Laboratory.'), sec:'5.2'},
  {id:'abonos', b:'fert', d:'f', n:E('Abonos y dosis','Manures and rates'), o:E('Registro del productor.','Grower record.'), sec:'5.3'},
  {id:'poda', b:'bio', d:'f', n:E('Peso de poda','Pruning weight'), o:E('Báscula.','Scale.'), cols:['bio.datos.*.poda']},
  {id:'af', b:'bio', d:'m', n:E('Área foliar','Leaf area'), o:E('Contar hojas y medirlas con regla (protocolo indirecto, HortScience 1993).','Count leaves and measure them with a ruler (indirect protocol, HortScience 1993).'), cols:['bio.datos.*.af']},
  {id:'ndvi', b:'bio', d:'m', n:E('NDVI','NDVI'), o:E('Imagen de satélite gratuita o sensor de mano.','Free satellite image or handheld sensor.'), cols:['bio.datos.*.ndvi']},
  {id:'sarm', b:'bio', d:'f', n:E('Crecimiento del sarmiento','Shoot growth'), o:E('Cinta métrica.','Tape measure.'), sec:'6.2'},
  {id:'carbono', b:'bio', d:'m', n:E('Materia seca, carbono y respiración','Dry matter, carbon and respiration'), o:E('Horno de secado y trampas de álcali.','Drying oven and alkali traps.'), sec:'6.3'},
  {id:'racimos', b:'prod', d:'f', n:E('Racimos por planta','Bunches per vine'), o:E('Conteo.','Count.'), cols:['prod.datos.*.racimos']},
  {id:'baya', b:'prod', d:'f', n:E('Peso de baya','Berry weight'), o:E('Báscula de cocina.','Kitchen scale.'), cols:['prod.datos.*.baya']},
  {id:'brix', b:'prod', d:'m', n:E('Sólidos solubles (°Brix)','Soluble solids (°Brix)'), o:E('Refractómetro barato.','Cheap refractometer.'), cols:['prod.datos.*.brix']},
  {id:'acidez', b:'prod', d:'m', n:E('Acidez titulable','Titratable acidity'), o:E('Titulación o kit.','Titration or kit.'), cols:['prod.datos.*.acidez']},
  {id:'phm', b:'prod', d:'m', n:E('pH del mosto','Must pH'), o:E('Tiras o medidor de bolsillo.','Strips or pocket meter.'), cols:['prod.datos.*.ph']}
];
const DIF = {f:{n:E('Fácil','Easy'),c:'ok'}, m:{n:E('Media','Medium'),c:'warn'}, x:{n:E('Con instrumento','Needs an instrument'),c:'bad'}};
const varOn = id=> !((S&&S.varsOff)||{})[id];
/* Oculta en el bloque lo que el estudio apagó y deja una franja para cambiarlo */
function aplicarVariables(id, el){ const off=VARS.filter(v=>v.b===id&&!varOn(v.id)); if(!off.length) return;
  off.forEach(v=>{ (v.campos||[]).forEach(p=>$$(`[data-s="${p}"]`,el).forEach(i=>{ const l=i.closest('label')||i; l.style.display='none'; }));
    (v.cols||[]).forEach(p=>{ const re=new RegExp('^'+p.replace(/\./g,'\\.').replace('*','[^.]+')+'$');
      $$('[data-sp]',el).filter(i=>re.test(i.dataset.sp)).forEach(i=>{ const td=i.closest('td'), tb=td&&td.closest('table'); if(!tb) return; const k=td.cellIndex;
        $$('tr',tb).forEach(tr=>{ if(tr.cells[k]) tr.cells[k].style.display='none'; }); }); });
    if(v.sec) $$('.card',el).forEach(c=>{ const h=c.querySelector('h2'); if(h&&h.textContent.trim().startsWith(v.sec+' ')) c.style.display='none'; }); });
  const cab=$('.hero',el)||el.firstElementChild; if(cab) cab.insertAdjacentHTML('afterend',`<div class="alert info vars-off no-print"><p>${T('Apagadas para este estudio','Turned off for this study')}: <b>${off.map(v=>esc(tx(v.n))).join(' · ')}</b>. <a href="#vina" data-ir="vina" data-varpanel>${T('Cambiar','Change')}</a></p></div>`); }
/* Panel de selección (al final del Bloque 1) */
function panelVariables(){ const g={}; VARS.forEach(v=>(g[v.b]=g[v.b]||[]).push(v)); const nOff=VARS.filter(v=>!varOn(v.id)).length;
  return `<div class="card" id="panelVars"><h2>${T('1.4 Variables del estudio','1.4 Study variables')}</h2>
    <p>${T('Enciende las variables que puedes obtener en tu caso de estudio y apaga las demás. Las apagadas se ocultan en su bloque y no cuentan en tu avance; cuando hay una estimación publicada (FAO-56), la app la usa en su lugar.','Turn on the variables you can obtain in your case study and turn off the rest. Those turned off are hidden in their block and do not count in your progress; when a published estimate exists (FAO-56), the app uses it instead.')}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><button class="btn sm" data-vpre="todas">${T('Todas','All')}</button><button class="btn sm" data-vpre="faciles">${T('Solo las que no necesitan instrumento','Only those needing no instrument')}</button><span class="nota">${VARS.length-nOff} ${T('de','of')} ${VARS.length} ${T('encendidas','on')}</span></div>
    <div class="vars-grid">${Object.entries(g).map(([b,l])=>`<div><h4>${esc(B(b).n)}. ${esc(tx(B(b).corto))}</h4>${l.map(v=>`<label class="var-row"><input type="checkbox" data-var="${v.id}" ${varOn(v.id)?'checked':''}><span><b>${esc(tx(v.n))}</b> <span class="badge ${DIF[v.d].c}">${esc(tx(DIF[v.d].n))}</span><br><small class="muted">${esc(tx(v.o))}</small></span></label>`).join('')}</div>`).join('')}</div>
    <p class="nota">${T('Lo básico del viñedo, la textura, la profundidad de raíces, Tmáx, Tmín, lluvia, la brotación y el rendimiento siempre están encendidos: sin ellos no hay balance ni resultados.','Vineyard basics, texture, rooting depth, Tmax, Tmin, rain, budburst and yield are always on: without them there is no balance and no results.')}</p></div>`; }
document.addEventListener('change',e=>{ const c=e.target.closest&&e.target.closest('[data-var]'); if(!c||EJ) return; S.varsOff=S.varsOff||{}; if(c.checked) delete S.varsOff[c.dataset.var]; else S.varsOff[c.dataset.var]=true; guardar(); render(); });
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-vpre]'); if(b&&!EJ){ S.varsOff={}; if(b.dataset.vpre==='faciles') VARS.filter(v=>v.d!=='f').forEach(v=>S.varsOff[v.id]=true); guardar(); render(); }
  if(e.target.closest&&e.target.closest('[data-varpanel]')) setTimeout(()=>{ const p=$('#panelVars'); if(p) p.scrollIntoView({behavior:'smooth'}); },60); });
