const ROOT='/Users/fedebalto/ignea-labs';
const store={},ss={};
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
global.sessionStorage={getItem:k=>k in ss?ss[k]:null,setItem:(k,v)=>{ss[k]=String(v)},removeItem:k=>{delete ss[k]}};
global.LeyvaFamilies=require(ROOT+'/js/leyva-families.js');
global.LeyvaOrder=require(ROOT+'/js/leyva-order.js');
global.LeyvaDemo=require(ROOT+'/js/leyva-demo.js');
global.LeyvaMemory=require(ROOT+'/js/leyva-memory.js');
const D=LeyvaDemo,M=LeyvaMemory;
let f=0,n=0;
const ck=(l,c,x)=>{n++;if(!c)f++;console.log((c?'PASS  ':'FAIL  ')+l+(x?'   '+String(x).replace(/\n/g,' | '):''))};
const say=q=>D.local(q).bubbles.join('\n');

M.init(); M.setMode('vuelve'); D.resetState();
ck('seeded profile exists', !!M.profile());
ck('declared razón social', M.declared('razon_social').v==='Constructora García S.A.');
ck('RUC marked synthetic', M.declared('ruc').fake===true);
const open=M.abiertas()[0];
ck('open proforma PRO-2481', open && open.correlativo==='PRO-2481', open&&open.correlativo);
// prices re-derived from the catalog, never stored
const C=require(ROOT+'/api/_data/leyva-catalog.json');
const expect=14*C.items['GYP-12-48'].precio + 2*C.items['PTA-MET-3T-CAFE'].precio;
ck('open proforma total recomputed = C$'+expect.toLocaleString('en-US'), open.total===expect, open.total);

D.resetState();
const rec=say('lo mismo del mes pasado');
ck('repeat order recalls the proforma', /PRO-2481/.test(rec), rec);
ck('repeat order shows the recomputed total', rec.includes(expect.toLocaleString('en-US')), rec);
ck('repeat order ASKS quantities', /cantidades/i.test(rec), rec);
const q1=say('sí');
ck('qty confirm -> naming question', /nombre de Constructora Garc/i.test(q1), q1);
const q2=say('sí');
ck('name confirm -> document', /se la mando a nombre de/i.test(q2), q2);

M.setMode('vuelve'); D.resetState();
const w=say('olvidá mis datos');
ck('forget confirms', /borré sus datos/i.test(w), w);
ck('forget actually wipes', M.wiped() && M.profile()===null && M.wire()===null);
ck('forget clears raw storage', !JSON.parse(store['ignea_leyva_profiles']||'{}')['8000-0000']);
ck('after forgetting, no prior order', /No tengo un pedido anterior/.test(say('lo mismo del mes pasado')));

// the NEW cotización flow must still reach a document
M.setMode('nuevo'); D.resetState();
say('10 tubos de media, 5 codos y 2 bultos de cemento');
const c1=say('me arma una cotización');
ck('confirmation before the document', /Para confirmarle/i.test(c1), c1);
ck('confirmation pluralises the nouns', /10 tubos/.test(c1) && /5 codos/.test(c1) && /2 bultos/.test(c1), c1);
ck('confirmation stays short (Fede: "10 tubos de 1/2, 5 codos de 1/2 y 2 bultos de cemento")', c1.split('\n')[0].length < 95, c1.split('\n')[0].length + ' chars: ' + c1.split('\n')[0]);
const c2=say('sí');
ck('confirmation -> naming question', /nombre/i.test(c2), c2);
ck('confirmation not repeated', !/Para confirmarle/i.test(c2), c2);
const c3=say('Constructora Peña S.A.');
ck('name accepted -> document path', /se la mando a nombre de Constructora Peña S\.A\./.test(c3), c3);

console.log('\n'+(f?f+' of '+n+' FAILED':'all '+n+' memory assertions pass'));
process.exit(f?1:0);
