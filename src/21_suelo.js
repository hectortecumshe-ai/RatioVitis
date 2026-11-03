"use strict";
/* =====================================================================
   SUELO · propiedades físicas e hídricas del viñedo (Bloque 2)
   · Prueba del frasco: % de cada capa = altura de la capa / altura total de sólidos × 100 (UC ANR, 2025).
   · Clase textural: triángulo de texturas del USDA (Soil Survey Staff).
   · Densidad aparente = masa seca / volumen del cilindro, y su clase por textura (USDA-NRCS, Soil Quality Kit).
   · ADT = 1000 (θCC − θPMP) Zr ; AFA = p · ADT (FAO-56, Ec. 82 y 83).
   · Infiltración = volumen / tiempo (UC ANR, 2025).
   · pH ideal 5.5–6.5 (UC ANR, 2025); pH < 5.0 o > 7.0 reduce la disponibilidad de boro (NC State Extension).
   · Salinidad: Ya/Ym = 100 − b (CEe − CEe umbral), vid CEe umbral 1.5 dS m-1 y b = 9.6 % por dS m-1 (FAO-56).
   ===================================================================== */
const SUELO = (()=>{
  /* Clase textural USDA a partir de % de arena, limo y arcilla */
  function textura(ar, li, ac){ if([ar,li,ac].some(v=>v==null)) return null; const s=ar+li+ac; if(s<=0) return null; ar=100*ar/s; li=100*li/s; ac=100*ac/s;
    if(li+1.5*ac<15) return 'arena';
    if(li+1.5*ac>=15 && li+2*ac<30) return 'arenafr';
    if((ac>=7&&ac<20&&ar>52&&li+2*ac>=30)||(ac<7&&li<50&&li+2*ac>=30)) return 'frarenoso';
    if(ac>=7&&ac<27&&li>=28&&li<50&&ar<=52) return 'franco';
    if((li>=50&&ac>=12&&ac<27)||(li>=50&&li<80&&ac<12)) return 'frlimoso';
    if(li>=80&&ac<12) return 'limoso';
    if(ac>=20&&ac<35&&li<28&&ar>45) return 'frarcare';
    if(ac>=27&&ac<40&&ar>20&&ar<=45) return 'frarcilloso';
    if(ac>=27&&ac<40&&ar<=20) return 'frarclim';
    if(ac>=35&&ar>45) return 'arcare';
    if(ac>=40&&li>=40) return 'arclim';
    return 'arcilla'; }
  /* Las 12 clases USDA; las que no tienen fila en el Cuadro 19 de FAO-56 piden θCC y θPMP medidas */
  const CLASES = {arena:E('Arenoso','Sand'), arenafr:E('Arenoso franco','Loamy sand'), frarenoso:E('Franco arenoso','Sandy loam'), franco:E('Franco','Loam'),
    frlimoso:E('Franco limoso','Silt loam'), limoso:E('Limoso','Silt'), frarcare:E('Franco arcillo arenoso','Sandy clay loam'), frarcilloso:E('Franco arcilloso','Clay loam'),
    frarclim:E('Franco arcillo limoso','Silty clay loam'), arcare:E('Arcillo arenoso','Sandy clay'), arclim:E('Arcillo limoso','Silty clay'), arcilla:E('Arcilloso','Clay')};
  /* Densidad aparente (g cm-3) por textura: ideal (menor que), afecta raíces, restringe raíces (mayor que). USDA-NRCS. */
  const DA = [
    {t:['arena','arenafr'], ideal:1.60, afecta:1.69, restringe:1.80},
    {t:['frarenoso','franco'], ideal:1.40, afecta:1.63, restringe:1.80},
    {t:['frarcare','frarcilloso'], ideal:1.40, afecta:1.60, restringe:1.75},
    {t:['limoso','frlimoso'], ideal:1.40, afecta:1.60, restringe:1.75},
    {t:['frarclim'], ideal:1.40, afecta:1.55, restringe:1.65},
    {t:['arcare','arclim'], ideal:1.10, afecta:1.49, restringe:1.58},
    {t:['arcilla'], ideal:1.10, afecta:1.39, restringe:1.47} ];
  function claseDa(da, tex){ if(da==null) return null; const r=DA.find(x=>x.t.includes(tex));
    if(!r) return {k:da>1.3?'w':'ok', t:da>1.3?E('Indica compactación (umbral general de 1.3 g cm⁻³)','Indicates compaction (general 1.3 g cm⁻³ threshold)'):E('Sin compactación según el umbral general','No compaction by the general threshold'), r:null};
    if(da<r.ideal) return {k:'ok', t:E('Ideal para el crecimiento de raíces','Ideal for root growth'), r};
    if(da<r.afecta) return {k:'w', t:E('Puede afectar el crecimiento de raíces','May affect root growth'), r};
    if(da<=r.restringe) return {k:'w', t:E('Afecta el crecimiento de raíces','Affects root growth'), r};
    return {k:'bad', t:E('Restringe el crecimiento de raíces','Restricts root growth'), r}; }
  function clasePh(ph){ if(ph==null) return null;
    if(ph<5.0) return {k:'bad', t:E('Muy ácido: reduce la disponibilidad de boro y otros elementos','Very acid: reduces boron and other nutrient availability')};
    if(ph<5.5) return {k:'w', t:E('Ácido, por debajo del rango ideal del viñedo','Acid, below the vineyard ideal range')};
    if(ph<=6.5) return {k:'ok', t:E('Dentro del rango ideal del viñedo (5.5–6.5)','Within the vineyard ideal range (5.5–6.5)')};
    if(ph<=7.0) return {k:'w', t:E('Arriba del rango ideal del viñedo','Above the vineyard ideal range')};
    return {k:'bad', t:E('Alcalino: reduce la disponibilidad de boro y otros elementos','Alkaline: reduces boron and other nutrient availability')}; }
  /* Rendimiento relativo por salinidad (FAO-56): requiere la CE del extracto de saturación */
  function salinidad(cee){ if(cee==null) return null; const umbral=1.5, b=9.6, yr=cee<=umbral?100:Math.max(0,100-b*(cee-umbral));
    return {yr, k:yr>=100?'ok':yr>=90?'w':'bad'}; }
  return {textura, CLASES, DA, claseDa, clasePh, salinidad};
})();
/* Parámetros hídricos del suelo con su origen: medidos por el usuario o centro del rango del Cuadro 19 (sugerencia) */
function sueloHidrico(){ const s=S.suelo, tex=s.textura || SUELO.textura(num(s.jarArena),num(s.jarLimo),num(s.jarArcilla)), f=FAO.SUELOS.find(x=>x.id===tex);
  const mid=r=>r?(r[0]+r[1])/2:null, uv=tipoUva();
  const cc=num(s.cc)??mid(f&&f.cc), pmp=num(s.pmp)??mid(f&&f.pmp), zr=num(s.zr), ze=num(s.ze)??0.10, rew=num(s.rew)??mid(f&&f.rew);
  const sug={cc:num(s.cc)==null&&cc!=null, pmp:num(s.pmp)==null&&pmp!=null, ze:num(s.ze)==null, rew:num(s.rew)==null&&rew!=null};
  const adt = cc!=null&&pmp!=null&&zr!=null ? 1000*(cc-pmp)*zr : null, p=uv?uv.p:null;
  return {tex, fila:f, cc, pmp, zr, ze, rew, sug, adt, afa: adt!=null&&p!=null ? p*adt : null, p, ok: cc!=null&&pmp!=null&&zr!=null&&cc>pmp}; }
