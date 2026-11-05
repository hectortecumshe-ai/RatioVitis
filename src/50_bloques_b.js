"use strict";
/* =====================================================================
   7. BLOQUES · 3 Clima, 4 RASPA · con gráficas propias en SVG
   ===================================================================== */
/* Serie diaria: barras (lluvia, riego) y líneas (ET0, ETc, Dr…) con eje de fechas */
function serieDiaria(dias, cfg){ const W=980, H=cfg.h||300, L=52, R=cfg.der?52:16, Tp=34, B=34, n=dias.length; if(!n) return '';
  const x=i=>L+(i+.5)*(W-L-R)/n, bw=Math.max(1,(W-L-R)/n*.8);
  const vals=cfg.series.flatMap(s=>dias.map(s.f)).concat((cfg.barras||[]).flatMap(b=>dias.map(b.f))).filter(v=>v!=null&&isFinite(v));
  const hi=cfg.max!=null?cfg.max:Math.max(1,...vals)*1.08, lo=cfg.min!=null?cfg.min:0, y=v=>Tp+(H-Tp-B)*(1-(v-lo)/(hi-lo));
  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cfg.titulo||'')}">`;
  const paso=Math.pow(10,Math.floor(Math.log10((hi-lo)/4||1))), dv=[1,2,5,10].map(k=>k*paso).find(d=>(hi-lo)/d<=6)||paso*10;
  for(let v=Math.ceil(lo/dv)*dv; v<=hi; v+=dv) s+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${L-6}" y="${y(v)+4}" text-anchor="end" font-size="11" class="m">${fmt(v,dv<1?1:0)}</text>`;
  (cfg.bandas||[]).forEach(bd=>{ s+=`<path d="${dias.map((d,i)=>`${i?'L':'M'}${x(i)} ${y(bd.f(d))}`).join('')}" fill="none" stroke="${bd.c}" stroke-width="1.5" stroke-dasharray="5 4"/>`; });
  (cfg.barras||[]).forEach(bd=>{ dias.forEach((d,i)=>{ const v=bd.f(d); if(v>0) s+=`<rect x="${x(i)-bw/2}" y="${y(v)}" width="${bw}" height="${y(lo)-y(v)}" fill="${bd.c}" opacity=".75" data-tip="${esc(d.f+' · '+bd.n+': '+fmt(v,1)+' mm')}"/>`; }); });
  cfg.series.forEach(se=>{ const pts=dias.map((d,i)=>[x(i),se.f(d)]).filter(p=>p[1]!=null); s+=`<path class="dibuja" d="${pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="${se.c}" stroke-width="${se.w||2}" style="--l:4000;stroke-dasharray:4000"/>`; });
  const meses=[]; dias.forEach((d,i)=>{ if(i===0||d.f.slice(8)==='01') meses.push(i); }); const salto=Math.max(1,Math.ceil(meses.length/12));
  meses.filter((_,k)=>k%salto===0).forEach(i=>{ s+=`<text x="${x(i)}" y="${H-12}" font-size="11" class="m">${MESES()[+dias[i].f.slice(5,7)-1]} ${dias[i].f.slice(2,4)}</text>`; });
  s+=`<g font-size="12">${cfg.series.concat(cfg.barras||[]).concat(cfg.bandas||[]).map((se,k)=>`<g transform="translate(${L+8+k*170} 4)"><rect width="12" height="4" y="5" fill="${se.c}"/><text x="16" y="11" class="m">${esc(se.n)}</text></g>`).join('')}</g>`;
  return s+'</svg>'; }
/* Anillo partido: transpiración (pasa por la vid) contra evaporación del suelo (no pasa) */
function anilloAgua(E, Tr){ const tot=E+Tr; if(!(tot>0)) return ''; const fe=E/tot, R=88, C=110, a=2*Math.PI*fe, x=C+R*Math.sin(a), y=C-R*Math.cos(a);
  return `<svg class="chart anillo" viewBox="0 0 220 220" style="max-width:240px;margin:auto;display:block" role="img" aria-label="${T('Reparto del agua evapotranspirada','Evapotranspired water split')}">
   <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#4f7d3a" stroke-width="26"/>
   <path d="M${C} ${C-R} A${R} ${R} 0 ${fe>.5?1:0} 1 ${x.toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="#c0772b" stroke-width="26"/>
   <text x="${C}" y="${C-4}" text-anchor="middle" font-size="34" font-weight="700" fill="var(--text)">${fmt(100*fe,0)}%</text>
   <text x="${C}" y="${C+20}" text-anchor="middle" font-size="12" class="m">${T('no pasa por la vid','skips the vine')}</text></svg>`; }

/* ================= BLOQUE 3 · CLIMA ================= */
function renderClima(el){ const st=sitio(), dd=S.clima.dias, hay=dd.length>0;
  const dE = hay&&st.ok ? CLIMA.conET0(dd, st) : [], idx = hay&&st.ok ? CLIMA.indices(dd, st.lat) : [], men = dE.length ? CLIMA.mensual(dE) : [];
  const etMed = dE.length ? dE.reduce((s,d)=>s+d.r.et0,0)/dE.length : null, etMax = dE.length ? Math.max(...dE.map(d=>d.r.et0)) : null;
  const cols = hay ? ['tmax','tmin','hrmax','hrmin','hrmed','u2','rs','n','prec','tdew'].filter(k=>dd.some(d=>d[k]!=null)) : [];
  el.innerHTML = `${cabecera('clima',T('La atmósfera pide agua y el sol da la energía. Con los registros diarios de tu estación, Ratio Vitis calcula la evapotranspiración de referencia de cada día por FAO Penman–Monteith y los índices vitícolas de tu temporada.','The atmosphere demands water and the sun provides the energy. From your station’s daily records, Ratio Vitis computes each day’s reference evapotranspiration by FAO Penman–Monteith and your season’s viticultural indices.'))}
  <div class="card"><h2>${T('3.1 Registros diarios','3.1 Daily records')}</h2>
    <p class="nota">${T('Archivo CSV con una fila por día. Columnas reconocidas: fecha, tmax, tmin (obligatorias) y, si las tienes, hrmax, hrmin o hr, u2 o viento (m s⁻¹ a 2 m), rs (MJ m⁻² d⁻¹) o n (horas de sol), prec (mm) y tdew. Lo que falte se estima como indica FAO-56 y la app te dice cómo.','CSV file with one row per day. Recognised columns: date, tmax, tmin (required) and, if available, hrmax, hrmin or hr, u2 or wind (m s⁻¹ at 2 m), rs (MJ m⁻² d⁻¹) or n (sunshine hours), prec (mm) and tdew. Missing data are estimated as FAO-56 indicates and the app tells you how.')}</p>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><label class="btn"><input type="file" id="fClima" accept=".csv,.txt" style="display:none">⤒ ${T('Importar CSV de clima','Import climate CSV')}</label>${hay?`<button class="btn ghost" id="bPheno">⤓ ${T('CSV para PhenologyPro','CSV for PhenologyPro')}</button><button class="btn ghost" id="bBorrarClima">${T('Quitar registros','Remove records')}</button>`:''}</div>
    ${campo('clima.fuente',T('Fuente de los datos','Data source'),{tipo:'texto',ph:T('p. ej., estación automática del viñedo, SMN o CONAGUA','e.g., vineyard automatic station, SMN or CONAGUA')})}
    ${hay?`<p>${T('Días','Days')}: <b>${dd.length}</b> · ${esc(dd[0].f)} ${T('a','to')} ${esc(dd[dd.length-1].f)} · ${T('columnas','columns')}: ${cols.join(', ')}</p>`:`<p class="sindato">${T('Aún no hay registros de clima.','No climate records yet.')}</p>`}
    ${hay&&!st.ok?`<p class="alert warn">${T('Para calcular la ET0 falta la latitud y la altitud del sitio (Bloque 1).','Site latitude and altitude are needed to compute ET0 (Block 1).')} <button class="btn sm" data-ir="vina">${T('Ir al Bloque 1','Go to Block 1')}</button></p>`:''}</div>
  ${dE.length?`<div class="card"><h2>${T('3.2 Demanda de la atmósfera','3.2 Atmospheric demand')}${ayuda('et0')}</h2>
    <div class="kpis"><div class="kpi"><div class="l">${T('ET0 media','Mean ET0')}</div><div class="v">${fmt(etMed,2)}</div><div class="s">mm d⁻¹ · ${esc(tx(CLIMA.claseET0(etMed).t))}</div></div>
      <div class="kpi"><div class="l">${T('ET0 máxima','Maximum ET0')}</div><div class="v">${fmt(etMax,2)}</div><div class="s">mm d⁻¹ · ${esc(tx(CLIMA.claseET0(etMax).t))}</div></div>
      <div class="kpi"><div class="l">${T('ET0 acumulada','Cumulative ET0')}</div><div class="v">${fmt(dE.reduce((s,d)=>s+d.r.et0,0),0)}</div><div class="s">mm</div></div>
      <div class="kpi"><div class="l">${T('Lluvia acumulada','Cumulative rain')}</div><div class="v">${dd.some(d=>d.prec!=null)?fmt(dd.reduce((s,d)=>s+(d.prec||0),0),0):'—'}</div><div class="s">mm</div></div></div>
    ${serieDiaria(dE,{titulo:'ET0',series:[{n:'ET0 (mm d⁻¹)',c:'#c0772b',f:d=>d.r.et0}],barras:dd.some(d=>d.prec!=null)?[{n:T('Lluvia (mm)','Rain (mm)'),c:'#3f6fb0',f:d=>d.prec}]:[]})}
    <p class="nota">${T('Cómo se obtuvo cada término (primer día)','How each term was obtained (first day)')}: Rs ${esc(dE[0].r.mrs)} · u2 ${esc(dE[0].r.mu)} · ea ${esc(dE[0].r.mea)}.</p>
    <div class="sci"><div class="tbl-c"><table class="tbl"><thead><tr><th>${T('Mes','Month')}</th><th>${T('Días','Days')}</th><th>Tmáx</th><th>Tmín</th><th>${T('Lluvia','Rain')} (mm)</th><th>ET0 (mm)</th><th>P/ET0${ayuda('pe')}</th></tr></thead><tbody>
      ${men.map(m=>`<tr><td>${esc(m.mes)}</td><td>${m.n}</td><td>${fmt(m.tmax,1)}</td><td>${fmt(m.tmin,1)}</td><td>${m.prec!=null?fmt(m.prec,0):'—'}</td><td>${fmt(m.et0,0)}</td><td>${m.pe!=null?`<span class="badge ${m.pe>=1?'ok':m.pe<0.5?'bad':'warn'}">${fmt(m.pe,2)}</span>`:'—'}</td></tr>`).join('')}</tbody></table></div>
      <p class="nota">ET0 = [0.408 Δ (Rn − G) + γ 900/(T + 273) u2 (es − ea)] / [Δ + γ (1 + 0.34 u2)] · FAO-56, Ec. 6.</p></div>
    ${fuente('Allen et al. (2006), FAO Riego y Drenaje 56.')}</div>
  <div class="card"><h2>${T('3.3 Índices vitícolas','3.3 Viticultural indices')}</h2>
    <div class="tbl-c"><table class="tbl"><thead><tr><th>${T('Temporada','Season')}</th><th>Huglin${ayuda('huglin')}</th><th>${T('Frescor nocturno','Cool nights')}${ayuda('ci')}</th><th>Winkler${ayuda('winkler')}</th><th>GST (°C)</th></tr></thead><tbody>
      ${idx.map(r=>{ const ch=CLIMA.clase(CLIMA.CLASE_HI,r.HI), cc=CLIMA.clase(CLIMA.CLASE_CI,r.CI);
        return `<tr><td>${r.anio}</td><td>${r.cobH>=0.9?`<b>${fmt(r.HI,0)}</b><br><small>${esc(tx(ch[1]))}</small>`:`<span class="sindato">${T('cobertura','coverage')} ${fmt(100*r.cobH,0)} %</span>`}</td>
          <td>${r.nCI>=27?`<b>${fmt(r.CI,1)} °C</b><br><small>${esc(tx(cc[1]))}</small>`:`<span class="sindato">${r.nCI} ${T('días de septiembre','September days')}</span>`}</td>
          <td>${r.cobW>=0.9?`<b>${fmt(r.W,0)}</b> °C·d`:`<span class="sindato">${T('cobertura','coverage')} ${fmt(100*r.cobW,0)} %</span>`}</td><td>${r.cobW>=0.9?fmt(r.GST,1):'—'}</td></tr>`; }).join('')}</tbody></table></div>
    <p class="nota">${T('Un índice se calcula solo si su periodo tiene al menos 90 % de los días. Se desarrollaron para la viticultura templada; en climas sin invierno marcado se leen con cautela.','An index is computed only when its period has at least 90 % of the days. They were developed for temperate viticulture; in climates without a marked winter, read them with caution.')} ${marcaInterp(T('Criterio de cobertura de Ratio Vitis','Ratio Vitis coverage criterion'))}</p>
    ${fuente('Tonietto y Carbonneau (2004), Agricultural and Forest Meteorology 124: 81–97; Amerine y Winkler (1944).')}</div>`:''}
  ${siguiente('clima')}`;
  $('#fClima',el).onchange=ev=>{ const f=ev.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ const res=CLIMA.leerCSV(String(r.result));
    if(res.err==='columnas') return toast(T('No encontré las columnas fecha, tmax y tmin','Columns date, tmax and tmin not found'));
    if(res.err) return toast(T('El archivo está vacío','The file is empty'));
    S.clima.dias=res.dias; guardar(); render(); toast(T(`${res.dias.length} días importados`,`${res.dias.length} days imported`)+(res.malas?T(` · ${res.malas} filas descartadas`,` · ${res.malas} rows skipped`):'')); }; r.readAsText(f); };
  const bp=$('#bPheno',el); if(bp) bp.onclick=()=>descargar(slug()+'_clima_phenologypro.csv', CLIMA.csvPhenology(dd), 'text/csv');
  const bb=$('#bBorrarClima',el); if(bb) bb.onclick=()=>{ if(bb.dataset.ok){ S.clima.dias=[]; guardar(); render(); } else { bb.dataset.ok=1; bb.textContent=T('¿Seguro? Toca otra vez','Sure? Tap again'); } }; }

/* ================= BLOQUE 4 · RASPA ================= */
function renderRaspa(el){ const r=S.raspa, res=RASPA.correr(), uv=tipoUva();
  el.innerHTML = `${cabecera('raspa',T('El agua entra por la lluvia y el riego, se guarda en el suelo, sube por la vid y sale a la atmósfera. Aquí se sigue día a día con el coeficiente dual de FAO-56: cuánto transpira la vid, cuánto se evapora del suelo y cuándo empieza el estrés.','Water arrives as rain and irrigation, is stored in the soil, rises through the vine and leaves to the atmosphere. Here it is followed day by day with the FAO-56 dual coefficient: how much the vine transpires, how much evaporates from the soil and when stress begins.'))}
  <div class="card"><h2>${T('4.1 Etapas del ciclo','4.1 Crop stages')}${ayuda('kcb')}</h2>
    <div class="grid g2"><label class="f"><span>${T('Duración de etapas (FAO-56, Cuadro 11)','Stage lengths (FAO-56, Table 11)')}</span><select data-s="raspa.etapas" class="${r.etapas?'':'vacio'}"><option value="" ${r.etapas?'':'selected'} disabled>${T('— Elige —','— Choose —')}</option>${FAO.ETAPAS_UVA.map(x=>`<option value="${x.id}" ${r.etapas===x.id?'selected':''}>${esc(tx(x.n))} · ${x.L.join('/')} ${T('días','days')}</option>`).join('')}</select></label>
      <label class="f"><span>${T('Fecha de brotación','Budburst date')}</span><input type="date" data-s="raspa.brot" value="${esc(r.brot)}"></label></div>
    ${uv?`<p class="nota">Kcb ${T('inicial, media y final','initial, mid and late')}: ${uv.kcb.join(' / ')} · p = ${uv.p} · h = ${uv.h} m (FAO-56, ${T('Cuadros 12, 17 y 22','Tables 12, 17 and 22')})${S.vina.tipo==='vino'?` · ${marcaInterp(T('h = 1.75 m, centro del rango 1.5–2 m','h = 1.75 m, centre of the 1.5–2 m range'))}`:''}</p>`:`<p class="sindato">${T('Elige el tipo de uva en el Bloque 1.','Choose the grape type in Block 1.')}</p>`}
    <label class="row sci" style="gap:8px;align-items:center"><input type="checkbox" data-s="raspa.ajustar" ${r.ajustar?'checked':''}><span>${T('Ajustar Kcb medio y final por viento y humedad (FAO-56, Ec. 70)','Adjust mid and late Kcb for wind and humidity (FAO-56, Eq. 70)')}</span></label>
    <div class="grid g2 sci">${campo('raspa.fc',T('Fracción de suelo cubierto fc (0–1)','Ground cover fraction fc (0–1)'),{nota:T('Vacío: se estima con la Ec. 76 de FAO-56.','Empty: estimated with FAO-56 Eq. 76.')})}${campo('raspa.dr0',T('Agotamiento inicial Dr (mm)','Initial depletion Dr (mm)'),{nota:T('Vacío: el suelo empieza a capacidad de campo.','Empty: soil starts at field capacity.')})}</div></div>
  <div class="card"><h2>${T('4.2 Riegos aplicados','4.2 Irrigations applied')}</h2>
    ${(r.riegos||[]).length?`<div class="tbl-c"><table class="tbl"><thead><tr><th>${T('Fecha','Date')}</th><th>${T('Lámina (mm)','Depth (mm)')}</th><th></th></tr></thead><tbody>${r.riegos.map((x,i)=>`<tr><td>${esc(x.f)}</td><td>${fmt(num(x.mm),1)}</td><td><button class="btn sm ghost" data-qriego="${i}">×</button></td></tr>`).join('')}</tbody></table></div>`:`<p class="sindato">${T('Sin riegos registrados.','No irrigations recorded.')}</p>`}
    <div class="row" style="gap:8px;align-items:flex-end;flex-wrap:wrap"><label class="f"><span>${T('Fecha','Date')}</span><input type="date" id="rgF"></label><label class="f"><span>${T('Lámina (mm)','Depth (mm)')}</span><input type="number" step="any" id="rgM" placeholder="${T('p. ej., 6','e.g., 6')}"></label><button class="btn sm" id="bRiego">＋ ${T('Agregar riego','Add irrigation')}</button></div>
    <p class="nota">${T('Lámina en mm sobre toda la superficie: litros por planta / (distancia entre hileras × distancia entre plantas).','Depth in mm over the whole area: litres per vine / (row spacing × vine spacing).')}</p></div>
  ${res.falta?`<div class="card vacio-res"><h2>${T('Para correr el balance falta','To run the balance you still need')}</h2><ul>${res.falta.map(f=>`<li>${esc(tx(f[1]))}</li>`).join('')}</ul></div>`:`
  <div class="card"><h2>${T('4.3 Balance hídrico diario','4.3 Daily water balance')}${ayuda('ks')}</h2>
    <div class="grid g2" style="align-items:center"><div>${anilloAgua(res.tot.E, res.tot.T)}<p class="nota" style="text-align:center"><span style="color:#4f7d3a">■</span> ${T('transpiración: pasa por la vid','transpiration: through the vine')} · <span style="color:#c0772b">■</span> ${T('evaporación del suelo','soil evaporation')}</p></div>
     <div><h3 style="margin-top:0">${T(`De cada 100 litros que se evapotranspiraron, ${fmt(100*res.fracE,0)} salieron del suelo sin pasar por la vid.`,`Of every 100 litres evapotranspired, ${fmt(100*res.fracE,0)} left the soil without passing through the vine.`)}${ayuda('fracE')}</h3>
      <div class="kpis"><div class="kpi"><div class="l">${T('Transpiración','Transpiration')}</div><div class="v">${fmt(res.tot.T,0)}</div><div class="s">mm</div></div><div class="kpi"><div class="l">${T('Evaporación del suelo','Soil evaporation')}</div><div class="v">${fmt(res.tot.E,0)}</div><div class="s">mm</div></div>
       <div class="kpi"><div class="l">${T('Días con estrés (Ks < 1)','Days with stress (Ks < 1)')}</div><div class="v">${res.diasEstres}</div><div class="s">${T('de','of')} ${res.dias} · Ks ${T('mín.','min.')} ${fmt(res.ksMin,2)}</div></div>
       <div class="kpi"><div class="l">${T('Agotamiento hoy (Dr)','Depletion today (Dr)')}</div><div class="v">${fmt(res.ultimo.Dr,0)}</div><div class="s">mm · ${T('riego neto para llenar','net irrigation to refill')}</div></div></div></div></div>
    ${serieDiaria(res.b,{titulo:'Dr',h:280,series:[{n:T('Agotamiento Dr','Depletion Dr'),c:'#8a3f5a',f:d=>d.Dr}],bandas:[{n:T('AFA (inicio de estrés)','RAW (stress onset)'),c:'#c0772b',f:d=>d.RAW},{n:'ADT',c:'#b05434',f:d=>d.TAW}],barras:[{n:T('Lluvia + riego','Rain + irrigation'),c:'#3f6fb0',f:d=>d.P+d.I}]})}
    ${serieDiaria(res.b,{titulo:'Kc',h:240,max:1.3,series:[{n:'Kcb',c:'#4f7d3a',f:d=>d.kcb},{n:'Ke',c:'#c0772b',f:d=>d.Ke},{n:'Ks',c:'#3f6fb0',f:d=>d.Ks}]})}
    <div class="sci"><p class="nota">Dr,i = Dr,i−1 − (P − RO) − I + ETc,aj + DP · ETc,aj = (Ks Kcb + Ke) ET0 · Ke = min[Kr (Kc,max − Kcb), few Kc,max] · ${T('FAO-56, Ec. 71, 80, 84 y 85','FAO-56, Eq. 71, 80, 84 and 85')}. ${marcaInterp(T('RO = 0 y CR = 0; con goteo, la lluvia moja toda la superficie (fw = 1)','RO = 0 and CR = 0; with drip, rain wets the whole surface (fw = 1)'))}</p>
     <p class="nota">ET0 ${fmt(res.tot.et0,0)} mm · ETc ${fmt(res.tot.etc,0)} mm · ${T('lluvia','rain')} ${fmt(res.tot.P,0)} mm · ${T('riego','irrigation')} ${fmt(res.tot.I,0)} mm · ${T('percolación','deep percolation')} ${fmt(res.tot.DP,0)} mm · ADT ${fmt(res.sh.adt,0)} mm · AET ${fmt(res.b[0].TEW,1)} mm · AFE ${fmt(res.sh.rew,1)} mm · fw ${res.fw}</p></div>
    ${fuente('Allen et al. (2006), FAO Riego y Drenaje 56, caps. 7 y 8.')}</div>`}
  <div class="card"><h2>${T('4.4 Potencial hídrico medido','4.4 Measured water potential')}</h2>
    ${(r.psi||[]).length?`<div class="tbl-c"><table class="tbl"><thead><tr><th>${T('Fecha','Date')}</th><th>${T('Medición','Measurement')}</th><th>MPa</th><th>IVES</th><th class="sci">UC ANR</th><th class="sci">Uriarte et al. (2025)</th><th></th></tr></thead><tbody>
      ${r.psi.map((x,i)=>{ const c=RASPA.psi(x.tipo, num(x.mpa)); const k=c&&c.ives?(c.ives[1]===1?'ok':c.ives[1]===4?'bad':'warn'):''; return `<tr><td>${esc(x.f)}</td><td>${x.tipo==='alba'?T('Hoja al alba','Predawn leaf'):T('Tallo al mediodía','Midday stem')}</td><td>${fmt(num(x.mpa),2)}</td><td>${c?`<span class="badge ${k}">${T('Clase','Class')} ${c.ives[1]} · ${esc(tx(c.ives[2]))}</span>`:'—'}</td><td class="sci">${c&&c.ucanr?esc(tx(c.ucanr[1])):'—'}</td><td class="sci">${c&&c.uriarte?esc(tx(c.uriarte[1])):'—'}</td><td><button class="btn sm ghost" data-qpsi="${i}">×</button></td></tr>`; }).join('')}</tbody></table></div>`:`<p class="sindato">${T('Sin mediciones con cámara de presión.','No pressure chamber measurements.')}</p>`}
    <div class="row" style="gap:8px;align-items:flex-end;flex-wrap:wrap"><label class="f"><span>${T('Fecha','Date')}</span><input type="date" id="psF"></label>
      <label class="f"><span>${T('Medición','Measurement')}</span><select id="psT"><option value="tallo">${T('Tallo al mediodía','Midday stem')}</option><option value="alba">${T('Hoja al alba','Predawn leaf')}</option></select></label>
      <label class="f"><span>MPa</span><input type="number" step="any" id="psV" placeholder="${T('p. ej., −0.8','e.g., −0.8')}"></label><button class="btn sm" id="bPsi">＋ ${T('Agregar','Add')}</button></div>
    <p class="nota">${ayuda('psiTallo')} ${T('Tallo','Stem')} · ${ayuda('psiAlba')} ${T('Alba','Predawn')} · ${T('Si tu cámara marca bar, divide entre 10 (1 bar = 0.1 MPa).','If your chamber reads bar, divide by 10 (1 bar = 0.1 MPa).')}</p>
    ${fuente('IVES Technical Reviews, «A few words on grapevine leaf water potential»; UC ANR, Using stem water potential for wine grape irrigation management; Uriarte et al. (2025).')}</div>
  ${seccionFeno()}
  ${siguiente('raspa')}`;
  $('#bRiego',el).onclick=()=>{ const f=$('#rgF',el).value, m=num($('#rgM',el).value); if(!f||m==null) return toast(T('Escribe fecha y lámina','Type date and depth')); S.raspa.riegos.push({f, mm:String(m)}); S.raspa.riegos.sort((a,b)=>a.f.localeCompare(b.f)); guardar(); render(); };
  $$('[data-qriego]',el).forEach(b=>b.onclick=()=>{ S.raspa.riegos.splice(+b.dataset.qriego,1); guardar(); render(); });
  $('#bPsi',el).onclick=()=>{ const f=$('#psF',el).value, v=num($('#psV',el).value); if(!f||v==null) return toast(T('Escribe fecha y valor','Type date and value')); S.raspa.psi.push({f, tipo:$('#psT',el).value, mpa:String(v>0?-v:v)}); S.raspa.psi.sort((a,b)=>a.f.localeCompare(b.f)); guardar(); render(); };
  $$('[data-qpsi]',el).forEach(b=>b.onclick=()=>{ S.raspa.psi.splice(+b.dataset.qpsi,1); guardar(); render(); }); }
