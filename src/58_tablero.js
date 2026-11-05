"use strict";
/* =====================================================================
   BLOQUE 11 · TABLERO DEL VIÑEDO
   Una sola vista con lo que ya calcularon los bloques 1 a 10: indicadores clave, semáforo
   (cada lectura con la clase de su fuente, ya cotejada en su bloque), a dónde se fue el agua,
   comparación entre tratamientos y la red en números. No calcula nada nuevo ni inventa
   umbrales: si falta un dato, dice dónde se captura.
   ===================================================================== */
function renderTablero(el){ const red=RED.construir(), v=red.val, r=v._r, ok=r&&!r.falta, U=unidades(), den=densidad(), area=num(S.vina.entre)*num(S.vina.sobre);
  const sd=`<span class="sindato">${T('sin dato','no data')}</span>`, f=(x,d,u)=>x!=null&&isFinite(x)?fmt(x,d)+(u?' '+u:''):'—';
  const kpi=(l,val,s,ir)=>`<div class="kpi"${ir?` data-ir="${ir}" style="cursor:pointer"`:''}><div class="l">${l}</div><div class="v">${val}</div><div class="s">${s||''}</div></div>`;
  const kb=c=>c?{k:c.k==='w'?'warn':c.k, c:c.c||c.t, n:c.n||c.t}:null;   // une las dos formas de clase (suelo/clima usan t, campo usa c/n)
  /* Etiqueta corta del pH con los mismos cortes de SUELO.clasePh; el texto largo queda en el título */
  const cortoPh=(c,x)=>c&&Object.assign(c,{c:x<5?E('muy ácido','very acid'):x<5.5?E('ácido','acid'):x<=6.5?E('ideal','ideal'):x<=7?E('arriba del ideal','above ideal'):E('alcalino','alkaline')});
  /* Clima de la última temporada con cobertura suficiente (mismos criterios que el Bloque 3) */
  const st=sitio(), idx=S.clima.dias.length&&st.lat!=null?CLIMA.indices(S.clima.dias, st.lat):[], hi=[...idx].reverse().find(x=>x.cobH>=0.9), ci=[...idx].reverse().find(x=>x.nCI>=27);
  const sh=sueloHidrico(), psiT=v.psi!=null?RASPA.psi('tallo',v.psi):null, poda=v.bio, cPoda=CAMPO.clasePoda(poda,num(S.vina.sobre)), sal=SUELO.salinidad(v.ce);
  const fila=(n,val,c,ir)=>`<tr><td>${n}</td><td class="r"><b>${val}</b></td><td>${c?badgeC(c):val==='—'?`<span class="sindato">${T('captura en','enter in')} <a href="#${ir}" data-ir="${ir}">${esc(tx(B(ir).corto))}</a></span>`:''}</td></tr>`;
  const sem=[
    fila(T('pH del suelo','Soil pH'), f(num(S.suelo.ph),1), cortoPh(kb(SUELO.clasePh(num(S.suelo.ph))), num(S.suelo.ph)), 'suelo'),
    fila(T('Densidad aparente','Bulk density'), f(v.da,2,'g cm⁻³'), (c=>c&&Object.assign(c,{c:c.k==='ok'?E('sin compactación','no compaction'):c.k==='bad'?E('restringe raíces','restricts roots'):E('compactación','compaction')}))(kb(SUELO.claseDa(v.da, sh.tex))), 'suelo'),
    fila(T('Rendimiento relativo por salinidad','Relative yield from salinity'), sal?fmt(sal.yr,0)+' %':'—', sal?{k:sal.k==='w'?'warn':sal.k, c:sal.yr>=100?E('sin pérdida','no loss'):E('con pérdida','with loss'), n:E('FAO-56: umbral 1.5 dS m⁻¹, pendiente 9.6 % por dS m⁻¹','FAO-56: threshold 1.5 dS m⁻¹, slope 9.6 % per dS m⁻¹')}:null, 'suelo'),
    fila(T('ET₀ media diaria','Mean daily ET₀'), ok&&r.dias?f(r.tot.et0/r.dias,1,'mm d⁻¹'):'—', ok&&r.dias?kb(CLIMA.claseET0(r.tot.et0/r.dias)):null, 'clima'),
    fila(T('Índice de Huglin','Huglin index')+(hi?` (${hi.anio})`:''), hi?fmt(hi.HI,0):'—', hi?{k:'neu', c:CLIMA.clase(CLIMA.CLASE_HI,hi.HI)[1], n:E('Tonietto y Carbonneau (2004)','Tonietto & Carbonneau (2004)')}:null, 'clima'),
    fila(T('Frescor nocturno','Cool-night index')+(ci?` (${ci.anio})`:''), ci?fmt(ci.CI,1)+' °C':'—', ci?{k:'neu', c:CLIMA.clase(CLIMA.CLASE_CI,ci.CI)[1], n:E('Tonietto y Carbonneau (2004)','Tonietto & Carbonneau (2004)')}:null, 'clima'),
    fila(T('Potencial hídrico de tallo (media)','Stem water potential (mean)'), f(v.psi,2,'MPa'), psiT?{k:psiT.ives[1]===1?'ok':psiT.ives[1]===4?'bad':'warn', c:psiT.ives[2], n:E('Escala del IVES · Uriarte: '+psiT.uriarte[1].es, 'IVES scale · Uriarte: '+psiT.uriarte[1].en)}:null, 'raspa'),
    fila(T('Peso de poda por metro de hilera','Pruning weight per row metre'), cPoda?fmt(cPoda.v,2)+' kg m⁻¹':'—', cPoda, 'bio'),
    fila(T('Índice de Ravaz','Ravaz index'), f(v.ravaz,1), CAMPO.claseRavaz(v.ravaz), 'prod'),
    fila(T('Sólidos solubles','Soluble solids'), f(v.brix,1,'°Brix'), CAMPO.claseBrix(v.brix, S.vina.tipo), 'prod')];
  /* Balance de agua de la temporada (Bloque 4) */
  const agua=ok?[{l:T('Lluvia','Rain'),v:r.tot.P,c:'#3f6fb0'},{l:T('Riego','Irrigation'),v:r.tot.I,c:'#2f8f9d'},{l:T('Transpiración de la vid','Vine transpiration'),v:r.tot.T,c:'#4f8a3a'},{l:T('Evaporación del suelo','Soil evaporation'),v:r.tot.E,c:'#c0772b'},{l:T('Percolación profunda','Deep percolation'),v:r.tot.DP,c:'#8a6d4b'}].map(x=>Object.assign(x,{vl:fmt(x.v,0)+' mm'})):[];
  /* Comparación entre tratamientos (medias capturadas en los bloques 5 a 7) */
  const dat=(o,u,k)=>num(((o||{})[u.id]||{})[k]);
  const filasU=U.map(u=>{ const rd=dat(S.prod.datos,u,'rend'), pd=dat(S.bio.datos,u,'poda'), af=dat(S.bio.datos,u,'af'), bx=dat(S.prod.datos,u,'brix'), nf=dat(S.fert.foliar,u,'N'), rv=rd!=null&&pd>0?rd/pd:null;
    return `<tr><td><b>${esc(u.n)}</b></td><td class="r">${rd!=null&&den?fmt(rd*den/1000,1):'—'}</td><td class="r">${bx!=null?fmt(bx,1):'—'}</td><td class="r">${f(pd,2)}</td><td class="r">${rv!=null?fmt(rv,1)+' '+badgeC(CAMPO.claseRavaz(rv)):'—'}</td><td class="r">${af!=null&&rd>0?fmt(af/rd,2)+' '+badgeC(CAMPO.claseAF(af/rd)):'—'}</td><td class="r">${af!=null&&area>0?fmt(af/area,2):'—'}</td><td class="r">${f(nf,2)}</td></tr>`; });
  const hayU=U.some(u=>['rend','brix'].some(k=>dat(S.prod.datos,u,k)!=null)||['poda','af'].some(k=>dat(S.bio.datos,u,k)!=null)||dat(S.fert.foliar,u,'N')!=null);
  /* La red en números (Bloque 10) */
  const neg=red.ciclos.filter(c=>c.signo<0).length, top=[...red.nodos].sort((a,b)=>red.inter[b.id]-red.inter[a.id]).slice(0,5), nom=id=>tx(red.nodos.find(n=>n.id===id).n);
  const llenos=BLOQUES_LLENAR.map(id=>({id, a:avance(id)}));
  el.innerHTML = `${cabecera('tablero',T('Tu viñedo en una sola vista: lo que ya calcularon los bloques anteriores, con la lectura de cada fuente. Haz clic en un indicador o en «captura en…» para ir al bloque de donde sale.','Your vineyard at a glance: what the previous blocks already computed, with each source’s reading. Click an indicator or «enter in…» to go to the block it comes from.'))}
  <div class="kpis">
    ${kpi('ET₀ '+T('de la temporada','of the season'), ok?f(r.tot.et0,0,'mm'):'—', ok?r.dias+' '+T('días','days'):T('Bloque 3','Block 3'), 'clima')}
    ${kpi('ET '+T('del viñedo','of the vineyard'), ok?f(r.tot.etc,0,'mm'):'—', ok&&r.tot.et0>0?T('Kc medio','mean Kc')+' '+fmt(r.tot.etc/r.tot.et0,2):'', 'raspa')}
    ${kpi(T('Pasó por la vid','Went through the vine'), ok&&r.fracE!=null?fmt(100*(1-r.fracE),0)+' %':'—', ok?T('el resto se evaporó del suelo','the rest evaporated from the soil'):'', 'raspa')}
    ${kpi(T('Días con estrés hídrico','Water-stress days'), ok?String(r.diasEstres):'—', ok?'Ks < 1 · '+T('mínimo','minimum')+' '+fmt(r.ksMin,2):'', 'raspa')}
    ${kpi(T('Rendimiento','Yield'), f(v.rend,1,'t ha⁻¹'), den?fmt(den,0)+' '+T('plantas por ha','vines per ha'):'', 'prod')}
    ${kpi(T('Productividad del agua','Water productivity'), f(v.wp,2,'kg m⁻³'), T('fruta por agua del viñedo','fruit per vineyard water'), 'prod')}
    ${kpi(T('Relación de Bowen','Bowen ratio'), f(v.bowen,2), T('H / LE de la temporada','season H / LE'), 'energia')}
    ${kpi(T('Lazos de retroalimentación','Feedback loops'), String(red.ciclos.length), neg+' '+T('se compensan','balancing')+' · '+(red.ciclos.length-neg)+' '+T('se refuerzan','reinforcing'), 'sca')}</div>
  <div class="tablero">
    <div class="card t7"><h3>${T('Semáforo del viñedo','Vineyard traffic light')}</h3>
      ${tablaU([T('Indicador','Indicator'),T('Valor','Value'),T('Lectura de la fuente','Source reading')], sem)}
      <p class="nota">${T('Cada clase es la de la fuente citada en su bloque; pasa el cursor sobre la etiqueta para leerla completa.','Each class is the one from the source cited in its block; hover the label to read it in full.')}</p></div>
    <div class="card t5"><h3>${T('¿A dónde se fue el agua?','Where did the water go?')}</h3>
      ${agua.length?barrasH(agua,{izq:190,w:520,fila:30})+`<p class="nota">${T('Entradas: lluvia y riego. Salidas: transpiración (agua productiva), evaporación del suelo y percolación por debajo de la raíz. Balance diario FAO-56 con coeficiente dual.','Inputs: rain and irrigation. Outputs: transpiration (productive water), soil evaporation and percolation below the root zone. Daily FAO-56 dual-coefficient balance.')}</p>`
        :`<p class="sindato">${T('Necesita el clima diario (Bloque 3), el suelo (Bloque 2) y las etapas (Bloque 4).','Needs daily climate (Block 3), soil (Block 2) and stages (Block 4).')}</p>`}</div>
    <div class="card t12"><h3>${U.length>1?T('Comparación entre tratamientos','Treatment comparison'):T('Indicadores de campo','Field indicators')}</h3>
      ${hayU?tablaU([T('Unidad','Unit'),'t ha⁻¹','°Brix',T('Poda (kg/planta)','Pruning (kg/vine)'),'Ravaz',T('Área foliar/fruto (m² kg⁻¹)','Leaf area/fruit (m² kg⁻¹)'),T('IAF','LAI'),T('N foliar (%)','Leaf N (%)')], filasU)
        +`${U.length>1?`<p class="nota">${T('Medias capturadas por tratamiento. Para saber si las diferencias son reales (ANOVA, Tukey, ANCOVA) ve al','Means entered per treatment. To know whether the differences are real (ANOVA, Tukey, ANCOVA) go to')} <a href="#est" data-ir="est">${T('Bloque 9','Block 9')}</a>.</p>`:''}`
        :`<p class="sindato">${T('Captura rendimiento, poda, área foliar o nitrógeno foliar en los bloques 5 a 7.','Enter yield, pruning, leaf area or leaf nitrogen in Blocks 5 to 7.')}</p>`}</div>
    <div class="card t6"><h3>${T('El sistema en números','The system in numbers')}</h3>
      <p>${red.nodos.length} ${T('variables','variables')} · ${red.vinc.length} ${T('vínculos','links')} · ${red.nodos.filter(n=>n.v!=null).length} ${T('con valor de tu viñedo','with a value from your vineyard')}</p>
      <h4 style="margin:.6em 0 .2em">${T('Las que más conectan (intermediación)','The most connecting (betweenness)')}</h4>
      <ol style="margin:0;padding-left:1.3em">${top.map(n=>`<li>${esc(tx(n.n))} · <b>${fmt(red.inter[n.id],3)}</b></li>`).join('')}</ol>
      ${red.ciclos.length?`<h4 style="margin:.6em 0 .2em">${T('Lazos','Loops')}</h4>${red.ciclos.slice(0,3).map(c=>`<p style="margin:.2em 0"><span class="badge ${c.signo<0?'ok':'warn'}">${c.signo<0?T('se compensa','balancing'):T('se refuerza','reinforcing')}</span> ${c.ids.map(id=>esc(nom(id))).join(' → ')} → …</p>`).join('')}`:''}
      <p><button class="btn sm" data-ir="sca">${T('Ver el Recorrido del viñedo','See the Vineyard Walk-through')} →</button></p></div>
    <div class="card t6"><h3>${T('Lo que llevas capturado','What you have entered')}</h3>
      ${barrasH(llenos.map(({id,a})=>({l:B(id).n+'. '+tx(B(id).corto), v:100*a.f, c:a.estado==='ok'?'#4f8a3a':a.estado==='proc'?'#c0772b':'#9a9a9a', vl:a.h+' / '+a.t})),{max:100,izq:190,w:520,fila:26})}
      <p class="nota">${T('Solo cuenta lo que llenaste tú; nunca el ejemplo ni las sugerencias.','Counts only what you filled in; never the example or suggestions.')}</p></div>
  </div>${siguiente('tablero')}`;
  enlazarTips(el); }
