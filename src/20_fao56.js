"use strict";
/* =====================================================================
   MOTOR FAO-56 · evapotranspiración y balance hídrico del suelo
   Allen, R. G., Pereira, L. S., Raes, D. y Smith, M. (2006). Evapotranspiración
   del cultivo: guías para la determinación de los requerimientos de agua de los
   cultivos. Estudio FAO Riego y Drenaje 56. Roma: FAO.
   Cada función indica la ecuación (Ec.) o el cuadro de FAO-56 que implementa.
   Validado con los ejemplos resueltos 2, 8, 14, 15, 18 y 20 de FAO-56 y con una
   implementación independiente en Python (pruebas/verificar_fao56.py).
   ===================================================================== */
const FAO = (()=>{
  const GSC = 0.0820, SIGMA = 4.903e-9, rad = g=>Math.PI/180*g;
  const P = z=> 101.3*Math.pow((293-0.0065*z)/293, 5.26);                    // Ec. 7  [kPa]
  const gamma = Pk=> 0.665e-3*Pk;                                            // Ec. 8  [kPa °C-1]
  const e0 = T=> 0.6108*Math.exp(17.27*T/(T+237.3));                         // Ec. 11 [kPa]
  const es = (tx,tn)=> (e0(tx)+e0(tn))/2;                                    // Ec. 12
  const delta = T=> 4098*e0(T)/Math.pow(T+237.3,2);                          // Ec. 13 [kPa °C-1]
  /* Presión real de vapor: el mejor dato disponible, en el orden de FAO-56 */
  function ea(d){ if(d.tdew!=null) return {v:e0(d.tdew), m:'Ec. 14'};
    if(d.hrmax!=null && d.hrmin!=null) return {v:(e0(d.tmin)*d.hrmax/100 + e0(d.tmax)*d.hrmin/100)/2, m:'Ec. 17'};
    if(d.hrmax!=null) return {v:e0(d.tmin)*d.hrmax/100, m:'Ec. 18'};
    if(d.hrmed!=null) return {v:d.hrmed/100*(e0(d.tmax)+e0(d.tmin))/2, m:'Ec. 19'};
    return {v:e0(d.tmin), m:'Ec. 48 (Tdew ≈ Tmin)'}; }
  const dr = J=> 1+0.033*Math.cos(2*Math.PI*J/365);                         // Ec. 23
  const decl = J=> 0.409*Math.sin(2*Math.PI*J/365-1.39);                     // Ec. 24
  const ws = (phi,dc)=> Math.acos(Math.max(-1,Math.min(1,-Math.tan(phi)*Math.tan(dc))));   // Ec. 25
  function Ra(lat,J){ const phi=rad(lat), dc=decl(J), w=ws(phi,dc);           // Ec. 21 [MJ m-2 d-1]
    return 24*60/Math.PI*GSC*dr(J)*(w*Math.sin(phi)*Math.sin(dc)+Math.cos(phi)*Math.cos(dc)*Math.sin(w)); }
  const Nhoras = (lat,J)=> 24/Math.PI*ws(rad(lat),decl(J));                   // Ec. 34
  const rsAngstrom = (n,N,ra,as=0.25,bs=0.50)=> (as+bs*n/N)*ra;              // Ec. 35
  const rsHarg = (tx,tn,ra,k=0.16)=> k*Math.sqrt(Math.max(0,tx-tn))*ra;       // Ec. 50 (k 0.16 interior, 0.19 costa)
  const Rso = (z,ra)=> (0.75+2e-5*z)*ra;                                      // Ec. 37
  const Rns = (rs,alb=0.23)=> (1-alb)*rs;                                     // Ec. 38
  function Rnl(tx,tn,eav,rs,rso){ const r=Math.min(1,rs/rso);                // Ec. 39
    return SIGMA*(Math.pow(tx+273.16,4)+Math.pow(tn+273.16,4))/2*(0.34-0.14*Math.sqrt(eav))*(1.35*r-0.35); }
  const u2de = (uz,z)=> uz*4.87/Math.log(67.8*z-5.42);                        // Ec. 47
  const DOY = f=>{ const d=new Date(f+'T12:00:00Z'); return Math.round((d-Date.UTC(d.getUTCFullYear(),0,1,12))/864e5)+1; };
  /* ET0 diaria por FAO Penman–Monteith (Ec. 6). d: {f|J, tmax, tmin, hr…, u2|uz+zv, rs|n}; sitio: {lat, z} */
  function et0(d, sitio){ const J=d.J||DOY(d.f), z=sitio.z||0, tm=(d.tmax+d.tmin)/2, Pk=P(z), g=gamma(Pk), D=delta(tm);
    const ra=Ra(sitio.lat,J), N=Nhoras(sitio.lat,J), e=ea(d), esv=es(d.tmax,d.tmin);
    let rs=d.rs, mrs='medida'; if(rs==null && d.n!=null){ rs=rsAngstrom(d.n,N,ra); mrs='Ec. 35'; } if(rs==null){ rs=rsHarg(d.tmax,d.tmin,ra,sitio.kRs||0.16); mrs='Ec. 50'; }
    let u2=d.u2, mu='medida'; if(u2==null && d.uz!=null){ u2=u2de(d.uz,d.zv||10); mu='Ec. 47'; } if(u2==null){ u2=2; mu='2 m s-1 (FAO-56, a falta de dato)'; }
    const rso=Rso(z,ra), rns=Rns(rs), rnl=Rnl(d.tmax,d.tmin,e.v,rs,rso), rn=rns-rnl, G=0;   // Ec. 40 y 42 (G ≈ 0 en periodos diarios)
    const v = (0.408*D*(rn-G) + g*900/(tm+273)*u2*(esv-e.v)) / (D + g*(1+0.34*u2));
    return {et0:Math.max(0,v), J, tm, P:Pk, gamma:g, delta:D, es:esv, ea:e.v, mea:e.m, vpd:esv-e.v, ra, N, rs, mrs, rso, rns, rnl, rn, G, u2, mu}; }
  /* ET0 por Hargreaves (Ec. 52), con Ra expresada en evaporación equivalente (0.408 Ra) */
  const et0Harg = (tx,tn,ra)=> 0.0023*((tx+tn)/2+17.8)*Math.sqrt(Math.max(0,tx-tn))*0.408*ra;

  /* ---------- Coeficiente dual del cultivo (cap. 7) y balance hídrico (cap. 8) ----------
     Kcb por etapas (Cuadro 17 y Fig. 34): constante en la etapa inicial y en la de mediados de temporada,
     lineal en las de desarrollo y final. Duraciones del Cuadro 11. */
  function kcbDia(t, et){ const {Li,Ld,Lm,Lf,kini,kmed,kfin}=et;
    if(t<=Li) return kini; if(t<=Li+Ld) return kini+(kmed-kini)*(t-Li)/Ld;
    if(t<=Li+Ld+Lm) return kmed; if(t<=Li+Ld+Lm+Lf) return kmed+(kfin-kmed)*(t-Li-Ld-Lm)/Lf; return kfin; }
  const ajusteClima = (u2,hrmin,h)=> (0.04*(u2-2)-0.004*(hrmin-45))*Math.pow(h/3,0.3);   // Ec. 62 / 70
  /* Balance diario. dias: [{f, et0, prec, riego, u2, hrmin}] ; par: parámetros del suelo y del cultivo */
  function balance(dias, par){
    const TAW = 1000*(par.cc-par.pmp)*par.zr;                                 // Ec. 82 [mm]
    const TEW = 1000*(par.cc-0.5*par.pmp)*par.ze;                             // Ec. 73 [mm]
    const REW = Math.min(par.rew, TEW*0.99), h=par.h, kcmin=par.kcmin??0.15;
    let Dr = par.dr0!=null ? par.dr0 : 0, De = par.de0!=null ? par.de0 : 0;   // inicio a capacidad de campo si no se indica
    let fwUlt = 1;                                                             // fw del último humedecimiento (lluvia = 1)
    const out=[];
    dias.forEach((d,i)=>{ const t=i+1, u2=d.u2??2, hrmin=d.hrmin??45;
      let kcb=kcbDia(t, par.etapas);
      if(par.ajustar && kcb>0.45 && t>par.etapas.Li+par.etapas.Ld) kcb+=ajusteClima(u2,hrmin,h);          // Ec. 70
      const kcmax=Math.max(1.2+ajusteClima(u2,hrmin,h), kcb+0.05);                                         // Ec. 72
      const fc = par.fc!=null ? par.fc : Math.min(0.99, Math.max(0.01, Math.pow(Math.max(0,(kcb-kcmin)/(kcmax-kcmin)), 1+0.5*h)));   // Ec. 76
      const P=d.prec||0, I=d.riego||0, RO=0;                                  // escurrimiento superficial supuesto nulo
      if(P>0) fwUlt=1; else if(I>0) fwUlt=par.fw;                              // Cuadro 20: lluvia 1.0; goteo 0.3–0.4
      const fw = fwUlt;                                                        // entre eventos se conserva el del último (FAO-56, cap. 7)
      const few = Math.max(0.01, Math.min(1-fc, fw));                          // Ec. 75
      const Kr = De<=REW ? 1 : Math.max(0,(TEW-De)/(TEW-REW));                 // Ec. 74
      const Ke = Math.min(Kr*(kcmax-kcb), few*kcmax);                          // Ec. 71
      const p = Math.min(0.8, Math.max(0.1, par.p + 0.04*(5 - (kcb+Ke)*d.et0)));   // Cuadro 22 ajustado
      const RAW = p*TAW;                                                       // Ec. 83
      const Ks = Dr<=RAW ? 1 : Math.max(0,(TAW-Dr)/((1-p)*TAW));               // Ec. 84
      const E = Ke*d.et0, Tr = Ks*kcb*d.et0, etc = Tr+E;                       // Ec. 69 y 80
      const DPe = Math.max(0, P-RO+I/fw-De);                                   // Ec. 79
      De = Math.min(TEW, Math.max(0, De-(P-RO)-I/fw+E/few+DPe));               // Ec. 77 (Tew ≈ 0)
      const DP = Math.max(0, P-RO+I-etc-Dr);                                   // Ec. 88
      Dr = Math.min(TAW, Math.max(0, Dr-(P-RO)-I+etc+DP));                     // Ec. 85 (CR ≈ 0)
      out.push({f:d.f, t, et0:d.et0, kcb, kcmax, fc, few, Kr, Ke, Ks, p, RAW, E, Tr, etc, P, I, DP, Dr, De, TAW, TEW}); });
    return out; }
  /* Fracción de agotamiento p del Cuadro 22 y Zr; Kc y Kcb de los Cuadros 12 y 17; etapas del Cuadro 11 */
  const UVA = {
    mesa:{kc:[0.30,0.85,0.45], kcb:[0.15,0.80,0.40], h:2, zr:[1.0,2.0], p:0.35},
    vino:{kc:[0.30,0.70,0.45], kcb:[0.15,0.65,0.40], h:1.75, zr:[1.0,2.0], p:0.45} };
  const ETAPAS_UVA = [
    {id:'bajas', L:[20,40,120,60], mes:4, n:E('Latitudes bajas (abril)','Low latitudes (April)')},
    {id:'calif', L:[20,50,75,60], mes:3, n:E('California, EUA (marzo)','California, USA (March)')},
    {id:'altas', L:[20,50,90,20], mes:5, n:E('Latitudes altas (mayo)','High latitudes (May)')},
    {id:'vino', L:[30,60,40,80], mes:4, n:E('Latitudes medias, vino (abril)','Mid latitudes, wine (April)')} ];
  const FW = [{id:'goteo',v:0.35,n:E('Goteo (0.3–0.4)','Drip (0.3–0.4)')},{id:'surcoalt',v:0.4,n:E('Surcos alternados (0.3–0.5)','Alternate furrows (0.3–0.5)')},{id:'surcoancho',v:0.5,n:E('Surcos, camas anchas (0.4–0.6)','Furrows, wide beds (0.4–0.6)')},{id:'surcoestr',v:0.8,n:E('Surcos, camas estrechas (0.6–1.0)','Furrows, narrow beds (0.6–1.0)')},{id:'aspersion',v:1,n:E('Aspersión, melgas o pozas (1.0)','Sprinkler, borders or basins (1.0)')}];
  /* Cuadro 19: θCC, θPMP (m3 m-3) y AFE/REW (mm), rangos típicos por textura USDA */
  const SUELOS = [
    {id:'arena',      n:E('Arenoso','Sand'),                   cc:[0.07,0.17], pmp:[0.02,0.07], rew:[2,7]},
    {id:'arenafr',    n:E('Arenoso franco','Loamy sand'),      cc:[0.11,0.19], pmp:[0.03,0.10], rew:[4,8]},
    {id:'frarenoso',  n:E('Franco arenoso','Sandy loam'),      cc:[0.18,0.28], pmp:[0.06,0.16], rew:[6,10]},
    {id:'franco',     n:E('Franco','Loam'),                    cc:[0.20,0.30], pmp:[0.07,0.17], rew:[8,10]},
    {id:'frlimoso',   n:E('Franco limoso','Silt loam'),        cc:[0.22,0.36], pmp:[0.09,0.21], rew:[8,11]},
    {id:'limoso',     n:E('Limoso','Silt'),                    cc:[0.28,0.36], pmp:[0.12,0.22], rew:[8,11]},
    {id:'frarclim',   n:E('Franco arcillo limoso','Silty clay loam'), cc:[0.30,0.37], pmp:[0.17,0.24], rew:[8,11]},
    {id:'arclim',     n:E('Arcillo limoso','Silty clay'),      cc:[0.30,0.42], pmp:[0.17,0.29], rew:[8,12]},
    {id:'arcilla',    n:E('Arcilloso','Clay'),                 cc:[0.32,0.40], pmp:[0.20,0.24], rew:[8,12]} ];
  return {P, gamma, e0, es, delta, ea, dr, decl, ws, Ra, Nhoras, rsAngstrom, rsHarg, Rso, Rns, Rnl, u2de, DOY, et0, et0Harg, kcbDia, ajusteClima, balance, UVA, ETAPAS_UVA, FW, SUELOS};
})();
