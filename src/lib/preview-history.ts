export type HistoryPoint = {time:number;value:number|null};
export function previewHistory(points:HistoryPoint[], minutes:number) {
  const sorted=points.filter(p=>Number.isFinite(p.time)).slice().sort((a,b)=>a.time-b.time);
  const end=sorted.at(-1)?.time;
  if(end == null) return {start:0,end:0,interval:0,points:[] as {time:number;value:number|null;range:[number,number]|null}[]};
  const start=end-minutes*60000;
  const interval=minutes===30 ? 0 : minutes===360 ? 5*60000 : 15*60000;
  const result:{time:number;value:number|null;range:[number,number]|null}[]=[];
  let bucket:HistoryPoint[]=[];
  const flush=()=>{if(!bucket.length)return;const values=bucket.map(p=>p.value as number);result.push({time:bucket[0].time,value:values.reduce((a,b)=>a+b,0)/values.length,range:[Math.min(...values),Math.max(...values)]});bucket=[];};
  let prior:number|undefined;
  for(const p of sorted.filter(p=>p.time>=start)) {
    if(prior!=null && p.time-prior>3600000){flush();result.push({time:p.time-1,value:null,range:null});}
    prior=p.time;
    if(p.value==null || !Number.isFinite(p.value)){flush();result.push({time:p.time,value:null,range:null});continue;}
    if(!interval){result.push({...p,range:null});continue;}
    if(bucket.length && Math.floor((p.time-start)/interval)!==Math.floor((bucket[0].time-start)/interval))flush();
    bucket.push(p);
  }
  flush();return {start,end,interval,points:result};
}
