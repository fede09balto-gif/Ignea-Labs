/* ============================================================
   IGNEA LABS — WhatsApp assistant demo (homepage #demo)
   Ported from ignea-wa-demo-v2.html, engine unchanged.

   ES-only by decision. The scripted conversations are NOT
   data-i18n keys this pass — the target market is Nicaraguan
   ferreterias and there is no EN audience for them yet. They
   are isolated in the S config object below and nowhere else,
   so converting later means touching S, not the engine.

   Everything below the ENGINE banner is untouched from the source.
   ============================================================ */

(function(){
'use strict';

/* ============================================================
   CONFIG — edit scripts here. The engine below needs no changes.
   Event types:
     in    client message      {t:'in',   x:'texto con {{resaltado}}'}
     out   assistant message   {t:'out',  x:'...'}
     step  reasoning step      {t:'step', x:'título', d:'detalle', ms:600}
     ops   counter-screen card {t:'ops',  k:'etiqueta', tag:'NUEVO', x:'texto', s:'sub', money:true}
     doc   file bubble in chat {t:'doc',  f:'archivo.pdf', m:'PDF · 1 página'}
     pf    create proforma shell   {t:'pf'}
     row   add proforma line   {t:'row', i:0}
     sums  reveal totals       {t:'sums'}
   ============================================================ */

var S = {

ferreteria:{
  name:'Ferretería La Central', initials:'FC',
  events:[
    {t:'in',  x:'Buenas, ¿tienen {{cemento Holcim}}? ¿A cómo la bolsa?'},
    {t:'step',x:'Identificando producto', d:'cemento Holcim Fuerte 42.5 kg'},
    {t:'step',x:'Consultando inventario', d:'140 bolsas disponibles'},
    {t:'out', x:'¡Buenas! Sí — cemento Holcim Fuerte, C$385 la bolsa de 42.5 kg. Hay 140 en existencia. ¿Cuántas ocupa?'},

    {t:'in',  x:'Ocupo {{20 bolsas}} y también {{varilla corrugada de 3/8}}. ¿Me puede mandar una proforma para la constructora?'},
    {t:'step',x:'Segundo producto', d:'varilla 3/8" x 6 m — C$195'},
    {t:'step',x:'Detectando intención', d:'solicitud de proforma formal'},
    {t:'ops', k:'Consulta', tag:'ACTIVA', x:'Cliente pide proforma', s:'Atendido por el asistente'},
    {t:'out', x:'Claro. La varilla de 3/8" x 6 m está a C$195. ¿Cuántas varillas le pongo, y a nombre de quién emito la proforma?'},

    {t:'in',  x:'{{40 varillas}}. A nombre de {{Constructora García S.A., RUC J0310000123456}}. Y con entrega en el sitio.'},
    {t:'step',x:'Verificando cliente', d:'RUC J0310000123456 — cliente frecuente'},
    {t:'out', x:'Perfecto. Le armo la proforma con las 20 bolsas, 40 varillas y el flete local. Un momento.'},

    {t:'pf'},
    {t:'step',x:'Asignando correlativo', d:'PRO-1042'},
    {t:'step',x:'Cargando línea 1', d:'20 × C$385 = C$7,700.00'},
    {t:'row', i:0},
    {t:'step',x:'Cargando línea 2', d:'40 × C$195 = C$7,800.00'},
    {t:'row', i:1},
    {t:'step',x:'Agregando flete local', d:'entrega en sitio — C$150.00'},
    {t:'row', i:2},
    {t:'step',x:'Aplicando IVA 15%', d:'C$2,347.50'},
    {t:'sums'},
    {t:'ops', k:'Proforma', tag:'GENERADA', x:'PRO-1042 · Constructora García', s:'Válida 8 días'},
    {t:'ops', k:'Monto', tag:'', x:'C$ 17,997.50', s:'IVA incluido', money:true},
    {t:'doc', f:'PRO-1042_Constructora_Garcia.pdf', m:'PDF · 1 página · 48 kB'},
    {t:'out', x:'Listo. Proforma PRO-1042 por C$17,997.50 con IVA incluido, válida por 8 días. Si la aprueban, me confirma por aquí y programamos la entrega para mañana antes de las 10:00 am.'},
    {t:'ops', k:'Pendiente', tag:'ACCIÓN', x:'Aprobar y facturar', s:'Único paso manual del pedido', act:true}
  ],
  proforma:{
    biz:'Ferretería La Central',
    bizMeta:['RUC J0310000456789','Costado sur del mercado, León','Tel. 2311 4820'],
    no:'PRO-1042',
    dates:['Fecha: 30 jul 2026','Válida hasta: 07 ago 2026'],
    client:'Constructora García, S.A.', clientRuc:'RUC J0310000123456',
    rows:[
      {code:'CEM-HOL-42', desc:'Cemento Holcim Fuerte, bolsa 42.5 kg', qty:'20', unit:'385.00', total:'7,700.00'},
      {code:'VAR-038-6',  desc:'Varilla corrugada 3/8" x 6 m',          qty:'40', unit:'195.00', total:'7,800.00'},
      {code:'FLE-LOC',    desc:'Flete local — entrega en sitio',        qty:'1',  unit:'150.00', total:'150.00'}
    ],
    sums:[['Subtotal','C$ 15,650.00'],['IVA 15%','C$ 2,347.50']],
    total:['Total','C$ 17,997.50'],
    foot:'Precios en córdobas, sujetos a cambio sin previo aviso una vez vencida la proforma. Entrega dentro del casco urbano de León. Se acepta efectivo, transferencia o tarjeta.'
  }
},

clinica:{
  name:'Clínica Dental Sonrisa', initials:'CD',
  events:[
    {t:'in',  x:'Buenas tardes, quisiera una cita para {{limpieza dental}} esta semana'},
    {t:'step',x:'Identificando servicio', d:'limpieza dental — 40 min'},
    {t:'step',x:'Revisando agenda', d:'2 espacios esta semana'},
    {t:'out', x:'Buenas tardes. Con gusto. La limpieza dura 40 minutos y cuesta C$900. Tengo jueves 2:30 pm o viernes 10:00 am. ¿Cuál le acomoda?'},
    {t:'in',  x:'El {{jueves}} está bien'},
    {t:'step',x:'Reservando espacio', d:'jue 2 ago, 2:30 pm — Dra. Munguía'},
    {t:'out', x:'Perfecto. ¿Me confirma su nombre completo y número de cédula para registrarla?'},
    {t:'in',  x:'{{María Elena Ortiz}}, 001-150390-1002C'},
    {t:'step',x:'Creando expediente', d:'paciente nuevo'},
    {t:'ops', k:'Cita', tag:'NUEVA', x:'María Elena Ortiz', s:'Jue 2 ago · 2:30 pm · Limpieza'},
    {t:'out', x:'Registrada, María Elena. Jueves 2 de agosto, 2:30 pm, con la Dra. Munguía. Le llega un recordatorio por aquí el miércoles.'},
    {t:'in',  x:'¿Aceptan {{seguro}}?'},
    {t:'step',x:'Consultando convenios', d:'INISER, Seguros América'},
    {t:'out', x:'Trabajamos con INISER y Seguros América. Si trae su carné el jueves, lo aplicamos en caja. Si su seguro es otro, le paso con recepción para revisarlo.'},
    {t:'ops', k:'Recordatorio', tag:'PROGRAMADO', x:'Mié 1 ago · 9:00 am', s:'Envío automático', act:true}
  ],
  proforma:null
},

hotel:{
  name:'Hotel Las Peñitas', initials:'HP',
  events:[
    {t:'in',  x:'Hola, ¿tienen habitación para 2 personas del {{15 al 17 de agosto}}?'},
    {t:'step',x:'Leyendo fechas', d:'15–17 ago · 2 noches'},
    {t:'step',x:'Consultando disponibilidad', d:'4 habitaciones libres'},
    {t:'out', x:'¡Hola! Sí, tenemos disponibilidad. Doble con vista al mar: US$68 la noche, desayuno incluido. Dos noches serían US$136.'},
    {t:'in',  x:'¿Y tienen algo con {{aire acondicionado}}?'},
    {t:'step',x:'Comparando categorías', d:'doble y suite — ambas con A/C'},
    {t:'out', x:'La doble ya trae aire acondicionado. Si prefiere más espacio, la suite con terraza está a US$92 la noche — US$184 por las dos noches.'},
    {t:'in',  x:'Nos quedamos con la {{doble}}. ¿Cómo reservo?'},
    {t:'step',x:'Calculando anticipo', d:'30% de US$136 = US$41'},
    {t:'out', x:'Solo necesito su nombre completo y un anticipo del 30% (US$41) por transferencia o tarjeta. ¿A nombre de quién hago la reserva?'},
    {t:'in',  x:'{{Daniel Rivas}}'},
    {t:'step',x:'Bloqueando habitación', d:'RSV-0338 · doble vista al mar'},
    {t:'ops', k:'Reserva', tag:'NUEVA', x:'Daniel Rivas · RSV-0338', s:'15–17 ago · Doble vista al mar'},
    {t:'ops', k:'Anticipo', tag:'', x:'US$ 41.00', s:'Enlace de pago enviado', money:true},
    {t:'out', x:'Reserva RSV-0338 a nombre de Daniel Rivas, doble vista al mar, 15 al 17 de agosto. Le envío el enlace de pago y, al confirmarse, el comprobante por aquí.'},
    {t:'ops', k:'Pendiente', tag:'ACCIÓN', x:'Confirmar al recibir pago', s:'Único paso manual', act:true}
  ],
  proforma:null
}

};

/* ============================ ENGINE ============================ */

var chat=document.getElementById('chat'), steps=document.getElementById('steps'),
    ops=document.getElementById('ops'), pfEl=document.getElementById('pf'),
    nm=document.getElementById('nm'), av=document.getElementById('av'),
    pulse=document.getElementById('pulse'), opcount=document.getElementById('opcount'),
    tabs=[].slice.call(document.querySelectorAll('.ig-tab')),
    replay=document.getElementById('replay'), section=document.getElementById('demo');

var timers=[], running=false, current='ferreteria', token=0, opsN=0,
    reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function wait(ms){return new Promise(function(r){timers.push(setTimeout(r,ms));});}
function clearAll(){timers.forEach(clearTimeout);timers=[];}

var TICKS='<svg class="ig-ticks" viewBox="0 0 18 12" aria-hidden="true"><path d="M1 6.6l3 3.2 6.2-8"/><path class="ig-t2" d="M10.2 9.8l6.2-8"/></svg>';
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function hl(s){return esc(s).replace(/\{\{(.+?)\}\}/g,'<mark class="ig-hl">$1</mark>');}
function scroll(el){el.scrollTop=el.scrollHeight;}

function addMsg(e,anim){
  var el=document.createElement('div');
  el.className='ig-msg ig-msg--'+(e.t==='in'?'in':'out')+(anim?' ig-pop':'');
  el.innerHTML='<span>'+hl(e.x)+'</span><div class="ig-msg__meta"><span>9:1'+(e.t==='in'?'2':'3')+'</span>'+
               (e.t==='in'?'':TICKS.replace('ig-ticks','ig-ticks ig-ticks--single'))+'</div>';
  chat.appendChild(el);scroll(chat);return el;
}
function addDoc(e,anim){
  var el=document.createElement('div');
  el.className='ig-docmsg'+(anim?' ig-pop':'');
  el.innerHTML='<div class="ig-docmsg__c"><svg width="28" height="34" viewBox="0 0 30 36" aria-hidden="true">'+
    '<path d="M2 1h18l8 8v26H2z" fill="#fff" stroke="#C7CDD1"/><path d="M20 1v8h8" fill="none" stroke="#C7CDD1"/>'+
    '<rect x="6" y="16" width="18" height="1.6" fill="#E8352A"/><rect x="6" y="21" width="13" height="1.6" fill="#C7CDD1"/>'+
    '<rect x="6" y="26" width="16" height="1.6" fill="#C7CDD1"/></svg>'+
    '<div><div class="ig-docmsg__n">'+esc(e.f)+'</div><div class="ig-docmsg__s">'+esc(e.m)+'</div></div></div>'+
    '<div class="ig-msg__meta"><span>9:13</span>'+TICKS.replace('ig-ticks','ig-ticks ig-ticks--single')+'</div>';
  chat.appendChild(el);scroll(chat);return el;
}
function ticks(el,read){
  var t=el.querySelector('.ig-ticks'); if(!t)return;
  t.classList.remove('ig-ticks--single'); if(read)t.classList.add('ig-ticks--read');
}
function typing(){
  var el=document.createElement('div');el.className='ig-typing';
  el.innerHTML='<i></i><i></i><i></i>';chat.appendChild(el);scroll(chat);return el;
}
function addStep(e,anim){
  var prev=steps.querySelector('.ig-step.active');
  if(prev){prev.classList.remove('active');prev.classList.add('done');}
  var li=document.createElement('li');
  li.className='ig-step'+(anim?'':' in done');
  li.innerHTML='<div class="ig-step__t">'+esc(e.x)+'</div>'+(e.d?'<div class="ig-step__d">'+esc(e.d)+'</div>':'');
  steps.appendChild(li);
  if(anim){requestAnimationFrame(function(){li.classList.add('in','active');});}
  return li;
}
function addOps(e,anim){
  var idle=ops.querySelector('.ig-ops__idle'); if(idle)idle.remove();
  var el=document.createElement('div');
  el.className='ig-ev'+(e.money?' ig-ev--money':'');
  if(!anim)el.style.animation='none';
  el.innerHTML='<div class="ig-ev__k"><span>'+esc(e.k)+'</span>'+(e.tag?'<b>'+esc(e.tag)+'</b>':'')+'</div>'+
               '<div class="ig-ev__t">'+esc(e.x)+'</div>'+(e.s?'<div class="ig-ev__s">'+esc(e.s)+'</div>':'');
  ops.appendChild(el);
  if(e.act){
    var a=document.createElement('div');a.className='ig-ops__act';
    a.innerHTML='<button type="button" tabindex="-1" class="pri">Aprobar</button><button type="button" tabindex="-1">Ver</button>';
    ops.appendChild(a);
  } else { opsN++; opcount.textContent=opsN+(opsN===1?' nuevo':' nuevos'); }
  scroll(ops);
}
function opsIdle(){ops.innerHTML='<div class="ig-ops__idle">Sin intervención<br>del mostrador</div>';opsN=0;opcount.textContent='0 nuevos';}

function pfShell(pf,anim){
  pfEl.innerHTML='<article class="ig-pf"'+(anim?'':' style="animation:none"')+'>'+
    '<div class="ig-pf__top"><div><div class="ig-pf__biz">'+esc(pf.biz)+'</div>'+
    '<div class="ig-pf__bm">'+pf.bizMeta.map(esc).join('<br>')+'</div></div>'+
    '<div><div class="ig-pf__kind">Proforma</div><div class="ig-pf__no">'+esc(pf.no)+'</div>'+
    '<div class="ig-pf__dt">'+pf.dates.map(esc).join('<br>')+'</div></div></div>'+
    '<dl class="ig-pf__cl"><dt>Cliente</dt><dd>'+esc(pf.client)+' <span>'+esc(pf.clientRuc)+'</span></dd></dl>'+
    '<table><thead><tr><th>Código</th><th>Descripción</th><th style="text-align:right">Cant.</th>'+
    '<th style="text-align:right">P. Unit.</th><th style="text-align:right">Total</th></tr></thead>'+
    '<tbody id="pfBody"></tbody></table><div id="pfSums"></div>'+
    '<p class="ig-pf__ft">'+esc(pf.foot)+'</p>'+
    '<div class="ig-pf__sig"><div>Elaborado por</div><div>Autorizado por</div></div></article>';
}
function pfRow(pf,i,anim){
  var b=document.getElementById('pfBody'); if(!b)return;
  var r=pf.rows[i],tr=document.createElement('tr');
  if(!anim)tr.style.animation='none';
  tr.innerHTML='<td class="code">'+esc(r.code)+'</td><td>'+esc(r.desc)+'</td>'+
    '<td class="num">'+esc(r.qty)+'</td><td class="num">'+esc(r.unit)+'</td><td class="num">'+esc(r.total)+'</td>';
  b.appendChild(tr);
}
function pfSums(pf){
  var s=document.getElementById('pfSums'); if(!s)return;
  s.className='ig-pf__sums';
  s.innerHTML=pf.sums.map(function(x){return '<div><span>'+esc(x[0])+'</span><span>'+esc(x[1])+'</span></div>';}).join('')+
    '<div class="tot"><span>'+esc(pf.total[0])+'</span><span>'+esc(pf.total[1])+'</span></div>';
}
function pfHint(){pfEl.innerHTML='<div class="ig-hint">La proforma se arma aquí,<br>línea por línea, mientras el asistente responde</div>';}

function reset(){
  clearAll(); token++; running=false;
  chat.innerHTML=''; steps.innerHTML=''; pfEl.innerHTML='';
  pulse.classList.remove('live'); opsIdle();
}

function renderStatic(k){
  var s=S[k];
  var d=document.createElement('div');d.className='ig-day';d.textContent='HOY';chat.appendChild(d);
  if(s.proforma)pfShell(s.proforma,false); else pfHint();
  s.events.forEach(function(e){
    if(e.t==='in'||e.t==='out'){var el=addMsg(e,false); if(e.t==='out')ticks(el,true);}
    else if(e.t==='doc'){ticks(addDoc(e,false),true);}
    else if(e.t==='step'){addStep(e,false);}
    else if(e.t==='ops'){addOps(e,false);}
    else if(e.t==='row'&&s.proforma){pfRow(s.proforma,e.i,false);}
    else if(e.t==='sums'&&s.proforma){pfSums(s.proforma);}
  });
}

async function play(k){
  var my=++token; running=true;
  var s=S[k];
  var d=document.createElement('div');d.className='ig-day';d.textContent='HOY';chat.appendChild(d);
  if(s.proforma)pfHint();
  pulse.classList.add('live');

  for(var i=0;i<s.events.length;i++){
    if(my!==token)return;
    var e=s.events[i];

    if(e.t==='in'){
      var el=addMsg(e,true);
      var m=el.querySelector('mark');
      if(m){await wait(260); if(my!==token)return; m.classList.add('on');}
      await wait(420);
    }
    else if(e.t==='step'){
      addStep(e,true);
      await wait(e.ms||620);
    }
    else if(e.t==='ops'){
      addOps(e,true);
      await wait(480);
    }
    else if(e.t==='out'||e.t==='doc'){
      var ty=typing();
      var len=e.t==='doc'?55:e.x.length;
      await wait(Math.min(1100+len*30,2400));
      if(my!==token){ty.remove();return;}
      ty.remove();
      var node=e.t==='doc'?addDoc(e,true):addMsg(e,true);
      await wait(460); if(my!==token)return; ticks(node,false);
      await wait(280); if(my!==token)return; ticks(node,true);
      await wait(560);
    }
    else if(e.t==='pf'){ pfShell(s.proforma,true); await wait(520); }
    else if(e.t==='row'){ pfRow(s.proforma,e.i,true); await wait(400); }
    else if(e.t==='sums'){ pfSums(s.proforma); await wait(520); }
  }
  if(my!==token)return;
  var last=steps.querySelector('.ig-step.active');
  if(last){last.classList.remove('active');last.classList.add('done');}
  pulse.classList.remove('live');
  running=false;
}

function start(k){
  reset(); current=k;
  nm.textContent=S[k].name; av.textContent=S[k].initials;
  if(reduced)renderStatic(k); else play(k);
}

tabs.forEach(function(tab){
  tab.addEventListener('click',function(){
    tabs.forEach(function(t){t.setAttribute('aria-selected',String(t===tab));});
    start(tab.dataset.s);
  });
});
replay.addEventListener('click',function(){start(current);});

opsIdle(); pfHint();

var began=false;
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(en){
    en.forEach(function(x){ if(x.isIntersecting&&!began){began=true;start(current);io.disconnect();} });
  },{threshold:0.25});
  io.observe(section);
}else{ start(current); }

})();

/* ============================================================
   The site's fixed WhatsApp float overlaps this section's own
   rendered WhatsApp UI — at 375px it lands directly beneath the
   demo phone's send button, where it reads as part of the mockup.
   Hide it for the duration the demo is on screen, restore after.
   ============================================================ */
(function(){
  'use strict';

  /* .wa-float is the last element in <body>, after this script tag, so it does
     not exist yet at parse time. Wait for the document before querying it. */
  function bind() {
    var float = document.querySelector('.wa-float');
    var demo = document.getElementById('demo');
    if (!float || !demo || !('IntersectionObserver' in window)) return;

    new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        float.classList.toggle('is-hidden', e.isIntersecting);
      });
    }, { threshold: 0.12 }).observe(demo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
