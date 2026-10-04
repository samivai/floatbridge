(function (root) {
  'use strict';
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  function features(a, day, hour) {
    const s=Math.sin(2*Math.PI*hour/24),c=Math.cos(2*Math.PI*hour/24),k1=+(a.kind===1),k2=+(a.kind===2);
    return [1,s,c,Math.sin(4*Math.PI*hour/24),Math.cos(4*Math.PI*hour/24),+([5,6].includes(day%7)),+([0,1,2].includes(day%30)),k1,k2,k1*s,k1*c,k2*s,k2*c,Math.log(a.scale)];
  }
  function forecast(data,a,day,policy='ml') {
    return Array.from({length:6},(_,i)=>{
      const hour=i+8;
      let values;
      if(policy==='seasonal') values=data.seasonal[`${a.id}:${hour}:${+([5,6].includes(day%7))}`];
      else {
        const x=features(a,day,hour),m=data.model;
        values=[0,1].map(j=>Math.max(0,Math.exp(x.reduce((s,v,k)=>s+v*m.coefficients[k][j],0))*m.smearing_correction[j]-1));
      }
      return {hour,cashIn:values[0],cashOut:values[1]};
    });
  }
  const defaults={budget:60000,visits:6,delay:60,hubCash:120000,hubEfloat:120000,buffer:3000,stale:false};
  function propose(data,scenario,policy='ml',options={}) {
    const opt={...defaults,...options};
    if(opt.stale) return {policy,items:[],rejected:[],options:opt,reason:'Balance snapshot is stale. Refresh balances before approving any exchange.'};
    const rejected=[];
    const candidates=data.agents.map(a=>{
      const f=forecast(data,a,scenario.day,policy==='threshold'?'seasonal':policy);
      let cumulative=0,min=0,max=0;
      f.forEach(p=>{cumulative+=p.cashIn-p.cashOut;min=Math.min(min,cumulative);max=Math.max(max,cumulative);});
      const total=a.cash+a.efloat;
      const risk=Math.max(0,opt.buffer-a.cash-min,opt.buffer-a.efloat+max);
      const target=policy==='threshold'?total/2:clamp((total-max-min)/2,opt.buffer,total-opt.buffer);
      let delta=Math.round((target-a.cash)/100)*100;
      if(policy==='threshold' && Math.min(a.cash,a.efloat)>=total*.30) delta=0;
      if(policy!=='threshold' && risk===0) delta=0;
      delta=clamp(delta,-a.cash,a.efloat);
      return {agent:a.id,name:a.name,group:a.group,delta,risk,forecast:f,minCash:a.cash+min,minEfloat:a.efloat-max,reason:delta>0?'Predicted withdrawals consume physical cash.':'Predicted deposits consume electronic balance.'};
    }).filter(c=>Math.abs(c.delta)>=500).sort((a,b)=>b.risk-a.risk||a.agent.localeCompare(b.agent));
    let budget=opt.budget,hubCash=opt.hubCash,hubEfloat=opt.hubEfloat;
    const items=[];
    candidates.forEach(c=>{
      if(items.length>=opt.visits){rejected.push({...c,rejection:'Visit capacity reached'});return;}
      let delta=c.delta>0?Math.min(c.delta,budget,hubCash): -Math.min(-c.delta,budget,hubEfloat);
      delta=Math.trunc(delta/100)*100;
      if(Math.abs(delta)<500){rejected.push({...c,rejection:'Insufficient remaining exchange budget or hub inventory'});return;}
      hubCash-=delta;hubEfloat+=delta;budget-=Math.abs(delta);
      items.push({...c,delta,arrivalMinute:opt.delay});
    });
    return {policy,items,rejected,options:opt,usedBudget:opt.budget-budget,hubCash,hubEfloat,reason:items.length?'Review each proposed exchange before the simulated replay.':'No feasible exchange is proposed under these constraints.'};
  }
  function replay(data,scenario,plan,approved=false) {
    const opt=plan?.options||defaults;
    const agents=Object.fromEntries(data.agents.map(a=>[a.id,{...a,failed:0,attempted:0,failedValue:0}]));
    let hubCash=opt.hubCash,hubEfloat=opt.hubEfloat,failed=0,attempted=0,failedValue=0,fulfilledValue=0;
    let exchanged=0,visits=0; const log=[],delivered=new Set();
    const timeline=data.agents.map(a=>({id:a.id,points:[{minute:0,cash:a.cash,efloat:a.efloat}]}));
    const all=[...scenario.events.map((e,i)=>({...e,type:'request',sequence:i})),...(approved?(plan?.items||[]).map((p,i)=>({...p,type:'delivery',minute:p.arrivalMinute,sequence:i})):[])].sort((a,b)=>a.minute-b.minute||((a.type==='delivery'?0:1)-(b.type==='delivery'?0:1))||a.sequence-b.sequence);
    for(const e of all){
      const a=agents[e.agent];if(!a)throw new Error('Unknown agent in scenario');
      if(e.type==='delivery'){
        if(delivered.has(e.agent))continue;
        delivered.add(e.agent);
        const d=e.delta;
        if(a.cash+d<0||a.efloat-d<0||hubCash-d<0||hubEfloat+d<0){log.push({minute:e.minute,agent:e.agent,status:'Skipped',text:'Exchange no longer feasible at arrival; no funds moved.'});continue;}
        a.cash+=d;a.efloat-=d;hubCash-=d;hubEfloat+=d;exchanged+=Math.abs(d);visits++;
        log.push({minute:e.minute,agent:e.agent,status:'Exchange',text:`${d>0?'Cash delivered':'E-float delivered'}: ${Math.abs(d)} BDT (matched exchange)`});
      }else{
        if(e.amount<=0)continue;
        attempted++;a.attempted++;
        const ok=e.kind==='out'?a.cash>=e.amount:a.efloat>=e.amount;
        if(ok){const d=e.kind==='in'?e.amount:-e.amount;a.cash+=d;a.efloat-=d;fulfilledValue+=e.amount;}
        else{failed++;a.failed++;a.failedValue+=e.amount;failedValue+=e.amount;log.push({minute:e.minute,agent:e.agent,status:'Failed',text:`Cash-${e.kind}: ${e.amount} BDT; insufficient ${e.kind==='out'?'cash':'e-float'}`});}
      }
      timeline.find(t=>t.id===a.id).points.push({minute:e.minute,cash:a.cash,efloat:a.efloat});
      if(a.cash<0||a.efloat<0||hubCash<0||hubEfloat<0)throw new Error('Negative balance invariant');
    }
    const groups={};Object.values(agents).forEach(a=>{const g=groups[a.group]||(groups[a.group]={failed:0,attempted:0});g.failed+=a.failed;g.attempted+=a.attempted;});
    return {failed,attempted,failedRate:attempted?failed/attempted:0,completed:attempted-failed,failedValue,fulfilledValue,exchanged,visits,visitCost:visits*150,agents,groups,hubCash,hubEfloat,log,timeline,approved};
  }
  function evaluate(data,options={}){
    const records=data.evaluation.map(s=>{
      const values={seed:s.seed};for(const policy of ['threshold','seasonal','ml']){const p=propose(data,s,policy,options);const r=replay(data,s,p,true);values[policy]={failed:r.failed,attempted:r.attempted,visits:r.visits,exchange:r.exchanged,visitCost:r.visitCost,groups:r.groups};}return values;
    });
    const totals={};for(const policy of ['threshold','seasonal','ml']){
      const t=records.reduce((a,r)=>({failed:a.failed+r[policy].failed,attempted:a.attempted+r[policy].attempted,visits:a.visits+r[policy].visits,exchange:a.exchange+r[policy].exchange}),{failed:0,attempted:0,visits:0,exchange:0});t.failedRate=t.failed/t.attempted;t.groups={};for(const r of records){for(const [group,g] of Object.entries(r[policy].groups)){const z=t.groups[group]||(t.groups[group]={failed:0,attempted:0});z.failed+=g.failed;z.attempted+=g.attempted;}}totals[policy]=t;
    }
    const differences=records.map(r=>r.threshold.failed-r.ml.failed);
    return {records,totals,pairedImprovement:{mean:differences.reduce((a,b)=>a+b,0)/differences.length,min:Math.min(...differences),max:Math.max(...differences)},note:'12 independent synthetic scenario seeds. No real-world impact claim. Same budgets, balances, lead times and demand across policies.'};
  }
  const api={features,forecast,propose,replay,evaluate,defaults};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.FloatBridge=api;
})(typeof window!=='undefined'?window:globalThis);
