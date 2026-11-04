"use strict";
/* =====================================================================
   Llenado por el usuario, modo ejemplo y bloques de resultados sin datos.
   - avance(id): cuántos datos de un bloque llenó la persona (nunca cuenta
     sugerencias ni el ejemplo) → Pendiente / En proceso / Completo.
   - Modo ejemplo: el caso de Mata de Zarza vive en un estado aparte que no se
     guarda; una franja fija lo anuncia y el proyecto del usuario queda intacto.
   ===================================================================== */
const BLOQUES_LLENAR = ['vina','suelo','clima','raspa','fert','bio','prod','est'];
const BLOQUES_RESULTADO = [];
function avance(id){ let c=[], nota='';
  const v=S.vina, s=S.suelo, r=S.raspa;
  if(id==='vina') c=[!!S.loc||(S.sitio.manual&&num(S.sitio.lat)!=null&&num(S.sitio.z)!=null), !!v.tipo, !!v.variedad, num(v.entre)!=null, num(v.sobre)!=null, !!v.riego, !!S.exp.sorteo];
  else if(id==='suelo') c=[!!(s.textura||SUELO.textura(num(s.jarArena),num(s.jarLimo),num(s.jarArcilla))), num(s.da)!=null||(num(s.daMasa)!=null&&num(s.daVol)!=null), num(s.cc)!=null, num(s.pmp)!=null, num(s.zr)!=null, num(s.ph)!=null, num(s.ce)!=null, num(s.mo)!=null];
  else if(id==='clima'){ c=[S.clima.dias.length>0, S.clima.dias.length>=30, S.clima.dias.length>=180, !!S.clima.fuente]; if(!S.clima.dias.length) nota=T('importa los registros diarios','import the daily records'); }
  else if(id==='raspa') c=[!!r.etapas, !!r.brot, (r.riegos||[]).length>0, (r.psi||[]).length>0];
  else if(id==='fert'){ const fo=Object.values(S.fert.foliar||{}); c=[Object.values(S.fert.suelo).some(v=>num(v)!=null), !!S.fert.tejido&&!!S.fert.etapa, fo.some(o=>Object.values(o).some(v=>num(v)!=null)), (S.fert.abonos||[]).length>0]; }
  else if(id==='bio'){ const d=Object.values(S.bio.datos||{}); c=[d.some(o=>num(o.poda)!=null), d.some(o=>num(o.af)!=null), (S.bio.sarm||[]).length>0, num(S.bio.fC)!=null, Object.keys(S.bio.ms||{}).length>0]; }
  else if(id==='prod'){ const d=Object.values(S.prod.datos||{}); c=[d.some(o=>num(o.rend)!=null), d.some(o=>num(o.racimos)!=null), d.some(o=>num(o.brix)!=null), d.some(o=>num(o.acidez)!=null)]; }
  else if(id==='est') c=[S.est.filas.length>0, !!S.est.cT, !!S.est.cB];
  else return null;
  const t=c.length, h=c.filter(Boolean).length, f=t?h/t:0, estado=!h?'pend':h>=t?'ok':'proc';
  return {h, t, f, estado, nota, txt:{pend:T('Pendiente','Pending'), proc:T('En proceso','In progress'), ok:T('Completo','Complete')}[estado]}; }
function avanceTotal(){ const l=BLOQUES_LLENAR.map(avance).filter(Boolean); return l.reduce((s,a)=>s+a.f,0)/l.length; }
function franjaAvance(id){ if(EJ) return `<div class="avance ej"><b>${T('Ejemplo','Example')}</b> · ${T('estos datos no son tuyos','these data are not yours')}</div>`;
  const a=avance(id); if(!a) return '';
  return `<div class="avance est-${a.estado}"><div class="av-barra"><i style="width:${100*a.f}%"></i></div><span><b>${a.h} ${T('de','of')} ${a.t}</b> ${T('llenados por ti','filled in by you')} · ${a.txt}${a.nota?' · '+esc(a.nota):''}</span></div>`; }
function franjaEjemplo(){ let f=$('#franjaEj'); if(!EJ){ if(f) f.remove(); return; }
  if(!f){ f=document.createElement('div'); f.id='franjaEj'; f.className='franja-ej no-print'; document.body.prepend(f); }
  f.innerHTML=`<span>⚑ <b>${T('Estás viendo un EJEMPLO.','You are viewing an EXAMPLE.')}</b> ${T('Tus datos no han cambiado y nada de esto se guarda.','Your data have not changed and nothing here is saved.')}</span><button class="btn sm" data-salir-ej>${T('Salir del ejemplo','Leave the example')} ✕</button>`; }
function salirEjemplo(){ if(!EJ) return; EJ=false; S=S_USUARIO||cargar(); S_USUARIO=null; render(); toast(T('Regresaste a tu proyecto','Back to your project')); }
document.addEventListener('click',ev=>{ if(ev.target.closest('[data-salir-ej]')) salirEjemplo(); });
