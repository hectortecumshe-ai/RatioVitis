"use strict";
/* =====================================================================
   CLIMA · registros diarios de la estación e índices vitícolas (Bloque 3)
   · ET0 diaria por FAO Penman–Monteith (motor FAO-56). Clases del poder
     evaporante de la atmósfera: bajo 1–3, moderado 3–5, alto 5–7, muy alto > 7 mm d-1 (FAO-56).
   · Índice heliotérmico de Huglin: HI = Σ 1 abr–30 sep [(T − 10) + (Tx − 10)] / 2 · d,
     d = 1.00 a latitudes ≤ 40° (Tonietto y Carbonneau, 2004).
   · Índice de frescor nocturno: CI = Tmín media de septiembre (Tonietto y Carbonneau, 2004).
   · Grados día de Winkler: W = Σ 1 abr–31 oct max(0, T − 10) (Amerine y Winkler, 1944).
   · Temperatura media de la temporada: GST = media de T del 1 abr al 31 oct.
   · Relación P/ET0 mensual: ≥ 1 húmedo; < 0.5 seco (FAO-56).
   Hemisferio sur: los periodos se desplazan seis meses (oct–abr).
   Los índices se desarrollaron para la viticultura templada; en climas sin
   invierno marcado se leen con cautela (lectura de Ratio Vitis).
   ===================================================================== */
const CLIMA = (()=>{
  /* Columnas reconocidas al importar (encabezados en español o inglés) */
  const ALIAS = {f:/^(fecha|date|dia|día|day)$/i, tmax:/^(tmax|t_?max|tx|temp_?max)/i, tmin:/^(tmin|t_?min|tn|temp_?min)/i,
    hrmax:/^(hr_?max|rh_?max|hrx)/i, hrmin:/^(hr_?min|rh_?min|hrn)/i, hrmed:/^(hr|hr_?med|rh|rh_?mean|humedad)$/i,
    u2:/^(u2|viento|wind|u_?2m|viento_?2m)$/i, rs:/^(rs|rad|radiacion|radiación|srad|solar)/i, n:/^(n|insolacion|insolación|sol|sunshine)$/i,
    prec:/^(prec|lluvia|pp|precip|rain|p)$/i, tdew:/^(tdew|t_?rocio|rocio|rocío|dewpoint)/i};
  function leerCSV(texto){ const lin=texto.replace(/^\uFEFF/,'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean); if(lin.length<2) return {err:'vacio'};
    const sep=[',',';','\t'].map(s=>[s,lin[0].split(s).length]).sort((a,b)=>b[1]-a[1])[0][0];
    const cab=lin[0].split(sep).map(h=>h.trim().replace(/^"|"$/g,'')); const col={};
    cab.forEach((h,i)=>{ for(const [k,re] of Object.entries(ALIAS)) if(col[k]==null && re.test(h)) { col[k]=i; break; } });
    if(col.f==null||col.tmax==null||col.tmin==null) return {err:'columnas', cab};
    const dias=[]; let malas=0;
    lin.slice(1).forEach(l=>{ const c=l.split(sep).map(x=>x.trim().replace(/^"|"$/g,'')); const f=fechaISO(c[col.f]);
      const v=k=> col[k]==null||c[col[k]]===''||c[col[k]]==null ? null : (isFinite(+c[col[k]].replace(',','.')) ? +c[col[k]].replace(',','.') : null);
      const d={f, tmax:v('tmax'), tmin:v('tmin'), hrmax:v('hrmax'), hrmin:v('hrmin'), hrmed:v('hrmed'), u2:v('u2'), rs:v('rs'), n:v('n'), prec:v('prec'), tdew:v('tdew')};
      if(!f||d.tmax==null||d.tmin==null||d.tmax<d.tmin) { malas++; return; } dias.push(d); });
    dias.sort((a,b)=>a.f.localeCompare(b.f));
    return {dias, malas, col:Object.keys(col)}; }
  function fechaISO(s){ if(!s) return null; let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/); if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    m=s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/); if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; return null; }
  /* ET0 de cada día con el motor FAO-56 */
  function conET0(dias, st){ return dias.map(d=>Object.assign({}, d, {r:FAO.et0(d, st)})); }
  const claseET0 = v=> v==null?null: v<=3?{k:'ok',t:E('Bajo','Low')}: v<=5?{k:'ok',t:E('Moderado','Moderate')}: v<=7?{k:'w',t:E('Alto','High')}:{k:'bad',t:E('Muy alto','Very high')};
  const CLASE_HI = [[1500,E('Muy fresco (HI−3)','Very cool (HI−3)')],[1800,E('Fresco (HI−2)','Cool (HI−2)')],[2100,E('Templado (HI−1)','Temperate (HI−1)')],[2400,E('Templado cálido (HI+1)','Warm temperate (HI+1)')],[3000,E('Cálido (HI+2)','Warm (HI+2)')],[1e9,E('Muy cálido (HI+3)','Very warm (HI+3)')]];
  const CLASE_CI = [[12,E('Noches muy frescas (CI+2)','Very cool nights (CI+2)')],[14,E('Noches frescas (CI+1)','Cool nights (CI+1)')],[18,E('Noches templadas (CI−1)','Temperate nights (CI−1)')],[1e9,E('Noches cálidas (CI−2)','Warm nights (CI−2)')]];
  const clase = (tabla, v)=> v==null ? null : (tabla.find(x=>v<=x[0]) || tabla[tabla.length-1]);
  const dHuglin = lat=>{ const a=Math.abs(lat); return a<=40?1.00:a<=42?1.02:a<=44?1.03:a<=46?1.04:a<=48?1.05:1.06; };
  /* Índices de una temporada: año y hemisferio; cobertura = días con dato / días del periodo */
  function indices(dias, lat){ const sur=lat<0, anios=[...new Set(dias.map(d=>+d.f.slice(0,4)))]; const res=[];
    anios.forEach(a=>{ const per=(m1,d1,m2,d2,y2)=>dias.filter(d=>{ const k=d.f; return k>=`${a}-${m1}-${d1}` && k<=`${y2??a}-${m2}-${d2}`; });
      const dur=(i,f)=>Math.round((Date.parse(f)-Date.parse(i))/864e5)+1;
      const w = sur ? per('10','01','04','30',a+1) : per('04','01','10','31'), nW = sur ? dur(`${a}-10-01`,`${a+1}-04-30`) : 214;
      const h = sur ? per('10','01','03','31',a+1) : per('04','01','09','30'), nH = sur ? dur(`${a}-10-01`,`${a+1}-03-31`) : 183;
      const ci = sur ? dias.filter(d=>d.f.slice(0,7)===`${a+1}-03`) : dias.filter(d=>d.f.slice(0,7)===`${a}-09`);
      const tm=d=>(d.tmax+d.tmin)/2, cw=w.length/nW, ch=h.length/nH;
      res.push({anio:a, cobW:cw, cobH:ch, nCI:ci.length,
        W: w.length ? w.reduce((s,d)=>s+Math.max(0,tm(d)-10),0) : null,
        GST: w.length ? w.reduce((s,d)=>s+tm(d),0)/w.length : null,
        HI: h.length ? h.reduce((s,d)=>s+Math.max(0,((tm(d)-10)+(d.tmax-10))/2),0)*dHuglin(lat) : null,
        CI: ci.length ? ci.reduce((s,d)=>s+d.tmin,0)/ci.length : null}); });
    return res; }
  /* Resumen mensual: medias de temperatura, suma de lluvia y de ET0, relación P/ET0 */
  function mensual(dd){ const g={}; dd.forEach(d=>{ const k=d.f.slice(0,7); (g[k]=g[k]||[]).push(d); });
    return Object.entries(g).map(([k,l])=>{ const pr=l.some(d=>d.prec!=null)?l.reduce((s,d)=>s+(d.prec||0),0):null, et=l.reduce((s,d)=>s+d.r.et0,0);
      return {mes:k, n:l.length, tmax:l.reduce((s,d)=>s+d.tmax,0)/l.length, tmin:l.reduce((s,d)=>s+d.tmin,0)/l.length, prec:pr, et0:et, pe:pr!=null&&et>0?pr/et:null}; }); }
  /* Exportación para PhenologyPro (Barrera-Guzmán, 2026): fecha,tmax,tmin,prec,hr,viento */
  function csvPhenology(dias){ return 'fecha,tmax,tmin,prec,hr,viento\n'+dias.map(d=>[d.f,d.tmax,d.tmin,d.prec??'',d.hrmed??(d.hrmax!=null&&d.hrmin!=null?(d.hrmax+d.hrmin)/2:''),d.u2??''].join(',')).join('\n'); }
  return {leerCSV, conET0, claseET0, CLASE_HI, CLASE_CI, clase, dHuglin, indices, mensual, csvPhenology};
})();
