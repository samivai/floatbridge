// Run with Node.js: node test.js
const assert=require('node:assert/strict');
const fs=require('node:fs');
global.window={};require('./bundle.js');const D=window.FLOATBRIDGE_DATA;const E=require('./engine.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}
const s=D.scenarios[0];
test('Features match documented trained model',()=>{assert.equal(E.features(D.agents[0],82,8).length,D.model.coefficients.length);});
test('Forecast is finite, positive, deterministic',()=>{let a=E.forecast(D,D.agents[0],82);assert.deepEqual(a,E.forecast(D,D.agents[0],82));assert(a.every(x=>Number.isFinite(x.cashIn)&&x.cashIn>0&&x.cashOut>0));});
test('No approval means no replenishment',()=>{let p=E.propose(D,s);assert.equal(E.replay(D,s,p,false).visits,0);});
test('Budget and visit capacity are respected',()=>{for(const scenario of D.scenarios){const p=E.propose(D,scenario,'ml',{budget:12000,visits:2});assert(p.items.length<=2);assert(p.items.reduce((a,b)=>a+Math.abs(b.delta),0)<=12000);}});
test('Zero budget and stale balance produce no plan',()=>{assert.equal(E.propose(D,s,'ml',{budget:0}).items.length,0);assert.equal(E.propose(D,s,'ml',{stale:true}).items.length,0);});
test('Replay preserves principal and nonnegative balances',()=>{for(const scenario of D.scenarios){const p=E.propose(D,scenario);const r=E.replay(D,scenario,p,true);for(const a of D.agents){const end=r.agents[a.id];assert.equal(end.cash+end.efloat,a.cash+a.efloat);assert(end.cash>=0&&end.efloat>=0);}assert.equal(r.hubCash+r.hubEfloat,p.options.hubCash+p.options.hubEfloat);}});
test('Failed request does not change balances',()=>{const tiny={...D,agents:[{...D.agents[0],cash:5,efloat:5}]};let r=E.replay(tiny,{events:[{agent:'A01',minute:0,kind:'out',amount:10}]},null);assert.equal(r.failed,1);assert.equal(r.agents.A01.cash,5);assert.equal(r.agents.A01.efloat,5);});
test('Cash-in and cash-out update opposite balances',()=>{const tiny={...D,agents:[{...D.agents[0],cash:100,efloat:100}]};let r=E.replay(tiny,{events:[{agent:'A01',minute:0,kind:'in',amount:30},{agent:'A01',minute:1,kind:'out',amount:20}]},null);assert.equal(r.agents.A01.cash,110);assert.equal(r.agents.A01.efloat,90);});
test('Duplicate delivery is applied at most once',()=>{const p=E.propose(D,s);const repeated={...p,items:[...p.items,...p.items]};assert.deepEqual(E.replay(D,s,p,true),E.replay(D,s,repeated,true));});
test('Delivery cannot use future liquidity before arrival',()=>{let p=E.propose(D,s,'ml',{delay:400});let r=E.replay(D,s,p,true);let b=E.replay(D,s,p,false);assert.equal(r.failed,b.failed);});
test('Evaluation is reproducible with identical denominators',()=>{const a=E.evaluate(D);assert.deepEqual(a,E.evaluate(D));assert.equal(a.totals.ml.attempted,a.totals.threshold.attempted);assert.equal(a.totals.ml.attempted,a.totals.seasonal.attempted);fs.writeFileSync(__dirname+'/evaluation.json',JSON.stringify(a,null,2));});
console.log(`${count} tests passed`);console.log(JSON.stringify(E.evaluate(D).totals,null,2));
