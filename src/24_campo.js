"use strict";
/* =====================================================================
   CAMPO · fertilidad, biomasa y carbono, productividad y energía (Bloques 5 a 8)
   Cada constante está cotejada con el texto de su fuente:
   · Rangos de suficiencia foliar de Garnacha tinta (La Rioja), limbo y peciolo en floración y envero:
     OENO One, «Sufficiency ranges (SR) and deviation from optimum percentage (DOP) references…», Tablas 5 a 8.
   · Índice DOP = C·100/Cref − 100 (Montañés et al., 1993, J. Plant Nutr. 16: 1289–1308; en Goodarzi, 2005);
     Cref de Garnacha tinta: OENO One, Tabla 9 (media de la población de referencia). Σ|DOP| = equilibrio global.
   · Rangos de suficiencia de peciolo en floración: NC State Extension, Winegrape Grower’s Guide, cap. 9.
   · Riesgo de deficiencia de Mg cuando K/Mg del peciolo pasa de 5 a 1: NC State Extension, cap. 9.
   · Peso de poda de 0.3 a 0.4 libras por pie de hilera: NC State Extension.
   · Índice de Ravaz recomendado entre 5 y 10; relación área foliar/fruto 1.2 m² kg⁻¹ (0.8 sobrecargada, 1.6 subcargada): UC Davis.
   · Sólidos solubles de cosecha en uva de mesa entre 14 y 17.5 °Brix: Permanhani et al. (2016).
   · fc = 0.98 (NDVI − 0.15) y Kc = 0.1808 e^(1.3138 NDVI), uva de mesa en el noroeste de México: Er-Raki et al. (2013).
   · λ = 2.45 MJ kg⁻¹ (FAO-56); relación de Bowen β = H / LE (OENO One, revisión de covarianza de remolinos).
   · C = MS · fC; CO₂ = ΔC · 44/12; O₂ = CO₂ · 32/44 (estequiometría de la fotosíntesis; propuesta de tesis de Hernández González).
   ===================================================================== */
const CAMPO = (()=>{
  const NUT = [{k:'N',u:'%'},{k:'P',u:'%'},{k:'K',u:'%'},{k:'Ca',u:'%'},{k:'Mg',u:'%'},{k:'Fe',u:'mg/kg'},{k:'Mn',u:'mg/kg'},{k:'Zn',u:'mg/kg'},{k:'Cu',u:'mg/kg'},{k:'B',u:'mg/kg'}];
  /* Garnacha: cortes entre bajo | bajo el óptimo | óptimo | sobre el óptimo | alto (4 límites por nutriente) */
  const GARNACHA = {
    'limbo|floracion':  {N:[2.83,2.97,3.10,3.25],P:[0.22,0.25,0.28,0.32],K:[0.84,0.94,1.02,1.11],Ca:[1.77,2.01,2.22,2.47],Mg:[0.23,0.28,0.33,0.38],Fe:[97,125,154,197],Mn:[80,103,123,145],Zn:[13,15,17,20],Cu:[6,7,9,11],B:[53,62,71,80]},
    'peciolo|floracion':{N:[1.24,1.46,1.64,1.86],P:[0.34,0.41,0.46,0.52],K:[1.15,1.38,1.61,1.93],Ca:[1.75,1.98,2.19,2.43],Mg:[0.62,0.82,1.06,1.24],Fe:[26,32,38,46],Mn:[30,44,61,88],Zn:[11,13,16,20],Cu:[7,8,9,11],B:[39,43,45,49]},
    'limbo|envero':     {N:[1.99,2.09,2.18,2.28],P:[0.14,0.15,0.17,0.19],K:[0.92,1.14,1.34,1.56],Ca:[2.63,2.86,3.06,3.28],Mg:[0.21,0.29,0.40,0.47],Fe:[129,159,191,235],Mn:[91,124,153,187],Zn:[12,14,16,18],Cu:[14,68,127,275],B:[32,39,45,54]},
    'peciolo|envero':   {N:[0.57,0.64,0.70,0.77],P:[0.12,0.17,0.22,0.30],K:[0.83,1.73,2.64,3.87],Ca:[2.19,2.40,2.52,2.77],Mg:[0.77,1.03,1.43,1.70],Fe:[30,37,45,55],Mn:[47,90,148,218],Zn:[16,21,25,29],Cu:[10,18,39,66],B:[34,37,40,43]} };
  /* Tabla 9: referencias DOP (macro en g/100 g = %, micro en mg/kg; base seca). Cu: sin significado fisiológico real (residuos de fungicidas cúpricos) */
  const DOPREF = {
    'limbo|floracion':  {N:3.04,P:0.268,K:0.976,Ca:2.12,Mg:0.309,Fe:139,Mn:113,Zn:16.3,Cu:8.14,B:66.5},
    'peciolo|floracion':{N:1.55,P:0.433,K:1.49,Ca:2.09,Mg:0.905,Fe:35.0,Mn:51.7,Zn:14.8,Cu:8.73,B:44.0},
    'limbo|envero':     {N:2.14,P:0.162,K:1.24,Ca:2.96,Mg:0.347,Fe:174,Mn:139,Zn:14.9,Cu:89.5,B:41.9},
    'peciolo|envero':   {N:0.669,P:0.191,K:2.09,Ca:2.46,Mg:1.28,Fe:40.7,Mn:116,Zn:22.7,Cu:29.0,B:38.4} };
  const dop = (clave, nut, v)=>{ const r=(DOPREF[clave]||{})[nut]; return r&&v!=null ? v*100/r-100 : null; };
  const CLASES_SR = [E('Bajo','Low'),E('Bajo el óptimo','Below optimal'),E('Óptimo','Optimal'),E('Sobre el óptimo','Above optimal'),E('Alto','High')];
  function claseGarnacha(clave, nut, v){ const t=(GARNACHA[clave]||{})[nut]; if(!t||v==null) return null; const i=t.findIndex(x=>v<x); return {i:i<0?4:i, n:CLASES_SR[i<0?4:i]}; }
  /* NC State: peciolo en floración, rango de suficiencia [mín, máx] (null = sin límite publicado) */
  const NCSTATE = {N:[1.20,2.20],P:[0.15,null],K:[1.50,2.50],Mg:[0.30,0.50],Fe:[40,null],Mn:[25,1000],Cu:[7,15],Zn:[35,50],B:[30,100]};
  function claseNC(nut, v){ const r=NCSTATE[nut]; if(!r||v==null) return null; if(v<r[0]) return {k:'bad',n:E('Bajo el rango','Below range')}; if(r[1]!=null&&v>r[1]) return {k:'warn',n:E('Arriba del rango','Above range')}; return {k:'ok',n:E('Suficiente','Sufficient')}; }
  const kmg = (K,Mg)=> K!=null&&Mg>0 ? K/Mg : null;   // > 5 : riesgo de deficiencia de Mg (NC State)
  /* Poda: libras por pie de hilera a kg por metro (1 lb = 0.45359 kg; 1 pie = 0.3048 m) */
  const PODA_KGM = [0.3*0.45359237/0.3048, 0.4*0.45359237/0.3048];
  function clasePoda(kgPlanta, sobre){ if(kgPlanta==null||!(sobre>0)) return null; const v=kgPlanta/sobre;
    return {v, k:v<PODA_KGM[0]?'warn':v>PODA_KGM[1]?'warn':'ok', c:v<PODA_KGM[0]?E('bajo','low'):v>PODA_KGM[1]?E('vigor alto','high vigour'):E('en promedio','average'), n:v<PODA_KGM[0]?E('Bajo el promedio de referencia (0.45–0.60 kg m⁻¹)','Below the reference average (0.45–0.60 kg m⁻¹)'):v>PODA_KGM[1]?E('Arriba: vigor alto (0.45–0.60 kg m⁻¹)','Above: high vigour (0.45–0.60 kg m⁻¹)'):E('En el promedio de referencia','Within the reference average')}; }
  const claseRavaz = r=> r==null?null: r<5?{k:'warn',c:E('subcargada','undercropped'),n:E('Menos de 5: subcargada (mucho vigor para la fruta)','Below 5: undercropped (much vigour for the fruit)')}: r>10?{k:'warn',c:E('sobrecargada','overcropped'),n:E('Más de 10: sobrecargada','Above 10: overcropped')}:{k:'ok',c:E('equilibrada','balanced'),n:E('Entre 5 y 10: equilibrada','Between 5 and 10: balanced')};
  const claseAF = r=> r==null?null: r<1.0?{k:'warn',c:E('sobrecargada','overcropped'),n:E('Cerca de 0.8: sobrecargada','Near 0.8: overcropped')}: r>1.4?{k:'warn',c:E('subcargada','undercropped'),n:E('Cerca de 1.6: subcargada','Near 1.6: undercropped')}:{k:'ok',c:E('recomendada','recommended'),n:E('Cerca de 1.2: recomendada','Near 1.2: recommended')};
  const claseBrix = (b, tipo)=> b==null||tipo!=='mesa'?null: b<14?{k:'warn',c:E('antes de la ventana','before the window'),n:E('Menos de 14 °Brix: antes de la ventana de cosecha de uva de mesa','Below 14 °Brix: before the table-grape harvest window')}: b>17.5?{k:'warn',c:E('después de la ventana','after the window'),n:E('Más de 17.5 °Brix: después de la ventana','Above 17.5 °Brix: after the window')}:{k:'ok',c:E('en ventana','in window'),n:E('Dentro de la ventana de cosecha (14–17.5 °Brix)','Within the harvest window (14–17.5 °Brix)')};
  const fcNDVI = ndvi=> ndvi==null?null: Math.max(0, 0.98*(ndvi-0.15));
  const kcNDVI = ndvi=> ndvi==null?null: 0.1808*Math.exp(1.3138*ndvi);
  /* Carbono de la biomasa seca y gases equivalentes (por planta, g) */
  function carbono(msIni, msFin, fC){ if(msFin==null||fC==null) return null; const dC=(msFin-(msIni||0))*fC, co2=dC*44/12; return {dC, co2, o2:co2*32/44}; }
  /* Energía diaria de la superficie con la ET del viñedo: LE = λ ETc; H = Rn − G − LE (residuo); β = H / LE */
  function energia(b){ return b.map(d=>{ const rn=d.rnRef, le=2.45*d.etc, h=rn-le; return {f:d.f, rn, le, h, beta:le>0?h/le:null}; }); }
  return {NUT, GARNACHA, CLASES_SR, claseGarnacha, NCSTATE, claseNC, kmg, PODA_KGM, clasePoda, claseRavaz, claseAF, claseBrix, fcNDVI, kcNDVI, carbono, energia, DOPREF, dop};
})();
/* Unidades de comparación: los tratamientos del experimento, o el viñedo completo si no hay */
const unidades = ()=> (S.exp.trats||[]).filter(t=>t.id).length ? S.exp.trats.filter(t=>t.id).map(t=>({id:t.id, n:t.id+(t.n?' · '+t.n:'')})) : [{id:'V', n:T('Viñedo','Vineyard')}];
const densidad = ()=> num(S.vina.entre)>0&&num(S.vina.sobre)>0 ? 10000/(num(S.vina.entre)*num(S.vina.sobre)) : null;
