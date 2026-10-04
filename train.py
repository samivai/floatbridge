"""Train a small, inspectable model using only NumPy and synthetic data.
Run: python train.py. It regenerates model.json and bundle.js deterministically.
"""
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
SEED = 20261004
NAMES = ['Campus Gate', 'Market Road', 'River Crossing', 'Factory Lane', 'North Bazaar', 'Station Road', 'College Corner', 'Village Centre', 'South Market', 'Bus Terminal', 'Residential Lane', 'East Crossing']
AGENTS = [dict(id=f'A{i+1:02}', name=n, kind=i % 3, group='Low-volume' if i % 4 == 0 else 'Standard', scale=0.60 if i % 4 == 0 else 0.85 + 0.10 * (i % 5), cash=round(30000*(0.18+0.064*(i%9))), efloat=0) for i,n in enumerate(NAMES)]
for a in AGENTS:
    a['efloat'] = 30000-a['cash']

def features(a, day, hour):
    s,c=np.sin(2*np.pi*hour/24),np.cos(2*np.pi*hour/24)
    k1,k2=int(a['kind']==1),int(a['kind']==2)
    return [1.,s,c,np.sin(4*np.pi*hour/24),np.cos(4*np.pi*hour/24),int(day%7 in (5,6)),int(day%30 in (0,1,2)),k1,k2,k1*s,k1*c,k2*s,k2*c,np.log(a['scale'])]

FEATURES=['intercept','hour_sin','hour_cos','hour_sin_2','hour_cos_2','weekend','payday','cash_out_segment','balanced_segment','out_x_sin','out_x_cos','balanced_x_sin','balanced_x_cos','log_scale']

def demand(a,day,hour,rng,stress=False):
    # Independent stochastic demand process: forecasts never see these draws.
    peak=np.exp(-((hour-(11 if a['kind']==1 else 13))/3)**2)
    common=a['scale']*(1+.18*(day%7 in (5,6)))
    ci=(1300+2300*peak)*(1.7 if a['kind']==0 else .7 if a['kind']==1 else 1.05)*common
    co=(1400+2500*peak)*(1.65 if a['kind']==1 else .65 if a['kind']==0 else 1.0)*common
    if day%30 in (0,1,2): co*=1.65
    if stress and hour>=11: co*=1.8
    return np.array([ci,co])*rng.lognormal(-.5*.32**2,.32,2)

def main():
    rng=np.random.default_rng(SEED)
    rows=[]
    for day in range(90):
        for a in AGENTS:
            for hour in range(8,18):
                rows.append((day,a['id'],hour,features(a,day,hour),demand(a,day,hour,rng)))
    x=np.array([r[3] for r in rows]); y=np.array([r[4] for r in rows]); days=np.array([r[0] for r in rows])
    fit=days<60; val=(days>=60)&(days<75); test=days>=75
    penalties=[.01,.1,1.,10.]; candidates=[]
    for alpha in penalties:
        p=np.eye(x.shape[1])*alpha;p[0,0]=0
        coef=np.linalg.solve(x[fit].T@x[fit]+p,x[fit].T@np.log1p(y[fit]))
        residual=np.log1p(y[fit])-x[fit]@coef
        correction=np.mean(np.exp(residual),axis=0)
        pred=np.maximum(0,np.exp(x[val]@coef)*correction-1)
        candidates.append((np.abs(pred-y[val]).sum()/y[val].sum(),alpha,coef,correction))
    _,alpha,coef,correction=min(candidates,key=lambda z:z[0])
    seasonal={}
    for a in AGENTS:
        for h in range(8,18):
            for weekend in [False,True]:
                yy=[r[4] for r in rows if r[0]<60 and r[1]==a['id'] and r[2]==h and (r[0]%7 in (5,6))==weekend]
                seasonal[f'{a["id"]}:{h}:{int(weekend)}']=np.mean(yy,axis=0).tolist()
    pt=np.maximum(0,np.exp(x[test]@coef)*correction-1)
    st=np.array([seasonal[f'{r[1]}:{r[2]}:{int(r[0]%7 in (5,6))}'] for r in rows if r[0]>=75])
    metrics={'model_wape':float(np.abs(pt-y[test]).sum()/y[test].sum()),'seasonal_wape':float(np.abs(st-y[test]).sum()/y[test].sum()),'model_mae_bdt':float(np.abs(pt-y[test]).mean()),'seasonal_mae_bdt':float(np.abs(st-y[test]).mean()),'train_rows':int(fit.sum()),'validation_rows':int(val.sum()),'test_rows':int(test.sum())}
    model={'name':'Ridge regression on log hourly demand','alpha':alpha,'features':FEATURES,'coefficients':coef.tolist(),'smearing_correction':correction.tolist(),'metrics':metrics,'split':{'train':'days 0-59','validation':'days 60-74','test':'days 75-89'},'seed':SEED,'limitations':['Synthetic generator only; no upay data.','Point forecasts, not calibrated shortage probabilities.','Known payday flag is observable in advance; surprise shock is not.','Cash snapshots are assumed accurate unless marked stale.']}
    scenarios=[]
    for key,title,day,stress,seed in [('ordinary','Ordinary weekday',82,False,7201),('payday','Scheduled payday',90,False,7202),('shock','Unexpected demand shock',83,True,7203),('quiet','Low demand day',84,False,7204)]:
        rr=np.random.default_rng(seed); events=[]
        for a in AGENTS:
            for h in range(8,14):
                values=demand(a,day,h,rr,stress)
                if key=='quiet': values*=.5
                for direction,total in zip(['in','out'],values):
                    weights=rr.dirichlet(np.ones(3))
                    for w in weights:
                        events.append({'agent':a['id'],'minute':(h-8)*60+int(rr.integers(0,60)),'kind':direction,'amount':int(round(total*w/10)*10)})
        events.sort(key=lambda e:e['minute'])
        scenarios.append({'id':key,'title':title,'day':day,'seed':seed,'events':events,'unannounced_shock':stress})
    # Separate multi-seed evaluation, not used to tune the model or planner.
    evaluation=[]
    for seed in range(8100,8112):
        rr=np.random.default_rng(seed); day=75+(seed-8100); events=[]
        for a in AGENTS:
            for h in range(8,14):
                for direction,total in zip(['in','out'],demand(a,day,h,rr)):
                    for w in rr.dirichlet(np.ones(3)):
                        events.append({'agent':a['id'],'minute':(h-8)*60+int(rr.integers(0,60)),'kind':direction,'amount':int(round(total*w/10)*10)})
        events.sort(key=lambda e:e['minute'])
        evaluation.append({'id':str(seed),'day':day,'seed':seed,'events':events})
    bundle={'agents':AGENTS,'model':model,'seasonal':seasonal,'scenarios':scenarios,'evaluation':evaluation,'generated_by':'train.py; synthetic only','version':'1.0.0'}
    (ROOT/'model.json').write_text(json.dumps(model,indent=2),encoding='utf-8')
    (ROOT/'bundle.js').write_text('window.FLOATBRIDGE_DATA = '+json.dumps(bundle,separators=(',',':'))+';\n',encoding='utf-8')
    print(json.dumps(metrics,indent=2))

if __name__=='__main__': main()
