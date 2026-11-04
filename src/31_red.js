"use strict";
/* =====================================================================
   RED DEL SISTEMA COMPLEJO ADAPTATIVO (Bloque 10)
   Nodos: variables del viñedo en cinco capas (suelo, manejo, planta, producto, atmósfera),
   con el valor que salió de tus datos o «sin dato».
   Vínculos dirigidos de tres tipos:
   · ecuación: relación de un modelo publicado (FAO-56);
   · evidencia: efecto reportado en una fuente (Uriarte et al., 2025; NC State; UC Davis);
   · hipótesis: lo que el experimento pone a prueba (propuesta de tesis de Hernández González);
   más las correlaciones significativas de tus datos de campo (Bloque 9), sin dirección.
   Métricas: grado, intermediación (Brandes, 2001) y ciclos dirigidos (retroalimentaciones).
   Validado contra NetworkX en pruebas/verificar_red.py.
   ===================================================================== */
const RED = (()=>{
  const CAPAS = [
    {id:'suelo',    z:-240, col:'#8a5a3a', n:E('Suelo: el tanque','Soil: the tank')},
    {id:'manejo',   z:-120, col:'#2f5d50', n:E('Manejo: lo que decide el productor','Management: what the grower decides')},
    {id:'planta',   z:0,    col:'#4f7d3a', n:E('Planta: la vid que regula','Plant: the regulating vine')},
    {id:'producto', z:120,  col:'#8a3f5a', n:E('Producto: lo que sale','Product: what comes out')},
    {id:'atm',      z:240,  col:'#c0772b', n:E('Atmósfera: la demanda','Atmosphere: the demand')}];
  /* Catálogo de nodos: id, capa, nombre y unidad */
  const NODOS = [
    ['rn','atm',E('Radiación neta','Net radiation'),'MJ m⁻²'], ['et0','atm',E('Demanda atmosférica (ET0)','Atmospheric demand (ET0)'),'mm'], ['vpd','atm',E('Déficit de presión de vapor','Vapour pressure deficit'),'kPa'], ['temp','atm',E('Temperatura media','Mean temperature'),'°C'], ['lluvia','atm',E('Lluvia','Rain'),'mm'], ['bowen','atm',E('Relación de Bowen','Bowen ratio'),''],
    ['adt','suelo',E('Agua disponible total','Total available water'),'mm'], ['dr','suelo',E('Agotamiento del suelo','Soil depletion'),'mm'], ['evap','suelo',E('Evaporación del suelo','Soil evaporation'),'mm'], ['ce','suelo',E('Salinidad (CEe)','Salinity (ECe)'),'dS m⁻¹'], ['da','suelo',E('Densidad aparente','Bulk density'),'g cm⁻³'],
    ['riego','manejo',E('Riego','Irrigation'),'mm'], ['abonoN','manejo',E('Nitrógeno del abono','Manure nitrogen'),'g planta⁻¹'], ['dens','manejo',E('Densidad de plantación','Planting density'),'pl ha⁻¹'],
    ['transp','planta',E('Transpiración','Transpiration'),'mm'], ['etc','planta',E('Evapotranspiración del viñedo','Vineyard evapotranspiration'),'mm'], ['ks','planta',E('Coeficiente de estrés (Ks mínimo)','Stress coefficient (minimum Ks)'),''], ['psi','planta',E('Potencial hídrico de tallo','Stem water potential'),'MPa'], ['iaf','planta',E('Índice de área foliar','Leaf area index'),''], ['nfol','planta',E('Nitrógeno foliar','Leaf nitrogen'),'%'], ['bio','planta',E('Biomasa (peso de poda)','Biomass (pruning weight)'),'kg planta⁻¹'],
    ['rend','producto',E('Rendimiento','Yield'),'t ha⁻¹'], ['brix','producto',E('Sólidos solubles','Soluble solids'),'°Brix'], ['ravaz','producto',E('Índice de Ravaz','Ravaz index'),''], ['wp','producto',E('Productividad del agua','Water productivity'),'kg m⁻³'], ['le','producto',E('Calor latente (enfriamiento)','Latent heat (cooling)'),'MJ m⁻²'] ];
  /* Vínculos dirigidos: [de, a, signo, tipo, fuente] */
  const F56='Allen et al. (2006), FAO-56', URI='Uriarte et al. (2025)';
  const VINC = [
    ['rn','et0',+1,'ecuacion',F56+', Ec. 6'], ['temp','et0',+1,'ecuacion',F56+', Ec. 6'], ['vpd','et0',+1,'ecuacion',F56+', Ec. 6'],
    ['et0','transp',+1,'ecuacion',F56+', Ec. 80'], ['et0','evap',+1,'ecuacion',F56+', Ec. 71'], ['transp','etc',+1,'ecuacion',F56+', Ec. 69'], ['evap','etc',+1,'ecuacion',F56+', Ec. 69'],
    ['etc','dr',+1,'ecuacion',F56+', Ec. 85'], ['lluvia','dr',-1,'ecuacion',F56+', Ec. 85'], ['riego','dr',-1,'ecuacion',F56+', Ec. 85'],
    ['dr','ks',-1,'ecuacion',F56+', Ec. 84'], ['adt','ks',+1,'ecuacion',F56+', Ec. 84'], ['ks','transp',+1,'ecuacion',F56+', Ec. 80'],
    ['iaf','transp',+1,'ecuacion',F56+', cap. 7 (Kcb y cobertura)'], ['iaf','evap',-1,'ecuacion',F56+', Ec. 75 (few = 1 − fc)'],
    ['etc','le',+1,'ecuacion',F56+' (λ = 2.45 MJ kg⁻¹)'], ['le','bowen',-1,'ecuacion','β = H / LE'], ['rn','bowen',+1,'ecuacion','β = (Rn − G − LE) / LE'],
    ['ce','rend',-1,'ecuacion',F56+', Cuadro 23'],
    ['dr','psi',-1,'evidencia','IVES Technical Reviews'], ['psi','iaf',+1,'evidencia',URI], ['psi','bio',+1,'evidencia',URI], ['psi','rend',+1,'evidencia',URI], ['psi','brix',-1,'evidencia',URI],
    ['nfol','bio',+1,'evidencia','NC State Extension'], ['rend','ravaz',+1,'ecuacion','Ravaz = rendimiento / peso de poda'], ['bio','ravaz',-1,'ecuacion','Ravaz = rendimiento / peso de poda'],
    ['rend','wp',+1,'ecuacion','WP = rendimiento / agua'], ['etc','wp',-1,'ecuacion','WP = rendimiento / agua'],
    ['abonoN','nfol',+1,'hipotesis','Hernández González (2026), hipótesis de trabajo'], ['dens','rend',+1,'ecuacion','t/ha = kg/planta × plantas/ha'] ];
  /* Valor de cada nodo con los datos del proyecto (null = sin dato) */
  function valores(){ const r=RASPA.correr(), ok=!r.falta, U=unidades(), media=(o,k)=>{ const l=U.map(u=>num(((o||{})[u.id]||{})[k])).filter(x=>x!=null); return l.length?l.reduce((a,b)=>a+b,0)/l.length:null; };
    const sh=sueloHidrico(), psis=(S.raspa.psi||[]).filter(x=>x.tipo==='tallo').map(x=>num(x.mpa)).filter(x=>x!=null), den=densidad();
    const area=num(S.vina.entre)*num(S.vina.sobre), iafs=U.map(u=>{ const a=num(((S.bio.datos||{})[u.id]||{}).af); return a!=null&&area>0?a/area:null; }).filter(x=>x!=null);
    const en=ok?CAMPO.energia(r.b):[], sum=k=>en.reduce((s,d)=>s+d[k],0), rendKg=media(S.prod.datos,'rend'), tha=rendKg!=null&&den?rendKg*den/1000:null;
    const days=ok?r.b:[], mean=f=>days.length?days.reduce((s,d)=>s+f(d),0)/days.length:null, poda=media(S.bio.datos,'poda');
    const abN=num(S.fert.nObj), nf=media(S.fert.foliar,'N');
    return {rn:ok?sum('rn'):null, et0:ok?r.tot.et0:null, vpd:ok?mean(d=>d.r?d.r.vpd:null):null, temp:S.clima.dias.length?S.clima.dias.reduce((s,d)=>s+(d.tmax+d.tmin)/2,0)/S.clima.dias.length:null, lluvia:ok?r.tot.P:null, bowen:ok&&sum('le')>0?sum('h')/sum('le'):null,
      adt:sh.adt, dr:ok?r.ultimo.Dr:null, evap:ok?r.tot.E:null, ce:num(S.suelo.ce), da:num(S.suelo.da)??(num(S.suelo.daMasa)!=null&&num(S.suelo.daVol)>0?num(S.suelo.daMasa)/num(S.suelo.daVol):null),
      riego:ok?r.tot.I:null, abonoN:abN, dens:den, transp:ok?r.tot.T:null, etc:ok?r.tot.etc:null, ks:ok?r.ksMin:null, psi:psis.length?psis.reduce((a,b)=>a+b,0)/psis.length:null,
      iaf:iafs.length?iafs.reduce((a,b)=>a+b,0)/iafs.length:null, nfol:nf, bio:poda, rend:tha, brix:media(S.prod.datos,'brix'), ravaz:rendKg!=null&&poda>0?rendKg/poda:null, wp:tha!=null&&ok&&r.tot.etc>0?tha*1000/(r.tot.etc*10):null, le:ok?sum('le'):null, _r:r}; }
  /* Correlaciones significativas de los datos de campo (Bloque 9) como vínculos de evidencia propia */
  function vinculosCampo(){ const vs=estVars().slice(0,14), out=[], ns=[]; if(vs.length<2) return {nodos:ns, vinc:out};
    const X=vs.map(c=>S.est.filas.map(f=>num(f[colIdx(c)])));
    for(let i=0;i<vs.length;i++) for(let j=i+1;j<vs.length;j++){ const q=EST.pearson(X[i],X[j]); if(q&&q.p<0.05) out.push(['c:'+vs[i],'c:'+vs[j],Math.sign(q.r),'campo',`r = ${q.r.toFixed(2)}, p = ${q.p<0.001?'< 0.001':q.p.toFixed(3)}, n = ${q.n}`, Math.abs(q.r)]); }
    vs.forEach(v=>{ if(out.some(e=>e[0]==='c:'+v||e[1]==='c:'+v)) ns.push(['c:'+v,'planta',E(v,v),'']); }); return {nodos:ns, vinc:out}; }
  function construir(){ const val=valores(), cp=vinculosCampo();
    const nodos=NODOS.concat(cp.nodos).map(([id,capa,n,u])=>({id, capa, n, u, v:id.startsWith('c:')?null:val[id], campo:id.startsWith('c:')}));
    const vinc=VINC.map(([a,b,s,t,f])=>({a,b,s,t,f,w:1})).concat(cp.vinc.map(([a,b,s,t,f,w])=>({a,b,s,t,f,w})));
    return Object.assign({nodos, vinc, val}, metricas(nodos, vinc)); }
  /* Grado y fuerza (no dirigidos), intermediación de Brandes sin pesos y normalizada, ciclos dirigidos (Johnson acotado) */
  function metricas(nodos, vinc){ const ids=nodos.map(n=>n.id), ix=Object.fromEntries(ids.map((x,i)=>[x,i])), n=ids.length, adj=ids.map(()=>new Set());
    vinc.forEach(e=>{ if(ix[e.a]==null||ix[e.b]==null||e.a===e.b) return; adj[ix[e.a]].add(ix[e.b]); adj[ix[e.b]].add(ix[e.a]); });
    const grado=adj.map(s=>s.size), fuerza=ids.map((id)=>vinc.filter(e=>e.a===id||e.b===id).reduce((s,e)=>s+e.w,0)), bet=Array(n).fill(0);
    for(let s=0;s<n;s++){ const Sst=[], P=ids.map(()=>[]), sig=Array(n).fill(0), d=Array(n).fill(-1); sig[s]=1; d[s]=0; const Q=[s];
      while(Q.length){ const v=Q.shift(); Sst.push(v); adj[v].forEach(w=>{ if(d[w]<0){ d[w]=d[v]+1; Q.push(w); } if(d[w]===d[v]+1){ sig[w]+=sig[v]; P[w].push(v); } }); }
      const dl=Array(n).fill(0); while(Sst.length){ const w=Sst.pop(); P[w].forEach(v=>{ dl[v]+=sig[v]/sig[w]*(1+dl[w]); }); if(w!==s) bet[w]+=dl[w]; } }
    const norm=n>2?2/((n-1)*(n-2)):1; for(let i=0;i<n;i++) bet[i]=bet[i]/2*norm;
    /* Ciclos dirigidos simples hasta longitud 7, solo con vínculos dirigidos (no los de campo) */
    const out=ids.map(()=>[]); vinc.forEach(e=>{ if(e.t!=='campo'&&ix[e.a]!=null&&ix[e.b]!=null) out[ix[e.a]].push({to:ix[e.b], s:e.s}); });
    const ciclos=[];   // cada ciclo se encuentra una sola vez, desde su nodo de menor índice
    for(let s=0;s<n;s++){ const pila=[[s,[s],1]]; while(pila.length){ const [v,cam,sg]=pila.pop(); out[v].forEach(({to,s:sv})=>{ if(to===s&&cam.length>1){ ciclos.push({ids:cam.map(i=>ids[i]), signo:sg*sv}); }
        else if(to>s&&!cam.includes(to)&&cam.length<7) pila.push([to,cam.concat(to),sg*sv]); }); } }
    return {grado:Object.fromEntries(ids.map((x,i)=>[x,grado[i]])), fuerza:Object.fromEntries(ids.map((x,i)=>[x,fuerza[i]])), inter:Object.fromEntries(ids.map((x,i)=>[x,bet[i]])), ciclos}; }
  return {CAPAS, NODOS, VINC, valores, construir, metricas};
})();
