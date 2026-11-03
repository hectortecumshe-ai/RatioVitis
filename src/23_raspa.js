"use strict";
/* =====================================================================
   RASPA · relación agua–suelo–planta–atmósfera (Bloque 4)
   Une el clima diario (ET0), el suelo (ADT, AET, AFE) y la vid (Kcb por etapa)
   en el balance hídrico diario con coeficiente dual de FAO-56, y clasifica
   el potencial hídrico medido con la cámara de presión (Scholander):
   · Potencial de hoja al alba (IVES Technical Reviews; Carbonneau):
       clase 1 ≥ −0.3 · 2 −0.3 a −0.5 · 3 −0.5 a −0.8 · 4 < −0.8 MPa.
   · Potencial de tallo al mediodía (IVES Technical Reviews; Deloire):
       clase 1 ≥ −0.6 · 2 −0.7 a −1.1 · 3 −1.2 a −1.6 · 4 < −1.6 MPa.
   · Potencial de tallo, umbrales para riego (UC ANR, uva para vino):
       sin estrés 0 a −0.80 · algo de estrés −0.81 a −1.20 · estrés extremo −1.21 a −1.60 MPa.
   · Potencial de tallo, cinco niveles (Uriarte et al., 2025):
       sin déficit > −0.411 · leve −0.411 a −0.674 · moderado −0.674 a −0.936 · alto −0.936 a −1.2 · severo < −1.2 MPa.
   ===================================================================== */
const RASPA = (()=>{
  const ALBA = [[-0.3,1,E('Sin déficit hídrico','No water deficit')],[-0.5,2,E('Déficit leve a moderado','Mild to moderate deficit')],[-0.8,3,E('Déficit moderado a severo','Moderate to severe deficit')],[-1e9,4,E('Déficit severo a alto (estrés)','Severe to high deficit (stress)')]];
  const TALLO = [[-0.6,1,E('Sin déficit hídrico','No water deficit')],[-1.1,2,E('Déficit leve a moderado','Mild to moderate deficit')],[-1.6,3,E('Déficit moderado a severo','Moderate to severe deficit')],[-1e9,4,E('Déficit severo a alto (estrés)','Severe to high deficit (stress)')]];
  const UCANR = [[-0.80,E('Sin estrés hídrico','Not water stressed')],[-1.20,E('Algo de estrés hídrico','Some water stress')],[-1.60,E('Estrés hídrico extremo','Extremely water stressed')],[-1e9,E('Fuera de la tabla (más de −1.6 MPa)','Beyond the table (below −1.6 MPa)')]];
  const URIARTE = [[-0.411,E('Sin déficit','No deficit')],[-0.674,E('Déficit leve','Mild deficit')],[-0.936,E('Déficit moderado','Moderate deficit')],[-1.2,E('Déficit alto','High deficit')],[-1e9,E('Déficit severo','Severe deficit')]];
  /* En la escala del IVES los límites de tallo dejan huecos (−0.6/−0.7, −1.1/−1.2): un valor intermedio va a la clase siguiente */
  const clasif = (tabla, v)=> v==null ? null : tabla.find(x=>v>=x[0]);
  function psi(tipo, mpa){ if(mpa==null) return null;
    if(tipo==='alba') return {ives:clasif(ALBA,mpa)};
    if(tipo==='tallo') return {ives:clasif(TALLO,mpa), ucanr:clasif(UCANR,mpa), uriarte:clasif(URIARTE,mpa)};
    return null; }
  /* Prepara y corre el balance diario con los datos del usuario. Devuelve null y lo que falta si no se puede. */
  function correr(){ const falta=[], st=sitio(), uv=tipoUva(), sh=sueloHidrico(), et=FAO.ETAPAS_UVA.find(x=>x.id===S.raspa.etapas);
    if(!S.clima.dias.length) falta.push(['clima',E('registros diarios de clima','daily climate records')]);
    if(!st.ok) falta.push(['viñedo',E('latitud y altitud del sitio','site latitude and altitude')]);
    if(!uv) falta.push(['viñedo',E('tipo de uva (mesa o vino)','grape type (table or wine)')]);
    if(!sh.ok) falta.push(['suelo',E('θCC, θPMP y profundidad de raíces','θFC, θWP and rooting depth')]);
    if(!et) falta.push(['raspa',E('duración de las etapas','stage lengths')]);
    if(!S.raspa.brot) falta.push(['raspa',E('fecha de brotación','budburst date')]);
    if(falta.length) return {falta};
    const fw=(FAO.FW.find(x=>x.id===S.vina.riego)||{v:1}).v, riegos={}; (S.raspa.riegos||[]).forEach(r=>{ if(r.f&&num(r.mm)!=null) riegos[r.f]=(riegos[r.f]||0)+num(r.mm); });
    const dias=CLIMA.conET0(S.clima.dias.filter(d=>d.f>=S.raspa.brot), st).map(d=>({f:d.f, et0:d.r.et0, prec:d.prec||0, riego:riegos[d.f]||0, u2:d.r.u2, hrmin:d.hrmin, r:d.r}));
    if(!dias.length) return {falta:[['clima',E('días de clima desde la brotación','climate days from budburst')]]};
    const L=et.L, par={cc:sh.cc, pmp:sh.pmp, zr:sh.zr, ze:sh.ze, rew:sh.rew, p:uv.p, h:uv.h, fw, fc:num(S.raspa.fc), dr0:num(S.raspa.dr0), ajustar:!!S.raspa.ajustar,
      etapas:{Li:L[0], Ld:L[1], Lm:L[2], Lf:L[3], kini:uv.kcb[0], kmed:uv.kcb[1], kfin:uv.kcb[2]}};
    const b=FAO.balance(dias, par), tot=k=>b.reduce((s,d)=>s+d[k],0);
    const Tr=tot('Tr'), Ev=tot('E'), P=tot('P'), I=tot('I'), DP=tot('DP');
    return {b, par, sh, uv, fw, dias:b.length, tot:{et0:tot('et0'), etc:tot('etc'), T:Tr, E:Ev, P, I, DP}, fracE: Tr+Ev>0 ? Ev/(Tr+Ev) : null,
      diasEstres:b.filter(d=>d.Ks<1).length, ksMin:Math.min(...b.map(d=>d.Ks)), ultimo:b[b.length-1]}; }
  /* Lámina sugerida para regresar al suelo a capacidad de campo (riego neto = agotamiento Dr) */
  const laminaNeta = ultimo=> ultimo ? ultimo.Dr : null;
  return {ALBA, TALLO, UCANR, URIARTE, psi, correr, laminaNeta};
})();
